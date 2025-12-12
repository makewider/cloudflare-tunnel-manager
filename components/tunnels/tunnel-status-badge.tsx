'use client';

import { Badge } from '@/components/ui/badge';
import type { TunnelStatus } from '@/types/tunnel';

interface TunnelStatusBadgeProps {
  status: TunnelStatus;
}

/**
 * Status badge for tunnel status
 */
export function TunnelStatusBadge({ status }: TunnelStatusBadgeProps) {
  const variants: Record<TunnelStatus, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
    healthy: {
      variant: 'default',
      label: 'Healthy',
    },
    inactive: {
      variant: 'secondary',
      label: 'Inactive',
    },
    degraded: {
      variant: 'destructive',
      label: 'Degraded',
    },
    down: {
      variant: 'destructive',
      label: 'Down',
    },
  };

  const config = variants[status] || variants.inactive;

  return (
    <Badge variant={config.variant} className={status === 'healthy' ? 'bg-green-500 hover:bg-green-600' : ''}>
      {config.label}
    </Badge>
  );
}
