'use client';

import { useState } from 'react';
import { Copy, Check, Terminal } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useTunnelToken } from '@/hooks/use-tunnels';
import { LoadingSpinner } from '@/components/common/loading-spinner';
import { ErrorMessage } from '@/components/common/error-message';

interface TunnelTokenDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tunnelId: string | null;
  tunnelName: string;
}

/**
 * Dialog to display tunnel token for cloudflared
 */
export function TunnelTokenDialog({
  open,
  onOpenChange,
  tunnelId,
  tunnelName,
}: TunnelTokenDialogProps) {
  const { token, isLoading, isError, error, refetch } = useTunnelToken(
    open ? tunnelId : null
  );
  const [copied, setCopied] = useState(false);
  const [copiedCommand, setCopiedCommand] = useState(false);

  const handleCopyToken = async () => {
    if (!token) return;
    await navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyCommand = async () => {
    if (!token) return;
    const command = `cloudflared tunnel --token ${token} run`;
    await navigator.clipboard.writeText(command);
    setCopiedCommand(true);
    setTimeout(() => setCopiedCommand(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Tunnel Token</DialogTitle>
          <DialogDescription>
            Use this token to run the tunnel &quot;{tunnelName}&quot; with cloudflared.
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        )}

        {isError && (
          <ErrorMessage
            title="Failed to load token"
            message={error?.message || 'An error occurred while loading the token.'}
            onRetry={() => refetch()}
          />
        )}

        {token && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Token</label>
              <div className="relative">
                <pre className="bg-muted rounded-md p-3 pr-12 text-xs overflow-x-auto max-h-24 whitespace-pre-wrap break-all">
                  {token}
                </pre>
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute top-2 right-2"
                  onClick={handleCopyToken}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Run Command</label>
              <div className="relative">
                <pre className="bg-muted rounded-md p-3 pr-12 text-sm overflow-x-auto flex items-center gap-2">
                  <Terminal className="h-4 w-4 flex-shrink-0" />
                  <code className="break-all">cloudflared tunnel --token {token.slice(0, 20)}... run</code>
                </pre>
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute top-2 right-2"
                  onClick={handleCopyCommand}
                >
                  {copiedCommand ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Click the copy button to copy the full command.
              </p>
            </div>

            <div className="rounded-md bg-blue-50 dark:bg-blue-950 p-3 text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium">Note:</p>
              <p>
                Make sure cloudflared is installed on your system before running the command.
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
