import { NextRequest } from 'next/server';
import { listTunnels, createTunnel } from '@/lib/cloudflare/tunnels';
import { validateTunnelCreate } from '@/lib/validations/tunnel';
import {
  createErrorResponse,
  createSuccessResponse,
} from '@/lib/api-response';
import { CloudflareServiceError } from '@/lib/cloudflare/errors';
import type { TunnelsResponse, TunnelResponse } from '@/types/tunnel';

/**
 * GET /api/tunnels
 * List all tunnels (filtered by allowed zones)
 */
export async function GET(): Promise<Response> {
  try {
    const tunnels = await listTunnels();
    return createSuccessResponse<TunnelsResponse>({ tunnels });
  } catch (error) {
    return createErrorResponse(error);
  }
}

/**
 * POST /api/tunnels
 * Create a new tunnel
 */
export async function POST(request: NextRequest): Promise<Response> {
  try {
    const body = await request.json();

    // Validate input
    const validation = validateTunnelCreate(body);
    if (!validation.success) {
      throw new CloudflareServiceError(
        'Validation failed',
        'VALIDATION_ERROR',
        validation.error.flatten()
      );
    }

    const tunnel = await createTunnel(validation.data.name);
    return createSuccessResponse<TunnelResponse>({ tunnel }, 201);
  } catch (error) {
    return createErrorResponse(error);
  }
}
