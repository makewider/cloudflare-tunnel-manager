import Link from 'next/link';
import { Plus, FileKey } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppTable } from '@/components/access/app-table';

/**
 * Access Applications list page
 */
export default function AccessPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Access Applications</h1>
          <p className="text-muted-foreground">
            Manage your Cloudflare Access Applications
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/access/policies">
              <FileKey className="mr-2 h-4 w-4" />
              Manage Policies
            </Link>
          </Button>
          <Button asChild>
            <Link href="/access/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Application
            </Link>
          </Button>
        </div>
      </div>

      <AppTable />
    </div>
  );
}
