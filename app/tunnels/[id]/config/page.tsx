'use client';

import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TunnelConfigForm } from '@/components/tunnels/tunnel-config-form';
import { useTunnel } from '@/hooks/use-tunnels';
import { TableSkeleton } from '@/components/common/table-skeleton';
import { ErrorMessage } from '@/components/common/error-message';

interface TunnelConfigPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Tunnel configuration page
 */
export default function TunnelConfigPage({ params }: TunnelConfigPageProps) {
  const { id } = use(params);
  const { tunnel, isLoading, isError, error } = useTunnel(id);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/tunnels/${id}`}>
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
          <h1 className="text-3xl font-bold">Configure Tunnel</h1>
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
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/tunnels/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Configure Tunnel</h1>
          <p className="text-muted-foreground">
            Manage ingress rules for &quot;{tunnel.name}&quot;
          </p>
        </div>
      </div>

      <div className="max-w-4xl">
        <TunnelConfigForm tunnelId={id} tunnelName={tunnel.name} />
      </div>
    </div>
  );
}
