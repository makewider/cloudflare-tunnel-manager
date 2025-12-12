'use client';

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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { dnsCreateSchema, dnsRecordTypes } from '@/lib/validations/dns';
import { useDnsRecordMutations } from '@/hooks/use-dns';
import { useToast } from '@/hooks/use-toast';
import type { DnsRecord } from '@/types/dns';
import { useState } from 'react';

interface DnsFormProps {
  zoneId: string;
  zoneName: string;
  record?: DnsRecord;
  mode: 'create' | 'edit';
}

/**
 * DNS record form for creating and editing records
 */
export function DnsForm({ zoneId, zoneName, record, mode }: DnsFormProps) {
  const router = useRouter();
  const toast = useToast();
  const { createRecord, updateRecord } = useDnsRecordMutations(zoneId);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    resolver: zodResolver(dnsCreateSchema),
    defaultValues: {
      type: (record?.type as 'A' | 'AAAA' | 'CNAME' | 'MX' | 'TXT' | 'NS' | 'SRV' | 'CAA') || 'A',
      name: record?.name?.replace(`.${zoneName}`, '') || '',
      content: record?.content || '',
      ttl: record?.ttl || 1,
      proxied: record?.proxied || false,
      priority: record?.priority,
    },
  });

  const watchType = form.watch('type');
  const showPriority = watchType === 'MX' || watchType === 'SRV';
  const canProxy = ['A', 'AAAA', 'CNAME'].includes(watchType);

  const onSubmit = form.handleSubmit(async (data) => {
    setIsSubmitting(true);
    try {
      if (mode === 'create') {
        await createRecord(data);
        toast.success(
          'Record created',
          `${data.type} record for ${data.name} has been created.`
        );
      } else if (record) {
        await updateRecord(record.id, data);
        toast.success(
          'Record updated',
          `${data.type} record for ${data.name} has been updated.`
        );
      }
      router.push(`/dns?zone=${zoneId}`);
    } catch (err) {
      toast.error(
        mode === 'create' ? 'Failed to create record' : 'Failed to update record',
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
          {mode === 'create' ? 'Create DNS Record' : 'Edit DNS Record'}
        </CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={onSubmit}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={mode === 'edit'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select record type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {dnsRecordTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    The type of DNS record to create.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="@"
                        {...field}
                      />
                      <span className="text-muted-foreground whitespace-nowrap">
                        .{zoneName}
                      </span>
                    </div>
                  </FormControl>
                  <FormDescription>
                    Use @ for the root domain, or enter a subdomain.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={
                        watchType === 'A'
                          ? '192.0.2.1'
                          : watchType === 'AAAA'
                          ? '2001:db8::1'
                          : watchType === 'CNAME'
                          ? 'example.com'
                          : watchType === 'MX'
                          ? 'mail.example.com'
                          : watchType === 'TXT'
                          ? 'v=spf1 include:_spf.example.com ~all'
                          : ''
                      }
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {watchType === 'A' && 'IPv4 address (e.g., 192.0.2.1)'}
                    {watchType === 'AAAA' && 'IPv6 address (e.g., 2001:db8::1)'}
                    {watchType === 'CNAME' && 'Target domain name'}
                    {watchType === 'MX' && 'Mail server hostname'}
                    {watchType === 'TXT' && 'Text content (e.g., SPF, DKIM)'}
                    {watchType === 'NS' && 'Nameserver hostname'}
                    {watchType === 'SRV' && 'Service target (priority weight port target)'}
                    {watchType === 'CAA' && 'CAA record value'}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {showPriority && (
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={65535}
                        placeholder="10"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                      />
                    </FormControl>
                    <FormDescription>
                      Lower values have higher priority.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="ttl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>TTL</FormLabel>
                  <Select
                    onValueChange={(v) => field.onChange(parseInt(v, 10))}
                    defaultValue={String(field.value)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select TTL" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1">Auto</SelectItem>
                      <SelectItem value="60">1 minute</SelectItem>
                      <SelectItem value="120">2 minutes</SelectItem>
                      <SelectItem value="300">5 minutes</SelectItem>
                      <SelectItem value="600">10 minutes</SelectItem>
                      <SelectItem value="900">15 minutes</SelectItem>
                      <SelectItem value="1800">30 minutes</SelectItem>
                      <SelectItem value="3600">1 hour</SelectItem>
                      <SelectItem value="7200">2 hours</SelectItem>
                      <SelectItem value="18000">5 hours</SelectItem>
                      <SelectItem value="43200">12 hours</SelectItem>
                      <SelectItem value="86400">1 day</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Time to live for the DNS record.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {canProxy && (
              <FormField
                control={form.control}
                name="proxied"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Proxy</FormLabel>
                      <FormDescription>
                        Enable Cloudflare proxy for this record.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Button
                        type="button"
                        variant={field.value ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => field.onChange(!field.value)}
                        className={field.value ? 'bg-orange-500 hover:bg-orange-600' : ''}
                      >
                        {field.value ? 'Proxied' : 'DNS only'}
                      </Button>
                    </FormControl>
                  </FormItem>
                )}
              />
            )}
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
                  : 'Updating...'
                : mode === 'create'
                ? 'Create Record'
                : 'Update Record'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
