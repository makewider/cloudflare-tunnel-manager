'use client';

import useSWR, { useSWRConfig } from 'swr';
import { fetcher, ApiError } from '@/lib/fetcher';
import type {
  DnsRecord,
  DnsCreateInput,
  DnsUpdateInput,
  DnsRecordsResponse,
  DnsRecordResponse,
} from '@/types/dns';

/**
 * SWR hook for fetching DNS records for a zone
 *
 * @param zoneId - Zone ID to fetch records for, null to disable fetching
 * @returns DNS records with loading and error states
 */
export function useDnsRecords(zoneId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<DnsRecordsResponse, ApiError>(
    zoneId ? `/api/dns/${zoneId}` : null,
    fetcher
  );

  return {
    records: data?.records ?? [],
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

/**
 * SWR hook for fetching a single DNS record
 *
 * @param zoneId - Zone ID
 * @param recordId - DNS record ID, null to disable fetching
 * @returns DNS record with loading and error states
 */
export function useDnsRecord(zoneId: string, recordId: string | null) {
  const { data, error, isLoading } = useSWR<DnsRecordResponse, ApiError>(
    recordId ? `/api/dns/${zoneId}/${recordId}` : null,
    fetcher
  );

  return {
    record: data?.record ?? null,
    isLoading,
    isError: !!error,
    error,
  };
}

/**
 * Hook for DNS record mutations (create, update, delete)
 *
 * @param zoneId - Zone ID for mutations
 * @returns Mutation functions for DNS operations
 */
export function useDnsRecordMutations(zoneId: string) {
  const { mutate } = useSWRConfig();
  const key = `/api/dns/${zoneId}`;

  /**
   * Create a new DNS record
   */
  const createRecord = async (data: DnsCreateInput): Promise<DnsRecord> => {
    const res = await fetch(key, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new ApiError(
        errorData.error?.message || 'Failed to create record',
        errorData.error?.code || 'UNKNOWN',
        res.status,
        errorData.error?.details
      );
    }

    const result = await res.json();
    await mutate(key); // Revalidate records list
    return result.record;
  };

  /**
   * Update an existing DNS record
   */
  const updateRecord = async (
    recordId: string,
    data: DnsUpdateInput
  ): Promise<DnsRecord> => {
    const res = await fetch(`${key}/${recordId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new ApiError(
        errorData.error?.message || 'Failed to update record',
        errorData.error?.code || 'UNKNOWN',
        res.status,
        errorData.error?.details
      );
    }

    const result = await res.json();
    await mutate(key); // Revalidate records list
    return result.record;
  };

  /**
   * Delete a DNS record
   */
  const deleteRecord = async (recordId: string): Promise<void> => {
    const res = await fetch(`${key}/${recordId}`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new ApiError(
        errorData.error?.message || 'Failed to delete record',
        errorData.error?.code || 'UNKNOWN',
        res.status,
        errorData.error?.details
      );
    }

    await mutate(key); // Revalidate records list
  };

  return { createRecord, updateRecord, deleteRecord };
}
