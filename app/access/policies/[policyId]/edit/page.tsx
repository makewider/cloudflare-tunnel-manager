'use client';

import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PolicyForm } from '@/components/access/policy-form';
import { useAccessPolicy } from '@/hooks/use-access';
import { PageSkeleton } from '@/components/common/page-skeleton';
import { ErrorMessage } from '@/components/common/error-message';

interface PageProps {
  params: Promise<{ policyId: string }>;
}

/**
 * Edit Reusable Policy page
 */
export default function EditPolicyPage({ params }: PageProps) {
  const { policyId } = use(params);
  const { policy, isLoading, isError, error, mutate } =
    useAccessPolicy(policyId);

  if (isLoading) {
    return <PageSkeleton />;
  }

  if (isError || !policy) {
    return (
      <ErrorMessage
        title="Failed to load policy"
        message={error?.message || 'Policy not found or an error occurred.'}
        onRetry={() => mutate()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/access/policies">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Edit Policy</h1>
          <p className="text-muted-foreground">{policy.name}</p>
        </div>
      </div>

      <div className="max-w-2xl">
        <PolicyForm policy={policy} mode="edit" />
      </div>
    </div>
  );
}
