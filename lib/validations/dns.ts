import { z } from 'zod';
import type { DnsRecordType } from '@/types/dns';

/**
 * Supported DNS record types
 */
export const dnsRecordTypes: DnsRecordType[] = [
  'A',
  'AAAA',
  'CNAME',
  'MX',
  'TXT',
  'NS',
  'SRV',
  'CAA',
];

/**
 * Base DNS record schema without type-specific validation
 */
const baseDnsSchema = z.object({
  type: z.enum(['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SRV', 'CAA']),
  name: z
    .string()
    .min(1, 'Name is required')
    .max(255, 'Name must be 255 characters or less'),
  content: z
    .string()
    .min(1, 'Content is required')
    .max(65535, 'Content is too long'),
  ttl: z
    .number()
    .min(1, 'TTL must be at least 1 (auto)')
    .max(86400, 'TTL must be at most 86400 seconds')
    .default(1),
  proxied: z.boolean().default(false),
  priority: z
    .number()
    .min(0, 'Priority must be at least 0')
    .max(65535, 'Priority must be at most 65535')
    .optional(),
});

/**
 * IPv4 address validation regex
 */
const ipv4Regex =
  /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

/**
 * IPv6 address validation (simplified)
 */
const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;

/**
 * DNS record creation schema with type-specific validation
 */
export const dnsCreateSchema = baseDnsSchema.superRefine((data, ctx) => {
  // Type-specific content validation
  switch (data.type) {
    case 'A':
      if (!ipv4Regex.test(data.content)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Invalid IPv4 address',
          path: ['content'],
        });
      }
      break;

    case 'AAAA':
      if (!ipv6Regex.test(data.content)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Invalid IPv6 address',
          path: ['content'],
        });
      }
      break;

    case 'MX':
      if (data.priority === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Priority is required for MX records',
          path: ['priority'],
        });
      }
      break;

    case 'SRV':
      if (data.priority === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Priority is required for SRV records',
          path: ['priority'],
        });
      }
      break;

    case 'CNAME':
      // CNAME cannot be proxied if it's the root domain
      // This is handled at API level as we need zone info
      break;
  }

  // Proxied validation - only A, AAAA, and CNAME can be proxied
  if (data.proxied && !['A', 'AAAA', 'CNAME'].includes(data.type)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Only A, AAAA, and CNAME records can be proxied',
      path: ['proxied'],
    });
  }
});

/**
 * DNS record update schema (same as create)
 */
export const dnsUpdateSchema = dnsCreateSchema;

/**
 * Inferred input type from DNS create schema (before defaults are applied)
 */
export type DnsFormInput = z.input<typeof baseDnsSchema>;

/**
 * Inferred output type from DNS create schema (after validation)
 */
export type DnsFormOutput = z.output<typeof baseDnsSchema>;

/**
 * Type-safe validation function for DNS create input
 */
export function validateDnsCreate(data: unknown) {
  return dnsCreateSchema.safeParse(data);
}

/**
 * Type-safe validation function for DNS update input
 */
export function validateDnsUpdate(data: unknown) {
  return dnsUpdateSchema.safeParse(data);
}
