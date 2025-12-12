import crypto from 'crypto';
import { cloudflare, accountId } from './client';
import { getAllowedZones, getZoneById, parseHostname } from './zones';
import { listDnsRecords, createDnsRecord, deleteDnsRecord } from './dns';
import { CloudflareServiceError } from './errors';
import type {
  Tunnel,
  TunnelConfig,
  IngressRule,
  IngressRuleInput,
  ParsedIngressRule,
} from '@/types/tunnel';

/**
 * List all tunnels, filtered by allowed zones
 * Only tunnels with all ingress hostnames in allowed zones are returned
 *
 * @returns Array of filtered tunnels
 */
export async function listTunnels(): Promise<Tunnel[]> {
  // Collect all tunnels from paginated results
  const tunnels: Tunnel[] = [];

  for await (const tunnel of cloudflare.zeroTrust.tunnels.cloudflared.list({
    account_id: accountId,
    is_deleted: false,
  })) {
    tunnels.push(tunnel as unknown as Tunnel);
  }

  // Filter tunnels based on allowed zones
  const filteredTunnels = await Promise.all(
    tunnels.map(async (tunnel) => {
      try {
        const config = await getTunnelConfig(tunnel.id);

        // No config means no ingress rules - allow it
        if (!config?.ingress || config.ingress.length === 0) {
          return tunnel;
        }

        // Check if any hostname is not in allowed zones
        const hasDisallowedHostname = config.ingress.some((rule) => {
          // Skip catch-all rule (no hostname)
          if (!rule.hostname) return false;
          // Check if hostname belongs to allowed zone
          return parseHostname(rule.hostname) === null;
        });

        return hasDisallowedHostname ? null : tunnel;
      } catch {
        // If we can't get config, include the tunnel anyway
        return tunnel;
      }
    })
  );

  return filteredTunnels.filter((t): t is Tunnel => t !== null);
}

/**
 * Get a single tunnel by ID
 *
 * @param tunnelId - Tunnel UUID
 * @returns Tunnel details
 */
export async function getTunnel(tunnelId: string): Promise<Tunnel> {
  try {
    const tunnel = await cloudflare.zeroTrust.tunnels.cloudflared.get(
      tunnelId,
      {
        account_id: accountId,
      }
    );

    return tunnel as unknown as Tunnel;
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      throw new CloudflareServiceError(
        'Tunnel not found',
        'RESOURCE_NOT_FOUND'
      );
    }
    throw error;
  }
}

/**
 * Create a new tunnel with auto-generated secret
 *
 * @param name - Tunnel name
 * @returns Created tunnel
 */
export async function createTunnel(name: string): Promise<Tunnel> {
  // Generate 32-byte random secret and encode as base64
  const tunnelSecret = crypto.randomBytes(32).toString('base64');

  const tunnel = await cloudflare.zeroTrust.tunnels.cloudflared.create({
    account_id: accountId,
    name,
    tunnel_secret: tunnelSecret,
    config_src: 'cloudflare', // Enable remote configuration
  });

  return tunnel as unknown as Tunnel;
}

/**
 * Delete a tunnel
 *
 * @param tunnelId - Tunnel UUID
 */
export async function deleteTunnel(tunnelId: string): Promise<void> {
  try {
    await cloudflare.zeroTrust.tunnels.cloudflared.delete(tunnelId, {
      account_id: accountId,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      throw new CloudflareServiceError(
        'Tunnel not found',
        'RESOURCE_NOT_FOUND'
      );
    }
    throw error;
  }
}

/**
 * Get tunnel token for cloudflared
 *
 * @param tunnelId - Tunnel UUID
 * @returns JWT token for cloudflared tunnel run
 */
export async function getTunnelToken(tunnelId: string): Promise<string> {
  try {
    const response = await cloudflare.zeroTrust.tunnels.cloudflared.token.get(
      tunnelId,
      {
        account_id: accountId,
      }
    );

    // The response is the token string directly
    return response as unknown as string;
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      throw new CloudflareServiceError(
        'Tunnel not found',
        'RESOURCE_NOT_FOUND'
      );
    }
    throw error;
  }
}

/**
 * Get tunnel configuration (ingress rules)
 *
 * @param tunnelId - Tunnel UUID
 * @returns Tunnel configuration with ingress rules
 */
export async function getTunnelConfig(
  tunnelId: string
): Promise<TunnelConfig | null> {
  try {
    const response =
      await cloudflare.zeroTrust.tunnels.cloudflared.configurations.get(
        tunnelId,
        {
          account_id: accountId,
        }
      );

    // The configuration is nested in the response
    const config = response?.config as TunnelConfig | undefined;
    return config ?? null;
  } catch (error) {
    // If no configuration exists, return null instead of throwing
    if (
      error instanceof Error &&
      (error.message.includes('not found') ||
        error.message.includes('no configuration'))
    ) {
      return null;
    }
    throw error;
  }
}

/**
 * Parse ingress rules from API format to UI format
 * Converts hostname to zoneId + subdomain
 *
 * @param config - Tunnel configuration from API
 * @returns Array of parsed ingress rules for UI
 */
