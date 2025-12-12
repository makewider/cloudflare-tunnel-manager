import { cloudflare, accountId } from './client';
import { CloudflareServiceError } from './errors';
import type {
  AccessApplication,
  AccessPolicy,
  AccessAppCreateInput,
  AccessAppUpdateInput,
  PolicyCreateInput,
  PolicyUpdateInput,
  AccessRule,
  PolicyReference,
} from '@/types/access';

// ============================================
// Helper: Handle Cloudflare API Errors
// ============================================

/**
 * Check if the error is an authentication/permission error
 */
function handleCloudflareError(error: unknown): never {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Check for authentication/authorization errors
    if (
      message.includes('authentication error') ||
      message.includes('10000') ||
      (message.includes('403') && message.includes('error'))
    ) {
      throw new CloudflareServiceError(
        'Access API permission denied. Please ensure your API token has "Account:Access: Apps and Policies:Edit" permission.',
        'UNAUTHORIZED'
      );
    }

    // Check for rate limiting
    if (message.includes('429') || message.includes('rate limit')) {
      throw new CloudflareServiceError(
        'Rate limited by Cloudflare API. Please try again later.',
        'RATE_LIMITED'
      );
    }
  }

  throw error;
}

// ============================================
// Access Applications
// ============================================

/**
 * List all Access Applications
 *
 * @returns Array of Access Applications
 */
export async function listAccessApps(): Promise<AccessApplication[]> {
  try {
    const apps: AccessApplication[] = [];

    for await (const app of cloudflare.zeroTrust.access.applications.list({
      account_id: accountId,
    })) {
      // Filter to only self_hosted type for now (as per spec)
      if (app.type === 'self_hosted') {
        apps.push(mapApplicationFromApi(app));
      }
    }

    return apps;
  } catch (error) {
    handleCloudflareError(error);
  }
}

/**
 * Get a single Access Application by ID
 *
 * @param appId - Application UUID
 * @returns Application details
 */
export async function getAccessApp(appId: string): Promise<AccessApplication> {
  try {
    const app = await cloudflare.zeroTrust.access.applications.get(appId, {
      account_id: accountId,
    });

    return mapApplicationFromApi(app);
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      throw new CloudflareServiceError(
        'Access Application not found',
        'RESOURCE_NOT_FOUND'
      );
    }
    handleCloudflareError(error);
  }
}

/**
 * Create a new Access Application
 *
 * @param input - Application create input
 * @returns Created application
 */
export async function createAccessApp(
  input: AccessAppCreateInput
): Promise<AccessApplication> {
  try {
    // Build request body
    const body: Record<string, unknown> = {
      name: input.name,
      domain: input.domain,
      type: input.type,
      session_duration: input.session_duration ?? '24h',
      app_launcher_visible: input.app_launcher_visible ?? true,
    };

    if (input.allowed_idps?.length) {
      body.allowed_idps = input.allowed_idps;
    }

    // Associate reusable policies if provided
    if (input.policies?.length) {
      body.policies = input.policies.map((p) => ({ id: p.id }));
    }

    const app = await cloudflare.zeroTrust.access.applications.create({
      account_id: accountId,
      ...body,
    } as Parameters<typeof cloudflare.zeroTrust.access.applications.create>[0]);

    return mapApplicationFromApi(app);
  } catch (error) {
    handleCloudflareError(error);
  }
}

/**
 * Update an existing Access Application
 *
 * @param appId - Application UUID
 * @param input - Application update input
 * @returns Updated application
 */
export async function updateAccessApp(
  appId: string,
  input: AccessAppUpdateInput
): Promise<AccessApplication> {
  try {
    // Build update body
    const body: Record<string, unknown> = {
      name: input.name,
      domain: input.domain,
      type: input.type,
    };

    if (input.session_duration !== undefined) {
      body.session_duration = input.session_duration;
    }
    if (input.app_launcher_visible !== undefined) {
      body.app_launcher_visible = input.app_launcher_visible;
    }
    if (input.allowed_idps !== undefined) {
      body.allowed_idps = input.allowed_idps;
    }

    // Update policy associations
    if (input.policies !== undefined) {
      body.policies = input.policies.map((p) => ({ id: p.id }));
    }

    const app = await cloudflare.zeroTrust.access.applications.update(appId, {
      account_id: accountId,
      ...body,
    } as Parameters<typeof cloudflare.zeroTrust.access.applications.update>[1]);

    return mapApplicationFromApi(app);
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      throw new CloudflareServiceError(
        'Access Application not found',
        'RESOURCE_NOT_FOUND'
      );
    }
    handleCloudflareError(error);
  }
}

/**
 * Delete an Access Application
 *
 * @param appId - Application UUID
 */
export async function deleteAccessApp(appId: string): Promise<void> {
  try {
    await cloudflare.zeroTrust.access.applications.delete(appId, {
      account_id: accountId,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      throw new CloudflareServiceError(
        'Access Application not found',
        'RESOURCE_NOT_FOUND'
      );
    }
    handleCloudflareError(error);
  }
}

// ============================================
// Reusable Policies (Account Level)
// ============================================

/**
 * List all reusable policies
 *
 * @returns Array of reusable policies
 */
export async function listAccessPolicies(): Promise<AccessPolicy[]> {
  try {
    const policies: AccessPolicy[] = [];

    for await (const policy of cloudflare.zeroTrust.access.policies.list({
      account_id: accountId,
    })) {
      policies.push(mapPolicyFromApi(policy));
    }

    return policies;
  } catch (error) {
    handleCloudflareError(error);
  }
}

/**
 * Get a single reusable policy by ID
 *
 * @param policyId - Policy UUID
 * @returns Policy details with app_count
 */
export async function getAccessPolicy(
  policyId: string
): Promise<AccessPolicy> {
  try {
    const policy = await cloudflare.zeroTrust.access.policies.get(policyId, {
      account_id: accountId,
    });

    return mapPolicyFromApi(policy);
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      throw new CloudflareServiceError(
        'Access Policy not found',
        'RESOURCE_NOT_FOUND'
      );
    }
    handleCloudflareError(error);
  }
}

