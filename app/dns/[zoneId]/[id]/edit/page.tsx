'use client';

import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DnsForm } from '@/components/dns/dns-form';
import { useZones } from '@/hooks/use-zones';
import { useDnsRecord } from '@/hooks/use-dns';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorMessage } from '@/components/common/error-message';

interface EditDnsPageProps {
  params: Promise<{ zoneId: string; id: string }>;
}

/**
 * DNS record edit page
 */
export default function EditDnsPage({ params }: EditDnsPageProps) {
  const { zoneId, id } = use(params);
  const { zones, isLoading: zonesLoading } = useZones();
  const { record, isLoading: recordLoading, isError, error } = useDnsRecord(zoneId, id);

  const zone = zones.find((z) => z.id === zoneId);
  const isLoading = zonesLoading || recordLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!zone) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" asChild>
          <Link href="/dns">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <div className="text-center py-8">
          <p className="text-muted-foreground">Zone not found.</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" asChild>
          <Link href={`/dns?zone=${zoneId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <ErrorMessage
          title="Failed to load DNS record"
          message={error?.message || 'An error occurred while loading the DNS record.'}
        />
      </div>
    );
  }

  if (!record) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" asChild>
          <Link href={`/dns?zone=${zoneId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <div className="text-center py-8">
          <p className="text-muted-foreground">DNS record not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/dns?zone=${zoneId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Edit DNS Record</h1>
          <p className="text-muted-foreground">{zone.name}</p>
        </div>
      </div>

      <div className="max-w-2xl">
        <DnsForm zoneId={zoneId} zoneName={zone.name} record={record} mode="edit" />
      </div>
    </div>
  );
}
