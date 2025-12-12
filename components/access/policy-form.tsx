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
import { Separator } from '@/components/ui/separator';
import { RuleBuilder } from './rule-builder';
import { policyCreateSchema, policyUpdateSchema } from '@/lib/validations/access';
import { useAccessPolicyMutations } from '@/hooks/use-access';
import { useToast } from '@/hooks/use-toast';
import type { AccessPolicy, RuleInput } from '@/types/access';
import { accessRuleToInput, ruleInputToAccessRule } from '@/types/access';

interface PolicyFormProps {
  policy?: AccessPolicy | null;
  mode: 'create' | 'edit';
}

/**
 * Reusable Policy create/edit form
 */
export function PolicyForm({ policy, mode }: PolicyFormProps) {
  const router = useRouter();
  const toast = useToast();
  const { createPolicy, updatePolicy } = useAccessPolicyMutations();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const schema = mode === 'create' ? policyCreateSchema : policyUpdateSchema;

  // Convert API rules to form format
  const convertRulesToInput = (
    rules: AccessPolicy['include'] | undefined
  ): RuleInput[] => {
    if (!rules || rules.length === 0) return [{ type: 'email_domain', value: '' }];
    return rules.map(accessRuleToInput);
  };

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: policy?.name || '',
      precedence: policy?.precedence || 1,
      decision: policy?.decision || 'allow',
      include: convertRulesToInput(policy?.include),
      exclude: policy?.exclude ? convertRulesToInput(policy.exclude) : [],
      require: policy?.require ? convertRulesToInput(policy.require) : [],
      session_duration: policy?.session_duration || '',
      approval_required: policy?.approval_required || false,
    },
  });

  // Update form when policy data changes
  useEffect(() => {
    if (policy) {
      form.reset({
        name: policy.name,
        precedence: policy.precedence,
        decision: policy.decision,
        include: convertRulesToInput(policy.include),
        exclude: policy.exclude ? convertRulesToInput(policy.exclude) : [],
        require: policy.require ? convertRulesToInput(policy.require) : [],
        session_duration: policy.session_duration || '',
        approval_required: policy.approval_required || false,
      });
    }
  }, [policy, form]);

  const onSubmit = form.handleSubmit(async (data) => {
    setIsSubmitting(true);
    try {
      // Convert RuleInput format to AccessRule format for API
      const apiData = {
        ...data,
        include: data.include.map(ruleInputToAccessRule),
        exclude: data.exclude?.length
          ? data.exclude.map(ruleInputToAccessRule)
          : undefined,
        require: data.require?.length
          ? data.require.map(ruleInputToAccessRule)
          : undefined,
      };

      if (mode === 'create') {
        const newPolicy = await createPolicy(apiData);
        toast.success(
          'Policy created',
          `Policy "${newPolicy.name}" has been created successfully.`
        );
        router.push('/access/policies');
      } else if (policy) {
        await updatePolicy(policy.id, apiData);
        toast.success(
          'Policy updated',
          `Policy "${data.name}" has been updated successfully.`
        );
        router.push('/access/policies');
      }
    } catch (err) {
      toast.error(
        mode === 'create' ? 'Failed to create policy' : 'Failed to update policy',
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
          {mode === 'create' ? 'Create Policy' : 'Edit Policy'}
        </CardTitle>
        <CardDescription>
          {mode === 'create'
            ? 'Create a reusable policy that can be shared across multiple applications.'
            : 'Update this reusable policy. Changes will affect all applications using it.'}
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={onSubmit}>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Policy Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Employee Access" {...field} />
                    </FormControl>
                    <FormDescription>
                      A descriptive name for this policy.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="precedence"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precedence</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value, 10) || 1)
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      Lower numbers are evaluated first.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="decision"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Decision</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select decision" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="allow">Allow</SelectItem>
                      <SelectItem value="deny">Deny</SelectItem>
                      <SelectItem value="bypass">Bypass</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    The action to take when this policy matches.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            <FormField
              control={form.control}
              name="include"
              render={({ field }) => (
                <FormItem>
                  <RuleBuilder
                    rules={field.value}
                    onChange={field.onChange}
                    disabled={isSubmitting}
                    label="Include Rules"
                    description="Users must match at least one of these rules to be included."
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            <FormField
              control={form.control}
              name="exclude"
              render={({ field }) => (
                <FormItem>
                  <RuleBuilder
                    rules={field.value || []}
                    onChange={field.onChange}
                    disabled={isSubmitting}
                    label="Exclude Rules (Optional)"
                    description="Users matching these rules will be excluded even if they match include rules."
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            <FormField
              control={form.control}
              name="require"
              render={({ field }) => (
                <FormItem>
                  <RuleBuilder
                    rules={field.value || []}
                    onChange={field.onChange}
                    disabled={isSubmitting}
                    label="Require Rules (Optional)"
                    description="Users must match ALL of these rules in addition to include rules."
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            <FormField
              control={form.control}
              name="session_duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Session Duration (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="24h" {...field} />
                  </FormControl>
                  <FormDescription>
                    Override the application&apos;s session duration. Format:
                    30m, 24h, 7d
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="approval_required"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Require Approval
                    </FormLabel>
                    <FormDescription>
                      Require administrator approval before granting access.
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
                  ? 'Create Policy'
                  : 'Save Changes'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
