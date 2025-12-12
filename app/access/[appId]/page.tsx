'use client';

import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Pencil, Shield, Clock, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAccessApp } from '@/hooks/use-access';
import { PageSkeleton } from '@/components/common/page-skeleton';
import { ErrorMessage } from '@/components/common/error-message';

interface PageProps {
  params: Promise<{ appId: string }>;
}

/**
 * Access Application detail page
 */
export default function AccessAppDetailPage({ params }: PageProps) {
  const { appId } = use(params);
  const { app, isLoading, isError, error, mutate } = useAccessApp(appId);

  const formatDate = (date: string | undefined) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/access">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="h-8 w-8" />
              {app.name}
            </h1>
            <p className="text-muted-foreground">
              Access Application Details
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href={`/access/${app.id}/edit`}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Application Information</CardTitle>
            <CardDescription>
              Basic configuration for this application
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Domain</p>
                <code className="text-sm font-medium">{app.domain}</code>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Type</p>
                <Badge variant="outline">{app.type}</Badge>
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    Session Duration
                  </p>
                  <p className="text-sm font-medium">
                    {app.session_duration || '24h'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {app.app_launcher_visible ? (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                )}
                <div>
                  <p className="text-sm text-muted-foreground">App Launcher</p>
                  <p className="text-sm font-medium">
                    {app.app_launcher_visible ? 'Visible' : 'Hidden'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Access Policies</CardTitle>
            <CardDescription>
              Policies controlling who can access this application
            </CardDescription>
          </CardHeader>
          <CardContent>
            {app.policies && app.policies.length > 0 ? (
              <div className="space-y-2">
                {app.policies.map((policy) => (
                  <div
                    key={policy.id}
                    className="flex items-center justify-between rounded-md border p-3"
                  >
                    <span className="font-medium">
                      {policy.name || policy.id}
                    </span>
                    {policy.precedence !== undefined && (
                      <Badge variant="secondary">
                        Precedence: {policy.precedence}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No policies attached. This application may not be properly
                protected.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Metadata</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Application ID</p>
                <code className="text-xs">{app.id}</code>
              </div>
              {app.aud && (
                <div>
                  <p className="text-sm text-muted-foreground">AUD Tag</p>
                  <code className="text-xs">{app.aud}</code>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-sm">{formatDate(app.created_at)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="text-sm">{formatDate(app.updated_at)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
