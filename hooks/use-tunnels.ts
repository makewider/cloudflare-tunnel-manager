'use client';

import useSWR, { useSWRConfig } from 'swr';
import { fetcher, ApiError } from '@/lib/fetcher';
import type {
  Tunnel,
  TunnelCreateInput,
  IngressUpdateInput,
  TunnelsResponse,
  TunnelResponse,
  TunnelTokenResponse,
  TunnelConfigResponse,
} from '@/types/tunnel';

/**
 * SWR hook for fetching all tunnels
 *
 * @returns Tunnels with loading and error states
 */
export function useTunnels() {
  const { data, error, isLoading, mutate } = useSWR<TunnelsResponse, ApiError>(
    '/api/tunnels',
    fetcher
  );

  return {
    tunnels: data?.tunnels ?? [],
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

/**
 * SWR hook for fetching a single tunnel
 *
 * @param tunnelId - Tunnel ID, null to disable fetching
 * @returns Tunnel with loading and error states
 */
export function useTunnel(tunnelId: string | null) {
  const { data, error, isLoading } = useSWR<TunnelResponse, ApiError>(
    tunnelId ? `/api/tunnels/${tunnelId}` : null,
    fetcher
  );

  return {
    tunnel: data?.tunnel ?? null,
    isLoading,
    isError: !!error,
    error,
  };
}

/**
 * SWR hook for fetching tunnel token (on-demand)
 *
 * @param tunnelId - Tunnel ID, null to disable fetching
 * @returns Token with loading and error states
 */
export function useTunnelToken(tunnelId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<TunnelTokenResponse, ApiError>(
    tunnelId ? `/api/tunnels/${tunnelId}/token` : null,
    fetcher,
    {
      revalidateOnFocus: false, // Don't auto-refetch token
      revalidateOnReconnect: false,
    }
  );

  return {
    token: data?.token ?? null,
    isLoading,
    isError: !!error,
    error,
    refetch: mutate,
  };
}

/**
 * SWR hook for fetching tunnel configuration (ingress rules)
 *
 * @param tunnelId - Tunnel ID, null to disable fetching
 * @returns Config with loading and error states
 */
export function useTunnelConfig(tunnelId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<TunnelConfigResponse, ApiError>(
    tunnelId ? `/api/tunnels/${tunnelId}/config` : null,
    fetcher
  );

  return {
    config: data?.config ?? null,
    parsedRules: data?.parsedRules ?? [],
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

/**
 * Hook for tunnel mutations (create, delete)
 *
 * @returns Mutation functions for tunnel operations
 */
export function useTunnelMutations() {
  const { mutate } = useSWRConfig();
  const listKey = '/api/tunnels';

  /**
   * Create a new tunnel
   */
  const createTunnel = async (data: TunnelCreateInput): Promise<Tunnel> => {
    const res = await fetch(listKey, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new ApiError(
        errorData.error?.message || 'Failed to create tunnel',
        errorData.error?.code || 'UNKNOWN',
        res.status,
        errorData.error?.details
      );
    }

    const result = await res.json();
    await mutate(listKey); // Revalidate tunnels list
    return result.tunnel;
  };

  /**
   * Delete a tunnel
   */
  const deleteTunnel = async (tunnelId: string): Promise<void> => {
    const res = await fetch(`${listKey}/${tunnelId}`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new ApiError(
        errorData.error?.message || 'Failed to delete tunnel',
        errorData.error?.code || 'UNKNOWN',
        res.status,
        errorData.error?.details
      );
    }

    await mutate(listKey); // Revalidate tunnels list
  };

  return { createTunnel, deleteTunnel };
}

/**
 * Hook for tunnel config mutations (update ingress)
 *
 * @param tunnelId - Tunnel ID
 * @returns Mutation function for config operations
 */
export function useTunnelConfigMutations(tunnelId: string) {
  const { mutate } = useSWRConfig();
  const configKey = `/api/tunnels/${tunnelId}/config`;

  /**
   * Update tunnel ingress configuration
   */
  const updateConfig = async (data: IngressUpdateInput): Promise<void> => {
    const res = await fetch(configKey, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new ApiError(
        errorData.error?.message || 'Failed to update tunnel config',
        errorData.error?.code || 'UNKNOWN',
        res.status,
        errorData.error?.details
      );
    }

    await mutate(configKey); // Revalidate config
  };

  return { updateConfig };
}
