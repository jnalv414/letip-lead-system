/**
 * useBusinesses Query Hook
 *
 * Fetches paginated list of businesses with optional filters.
 * Supports pagination, city/industry filters, enrichment status, and text search.
 *
 * @usage
 * const { data, isLoading, error } = useBusinesses({ page: 1, limit: 20, city: 'Freehold' });
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { QueryBusinessesDto, PaginatedResponse, Business } from '@/types/api';

export const useBusinesses = (params?: QueryBusinessesDto) => {
  return useQuery({
    queryKey: ['businesses', params],
    queryFn: () => api.getBusinesses(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: true,
  });
};

/**
 * Type helper for accessing query data
 */
export type UseBusinessesData = PaginatedResponse<Business>;
