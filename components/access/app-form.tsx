'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
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
import { PolicySelector } from './policy-selector';
import {
  accessAppCreateSchema,
  accessAppUpdateSchema,
} from '@/lib/validations/access';
import { useAccessAppMutations } from '@/hooks/use-access';
import { useToast } from '@/hooks/use-toast';
import type { AccessApplication } from '@/types/access';

interface AppFormProps {
  app?: AccessApplication | null;
  mode: 'create' | 'edit';
}

/**
 * Access Application create/edit form
 */
export function AppForm({ app, mode }: AppFormProps) {
  const router = useRouter();
  const toast = useToast();
  const { createApp, updateApp } = useAccessAppMutations();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const schema = mode === 'create' ? accessAppCreateSchema : accessAppUpdateSchema;

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: app?.name || '',
      domain: app?.domain || '',
      type: app?.type || 'self_hosted',
      session_duration: app?.session_duration || '24h',
      app_launcher_visible: app?.app_launcher_visible ?? true,
      policies: app?.policies || [],
    },
  });

  // Update form when app data changes
  useEffect(() => {
    if (app) {
      form.reset({
        name: app.name,
        domain: app.domain,
        type: app.type,
        session_duration: app.session_duration || '24h',
        app_launcher_visible: app.app_launcher_visible ?? true,
        policies: app.policies || [],
      });
    }
  }, [app, form]);

  const onSubmit = form.handleSubmit(async (data) => {
    setIsSubmitting(true);
    try {
      if (mode === 'create') {
        const newApp = await createApp(data);
        toast.success(
          'Application created',
          `Application "${newApp.name}" has been created successfully.`
        );
        router.push(`/access/${newApp.id}`);
      } else if (app) {
        await updateApp(app.id, data);
        toast.success(
          'Application updated',
          `Application "${data.name}" has been updated successfully.`
        );
        router.push(`/access/${app.id}`);
      }
    } catch (err) {
      toast.error(
        mode === 'create'
          ? 'Failed to create application'
          : 'Failed to update application',
        err instanceof Error ? err.message : 'An error occurred'
      );
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {mode === 'create' ? 'Create Application' : 'Edit Application'}
        </CardTitle>
        <CardDescription>
          {mode === 'create'
            ? 'Create a new Access Application to protect your services.'
            : 'Update the settings for this Access Application.'}
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={onSubmit}>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Application Name</FormLabel>
                  <FormControl>
                    <Input placeholder="My Application" {...field} />
                  </FormControl>
                  <FormDescription>
                    A friendly name to identify this application.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="domain"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Domain</FormLabel>
                  <FormControl>
                    <Input placeholder="app.example.com" {...field} />
                  </FormControl>
                  <FormDescription>
                    The domain that this application will protect.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Application Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="self_hosted">Self-hosted</SelectItem>
                      <SelectItem value="saas">SaaS</SelectItem>
                      <SelectItem value="ssh">SSH</SelectItem>
                      <SelectItem value="vnc">VNC</SelectItem>
                      <SelectItem value="bookmark">Bookmark</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    The type of application you are protecting.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="session_duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Session Duration</FormLabel>
                  <FormControl>
                    <Input placeholder="24h" {...field} />
                  </FormControl>
                  <FormDescription>
                    How long a user&apos;s session remains valid. Format: 30m,
                    24h, 7d
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="app_launcher_visible"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Show in App Launcher
                    </FormLabel>
                    <FormDescription>
                      Make this application visible in the Cloudflare Access App
                      Launcher.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="policies"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Access Policies</FormLabel>
                  <FormControl>
                    <PolicySelector
                      value={field.value || []}
                      onChange={field.onChange}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    Select reusable policies to control who can access this
                    application.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
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
              {isSubmitting
                ? mode === 'create'
                  ? 'Creating...'
                  : 'Saving...'
                : mode === 'create'
                  ? 'Create Application'
                  : 'Save Changes'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
