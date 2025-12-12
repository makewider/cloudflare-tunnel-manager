'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { tunnelCreateSchema } from '@/lib/validations/tunnel';
import { useTunnelMutations } from '@/hooks/use-tunnels';
import { useToast } from '@/hooks/use-toast';

/**
 * Tunnel creation form
 */
export function TunnelForm() {
  const router = useRouter();
  const toast = useToast();
  const { createTunnel } = useTunnelMutations();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    resolver: zodResolver(tunnelCreateSchema),
    defaultValues: {
      name: '',
    },
  });

  const onSubmit = form.handleSubmit(async (data) => {
    setIsSubmitting(true);
    try {
      const tunnel = await createTunnel(data);
      toast.success(
        'Tunnel created',
        `Tunnel "${tunnel.name}" has been created successfully.`
      );
      router.push(`/tunnels/${tunnel.id}`);
    } catch (err) {
      toast.error(
        'Failed to create tunnel',
        err instanceof Error ? err.message : 'An error occurred'
      );
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Tunnel</CardTitle>
        <CardDescription>
          Create a new Cloudflare Tunnel to connect your services.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={onSubmit}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tunnel Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="my-tunnel"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    A unique name to identify this tunnel. Use letters, numbers, hyphens, and underscores.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="rounded-md bg-muted p-4 text-sm">
              <p className="font-medium mb-2">What happens when you create a tunnel:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>A secure tunnel is created in your Cloudflare account</li>
                <li>A unique token is generated for cloudflared</li>
                <li>You can configure ingress rules after creation</li>
              </ul>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Tunnel'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
