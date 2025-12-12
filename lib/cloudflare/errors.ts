import type { CloudflareErrorCode } from '@/types/errors';

/**
 * Custom error class for Cloudflare service operations
 * Provides structured error information with error codes
 */
export class CloudflareServiceError extends Error {
  constructor(
    message: string,
    public code: CloudflareErrorCode,
    public details?: unknown
  ) {
    super(message);
    this.name = 'CloudflareServiceError';
  }
}
