'use client';

import { Badge } from '@/components/ui/badge';
import type { DnsRecordType } from '@/types/dns';

interface DnsTypeBadgeProps {
  type: DnsRecordType | string;
}

/**
 * DNS record type badge with color coding
 */
export function DnsTypeBadge({ type }: DnsTypeBadgeProps) {
  const getVariant = (recordType: string) => {
    switch (recordType) {
      case 'A':
      case 'AAAA':
        return 'default';
      case 'CNAME':
        return 'secondary';
      case 'MX':
      case 'TXT':
        return 'outline';
      default:
        return 'outline';
    }
  };

  return (
    <Badge variant={getVariant(type)} className="font-mono">
      {type}
    </Badge>
  );
}
