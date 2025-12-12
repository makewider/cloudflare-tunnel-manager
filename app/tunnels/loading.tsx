import { TableSkeleton } from '@/components/common/table-skeleton';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Loading state for tunnels pages
 */
export default function TunnelsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-5 w-64 mt-2" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>

      <TableSkeleton rows={5} columns={6} />
    </div>
  );
}