/**
 * Create a new reusable policy
 *
 * @param input - Policy create input
 * @returns Created policy
 */
export async function createAccessPolicy(
  input: PolicyCreateInput
): Promise<AccessPolicy> {
  try {
    const body: Record<string, unknown> = {
      name: input.name,
      precedence: input.precedence,
      decision: input.decision,
      include: input.include,
    };

    if (input.exclude?.length) {
      body.exclude = input.exclude;
    }
    if (input.require?.length) {
      body.require = input.require;
    }
    if (input.session_duration) {
      body.session_duration = input.session_duration;
    }
    if (input.approval_required !== undefined) {
      body.approval_required = input.approval_required;
    }

    const policy = await cloudflare.zeroTrust.access.policies.create({
      account_id: accountId,
      ...body,
    } as Parameters<typeof cloudflare.zeroTrust.access.policies.create>[0]);

    return mapPolicyFromApi(policy);
  } catch (error) {
    handleCloudflareError(error);
  }
}

/**
 * Update an existing reusable policy
 *
 * @param policyId - Policy UUID
 * @param input - Policy update input
 * @returns Updated policy
 */
export async function updateAccessPolicy(
  policyId: string,
  input: PolicyUpdateInput
): Promise<AccessPolicy> {
  try {
    const body: Record<string, unknown> = {
      name: input.name,
      precedence: input.precedence,
      decision: input.decision,
      include: input.include,
    };

    if (input.exclude !== undefined) {
      body.exclude = input.exclude;
    }
    if (input.require !== undefined) {
      body.require = input.require;
    }
    if (input.session_duration !== undefined) {
      body.session_duration = input.session_duration;
    }
    if (input.approval_required !== undefined) {
      body.approval_required = input.approval_required;
    }

    const policy = await cloudflare.zeroTrust.access.policies.update(
      policyId,
      {
        account_id: accountId,
        ...body,
      } as Parameters<typeof cloudflare.zeroTrust.access.policies.update>[1]
    );

    return mapPolicyFromApi(policy);
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      throw new CloudflareServiceError(
        'Access Policy not found',
        'RESOURCE_NOT_FOUND'
      );
    }
    handleCloudflareError(error);
  }
}

/**
 * Delete a reusable policy
 *
 * @param policyId - Policy UUID
 */
export async function deleteAccessPolicy(policyId: string): Promise<void> {
  try {
    await cloudflare.zeroTrust.access.policies.delete(policyId, {
      account_id: accountId,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      throw new CloudflareServiceError(
        'Access Policy not found',
        'RESOURCE_NOT_FOUND'
      );
    }
    handleCloudflareError(error);
  }
}

// ============================================
// Helper Functions
// ============================================

/**
 * Map API application response to internal type
 */
function mapApplicationFromApi(app: unknown): AccessApplication {
  const a = app as Record<string, unknown>;
  return {
    id: a.id as string,
    name: a.name as string,
    domain: a.domain as string,
    type: a.type as AccessApplication['type'],
    session_duration: a.session_duration as string | undefined,
    app_launcher_visible: a.app_launcher_visible as boolean | undefined,
    allowed_idps: a.allowed_idps as string[] | undefined,
    auto_redirect_to_identity: a.auto_redirect_to_identity as
      | boolean
      | undefined,
    custom_deny_message: a.custom_deny_message as string | undefined,
    custom_deny_url: a.custom_deny_url as string | undefined,
    custom_non_identity_deny_url: a.custom_non_identity_deny_url as
      | string
      | undefined,
    enable_binding_cookie: a.enable_binding_cookie as boolean | undefined,
    http_only_cookie_attribute: a.http_only_cookie_attribute as
      | boolean
      | undefined,
    logo_url: a.logo_url as string | undefined,
    same_site_cookie_attribute: a.same_site_cookie_attribute as
      | string
      | undefined,
    service_auth_401_redirect: a.service_auth_401_redirect as
      | boolean
      | undefined,
    skip_interstitial: a.skip_interstitial as boolean | undefined,
    tags: a.tags as string[] | undefined,
    aud: a.aud as string | undefined,
    created_at: a.created_at as string | undefined,
    updated_at: a.updated_at as string | undefined,
    policies: mapPoliciesReference(a.policies),
  };
}

/**
 * Map policies from API response to PolicyReference array
 */
function mapPoliciesReference(policies: unknown): PolicyReference[] | undefined {
  if (!Array.isArray(policies)) return undefined;
  return policies.map((p: Record<string, unknown>) => ({
    id: p.id as string,
    name: p.name as string | undefined,
    precedence: p.precedence as number | undefined,
  }));
}

/**
 * Map API policy response to internal type
 */
function mapPolicyFromApi(policy: unknown): AccessPolicy {
  const p = policy as Record<string, unknown>;
  return {
    id: p.id as string,
    name: p.name as string,
    precedence: (p.precedence as number) ?? 0,
    decision: p.decision as AccessPolicy['decision'],
    include: (p.include as AccessRule[]) ?? [],
    exclude: p.exclude as AccessRule[] | undefined,
    require: p.require as AccessRule[] | undefined,
    session_duration: p.session_duration as string | undefined,
    approval_required: p.approval_required as boolean | undefined,
    created_at: p.created_at as string | undefined,
    updated_at: p.updated_at as string | undefined,
    app_count: p.app_count as number | undefined,
  };
}
