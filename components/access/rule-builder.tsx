'use client';

import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { RuleInput } from '@/types/access';

interface RuleBuilderProps {
  rules: RuleInput[];
  onChange: (rules: RuleInput[]) => void;
  disabled?: boolean;
  label?: string;
  description?: string;
}

const RULE_TYPES = [
  { value: 'email_domain', label: 'Email Domain', placeholder: 'example.com' },
  { value: 'email', label: 'Email', placeholder: 'user@example.com' },
  { value: 'group', label: 'Group ID', placeholder: 'group-uuid' },
  { value: 'geo', label: 'Country Code', placeholder: 'US' },
  {
    value: 'device_posture',
    label: 'Device Posture',
    placeholder: 'integration-uid',
  },
  { value: 'ip', label: 'IP Range', placeholder: '192.168.1.0/24' },
  { value: 'everyone', label: 'Everyone', placeholder: '' },
  { value: 'service_token', label: 'Service Token', placeholder: '' },
  {
    value: 'any_valid_service_token',
    label: 'Any Valid Service Token',
    placeholder: '',
  },
] as const;

const NO_VALUE_TYPES = ['everyone', 'service_token', 'any_valid_service_token'];

/**
 * Rule builder component for Access Policies
 */
export function RuleBuilder({
  rules,
  onChange,
  disabled,
  label,
  description,
}: RuleBuilderProps) {
  const handleAddRule = () => {
    onChange([...rules, { type: 'email_domain', value: '' }]);
  };

  const handleRemoveRule = (index: number) => {
    onChange(rules.filter((_, i) => i !== index));
  };

  const handleTypeChange = (index: number, type: RuleInput['type']) => {
    const newRules = [...rules];
    newRules[index] = {
      type,
      value: NO_VALUE_TYPES.includes(type) ? undefined : '',
    };
    onChange(newRules);
  };

  const handleValueChange = (index: number, value: string) => {
    const newRules = [...rules];
    newRules[index] = { ...newRules[index], value };
    onChange(newRules);
  };

  return (
    <div className="space-y-3">
      {label && (
        <div>
          <label className="text-sm font-medium">{label}</label>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      )}

      {rules.map((rule, index) => {
        const ruleType = RULE_TYPES.find((t) => t.value === rule.type);
        const needsValue = !NO_VALUE_TYPES.includes(rule.type);

        return (
          <div key={index} className="flex items-center gap-2">
            <Select
              value={rule.type}
              onValueChange={(value) =>
                handleTypeChange(index, value as RuleInput['type'])
              }
              disabled={disabled}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {RULE_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {needsValue && (
              <Input
                placeholder={ruleType?.placeholder || 'Value'}
                value={rule.value || ''}
                onChange={(e) => handleValueChange(index, e.target.value)}
                disabled={disabled}
                className="flex-1"
              />
            )}

            {!needsValue && (
              <div className="flex-1 text-sm text-muted-foreground">
                No value required
              </div>
            )}

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => handleRemoveRule(index)}
              disabled={disabled}
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Remove rule</span>
            </Button>
          </div>
        );
      })}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleAddRule}
        disabled={disabled}
      >
        <Plus className="mr-2 h-4 w-4" />
        Add Rule
      </Button>
    </div>
  );
}
