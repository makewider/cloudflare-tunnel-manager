import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TunnelTable } from '@/components/tunnels/tunnel-table';

/**
 * Tunnels list page
 * Displays all Cloudflare Tunnels
 */
export default function TunnelsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tunnels</h1>
          <p className="text-muted-foreground">
            Manage your Cloudflare Tunnels
          </p>
        </div>
        <Button asChild>
          <Link href="/tunnels/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Tunnel
          </Link>
        </Button>
      </div>

      <TunnelTable />
    </div>
  );
}
