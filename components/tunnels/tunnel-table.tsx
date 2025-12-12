'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MoreHorizontal, Settings, Key, Trash2, Network } from 'lucide-react';
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
import { TunnelStatusBadge } from './tunnel-status-badge';
import { TunnelDeleteDialog } from './tunnel-delete-dialog';
import { TunnelTokenDialog } from './tunnel-token-dialog';
import { useTunnels, useTunnelMutations } from '@/hooks/use-tunnels';
import { TableSkeleton } from '@/components/common/table-skeleton';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorMessage } from '@/components/common/error-message';
import { useToast } from '@/hooks/use-toast';
import type { Tunnel } from '@/types/tunnel';

/**
 * Tunnels table component
 * Displays all tunnels with actions
 */
export function TunnelTable() {
  const { tunnels, isLoading, isError, error, mutate } = useTunnels();
  const { deleteTunnel } = useTunnelMutations();
  const toast = useToast();

  const [deleteTarget, setDeleteTarget] = useState<Tunnel | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [tokenTarget, setTokenTarget] = useState<Tunnel | null>(null);

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      await deleteTunnel(deleteTarget.id);
      toast.success(
        'Tunnel deleted',
        `Tunnel "${deleteTarget.name}" has been deleted.`
      );
      setDeleteTarget(null);
    } catch (err) {
      toast.error(
        'Failed to delete tunnel',
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

  const getConnectionCount = (tunnel: Tunnel) => {
    return tunnel.connections?.length || 0;
  };

  const getConnectionColos = (tunnel: Tunnel) => {
    if (!tunnel.connections || tunnel.connections.length === 0) return '-';
    const colos = [...new Set(tunnel.connections.map((c) => c.colo_name))];
    return colos.join(', ');
  };

  if (isLoading) {
    return <TableSkeleton rows={5} columns={5} />;
  }

  if (isError) {
    return (
      <ErrorMessage
        title="Failed to load tunnels"
        message={error?.message || 'An error occurred while loading tunnels.'}
        onRetry={() => mutate()}
      />
    );
  }

  if (tunnels.length === 0) {
    return (
      <EmptyState
        icon={Network}
        title="No tunnels"
        description="Get started by creating your first Cloudflare Tunnel."
        action={{
          label: 'Create Tunnel',
          onClick: () => {
            window.location.href = '/tunnels/new';
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
              <TableHead>Status</TableHead>
              <TableHead className="hidden sm:table-cell">Connections</TableHead>
              <TableHead className="hidden md:table-cell">Data Centers</TableHead>
              <TableHead className="hidden lg:table-cell">Created</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tunnels.map((tunnel) => (
              <TableRow key={tunnel.id}>
                <TableCell className="font-medium">
                  <Link
                    href={`/tunnels/${tunnel.id}`}
                    className="hover:underline"
                  >
                    {tunnel.name}
                  </Link>
                </TableCell>
                <TableCell>
                  <TunnelStatusBadge status={tunnel.status} />
                </TableCell>
                <TableCell className="hidden sm:table-cell">{getConnectionCount(tunnel)}</TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">
                  {getConnectionColos(tunnel)}
                </TableCell>
                <TableCell className="hidden lg:table-cell text-muted-foreground">
                  {formatDate(tunnel.created_at)}
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
                      <Link href={`/tunnels/${tunnel.id}`}>
                        <Settings className="mr-2 h-4 w-4" />
                        View Details
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/tunnels/${tunnel.id}/config`}>
                        <Network className="mr-2 h-4 w-4" />
                        Configure Ingress
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTokenTarget(tunnel)}>
                      <Key className="mr-2 h-4 w-4" />
                      Get Token
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => setDeleteTarget(tunnel)}
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

      <TunnelDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        tunnel={deleteTarget}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />

      <TunnelTokenDialog
        open={!!tokenTarget}
        onOpenChange={(open) => !open && setTokenTarget(null)}
        tunnelId={tokenTarget?.id || null}
        tunnelName={tokenTarget?.name || ''}
      />
    </>
  );
}
