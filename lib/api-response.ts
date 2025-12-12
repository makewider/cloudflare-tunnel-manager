import { NextResponse } from 'next/server';
import { CloudflareServiceError } from '@/lib/cloudflare/errors';
import type { ApiErrorResponse, CloudflareErrorCode } from '@/types/errors';

/**
 * HTTP status code mapping for error codes
 */
const statusMap: Record<CloudflareErrorCode, number> = {
  ZONE_NOT_ALLOWED: 403,
  RESOURCE_NOT_FOUND: 404,
  VALIDATION_ERROR: 400,
  RATE_LIMITED: 429,
  UNAUTHORIZED: 401,
  UNKNOWN: 500,
};

/**
 * Create a standardized error response for API routes
 *
 * @param error - Error to convert to response
 * @param defaultStatus - Default HTTP status if error type is unknown
 * @returns NextResponse with error payload
 */
export function createErrorResponse(
  error: unknown,
  defaultStatus = 500
): NextResponse<ApiErrorResponse> {
  if (error instanceof CloudflareServiceError) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      },
      { status: statusMap[error.code] || defaultStatus }
    );
  }

  // Handle generic errors
  const message =
    error instanceof Error ? error.message : 'An unexpected error occurred';

  return NextResponse.json(
    {
      error: {
        code: 'UNKNOWN' as const,
        message,
      },
    },
    { status: defaultStatus }
  );
}

/**
 * Create a success response with data
 *
 * @param data - Data to return
 * @param status - HTTP status code (default: 200)
 * @returns NextResponse with data payload
 */
export function createSuccessResponse<T>(
  data: T,
  status = 200
): NextResponse<T> {
  return NextResponse.json(data, { status });
}
