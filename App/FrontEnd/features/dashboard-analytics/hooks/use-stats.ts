/**
 * Dashboard Analytics Hooks
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { statsApi } from '../api/stats-api';

export const statsKeys = {
  all: ['stats'] as const,
  current: () => [...statsKeys.all, 'current'] as const,
};

/**
 * Hook to fetch dashboard statistics
 */
export function useStats() {
  return useQuery({
    queryKey: statsKeys.current(),
    queryFn: () => statsApi.getStats(),
    staleTime: 30000, // Consider fresh for 30 seconds
    refetchInterval: 60000, // Refetch every minute
    refetchOnWindowFocus: true,
  });
}
