'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Error boundary for tunnels pages
 */
export default function TunnelsError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('Tunnels error:', error);
  }, [error]);

  const isRateLimited = error.message.includes('RATE_LIMITED');
  const isUnauthorized = error.message.includes('UNAUTHORIZED');

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
      <AlertCircle className="h-12 w-12 text-destructive" />
      <h2 className="text-xl font-semibold">Tunnel Management Error</h2>

      {isRateLimited && (
        <p className="text-muted-foreground text-center max-w-md">
          API rate limit reached. Please wait a moment and try again.
        </p>
      )}

      {isUnauthorized && (
        <p className="text-muted-foreground text-center max-w-md">
          API token permissions insufficient. Please check your configuration.
        </p>
      )}

      {!isRateLimited && !isUnauthorized && (
        <p className="text-muted-foreground text-center max-w-md">
          An error occurred while loading tunnel data.
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
