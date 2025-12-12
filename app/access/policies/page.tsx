import Link from 'next/link';
import { Plus, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PolicyTable } from '@/components/access/policy-table';

/**
 * Reusable Policies list page
 */
export default function AccessPoliciesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/access">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Access Policies</h1>
            <p className="text-muted-foreground">
              Manage reusable policies for Access Applications
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href="/access/policies/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Policy
          </Link>
        </Button>
      </div>

      <div className="rounded-md bg-muted p-4 text-sm">
        <p className="font-medium mb-1">About Reusable Policies</p>
        <p className="text-muted-foreground">
          Reusable policies can be shared across multiple applications. When you
          update a policy, the changes automatically apply to all applications
          using it.
        </p>
      </div>

      <PolicyTable />
    </div>
  );
}
