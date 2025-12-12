'use client';

import { useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { ingressUpdateSchema } from '@/lib/validations/tunnel';
import { useTunnelConfig, useTunnelConfigMutations } from '@/hooks/use-tunnels';
import { useZones } from '@/hooks/use-zones';
import { useToast } from '@/hooks/use-toast';
import { TableSkeleton } from '@/components/common/table-skeleton';
import { ErrorMessage } from '@/components/common/error-message';
import type { IngressRuleInput } from '@/types/tunnel';

interface TunnelConfigFormProps {
  tunnelId: string;
  tunnelName: string;
}

/**
 * Tunnel ingress configuration form
 */
export function TunnelConfigForm({ tunnelId, tunnelName }: TunnelConfigFormProps) {
  const toast = useToast();
  const { zones, isLoading: zonesLoading } = useZones();
  const { parsedRules, isLoading, isError, error, mutate } = useTunnelConfig(tunnelId);
  const { updateConfig } = useTunnelConfigMutations(tunnelId);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    resolver: zodResolver(ingressUpdateSchema),
    defaultValues: {
      rules: [] as IngressRuleInput[],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'rules',
  });

  // Reset form when data is loaded
  useState(() => {
    if (parsedRules.length > 0 && fields.length === 0) {
      form.reset({
        rules: parsedRules.map((rule) => ({
          zoneId: rule.zoneId,
          subdomain: rule.subdomain,
          service: rule.service,
          path: rule.path,
        })),
      });
    }
  });

  const onSubmit = form.handleSubmit(async (data) => {
    setIsSubmitting(true);
    try {
      await updateConfig(data);
      await mutate();
      toast.success(
        'Configuration updated',
        'Ingress rules have been updated successfully.'
      );
    } catch (err) {
      toast.error(
        'Failed to update configuration',
        err instanceof Error ? err.message : 'An error occurred'
      );
    } finally {
      setIsSubmitting(false);
    }
  });

  const addRule = () => {
    append({
      zoneId: zones[0]?.id || '',
      subdomain: '',
      service: 'http://localhost:8080',
      path: undefined,
    });
  };

  if (isLoading || zonesLoading) {
    return <TableSkeleton rows={3} columns={4} />;
  }

  if (isError) {
    return (
      <ErrorMessage
        title="Failed to load configuration"
        message={error?.message || 'An error occurred while loading configuration.'}
        onRetry={() => mutate()}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ingress Rules</CardTitle>
        <CardDescription>
          Configure how traffic is routed through the tunnel &quot;{tunnelName}&quot;.
          DNS CNAME records will be automatically created for each hostname.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={onSubmit}>
          <CardContent className="space-y-4">
            {fields.length === 0 && (
              <div className="rounded-md border border-dashed p-8 text-center">
                <p className="text-muted-foreground mb-4">
                  No ingress rules configured. Add a rule to start routing traffic.
                </p>
                <Button type="button" onClick={addRule}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Rule
                </Button>
              </div>
            )}

            {fields.map((field, index) => (
              <div
                key={field.id}
                className="rounded-md border p-4 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Rule {index + 1}</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name={`rules.${index}.zoneId`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Zone</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select zone" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {zones.map((zone) => (
                              <SelectItem key={zone.id} value={zone.id}>
                                {zone.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`rules.${index}.subdomain`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subdomain</FormLabel>
                        <FormControl>
                          <div className="flex items-center gap-2">
                            <Input
                              placeholder="app"
                              {...field}
                            />
                            <span className="text-muted-foreground whitespace-nowrap">
                              .{zones.find((z) => z.id === form.watch(`rules.${index}.zoneId`))?.name || 'example.com'}
                            </span>
                          </div>
                        </FormControl>
                        <FormDescription>
                          Leave empty for root domain.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name={`rules.${index}.service`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Service URL</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="http://localhost:8080"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          The local service to route traffic to.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`rules.${index}.path`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Path (optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="/api/*"
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormDescription>
                          Path pattern to match (e.g., /api/*).
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            ))}

            {fields.length > 0 && (
              <Button type="button" variant="outline" onClick={addRule}>
                <Plus className="mr-2 h-4 w-4" />
                Add Rule
              </Button>
            )}

            <div className="rounded-md bg-blue-50 dark:bg-blue-950 p-3 text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium">Note:</p>
              <p>
                A catch-all rule (http_status:404) will be automatically added at the end.
                DNS CNAME records pointing to the tunnel will be created automatically for each hostname.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Configuration'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
