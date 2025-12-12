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
import { PolicyUsageBadge } from './policy-usage-badge';
import type { AccessPolicy } from '@/types/access';

interface PolicyDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  policy: AccessPolicy | null;
  onConfirm: () => void;
  isDeleting: boolean;
}

/**
 * Access Policy delete confirmation dialog
 */
export function PolicyDeleteDialog({
  open,
  onOpenChange,
  policy,
  onConfirm,
  isDeleting,
}: PolicyDeleteDialogProps) {
  if (!policy) return null;

  const hasApps = policy.app_count && policy.app_count > 0;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Access Policy</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>Are you sure you want to delete this policy?</p>
            <div className="mt-4 rounded-md bg-muted p-3 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Name:</span>
                <code className="text-foreground">{policy.name}</code>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Decision:</span>
                <span className="text-foreground capitalize">
                  {policy.decision}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Usage:</span>
                <PolicyUsageBadge count={policy.app_count} />
              </div>
            </div>
            {hasApps && (
              <p className="text-destructive font-medium mt-4">
                Warning: This policy is currently used by {policy.app_count}{' '}
                application(s). Deleting it will remove access controls from
                those applications.
              </p>
            )}
            <p className="text-destructive font-medium mt-4">
              This action cannot be undone.
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
