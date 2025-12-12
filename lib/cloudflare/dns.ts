import { cloudflare } from './client';
import { isZoneAllowed } from './zones';
import { CloudflareServiceError } from './errors';
import type { DnsCreateInput, DnsUpdateInput, DnsRecord } from '@/types/dns';

/**
 * List all DNS records for a zone
 *
 * @param zoneId - Zone ID to list records for
 * @returns Array of DNS records
 * @throws CloudflareServiceError if zone is not allowed or API fails
 */
export async function listDnsRecords(zoneId: string): Promise<DnsRecord[]> {
  if (!isZoneAllowed(zoneId)) {
    throw new CloudflareServiceError('Zone not allowed', 'ZONE_NOT_ALLOWED');
  }

  const response = await cloudflare.dns.records.list({
    zone_id: zoneId,
  });

  return response.result as DnsRecord[];
}

/**
 * Get a single DNS record by ID
 *
 * @param zoneId - Zone ID
 * @param recordId - DNS record ID
 * @returns DNS record
 * @throws CloudflareServiceError if zone is not allowed or record not found
 */
export async function getDnsRecord(
  zoneId: string,
  recordId: string
): Promise<DnsRecord> {
  if (!isZoneAllowed(zoneId)) {
    throw new CloudflareServiceError('Zone not allowed', 'ZONE_NOT_ALLOWED');
  }

  try {
    const record = await cloudflare.dns.records.get(recordId, {
      zone_id: zoneId,
    });

    return record as DnsRecord;
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('Could not find record')
    ) {
      throw new CloudflareServiceError(
        'DNS record not found',
        'RESOURCE_NOT_FOUND'
      );
    }
    throw error;
  }
}

/**
 * Create a new DNS record
 *
 * @param zoneId - Zone ID
 * @param data - DNS record data
 * @returns Created DNS record
 * @throws CloudflareServiceError if zone is not allowed or creation fails
 */
export async function createDnsRecord(
  zoneId: string,
  data: DnsCreateInput
): Promise<DnsRecord> {
  if (!isZoneAllowed(zoneId)) {
    throw new CloudflareServiceError('Zone not allowed', 'ZONE_NOT_ALLOWED');
  }

  const record = await cloudflare.dns.records.create({
    zone_id: zoneId,
    type: data.type,
    name: data.name,
    content: data.content,
    ttl: data.ttl ?? 1, // 1 = auto
    proxied: data.proxied ?? false,
    ...(data.priority !== undefined && { priority: data.priority }),
  });

  return record as DnsRecord;
}

/**
 * Update an existing DNS record
 *
 * @param zoneId - Zone ID
 * @param recordId - DNS record ID
 * @param data - Updated DNS record data
 * @returns Updated DNS record
 * @throws CloudflareServiceError if zone is not allowed or update fails
 */
export async function updateDnsRecord(
  zoneId: string,
  recordId: string,
  data: DnsUpdateInput
): Promise<DnsRecord> {
  if (!isZoneAllowed(zoneId)) {
    throw new CloudflareServiceError('Zone not allowed', 'ZONE_NOT_ALLOWED');
  }

  try {
    const record = await cloudflare.dns.records.update(recordId, {
      zone_id: zoneId,
      type: data.type,
      name: data.name,
      content: data.content,
      ttl: data.ttl ?? 1,
      proxied: data.proxied ?? false,
      ...(data.priority !== undefined && { priority: data.priority }),
    });

    return record as DnsRecord;
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('Could not find record')
    ) {
      throw new CloudflareServiceError(
        'DNS record not found',
        'RESOURCE_NOT_FOUND'
      );
    }
    throw error;
  }
}

/**
 * Delete a DNS record
 *
 * @param zoneId - Zone ID
 * @param recordId - DNS record ID
 * @throws CloudflareServiceError if zone is not allowed or deletion fails
 */
export async function deleteDnsRecord(
  zoneId: string,
  recordId: string
): Promise<void> {
  if (!isZoneAllowed(zoneId)) {
    throw new CloudflareServiceError('Zone not allowed', 'ZONE_NOT_ALLOWED');
  }

  try {
    await cloudflare.dns.records.delete(recordId, {
      zone_id: zoneId,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('Could not find record')
    ) {
      throw new CloudflareServiceError(
        'DNS record not found',
        'RESOURCE_NOT_FOUND'
      );
    }
    throw error;
  }
}
