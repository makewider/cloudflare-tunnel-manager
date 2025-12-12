import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface ErrorBoundaryFallbackProps {
  error: Error;
  reset: () => void;
  title?: string;
  description?: string;
}

export function ErrorBoundaryFallback({
  error,
  reset,
  title = 'Something went wrong',
  description = 'An unexpected error occurred. Please try again.',
}: ErrorBoundaryFallbackProps) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
      <AlertCircle className="h-12 w-12 text-destructive" />
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="text-muted-foreground text-center max-w-md">{description}</p>
      {process.env.NODE_ENV === 'development' && (
        <pre className="text-xs text-muted-foreground bg-muted p-2 rounded max-w-md overflow-auto">
          {error.message}
        </pre>
      )}
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
