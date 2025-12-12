import { NextRequest } from 'next/server';
import { listAccessApps, createAccessApp } from '@/lib/cloudflare/access';
import { validateAccessAppCreate } from '@/lib/validations/access';
import {
  createErrorResponse,
  createSuccessResponse,
} from '@/lib/api-response';
import { CloudflareServiceError } from '@/lib/cloudflare/errors';
import type { AccessAppsResponse, AccessAppResponse } from '@/types/access';

/**
 * GET /api/access/apps
 * List all Access Applications
 */
export async function GET(): Promise<Response> {
  try {
    const apps = await listAccessApps();
    return createSuccessResponse<AccessAppsResponse>({ apps });
  } catch (error) {
    return createErrorResponse(error);
  }
}

/**
 * POST /api/access/apps
 * Create a new Access Application
 */
export async function POST(request: NextRequest): Promise<Response> {
  try {
    const body = await request.json();

    // Validate input
    const validation = validateAccessAppCreate(body);
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

    const app = await createAccessApp(input);
    return createSuccessResponse<AccessAppResponse>({ app }, 201);
  } catch (error) {
    return createErrorResponse(error);
  }
}
