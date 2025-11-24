/**
 * useStats Query Hook
 *
 * Fetches dashboard statistics with automatic 30-second polling.
 * Shows total businesses, enrichment status breakdown, and contacts.
 *
 * @usage
 * const { data: stats, isLoading } = useStats();
 * console.log(stats.totalBusinesses, stats.enrichedBusinesses, stats.pendingEnrichment);
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { Stats } from '@/types/api';

export const useStats = () => {
  return useQuery({
    queryKey: ['stats'],
    queryFn: () => api.getStats(),
    staleTime: 30 * 1000, // 30 seconds (stats change frequently)
    refetchInterval: 30 * 1000, // Poll every 30 seconds for live dashboard
    refetchOnWindowFocus: true,
  });
};

/**
 * Type helper for accessing query data
 */
export type UseStatsData = Stats;
