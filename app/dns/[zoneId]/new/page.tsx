'use client';

import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DnsForm } from '@/components/dns/dns-form';
import { useZones } from '@/hooks/use-zones';
import { Skeleton } from '@/components/ui/skeleton';

interface NewDnsPageProps {
  params: Promise<{ zoneId: string }>;
}

/**
 * DNS record creation page
 */
export default function NewDnsPage({ params }: NewDnsPageProps) {
  const { zoneId } = use(params);
  const { zones, isLoading } = useZones();
  const zone = zones.find((z) => z.id === zoneId);

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
          <h1 className="text-2xl font-bold">New DNS Record</h1>
          <p className="text-muted-foreground">{zone.name}</p>
        </div>
      </div>

      <div className="max-w-2xl">
        <DnsForm zoneId={zoneId} zoneName={zone.name} mode="create" />
      </div>
    </div>
  );
}
