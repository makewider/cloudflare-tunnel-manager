import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, Network, Shield } from 'lucide-react';

const features = [
  {
    title: 'DNS Management',
    description: 'Manage DNS records across your Cloudflare zones',
    href: '/dns',
    icon: Globe,
  },
  {
    title: 'Tunnel Management',
    description: 'Create and configure Cloudflare Tunnels',
    href: '/tunnels',
    icon: Network,
  },
  {
    title: 'Access Management',
    description: 'Control access with Cloudflare Access policies',
    href: '/access',
    icon: Shield,
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Welcome</h2>
        <p className="text-muted-foreground">
          Manage your Cloudflare DNS, Tunnels, and Access from one place.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {features.map((feature) => (
          <Link key={feature.href} href={feature.href}>
            <Card className="h-full transition-colors hover:bg-muted/50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <feature.icon className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>{feature.description}</CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
