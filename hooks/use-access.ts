'use client';

import useSWR, { useSWRConfig } from 'swr';
import { fetcher, ApiError } from '@/lib/fetcher';
import type {
  AccessApplication,
  AccessPolicy,
  AccessAppCreateInput,
  AccessAppUpdateInput,
  PolicyCreateInput,
  PolicyUpdateInput,
  AccessAppsResponse,
  AccessAppResponse,
  AccessPoliciesResponse,
  AccessPolicyResponse,
} from '@/types/access';

// ============================================
// Applications Hooks
// ============================================

/**
 * SWR hook for fetching all Access Applications
 *
 * @returns Applications with loading and error states
 */
export function useAccessApps() {
  const { data, error, isLoading, mutate } = useSWR<
    AccessAppsResponse,
    ApiError
  >('/api/access/apps', fetcher);

  return {
    apps: data?.apps ?? [],
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

/**
 * SWR hook for fetching a single Access Application
 *
 * @param appId - Application ID, null to disable fetching
 * @returns Application with loading and error states
 */
export function useAccessApp(appId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<
    AccessAppResponse,
    ApiError
  >(appId ? `/api/access/apps/${appId}` : null, fetcher);

  return {
    app: data?.app ?? null,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

/**
 * Hook for Access Application mutations (create, update, delete)
 *
 * @returns Mutation functions for app operations
 */
export function useAccessAppMutations() {
  const { mutate } = useSWRConfig();
  const listKey = '/api/access/apps';

  /**
   * Create a new Access Application
   */
  const createApp = async (
    data: AccessAppCreateInput
  ): Promise<AccessApplication> => {
    const res = await fetch(listKey, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new ApiError(
        errorData.error?.message || 'Failed to create access app',
        errorData.error?.code || 'UNKNOWN',
        res.status,
        errorData.error?.details
      );
    }

    const result = await res.json();
    await mutate(listKey); // Revalidate apps list
    return result.app;
  };

  /**
   * Update an existing Access Application
   */
  const updateApp = async (
    appId: string,
    data: AccessAppUpdateInput
  ): Promise<AccessApplication> => {
    const res = await fetch(`${listKey}/${appId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new ApiError(
        errorData.error?.message || 'Failed to update access app',
        errorData.error?.code || 'UNKNOWN',
        res.status,
        errorData.error?.details
      );
    }

    const result = await res.json();
    await mutate(listKey); // Revalidate apps list
    await mutate(`${listKey}/${appId}`); // Revalidate single app
    return result.app;
  };

  /**
   * Delete an Access Application
   */
  const deleteApp = async (appId: string): Promise<void> => {
    const res = await fetch(`${listKey}/${appId}`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new ApiError(
        errorData.error?.message || 'Failed to delete access app',
        errorData.error?.code || 'UNKNOWN',
        res.status,
        errorData.error?.details
      );
    }

    await mutate(listKey); // Revalidate apps list
  };

  return { createApp, updateApp, deleteApp };
}

// ============================================
// Reusable Policies Hooks
// ============================================

/**
 * SWR hook for fetching all reusable policies
 *
 * @returns Policies with loading and error states
 */
export function useAccessPolicies() {
  const { data, error, isLoading, mutate } = useSWR<
    AccessPoliciesResponse,
    ApiError
  >('/api/access/policies', fetcher);

  return {
    policies: data?.policies ?? [],
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

/**
 * SWR hook for fetching a single reusable policy
 *
 * @param policyId - Policy ID, null to disable fetching
 * @returns Policy with loading and error states (includes app_count)
 */
export function useAccessPolicy(policyId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<
    AccessPolicyResponse,
    ApiError
  >(policyId ? `/api/access/policies/${policyId}` : null, fetcher);

  return {
    policy: data?.policy ?? null,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

/**
 * Hook for reusable policy mutations (create, update, delete)
 *
 * @returns Mutation functions for policy operations
 */
export function useAccessPolicyMutations() {
  const { mutate } = useSWRConfig();
  const listKey = '/api/access/policies';
  const appsListKey = '/api/access/apps';

  /**
   * Create a new reusable policy
   */
  const createPolicy = async (
    data: PolicyCreateInput
  ): Promise<AccessPolicy> => {
    const res = await fetch(listKey, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new ApiError(
        errorData.error?.message || 'Failed to create policy',
        errorData.error?.code || 'UNKNOWN',
        res.status,
        errorData.error?.details
      );
    }

    const result = await res.json();
    await mutate(listKey); // Revalidate policies list
    return result.policy;
  };

  /**
   * Update an existing reusable policy
   */
  const updatePolicy = async (
    policyId: string,
    data: PolicyUpdateInput
  ): Promise<AccessPolicy> => {
    const res = await fetch(`${listKey}/${policyId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new ApiError(
        errorData.error?.message || 'Failed to update policy',
        errorData.error?.code || 'UNKNOWN',
        res.status,
        errorData.error?.details
      );
    }

    const result = await res.json();
    await mutate(listKey); // Revalidate policies list
    await mutate(`${listKey}/${policyId}`); // Revalidate single policy
    // Policy updates may affect associated apps
    await mutate(appsListKey);
    return result.policy;
  };

  /**
   * Delete a reusable policy
   */
  const deletePolicy = async (policyId: string): Promise<void> => {
    const res = await fetch(`${listKey}/${policyId}`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new ApiError(
        errorData.error?.message || 'Failed to delete policy',
        errorData.error?.code || 'UNKNOWN',
        res.status,
        errorData.error?.details
      );
    }

    await mutate(listKey); // Revalidate policies list
  };

  return { createPolicy, updatePolicy, deletePolicy };
}
