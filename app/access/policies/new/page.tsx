import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PolicyForm } from '@/components/access/policy-form';

/**
 * Create Reusable Policy page
 */
export default function NewPolicyPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/access/policies">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create Policy</h1>
          <p className="text-muted-foreground">
            Create a new reusable access policy
          </p>
        </div>
      </div>

      <div className="max-w-2xl">
        <PolicyForm mode="create" />
      </div>
    </div>
  );
}
