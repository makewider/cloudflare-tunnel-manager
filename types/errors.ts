/**
 * Cloudflare API error codes used throughout the application
 */
export type CloudflareErrorCode =
  | 'ZONE_NOT_ALLOWED'
  | 'RESOURCE_NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'RATE_LIMITED'
  | 'UNAUTHORIZED'
  | 'UNKNOWN';

/**
 * Standard application error structure
 */
export interface AppError {
  code: CloudflareErrorCode;
  message: string;
  details?: unknown;
}

/**
 * API error response format
 */
export interface ApiErrorResponse {
  error: AppError;
}
