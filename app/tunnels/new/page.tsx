import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TunnelForm } from '@/components/tunnels/tunnel-form';

/**
 * New tunnel creation page
 */
export default function NewTunnelPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/tunnels">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create Tunnel</h1>
          <p className="text-muted-foreground">
            Create a new Cloudflare Tunnel
          </p>
        </div>
      </div>

      <div className="max-w-2xl">
        <TunnelForm />
      </div>
    </div>
  );
}
