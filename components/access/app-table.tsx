'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MoreHorizontal, Pencil, Trash2, Shield, ExternalLink } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { AppDeleteDialog } from './app-delete-dialog';
import { useAccessApps, useAccessAppMutations } from '@/hooks/use-access';
import { TableSkeleton } from '@/components/common/table-skeleton';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorMessage } from '@/components/common/error-message';
import { useToast } from '@/hooks/use-toast';
import type { AccessApplication } from '@/types/access';

/**
 * Access Applications table component
 */
export function AppTable() {
  const { apps, isLoading, isError, error, mutate } = useAccessApps();
  const { deleteApp } = useAccessAppMutations();
  const toast = useToast();

  const [deleteTarget, setDeleteTarget] = useState<AccessApplication | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      await deleteApp(deleteTarget.id);
      toast.success(
        'Application deleted',
        `Application "${deleteTarget.name}" has been deleted.`
      );
      setDeleteTarget(null);
    } catch (err) {
      toast.error(
        'Failed to delete application',
        err instanceof Error ? err.message : 'An error occurred'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (date: string | undefined) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return <TableSkeleton rows={5} columns={5} />;
  }

  if (isError) {
    return (
      <ErrorMessage
        title="Failed to load applications"
        message={
          error?.message || 'An error occurred while loading applications.'
        }
        onRetry={() => mutate()}
      />
    );
  }

  if (apps.length === 0) {
    return (
      <EmptyState
        icon={Shield}
        title="No applications"
        description="Get started by creating your first Access Application."
        action={{
          label: 'Create Application',
          onClick: () => {
            window.location.href = '/access/new';
          },
        }}
      />
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="hidden sm:table-cell">Domain</TableHead>
              <TableHead className="hidden md:table-cell">Type</TableHead>
              <TableHead className="hidden md:table-cell">Policies</TableHead>
              <TableHead className="hidden lg:table-cell">Created</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {apps.map((app) => (
              <TableRow key={app.id}>
                <TableCell className="font-medium">
                  <Link href={`/access/${app.id}`} className="hover:underline">
                    {app.name}
                  </Link>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <code className="text-sm">{app.domain}</code>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <Badge variant="outline">{app.type}</Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {app.policies?.length || 0} policies
                </TableCell>
                <TableCell className="hidden lg:table-cell text-muted-foreground">
                  {formatDate(app.created_at)}
                </TableCell>
                <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/access/${app.id}`}>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        View Details
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/access/${app.id}/edit`}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => setDeleteTarget(app)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AppDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        app={deleteTarget}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </>
  );
}