export function parseIngressRules(
  config: TunnelConfig | null
): ParsedIngressRule[] {
  if (!config?.ingress) return [];

  const zones = getAllowedZones();
  const parsedRules: ParsedIngressRule[] = [];

  for (const rule of config.ingress) {
    // Skip catch-all rule
    if (!rule.hostname) continue;

    const parsed = parseHostname(rule.hostname);
    if (!parsed) continue; // Skip disallowed zones

    const zone = zones.find((z) => z.id === parsed.zoneId);
    if (!zone) continue;

    parsedRules.push({
      zoneId: parsed.zoneId,
      zoneName: zone.name,
      subdomain: parsed.subdomain,
      service: rule.service,
      path: rule.path,
      hostname: rule.hostname,
    });
  }

  return parsedRules;
}

/**
 * Update tunnel configuration (ingress rules)
 * Converts UI format (zoneId + subdomain) to API format (hostname)
 * Also synchronizes DNS CNAME records for each hostname
 *
 * @param tunnelId - Tunnel UUID
 * @param rules - Ingress rules in UI format
 */
export async function updateTunnelConfig(
  tunnelId: string,
  rules: IngressRuleInput[]
): Promise<void> {
  // Build hostname to zone mapping for DNS sync
  const hostnameToZone: Map<string, { zoneId: string; zoneName: string }> =
    new Map();

  // Convert UI format to Cloudflare API format
  const ingress: IngressRule[] = rules.map((rule) => {
    const zone = getZoneById(rule.zoneId);
    if (!zone) {
      throw new CloudflareServiceError(
        `Zone not found: ${rule.zoneId}`,
        'ZONE_NOT_ALLOWED'
      );
    }

    // Build hostname from subdomain + zone name
    const hostname = rule.subdomain
      ? `${rule.subdomain}.${zone.name}`
      : zone.name;

    // Store mapping for DNS sync
    hostnameToZone.set(hostname, { zoneId: zone.id, zoneName: zone.name });

    return {
      hostname,
      service: rule.service,
      ...(rule.path && { path: rule.path }),
    };
  });

  // Add catch-all rule (required by Cloudflare)
  ingress.push({ service: 'http_status:404' });

  try {
    // Type assertion needed because SDK types require hostname but Cloudflare API accepts catch-all rules without it
    const config = { ingress } as unknown as Parameters<
      typeof cloudflare.zeroTrust.tunnels.cloudflared.configurations.update
    >[1]['config'];

    await cloudflare.zeroTrust.tunnels.cloudflared.configurations.update(
      tunnelId,
      {
        account_id: accountId,
        config,
      }
    );

    // Sync DNS CNAME records for each hostname
    await syncDnsRecordsForTunnel(tunnelId, hostnameToZone);
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      throw new CloudflareServiceError(
        'Tunnel not found',
        'RESOURCE_NOT_FOUND'
      );
    }
    throw error;
  }
}

/**
 * Synchronize DNS CNAME records for tunnel hostnames
 * Creates CNAME records pointing to <tunnelId>.cfargotunnel.com
 * Deletes old tunnel CNAME records that are no longer in the ingress rules
 *
 * @param tunnelId - Tunnel UUID
 * @param hostnameToZone - Map of hostname to zone info (new ingress rules)
 */
async function syncDnsRecordsForTunnel(
  tunnelId: string,
  hostnameToZone: Map<string, { zoneId: string; zoneName: string }>
): Promise<void> {
  const tunnelCname = `${tunnelId}.cfargotunnel.com`;

  // Get all allowed zones - we need to check ALL zones for stale CNAME records
  const allZones = getAllowedZones();

  // Create set of all hostnames that should have CNAME records
  const neededHostnames = new Set(hostnameToZone.keys());

  // Process each allowed zone to handle both creation and deletion
  for (const zone of allZones) {
    // Get existing DNS records for this zone
    const existingRecords = await listDnsRecords(zone.id);

    // Find existing tunnel CNAME records (pointing to this tunnel)
    const existingTunnelCnames = existingRecords.filter(
      (record) => record.type === 'CNAME' && record.content === tunnelCname
    );

    // Delete CNAME records that are no longer needed
    for (const record of existingTunnelCnames) {
      if (!neededHostnames.has(record.name)) {
        // This CNAME record points to our tunnel but is no longer in ingress rules
        await deleteDnsRecord(zone.id, record.id);
      }
    }

    // Get hostnames for this zone that need CNAME records
    const zoneHostnames: string[] = [];
    for (const [hostname, { zoneId }] of hostnameToZone) {
      if (zoneId === zone.id) {
        zoneHostnames.push(hostname);
      }
    }

    // Create CNAME records for hostnames in this zone
    for (const hostname of zoneHostnames) {
      // Check if this tunnel's CNAME already exists
      const existingTunnelCname = existingTunnelCnames.find(
        (record) => record.name === hostname
      );
      if (existingTunnelCname) {
        // Record already exists for this tunnel, skip
        continue;
      }

      // Check if a different record already exists for this hostname
      const existingRecord = existingRecords.find(
        (record) => record.name === hostname
      );

      if (existingRecord) {
        // Skip if a record already exists (could be pointing to different tunnel or different record type)
        // We don't want to overwrite existing records automatically
        console.warn(
          `DNS record already exists for ${hostname}, skipping CNAME creation`
        );
        continue;
      }

      // Create new CNAME record
      await createDnsRecord(zone.id, {
        type: 'CNAME',
        name: hostname,
        content: tunnelCname,
        proxied: true,
        ttl: 1, // Auto TTL
      });
    }
  }
}
