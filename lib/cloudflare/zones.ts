import type { AllowedZone } from '@/types/zone';

/**
 * Parse CLOUDFLARE_ZONES environment variable and return allowed zones
 * Format: zone_id_1:example.com,zone_id_2:example.org
 *
 * @returns Array of allowed zones with id and name
 */
export function getAllowedZones(): AllowedZone[] {
  const zonesEnv = process.env.CLOUDFLARE_ZONES || '';
  return zonesEnv
    .split(',')
    .map((entry) => {
      const [id, name] = entry.trim().split(':');
      return { id, name };
    })
    .filter((zone) => zone.id && zone.name);
}

/**
 * Check if a zone ID is in the allowed list
 *
 * @param zoneId - Zone ID to check
 * @returns true if the zone is allowed
 */
export function isZoneAllowed(zoneId: string): boolean {
  return getAllowedZones().some((zone) => zone.id === zoneId);
}

/**
 * Get a zone by its ID from the allowed list
 *
 * @param zoneId - Zone ID to find
 * @returns Zone if found, undefined otherwise
 */
export function getZoneById(zoneId: string): AllowedZone | undefined {
  return getAllowedZones().find((zone) => zone.id === zoneId);
}

/**
 * Parse a hostname and match it against allowed zones
 * Returns the zoneId and subdomain if matched
 *
 * @param hostname - Full hostname (e.g., "app.example.com")
 * @returns Object with zoneId and subdomain, or null if not matched
 */
export function parseHostname(
  hostname: string
): { zoneId: string; subdomain: string } | null {
  const zones = getAllowedZones();

  for (const zone of zones) {
    // Exact match (root domain)
    if (hostname === zone.name) {
      return { zoneId: zone.id, subdomain: '' };
    }
    // Subdomain match
    if (hostname.endsWith(`.${zone.name}`)) {
      const subdomain = hostname.slice(0, -(zone.name.length + 1));
      return { zoneId: zone.id, subdomain };
    }
  }

  return null; // Zone not allowed
}
