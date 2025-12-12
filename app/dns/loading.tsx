import { TableSkeleton } from '@/components/common/table-skeleton';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * DNS page loading state
 */
export default function DnsLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Zone selector */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-9 w-64" />
      </div>

      {/* Table */}
      <TableSkeleton rows={5} columns={6} />
    </div>
  );
}
