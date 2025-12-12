'use client';

import useSWR from 'swr';
import { fetcher, ApiError } from '@/lib/fetcher';
import type { AllowedZone } from '@/types/zone';

interface ZonesResponse {
  zones: AllowedZone[];
}

/**
 * SWR hook for fetching allowed zones
 *
 * @returns Zone list with loading and error states
 */
export function useZones() {
  const { data, error, isLoading, mutate } = useSWR<ZonesResponse, ApiError>(
    '/api/zones',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  return {
    zones: data?.zones ?? [],
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}
