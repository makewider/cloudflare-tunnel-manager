'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ZoneSelector } from '@/components/dns/zone-selector';
import { DnsTable } from '@/components/dns/dns-table';

/**
 * DNS management page with zone selector
 */
export default function DnsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const zoneId = searchParams.get('zone');

  const handleZoneChange = (newZoneId: string) => {
    router.push(`/dns?zone=${newZoneId}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">DNS Records</h1>
          <p className="text-muted-foreground">
            Manage DNS records for your domains.
          </p>
        </div>
        {zoneId && (
          <Button asChild>
            <Link href={`/dns/${zoneId}/new`}>
              <Plus className="mr-2 h-4 w-4" />
              Add Record
            </Link>
          </Button>
        )}
      </div>

      <div className="flex items-center gap-4">
        <span className="text-sm font-medium">Zone:</span>
        <ZoneSelector value={zoneId} onChange={handleZoneChange} />
      </div>

      {zoneId ? (
        <DnsTable zoneId={zoneId} />
      ) : (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground">
            Select a zone to view DNS records.
          </p>
        </div>
      )}
    </div>
  );
}
