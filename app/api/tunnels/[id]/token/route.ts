import { NextRequest } from 'next/server';
import { getTunnelToken } from '@/lib/cloudflare/tunnels';
import {
  createErrorResponse,
  createSuccessResponse,
} from '@/lib/api-response';
import type { TunnelTokenResponse } from '@/types/tunnel';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/tunnels/[id]/token
 * Get tunnel token for cloudflared
 */
export async function GET(
  _request: NextRequest,
  { params }: RouteParams
): Promise<Response> {
  try {
    const { id } = await params;
    const token = await getTunnelToken(id);
    return createSuccessResponse<TunnelTokenResponse>({ token });
  } catch (error) {
    return createErrorResponse(error);
  }
}
