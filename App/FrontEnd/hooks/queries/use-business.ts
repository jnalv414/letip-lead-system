/**
 * useBusiness Query Hook
 *
 * Fetches single business by ID with related data (contacts, enrichment logs).
 * Automatically disabled if no ID provided.
 *
 * @usage
 * const { data: business, isLoading } = useBusiness(123);
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { Business } from '@/types/api';

export const useBusiness = (id: number | undefined | null) => {
  return useQuery({
    queryKey: ['businesses', id],
    queryFn: () => api.getBusiness(id!),
    staleTime: 10 * 60 * 1000, // 10 minutes (single records change less frequently)
    enabled: !!id, // Only run query if ID exists
  });
};

/**
 * Type helper for accessing query data
 */
export type UseBusinessData = Business;
