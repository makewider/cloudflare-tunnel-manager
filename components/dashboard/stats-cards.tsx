'use client';

import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Globe,
  Network,
  Shield,
  FileKey,
  Plus,
  ArrowRight,
  Activity,
  AlertCircle,
} from 'lucide-react';
import { useZones } from '@/hooks/use-zones';
import { useTunnels } from '@/hooks/use-tunnels';
import { useAccessApps, useAccessPolicies } from '@/hooks/use-access';

function StatsCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-12 mb-1" />
        <Skeleton className="h-3 w-32" />
      </CardContent>
    </Card>
  );
}

function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  href,
  status,
  isLoading,
  isError,
}: {
  title: string;
  value: number | string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  status?: { active: number; total: number } | null;
  isLoading: boolean;
  isError: boolean;
}) {
  if (isLoading) {
    return <StatsCardSkeleton />;
  }

  return (
    <Link href={href}>
      <Card className="h-full transition-colors hover:bg-muted/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isError ? (
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">Failed to load</span>
            </div>
          ) : (
            <>
              <div className="text-2xl font-bold">{value}</div>
              <p className="text-xs text-muted-foreground">{description}</p>
              {status && status.total > 0 && (
                <div className="mt-2 flex items-center gap-2">
                  <Activity className="h-3 w-3 text-green-500" />
                  <span className="text-xs text-muted-foreground">
                    {status.active} active
                  </span>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

export function StatsCards() {
  const { zones, isLoading: zonesLoading, isError: zonesError } = useZones();
  const {
    tunnels,
    isLoading: tunnelsLoading,
    isError: tunnelsError,
  } = useTunnels();
  const { apps, isLoading: appsLoading, isError: appsError } = useAccessApps();
  const {
    policies,
    isLoading: policiesLoading,
    isError: policiesError,
  } = useAccessPolicies();

  const activeTunnels = tunnels.filter(
    (t) => t.status === 'healthy'
  ).length;

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="DNS Zones"
        value={zones.length}
        description="Managed zones"
        icon={Globe}
        href="/dns"
        isLoading={zonesLoading}
        isError={zonesError}
      />
      <StatsCard
        title="Tunnels"
        value={tunnels.length}
        description="Cloudflare tunnels"
        icon={Network}
        href="/tunnels"
        status={{ active: activeTunnels, total: tunnels.length }}
        isLoading={tunnelsLoading}
        isError={tunnelsError}
      />
      <StatsCard
        title="Access Apps"
        value={apps.length}
        description="Protected applications"
        icon={Shield}
        href="/access"
        isLoading={appsLoading}
        isError={appsError}
      />
      <StatsCard
        title="Policies"
        value={policies.length}
        description="Reusable policies"
        icon={FileKey}
        href="/access/policies"
        isLoading={policiesLoading}
        isError={policiesError}
      />
    </div>
  );
}

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>
          Common operations you can perform
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Button variant="outline" className="justify-start" asChild>
          <Link href="/tunnels/new">
            <Plus className="mr-2 h-4 w-4" />
            New Tunnel
          </Link>
        </Button>
        <Button variant="outline" className="justify-start" asChild>
          <Link href="/access/new">
            <Plus className="mr-2 h-4 w-4" />
            New Access App
          </Link>
        </Button>
        <Button variant="outline" className="justify-start" asChild>
          <Link href="/access/policies/new">
            <Plus className="mr-2 h-4 w-4" />
            New Policy
          </Link>
        </Button>
        <Button variant="outline" className="justify-start" asChild>
          <Link href="/dns">
            <ArrowRight className="mr-2 h-4 w-4" />
            Manage DNS
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export function RecentTunnels() {
  const { tunnels, isLoading, isError } = useTunnels();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Tunnels</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-5 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Tunnels</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">Failed to load tunnels</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const recentTunnels = tunnels.slice(0, 5);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Recent Tunnels</CardTitle>
          <CardDescription>Your recently created tunnels</CardDescription>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/tunnels">
            View all
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {recentTunnels.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No tunnels created yet
          </p>
        ) : (
          <div className="space-y-4">
            {recentTunnels.map((tunnel) => (
              <Link
                key={tunnel.id}
                href={`/tunnels/${tunnel.id}`}
                className="flex items-center justify-between hover:bg-muted/50 -mx-2 px-2 py-1 rounded-md transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Network className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{tunnel.name}</span>
                </div>
                <Badge
                  variant={tunnel.status === 'healthy' ? 'default' : 'secondary'}
                  className={tunnel.status === 'healthy' ? 'bg-green-500 hover:bg-green-600' : ''}
                >
                  {tunnel.status}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function RecentApps() {
  const { apps, isLoading, isError } = useAccessApps();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Access Applications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Access Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">Failed to load applications</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const recentApps = apps.slice(0, 5);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Access Applications</CardTitle>
          <CardDescription>Protected applications</CardDescription>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/access">
            View all
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {recentApps.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No applications created yet
          </p>
        ) : (
          <div className="space-y-4">
            {recentApps.map((app) => (
              <Link
                key={app.id}
                href={`/access/${app.id}`}
                className="flex items-center justify-between hover:bg-muted/50 -mx-2 px-2 py-1 rounded-md transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{app.name}</span>
                </div>
                <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                  {app.domain}
                </span>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
