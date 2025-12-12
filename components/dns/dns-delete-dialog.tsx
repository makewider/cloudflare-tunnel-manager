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
import { DnsTypeBadge } from './dns-type-badge';
import type { DnsRecord } from '@/types/dns';

interface DnsDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: DnsRecord | null;
  onConfirm: () => void;
  isDeleting: boolean;
}

/**
 * DNS record delete confirmation dialog
 */
export function DnsDeleteDialog({
  open,
  onOpenChange,
  record,
  onConfirm,
  isDeleting,
}: DnsDeleteDialogProps) {
  if (!record) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete DNS Record</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>Are you sure you want to delete this DNS record?</p>
            <div className="mt-4 rounded-md bg-muted p-3 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Type:</span>
                <DnsTypeBadge type={record.type} />
              </div>
              <div>
                <span className="text-muted-foreground">Name: </span>
                <code className="text-foreground">{record.name}</code>
              </div>
              <div>
                <span className="text-muted-foreground">Content: </span>
                <code className="text-foreground">{record.content}</code>
              </div>
            </div>
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
