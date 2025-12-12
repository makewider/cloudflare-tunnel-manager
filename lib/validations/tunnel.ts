import { z } from 'zod';

/**
 * Tunnel name validation
 * - Required
 * - 1-253 characters
 * - Alphanumeric, hyphens, and underscores only
 */
const tunnelNameSchema = z
  .string()
  .min(1, 'Tunnel name is required')
  .max(253, 'Tunnel name must be 253 characters or less')
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    'Tunnel name can only contain letters, numbers, hyphens, and underscores'
  );

/**
 * Schema for creating a tunnel
 */
export const tunnelCreateSchema = z.object({
  name: tunnelNameSchema,
});

/**
 * Single ingress rule schema
 */
const ingressRuleSchema = z.object({
  zoneId: z.string().min(1, 'Zone is required'),
  subdomain: z
    .string()
    .max(63, 'Subdomain must be 63 characters or less')
    .regex(
      /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$|^$/,
      'Invalid subdomain format'
    ),
  service: z
    .string()
    .min(1, 'Service URL is required')
    .regex(
      /^(https?:\/\/|tcp:\/\/|ssh:\/\/|rdp:\/\/|unix:\/\/|http_status:)[^\s]+$/,
      'Invalid service URL format. Must start with http://, https://, tcp://, ssh://, rdp://, unix://, or http_status:'
    ),
  path: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.startsWith('/'),
      'Path must start with /'
    ),
});

/**
 * Schema for updating tunnel ingress configuration
 */
export const ingressUpdateSchema = z.object({
  rules: z.array(ingressRuleSchema).min(0),
});

/**
 * Inferred types from schemas
 */
export type TunnelCreateFormInput = z.input<typeof tunnelCreateSchema>;
export type TunnelCreateFormOutput = z.output<typeof tunnelCreateSchema>;
export type IngressRuleFormInput = z.input<typeof ingressRuleSchema>;
export type IngressUpdateFormInput = z.input<typeof ingressUpdateSchema>;
export type IngressUpdateFormOutput = z.output<typeof ingressUpdateSchema>;

/**
 * Validate tunnel create input
 */
export function validateTunnelCreate(data: unknown) {
  return tunnelCreateSchema.safeParse(data);
}

/**
 * Validate ingress update input
 */
export function validateIngressUpdate(data: unknown) {
  return ingressUpdateSchema.safeParse(data);
}
