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
import type { AccessApplication } from '@/types/access';

interface AppDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  app: AccessApplication | null;
  onConfirm: () => void;
  isDeleting: boolean;
}

/**
 * Access Application delete confirmation dialog
 */
export function AppDeleteDialog({
  open,
  onOpenChange,
  app,
  onConfirm,
  isDeleting,
}: AppDeleteDialogProps) {
  if (!app) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Access Application</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>Are you sure you want to delete this application?</p>
            <div className="mt-4 rounded-md bg-muted p-3 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Name:</span>
                <code className="text-foreground">{app.name}</code>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Domain:</span>
                <code className="text-foreground">{app.domain}</code>
              </div>
              {app.policies && app.policies.length > 0 && (
                <div>
                  <span className="text-muted-foreground">Policies: </span>
                  <span className="text-foreground">{app.policies.length}</span>
                </div>
              )}
            </div>
            <p className="text-destructive font-medium mt-4">
              This action cannot be undone. Users will lose access to this
              protected application.
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
