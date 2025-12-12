import { z } from 'zod';

/**
 * Access rule type enum
 */
export const ruleTypeSchema = z.enum([
  'email_domain',
  'email',
  'group',
  'geo',
  'device_posture',
  'everyone',
  'ip',
  'service_token',
  'any_valid_service_token',
]);

/**
 * Individual rule input schema for forms
 */
export const ruleInputSchema = z
  .object({
    type: ruleTypeSchema,
    value: z.string().optional(),
  })
  .refine(
    (data) => {
      // Value is required for types that need it
      const typesRequiringValue = [
        'email_domain',
        'email',
        'group',
        'geo',
        'device_posture',
        'ip',
      ];
      if (typesRequiringValue.includes(data.type)) {
        return data.value && data.value.trim().length > 0;
      }
      return true;
    },
    {
      message: 'Value is required for this rule type',
      path: ['value'],
    }
  );

/**
 * Policy decision enum
 */
export const policyDecisionSchema = z.enum(['allow', 'deny', 'bypass']);

/**
 * Session duration validation
 */
export const sessionDurationSchema = z
  .string()
  .regex(
    /^\d+[smhd]$/,
    'Session duration must be in format: number followed by s (seconds), m (minutes), h (hours), or d (days). Example: 24h'
  )
  .optional();

/**
 * Application type enum
 */
export const appTypeSchema = z.enum([
  'self_hosted',
  'saas',
  'ssh',
  'vnc',
  'bookmark',
  'app_launcher',
  'warp',
  'biso',
  'infrastructure',
]);

/**
 * Domain validation
 */
export const domainSchema = z
  .string()
  .min(1, 'Domain is required')
  .regex(
    /^(?!:\/\/)([a-zA-Z0-9-_]+\.)*[a-zA-Z0-9][a-zA-Z0-9-_]+\.[a-zA-Z]{2,11}?$/,
    'Invalid domain format. Example: app.example.com'
  );

/**
 * Policy reference schema
 */
export const policyReferenceSchema = z.object({
  id: z.string().min(1, 'Policy ID is required'),
  name: z.string().optional(),
  precedence: z.number().optional(),
});

/**
 * Schema for creating an Access Application
 */
export const accessAppCreateSchema = z.object({
  name: z
    .string()
    .min(1, 'Application name is required')
    .max(253, 'Application name must be 253 characters or less'),
  domain: domainSchema,
  type: appTypeSchema.default('self_hosted'),
  session_duration: sessionDurationSchema,
  app_launcher_visible: z.boolean().optional().default(true),
  allowed_idps: z.array(z.string()).optional(),
  policies: z.array(policyReferenceSchema).optional(),
});

/**
 * Schema for updating an Access Application
 */
export const accessAppUpdateSchema = accessAppCreateSchema;

/**
 * Schema for creating a reusable policy
 */
export const policyCreateSchema = z.object({
  name: z
    .string()
    .min(1, 'Policy name is required')
    .max(253, 'Policy name must be 253 characters or less'),
  precedence: z
    .number()
    .int('Precedence must be an integer')
    .min(1, 'Precedence must be at least 1'),
  decision: policyDecisionSchema,
  include: z.array(ruleInputSchema).min(1, 'At least one include rule is required'),
  exclude: z.array(ruleInputSchema).optional(),
  require: z.array(ruleInputSchema).optional(),
  session_duration: sessionDurationSchema,
  approval_required: z.boolean().optional(),
});

/**
 * Schema for updating a reusable policy
 */
export const policyUpdateSchema = policyCreateSchema;

/**
 * Inferred types from schemas
 */
export type RuleInputForm = z.input<typeof ruleInputSchema>;
export type AccessAppCreateFormInput = z.input<typeof accessAppCreateSchema>;
export type AccessAppCreateFormOutput = z.output<typeof accessAppCreateSchema>;
export type AccessAppUpdateFormInput = z.input<typeof accessAppUpdateSchema>;
export type AccessAppUpdateFormOutput = z.output<typeof accessAppUpdateSchema>;
export type PolicyCreateFormInput = z.input<typeof policyCreateSchema>;
export type PolicyCreateFormOutput = z.output<typeof policyCreateSchema>;
export type PolicyUpdateFormInput = z.input<typeof policyUpdateSchema>;
export type PolicyUpdateFormOutput = z.output<typeof policyUpdateSchema>;

/**
 * Validate access app create input
 */
export function validateAccessAppCreate(data: unknown) {
  return accessAppCreateSchema.safeParse(data);
}

/**
 * Validate access app update input
 */
export function validateAccessAppUpdate(data: unknown) {
  return accessAppUpdateSchema.safeParse(data);
}

/**
 * Validate policy create input
 */
export function validatePolicyCreate(data: unknown) {
  return policyCreateSchema.safeParse(data);
}

/**
 * Validate policy update input
 */
export function validatePolicyUpdate(data: unknown) {
  return policyUpdateSchema.safeParse(data);
}
