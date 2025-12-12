'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useZones } from '@/hooks/use-zones';
import { Skeleton } from '@/components/ui/skeleton';

interface ZoneSelectorProps {
  value: string | null;
  onChange: (zoneId: string) => void;
}

/**
 * Zone selector dropdown component
 * Displays allowed zones from environment variables
 */
export function ZoneSelector({ value, onChange }: ZoneSelectorProps) {
  const { zones, isLoading, isError } = useZones();

  if (isLoading) {
    return <Skeleton className="h-9 w-64" />;
  }

  if (isError) {
    return (
      <div className="text-destructive text-sm">
        Failed to load zones
      </div>
    );
  }

  if (zones.length === 0) {
    return (
      <div className="text-muted-foreground text-sm">
        No zones configured
      </div>
    );
  }

  return (
    <Select value={value ?? undefined} onValueChange={onChange}>
      <SelectTrigger className="w-64">
        <SelectValue placeholder="Select a zone..." />
      </SelectTrigger>
      <SelectContent>
        {zones.map((zone) => (
          <SelectItem key={zone.id} value={zone.id}>
            {zone.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
