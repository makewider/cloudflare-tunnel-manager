import Cloudflare from 'cloudflare';

/**
 * Singleton Cloudflare SDK client instance
 * Initialized with API token from environment variables
 */
export const cloudflare = new Cloudflare({
  apiToken: process.env.CLOUDFLARE_API_TOKEN!,
});

/**
 * Account ID from environment variables
 * Required for Tunnel and Access API operations
 */
export const accountId = process.env.CLOUDFLARE_ACCOUNT_ID!;
