import { TableSkeleton } from '@/components/common/table-skeleton';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Loading state for access pages
 */
export default function AccessLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-5 w-72 mt-2" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-36" />
          <Skeleton className="h-10 w-40" />
        </div>
      </div>

      <TableSkeleton rows={5} columns={6} />
    </div>
  );
}
