import { NextRequest } from 'next/server';
import {
  getAccessPolicy,
  updateAccessPolicy,
  deleteAccessPolicy,
} from '@/lib/cloudflare/access';
import { validatePolicyUpdate } from '@/lib/validations/access';
import {
  createErrorResponse,
  createSuccessResponse,
} from '@/lib/api-response';
import { CloudflareServiceError } from '@/lib/cloudflare/errors';
import type { AccessPolicyResponse } from '@/types/access';
import { ruleInputToAccessRule } from '@/types/access';

interface RouteContext {
  params: Promise<{ policyId: string }>;
}

/**
 * GET /api/access/policies/[policyId]
 * Get a single reusable policy (includes app_count)
 */
export async function GET(
  _request: NextRequest,
  context: RouteContext
): Promise<Response> {
  try {
    const { policyId } = await context.params;
    const policy = await getAccessPolicy(policyId);
    return createSuccessResponse<AccessPolicyResponse>({ policy });
  } catch (error) {
    return createErrorResponse(error);
  }
}

/**
 * PUT /api/access/policies/[policyId]
 * Update a reusable policy
 */
export async function PUT(
  request: NextRequest,
  context: RouteContext
): Promise<Response> {
  try {
    const { policyId } = await context.params;
    const body = await request.json();

    // Validate input
    const validation = validatePolicyUpdate(body);
    if (!validation.success) {
      throw new CloudflareServiceError(
        'Validation failed',
        'VALIDATION_ERROR',
        validation.error.flatten()
      );
    }

    // Convert rule inputs to API format
    const input = {
      ...validation.data,
      include: validation.data.include.map(ruleInputToAccessRule),
      exclude: validation.data.exclude?.map(ruleInputToAccessRule),
      require: validation.data.require?.map(ruleInputToAccessRule),
    };

    const policy = await updateAccessPolicy(policyId, input);
    return createSuccessResponse<AccessPolicyResponse>({ policy });
  } catch (error) {
    return createErrorResponse(error);
  }
}

/**
 * DELETE /api/access/policies/[policyId]
 * Delete a reusable policy
 */
export async function DELETE(
  _request: NextRequest,
  context: RouteContext
): Promise<Response> {
  try {
    const { policyId } = await context.params;
    await deleteAccessPolicy(policyId);
    return createSuccessResponse({ success: true });
  } catch (error) {
    return createErrorResponse(error);
  }
}
