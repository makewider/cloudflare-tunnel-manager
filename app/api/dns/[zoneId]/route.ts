import { NextRequest } from 'next/server';
import { listDnsRecords, createDnsRecord } from '@/lib/cloudflare/dns';
import { validateDnsCreate } from '@/lib/validations/dns';
import {
  createErrorResponse,
  createSuccessResponse,
} from '@/lib/api-response';
import { CloudflareServiceError } from '@/lib/cloudflare/errors';
import type { DnsRecordsResponse, DnsRecordResponse } from '@/types/dns';

interface RouteParams {
  params: Promise<{ zoneId: string }>;
}

/**
 * GET /api/dns/[zoneId]
 * List all DNS records for a zone
 */
export async function GET(
  _request: NextRequest,
  { params }: RouteParams
): Promise<Response> {
  try {
    const { zoneId } = await params;
    const records = await listDnsRecords(zoneId);
    return createSuccessResponse<DnsRecordsResponse>({ records });
  } catch (error) {
    return createErrorResponse(error);
  }
}

/**
 * POST /api/dns/[zoneId]
 * Create a new DNS record
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<Response> {
  try {
    const { zoneId } = await params;
    const body = await request.json();

    // Validate input
    const validation = validateDnsCreate(body);
    if (!validation.success) {
      throw new CloudflareServiceError(
        'Validation failed',
        'VALIDATION_ERROR',
        validation.error.flatten()
      );
    }

    const record = await createDnsRecord(zoneId, validation.data);
    return createSuccessResponse<DnsRecordResponse>({ record }, 201);
  } catch (error) {
    return createErrorResponse(error);
  }
}
