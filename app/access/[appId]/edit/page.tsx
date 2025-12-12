'use client';

import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppForm } from '@/components/access/app-form';
import { useAccessApp } from '@/hooks/use-access';
import { PageSkeleton } from '@/components/common/page-skeleton';
import { ErrorMessage } from '@/components/common/error-message';

interface PageProps {
  params: Promise<{ appId: string }>;
}

/**
 * Edit Access Application page
 */
export default function EditAccessAppPage({ params }: PageProps) {
  const { appId } = use(params);
  const { app, isLoading, isError, error, mutate } = useAccessApp(appId);

  if (isLoading) {
    return <PageSkeleton />;
  }

  if (isError || !app) {
    return (
      <ErrorMessage
        title="Failed to load application"
        message={
          error?.message || 'Application not found or an error occurred.'
        }
        onRetry={() => mutate()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/access/${app.id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Edit Application</h1>
          <p className="text-muted-foreground">{app.name}</p>
        </div>
      </div>

      <div className="max-w-2xl">
        <AppForm app={app} mode="edit" />
      </div>
    </div>
  );
}
