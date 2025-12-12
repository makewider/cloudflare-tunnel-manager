'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * DNS management error boundary
 */
export default function DnsError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('DNS error:', error);
  }, [error]);

  // Cloudflare API specific error handling
  const isRateLimited = error.message.includes('RATE_LIMITED');
  const isUnauthorized = error.message.includes('UNAUTHORIZED');
  const isZoneNotAllowed = error.message.includes('ZONE_NOT_ALLOWED');

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
      <AlertCircle className="h-12 w-12 text-destructive" />
      <h2 className="text-xl font-semibold">DNS Management Error</h2>

      {isRateLimited && (
        <p className="text-muted-foreground text-center max-w-md">
          API rate limit reached. Please wait a moment and try again.
        </p>
      )}

      {isUnauthorized && (
        <p className="text-muted-foreground text-center max-w-md">
          API token permissions are insufficient. Please check your configuration.
        </p>
      )}

      {isZoneNotAllowed && (
        <p className="text-muted-foreground text-center max-w-md">
          The selected zone is not in the allowed list. Please select a different zone.
        </p>
      )}

      {!isRateLimited && !isUnauthorized && !isZoneNotAllowed && (
        <p className="text-muted-foreground text-center max-w-md">
          An error occurred while loading DNS records.
        </p>
      )}

      <div className="flex gap-2">
        <Button onClick={reset}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
        <Button variant="outline" asChild>
          <Link href="/">Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
