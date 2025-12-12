import { NextRequest } from 'next/server';
import { getTunnel, deleteTunnel } from '@/lib/cloudflare/tunnels';
import {
  createErrorResponse,
  createSuccessResponse,
} from '@/lib/api-response';
import type { TunnelResponse } from '@/types/tunnel';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/tunnels/[id]
 * Get a single tunnel by ID
 */
export async function GET(
  _request: NextRequest,
  { params }: RouteParams
): Promise<Response> {
  try {
    const { id } = await params;
    const tunnel = await getTunnel(id);
    return createSuccessResponse<TunnelResponse>({ tunnel });
  } catch (error) {
    return createErrorResponse(error);
  }
}

/**
 * DELETE /api/tunnels/[id]
 * Delete a tunnel
 */
export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams
): Promise<Response> {
  try {
    const { id } = await params;
    await deleteTunnel(id);
    return createSuccessResponse({ success: true });
  } catch (error) {
    return createErrorResponse(error);
  }
}
