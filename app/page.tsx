'use client';

import {
  StatsCards,
  QuickActions,
  RecentTunnels,
  RecentApps,
} from '@/components/dashboard/stats-cards';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Overview of your Cloudflare resources
        </p>
      </div>

      <StatsCards />

      <QuickActions />

      <div className="grid gap-6 lg:grid-cols-2">
        <RecentTunnels />
        <RecentApps />
      </div>
    </div>
  );
}
