import { NextRequest } from 'next/server';
import {
  getDnsRecord,
  updateDnsRecord,
  deleteDnsRecord,
} from '@/lib/cloudflare/dns';
import { validateDnsUpdate } from '@/lib/validations/dns';
import {
  createErrorResponse,
  createSuccessResponse,
} from '@/lib/api-response';
import { CloudflareServiceError } from '@/lib/cloudflare/errors';
import type { DnsRecordResponse } from '@/types/dns';

interface RouteParams {
  params: Promise<{ zoneId: string; id: string }>;
}

/**
 * GET /api/dns/[zoneId]/[id]
 * Get a single DNS record
 */
export async function GET(
  _request: NextRequest,
  { params }: RouteParams
): Promise<Response> {
  try {
    const { zoneId, id } = await params;
    const record = await getDnsRecord(zoneId, id);
    return createSuccessResponse<DnsRecordResponse>({ record });
  } catch (error) {
    return createErrorResponse(error);
  }
}

/**
 * PATCH /api/dns/[zoneId]/[id]
 * Update a DNS record
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
): Promise<Response> {
  try {
    const { zoneId, id } = await params;
    const body = await request.json();

    // Validate input
    const validation = validateDnsUpdate(body);
    if (!validation.success) {
      throw new CloudflareServiceError(
        'Validation failed',
        'VALIDATION_ERROR',
        validation.error.flatten()
      );
    }

    const record = await updateDnsRecord(zoneId, id, validation.data);
    return createSuccessResponse<DnsRecordResponse>({ record });
  } catch (error) {
    return createErrorResponse(error);
  }
}

/**
 * DELETE /api/dns/[zoneId]/[id]
 * Delete a DNS record
 */
export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams
): Promise<Response> {
  try {
    const { zoneId, id } = await params;
    await deleteDnsRecord(zoneId, id);
    return createSuccessResponse({ success: true });
  } catch (error) {
    return createErrorResponse(error);
  }
}
