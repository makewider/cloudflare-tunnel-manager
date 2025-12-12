'use client';

import { Badge } from '@/components/ui/badge';
import { AppWindow } from 'lucide-react';

interface PolicyUsageBadgeProps {
  count?: number;
}

/**
 * Badge showing how many apps are using a policy
 */
export function PolicyUsageBadge({ count }: PolicyUsageBadgeProps) {
  if (count === undefined) return null;

  const variant = count === 0 ? 'secondary' : 'default';
  const text = count === 1 ? '1 app' : `${count} apps`;

  return (
    <Badge variant={variant} className="gap-1">
      <AppWindow className="h-3 w-3" />
      {text}
    </Badge>
  );
}
