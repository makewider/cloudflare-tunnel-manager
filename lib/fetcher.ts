import type { CloudflareErrorCode } from '@/types/errors';

/**
 * Custom API error class for SWR error handling
 * Contains structured error information from API responses
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public code: CloudflareErrorCode,
    public status: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Generic fetcher function for SWR
 * Handles error responses and converts them to ApiError instances
 *
 * @param url - URL to fetch
 * @returns Parsed JSON response
 * @throws ApiError if the response is not ok
 */
export async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url);

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new ApiError(
      errorData.error?.message || 'An error occurred',
      errorData.error?.code || 'UNKNOWN',
      res.status,
      errorData.error?.details
    );
  }

  return res.json();
}
