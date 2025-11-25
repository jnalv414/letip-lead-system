/**
 * Business Management Hooks
 *
 * Custom hooks for business data fetching and mutations.
 * Uses React Query for caching and state management.
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { businessApi } from '../api/business-api';
import type {
  Business,
  CreateBusinessDto,
  UpdateBusinessDto,
  QueryBusinessesDto,
} from '@/core/types/global.types';

// Query keys for React Query
export const businessKeys = {
  all: ['businesses'] as const,
  lists: () => [...businessKeys.all, 'list'] as const,
  list: (filters: QueryBusinessesDto) =>
    [...businessKeys.lists(), filters] as const,
  details: () => [...businessKeys.all, 'detail'] as const,
  detail: (id: number) => [...businessKeys.details(), id] as const,
};

/**
 * Hook to fetch paginated businesses with filters
 */
export function useBusinesses(params?: QueryBusinessesDto) {
  return useQuery({
    queryKey: businessKeys.list(params || {}),
    queryFn: () => businessApi.getBusinesses(params),
    staleTime: 30000, // Consider data fresh for 30 seconds
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook to fetch single business by ID
 */
export function useBusiness(id: number) {
  return useQuery({
    queryKey: businessKeys.detail(id),
    queryFn: () => businessApi.getBusiness(id),
    enabled: !!id, // Only fetch if ID is provided
    staleTime: 60000, // Consider fresh for 1 minute
  });
}

/**
 * Hook to create new business
 */
export function useCreateBusiness() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (business: CreateBusinessDto) =>
      businessApi.createBusiness(business),
    onSuccess: () => {
      // Invalidate and refetch business list
      queryClient.invalidateQueries({ queryKey: businessKeys.lists() });
    },
  });
}

/**
 * Hook to update existing business
 */
export function useUpdateBusiness() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: UpdateBusinessDto }) =>
      businessApi.updateBusiness(id, updates),
    onSuccess: (data) => {
      // Update cached business detail
      queryClient.setQueryData(businessKeys.detail(data.id), data);
      // Invalidate business list to refetch
      queryClient.invalidateQueries({ queryKey: businessKeys.lists() });
    },
  });
}

/**
 * Hook to delete business
 */
export function useDeleteBusiness() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => businessApi.deleteBusiness(id),
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: businessKeys.detail(deletedId) });
      // Invalidate list to refetch
      queryClient.invalidateQueries({ queryKey: businessKeys.lists() });
    },
  });
}

/**
 * Hook to bulk delete businesses
 */
export function useBulkDeleteBusinesses() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: number[]) => {
      // Delete each business sequentially
      // In a production app, you'd want a bulk delete API endpoint
      const results = await Promise.all(
        ids.map((id) => businessApi.deleteBusiness(id).catch((err) => ({ error: err, id })))
      );
      return results;
    },
    onSuccess: (_, deletedIds) => {
      // Remove all deleted items from cache
      deletedIds.forEach((id) => {
        queryClient.removeQueries({ queryKey: businessKeys.detail(id) });
      });
      // Invalidate list to refetch
      queryClient.invalidateQueries({ queryKey: businessKeys.lists() });
    },
  });
}
