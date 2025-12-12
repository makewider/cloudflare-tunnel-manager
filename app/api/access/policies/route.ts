import { NextRequest } from 'next/server';
import { listAccessPolicies, createAccessPolicy } from '@/lib/cloudflare/access';
import { validatePolicyCreate } from '@/lib/validations/access';
import {
  createErrorResponse,
  createSuccessResponse,
} from '@/lib/api-response';
import { CloudflareServiceError } from '@/lib/cloudflare/errors';
import type { AccessPoliciesResponse, AccessPolicyResponse } from '@/types/access';
import { ruleInputToAccessRule } from '@/types/access';

/**
 * GET /api/access/policies
 * List all reusable policies
 */
export async function GET(): Promise<Response> {
  try {
    const policies = await listAccessPolicies();
    return createSuccessResponse<AccessPoliciesResponse>({ policies });
  } catch (error) {
    return createErrorResponse(error);
  }
}

/**
 * POST /api/access/policies
 * Create a new reusable policy
 */
export async function POST(request: NextRequest): Promise<Response> {
  try {
    const body = await request.json();

    // Validate input
    const validation = validatePolicyCreate(body);
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

    const policy = await createAccessPolicy(input);
    return createSuccessResponse<AccessPolicyResponse>({ policy }, 201);
  } catch (error) {
    return createErrorResponse(error);
  }
}
