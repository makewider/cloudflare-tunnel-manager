'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MoreHorizontal, Pencil, Trash2, Cloud, CloudOff } from 'lucide-react';
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DnsTypeBadge } from './dns-type-badge';
import { DnsDeleteDialog } from './dns-delete-dialog';
import { useDnsRecords, useDnsRecordMutations } from '@/hooks/use-dns';
import { TableSkeleton } from '@/components/common/table-skeleton';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorMessage } from '@/components/common/error-message';
import { useToast } from '@/hooks/use-toast';
import { Database } from 'lucide-react';
import type { DnsRecord } from '@/types/dns';

interface DnsTableProps {
  zoneId: string;
}

/**
 * DNS records table component
 * Displays all DNS records for a zone with actions
 */
export function DnsTable({ zoneId }: DnsTableProps) {
  const { records, isLoading, isError, error, mutate } = useDnsRecords(zoneId);
  const { deleteRecord } = useDnsRecordMutations(zoneId);
  const toast = useToast();

  const [deleteTarget, setDeleteTarget] = useState<DnsRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      await deleteRecord(deleteTarget.id);
      toast.success(
        'Record deleted',
        `${deleteTarget.type} record for ${deleteTarget.name} has been deleted.`
      );
      setDeleteTarget(null);
    } catch (err) {
      toast.error(
        'Failed to delete record',
        err instanceof Error ? err.message : 'An error occurred'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const formatTTL = (ttl: number | undefined) => {
    if (!ttl || ttl === 1) return 'Auto';
    if (ttl < 60) return `${ttl}s`;
    if (ttl < 3600) return `${Math.floor(ttl / 60)}m`;
    return `${Math.floor(ttl / 3600)}h`;
  };

  if (isLoading) {
    return <TableSkeleton rows={5} columns={6} />;
  }

  if (isError) {
    return (
      <ErrorMessage
        title="Failed to load DNS records"
        message={error?.message || 'An error occurred while loading DNS records.'}
        onRetry={() => mutate()}
      />
    );
  }

  if (records.length === 0) {
    return (
      <EmptyState
        icon={Database}
        title="No DNS records"
        description="Get started by creating your first DNS record."
        action={{
          label: 'Create Record',
          onClick: () => {
            window.location.href = `/dns/${zoneId}/new`;
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
              <TableHead>Type</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="hidden sm:table-cell">Content</TableHead>
              <TableHead className="hidden md:table-cell">TTL</TableHead>
              <TableHead className="hidden md:table-cell">Proxy</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((record) => (
              <TableRow key={record.id}>
                <TableCell>
                  <DnsTypeBadge type={record.type} />
                </TableCell>
                <TableCell className="font-mono text-sm max-w-[200px] truncate">
                  {record.name}
                </TableCell>
                <TableCell className="hidden sm:table-cell font-mono text-sm max-w-[300px] truncate">
                  {record.content}
                </TableCell>
                <TableCell className="hidden md:table-cell">{formatTTL(record.ttl)}</TableCell>
                <TableCell className="hidden md:table-cell">
                  {record.proxied ? (
                    <Cloud className="h-4 w-4 text-orange-500" />
                  ) : (
                    <CloudOff className="h-4 w-4 text-muted-foreground" />
                  )}
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
                      <Link href={`/dns/${zoneId}/${record.id}/edit`}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => setDeleteTarget(record)}
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

      <DnsDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        record={deleteTarget}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </>
  );
}
