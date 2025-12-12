'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { TunnelStatusBadge } from './tunnel-status-badge';
import type { Tunnel } from '@/types/tunnel';

interface TunnelDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tunnel: Tunnel | null;
  onConfirm: () => void;
  isDeleting: boolean;
}

/**
 * Tunnel delete confirmation dialog
 */
export function TunnelDeleteDialog({
  open,
  onOpenChange,
  tunnel,
  onConfirm,
  isDeleting,
}: TunnelDeleteDialogProps) {
  if (!tunnel) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Tunnel</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>Are you sure you want to delete this tunnel?</p>
            <div className="mt-4 rounded-md bg-muted p-3 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Name:</span>
                <code className="text-foreground">{tunnel.name}</code>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Status:</span>
                <TunnelStatusBadge status={tunnel.status} />
              </div>
              {tunnel.connections && tunnel.connections.length > 0 && (
                <div>
                  <span className="text-muted-foreground">Connections: </span>
                  <span className="text-foreground">{tunnel.connections.length}</span>
                </div>
              )}
            </div>
            <p className="text-destructive font-medium mt-4">
              This action cannot be undone. All ingress configurations will be deleted.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
