'use client';

import { useState, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Key, Settings, Network, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { TunnelStatusBadge } from '@/components/tunnels/tunnel-status-badge';
import { TunnelTokenDialog } from '@/components/tunnels/tunnel-token-dialog';
import { TunnelDeleteDialog } from '@/components/tunnels/tunnel-delete-dialog';
import { useTunnel, useTunnelConfig, useTunnelMutations } from '@/hooks/use-tunnels';
import { useToast } from '@/hooks/use-toast';
import { TableSkeleton } from '@/components/common/table-skeleton';
import { ErrorMessage } from '@/components/common/error-message';

interface TunnelDetailPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Tunnel detail page
 */
export default function TunnelDetailPage({ params }: TunnelDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const toast = useToast();
  const { tunnel, isLoading, isError, error } = useTunnel(id);
  const { parsedRules } = useTunnelConfig(id);
  const { deleteTunnel } = useTunnelMutations();

  const [showToken, setShowToken] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!tunnel) return;

    setIsDeleting(true);
    try {
      await deleteTunnel(tunnel.id);
      toast.success('Tunnel deleted', `Tunnel "${tunnel.name}" has been deleted.`);
      router.push('/tunnels');
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
    return new Date(date).toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/tunnels">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <TableSkeleton rows={1} columns={2} />
        </div>
      </div>
    );
  }

  if (isError || !tunnel) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/tunnels">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Tunnel Details</h1>
        </div>
        <ErrorMessage
          title="Failed to load tunnel"
          message={error?.message || 'Tunnel not found.'}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/tunnels">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{tunnel.name}</h1>
              <TunnelStatusBadge status={tunnel.status} />
            </div>
            <p className="text-muted-foreground">Tunnel ID: {tunnel.id}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowToken(true)}>
            <Key className="mr-2 h-4 w-4" />
            Get Token
          </Button>
          <Button variant="destructive" onClick={() => setShowDelete(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Tunnel Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <TunnelStatusBadge status={tunnel.status} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Connections</p>
                <p className="font-medium">{tunnel.connections?.length || 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="font-medium">{formatDate(tunnel.created_at)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Type</p>
                <p className="font-medium">{tunnel.tun_type || 'cfd_tunnel'}</p>
              </div>
            </div>

            {tunnel.connections && tunnel.connections.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Active Connectors</p>
                <div className="space-y-2">
                  {tunnel.connections.map((conn) => (
                    <div
                      key={conn.id}
                      className="rounded-md bg-muted p-2 text-sm"
                    >
                      <div className="flex justify-between">
                        <span className="font-medium">{conn.colo_name}</span>
                        <span className="text-muted-foreground">
                          v{conn.client_version}
                        </span>
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {conn.origin_ip}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Network className="h-5 w-5" />
                Ingress Rules
              </CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/tunnels/${tunnel.id}/config`}>
                  Configure
                </Link>
              </Button>
            </div>
            <CardDescription>
              Routes configured for this tunnel
            </CardDescription>
          </CardHeader>
          <CardContent>
            {parsedRules.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No ingress rules configured.</p>
                <Button variant="link" asChild>
                  <Link href={`/tunnels/${tunnel.id}/config`}>
                    Add ingress rules
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {parsedRules.map((rule, index) => (
                  <div
                    key={index}
                    className="rounded-md border p-3 text-sm"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{rule.hostname}</p>
                        {rule.path && (
                          <p className="text-muted-foreground">{rule.path}</p>
                        )}
                      </div>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {rule.service}
                      </code>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <TunnelTokenDialog
        open={showToken}
        onOpenChange={setShowToken}
        tunnelId={tunnel.id}
        tunnelName={tunnel.name}
      />

      <TunnelDeleteDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        tunnel={tunnel}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}
