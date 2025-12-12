'use client';

import { useState } from 'react';
import { Check, ChevronsUpDown, X, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { useAccessPolicies } from '@/hooks/use-access';
import type { PolicyReference } from '@/types/access';

interface PolicySelectorProps {
  value: PolicyReference[];
  onChange: (policies: PolicyReference[]) => void;
  disabled?: boolean;
}

/**
 * Multi-select policy selector for Access Applications
 */
export function PolicySelector({
  value,
  onChange,
  disabled,
}: PolicySelectorProps) {
  const [open, setOpen] = useState(false);
  const { policies, isLoading, isError, error } = useAccessPolicies();

  const selectedIds = value.map((p) => p.id);

  const handleSelect = (policyId: string) => {
    const policy = policies.find((p) => p.id === policyId);
    if (!policy) return;

    if (selectedIds.includes(policyId)) {
      // Remove policy
      onChange(value.filter((p) => p.id !== policyId));
    } else {
      // Add policy
      onChange([
        ...value,
        { id: policy.id, name: policy.name, precedence: policy.precedence },
      ]);
    }
  };

  const handleRemove = (policyId: string) => {
    onChange(value.filter((p) => p.id !== policyId));
  };

  // Show error state
  if (isError) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 rounded-md border border-destructive bg-destructive/10 p-3">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <div className="text-sm text-destructive">
            Failed to load policies: {error?.message || 'Unknown error'}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          You can still create the application without policies and add them later.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled || isLoading}
          >
            {isLoading
              ? 'Loading policies...'
              : value.length === 0
                ? 'Select policies...'
                : `${value.length} policies selected`}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Search policies..." />
            <CommandList>
              <CommandEmpty>No policies found.</CommandEmpty>
              <CommandGroup>
                {policies.map((policy) => (
                  <CommandItem
                    key={policy.id}
                    value={policy.name}
                    onSelect={() => handleSelect(policy.id)}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        selectedIds.includes(policy.id)
                          ? 'opacity-100'
                          : 'opacity-0'
                      )}
                    />
                    <div className="flex flex-col">
                      <span>{policy.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {policy.decision} - Precedence: {policy.precedence}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((policy) => (
            <Badge
              key={policy.id}
              variant="secondary"
              className="gap-1 pr-1"
            >
              {policy.name || policy.id}
              <button
                type="button"
                onClick={() => handleRemove(policy.id)}
                className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
                disabled={disabled}
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Remove</span>
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
