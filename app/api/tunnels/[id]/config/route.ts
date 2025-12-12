import { NextRequest } from 'next/server';
import {
  getTunnelConfig,
  updateTunnelConfig,
  parseIngressRules,
} from '@/lib/cloudflare/tunnels';
import { validateIngressUpdate } from '@/lib/validations/tunnel';
import {
  createErrorResponse,
  createSuccessResponse,
} from '@/lib/api-response';
import { CloudflareServiceError } from '@/lib/cloudflare/errors';
import type { TunnelConfigResponse } from '@/types/tunnel';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/tunnels/[id]/config
 * Get tunnel configuration (ingress rules)
 */
export async function GET(
  _request: NextRequest,
  { params }: RouteParams
): Promise<Response> {
  try {
    const { id } = await params;
    const config = await getTunnelConfig(id);

    // Parse ingress rules for UI display
    const parsedRules = parseIngressRules(config);

    return createSuccessResponse<TunnelConfigResponse>({
      config: config ?? { ingress: [] },
      parsedRules,
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}

/**
 * PUT /api/tunnels/[id]/config
 * Update tunnel configuration (ingress rules)
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
): Promise<Response> {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate input
    const validation = validateIngressUpdate(body);
    if (!validation.success) {
      throw new CloudflareServiceError(
        'Validation failed',
        'VALIDATION_ERROR',
        validation.error.flatten()
      );
    }

    await updateTunnelConfig(id, validation.data.rules);

    // Return updated config
    const config = await getTunnelConfig(id);
    const parsedRules = parseIngressRules(config);

    return createSuccessResponse<TunnelConfigResponse>({
      config: config ?? { ingress: [] },
      parsedRules,
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
