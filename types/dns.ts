/**
 * DNS record types supported by the application
 */
export type DnsRecordType =
  | 'A'
  | 'AAAA'
  | 'CNAME'
  | 'MX'
  | 'TXT'
  | 'NS'
  | 'SRV'
  | 'CAA';

/**
 * DNS Record type for the application
 * Simplified from Cloudflare SDK's complex union type
 */
export interface DnsRecord {
  id: string;
  type: string;
  name: string;
  content: string;
  ttl?: number;
  proxied?: boolean;
  priority?: number;
  created_on?: string;
  modified_on?: string;
  zone_id?: string;
  zone_name?: string;
}

/**
 * Input type for creating a DNS record
 */
export interface DnsCreateInput {
  type: DnsRecordType;
  name: string;
  content: string;
  ttl?: number;
  proxied?: boolean;
  priority?: number; // Required for MX and SRV records
}

/**
 * Input type for updating a DNS record
 * Same as create input - all fields can be updated
 */
export type DnsUpdateInput = DnsCreateInput;

/**
 * API response for DNS records list
 */
export interface DnsRecordsResponse {
  records: DnsRecord[];
}

/**
 * API response for single DNS record
 */
export interface DnsRecordResponse {
  record: DnsRecord;
}
