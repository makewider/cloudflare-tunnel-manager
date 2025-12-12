import crypto from 'crypto';
import { cloudflare, accountId } from './client';
import { getAllowedZones, getZoneById, parseHostname } from './zones';
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
 *
 * @param tunnelId - Tunnel UUID
 * @param rules - Ingress rules in UI format
 */
export async function updateTunnelConfig(
  tunnelId: string,
  rules: IngressRuleInput[]
): Promise<void> {
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
