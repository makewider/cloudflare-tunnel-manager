import { NextRequest } from 'next/server';
import {
  getAccessApp,
  updateAccessApp,
  deleteAccessApp,
} from '@/lib/cloudflare/access';
import { validateAccessAppUpdate } from '@/lib/validations/access';
import {
  createErrorResponse,
  createSuccessResponse,
} from '@/lib/api-response';
import { CloudflareServiceError } from '@/lib/cloudflare/errors';
import type { AccessAppResponse } from '@/types/access';

interface RouteContext {
  params: Promise<{ appId: string }>;
}

/**
 * GET /api/access/apps/[appId]
 * Get a single Access Application
 */
export async function GET(
  _request: NextRequest,
  context: RouteContext
): Promise<Response> {
  try {
    const { appId } = await context.params;
    const app = await getAccessApp(appId);
    return createSuccessResponse<AccessAppResponse>({ app });
  } catch (error) {
    return createErrorResponse(error);
  }
}

/**
 * PUT /api/access/apps/[appId]
 * Update an Access Application
 */
export async function PUT(
  request: NextRequest,
  context: RouteContext
): Promise<Response> {
  try {
    const { appId } = await context.params;
    const body = await request.json();

    // Validate input
    const validation = validateAccessAppUpdate(body);
    if (!validation.success) {
      throw new CloudflareServiceError(
        'Validation failed',
        'VALIDATION_ERROR',
        validation.error.flatten()
      );
    }

    // Convert rule inputs to API format if policies have rules
    const input = {
      ...validation.data,
      policies: validation.data.policies?.map((p) => ({
        id: p.id,
        name: p.name,
        precedence: p.precedence,
      })),
    };

    const app = await updateAccessApp(appId, input);
    return createSuccessResponse<AccessAppResponse>({ app });
  } catch (error) {
    return createErrorResponse(error);
  }
}

/**
 * DELETE /api/access/apps/[appId]
 * Delete an Access Application
 */
export async function DELETE(
  _request: NextRequest,
  context: RouteContext
): Promise<Response> {
  try {
    const { appId } = await context.params;
    await deleteAccessApp(appId);
    return createSuccessResponse({ success: true });
  } catch (error) {
    return createErrorResponse(error);
  }
}
