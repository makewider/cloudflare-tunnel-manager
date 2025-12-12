'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MoreHorizontal, Pencil, Trash2, FileKey } from 'lucide-react';
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
import { PolicyUsageBadge } from './policy-usage-badge';
import { PolicyDeleteDialog } from './policy-delete-dialog';
import { useAccessPolicies, useAccessPolicyMutations } from '@/hooks/use-access';
import { TableSkeleton } from '@/components/common/table-skeleton';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorMessage } from '@/components/common/error-message';
import { useToast } from '@/hooks/use-toast';
import type { AccessPolicy } from '@/types/access';

/**
 * Reusable Policies table component
 */
export function PolicyTable() {
  const { policies, isLoading, isError, error, mutate } = useAccessPolicies();
  const { deletePolicy } = useAccessPolicyMutations();
  const toast = useToast();

  const [deleteTarget, setDeleteTarget] = useState<AccessPolicy | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      await deletePolicy(deleteTarget.id);
      toast.success(
        'Policy deleted',
        `Policy "${deleteTarget.name}" has been deleted.`
      );
      setDeleteTarget(null);
    } catch (err) {
      toast.error(
        'Failed to delete policy',
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

  const getDecisionBadgeVariant = (decision: string) => {
    switch (decision) {
      case 'allow':
        return 'default';
      case 'deny':
        return 'destructive';
      case 'bypass':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (isLoading) {
    return <TableSkeleton rows={5} columns={5} />;
  }

  if (isError) {
    return (
      <ErrorMessage
        title="Failed to load policies"
        message={error?.message || 'An error occurred while loading policies.'}
        onRetry={() => mutate()}
      />
    );
  }

  if (policies.length === 0) {
    return (
      <EmptyState
        icon={FileKey}
        title="No policies"
        description="Get started by creating your first reusable policy."
        action={{
          label: 'Create Policy',
          onClick: () => {
            window.location.href = '/access/policies/new';
          },
        }}
      />
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Decision</TableHead>
            <TableHead>Precedence</TableHead>
            <TableHead>Usage</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {policies.map((policy) => (
            <TableRow key={policy.id}>
              <TableCell className="font-medium">{policy.name}</TableCell>
              <TableCell>
                <Badge variant={getDecisionBadgeVariant(policy.decision)}>
                  {policy.decision}
                </Badge>
              </TableCell>
              <TableCell>{policy.precedence}</TableCell>
              <TableCell>
                <PolicyUsageBadge count={policy.app_count} />
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDate(policy.created_at)}
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
                      <Link href={`/access/policies/${policy.id}/edit`}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => setDeleteTarget(policy)}
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

      <PolicyDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        policy={deleteTarget}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </>
  );
}
