/**
 * useScrapeStatus Query Hook
 *
 * Polls BullMQ scraping job status with intelligent refetch intervals.
 * - Active/waiting jobs: poll every 2 seconds
 * - Completed/failed jobs: stop polling
 *
 * @usage
 * const { data: job, isLoading } = useScrapeStatus(jobId);
 *
 * @example
 * // Start scrape and monitor progress
 * const startScrape = useStartScrape();
 * const handleScrape = async () => {
 *   const result = await startScrape.mutateAsync({ location: 'Freehold, NJ' });
 *   setJobId(result.jobId); // useScrapeStatus will start polling
 * };
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { JobStatus } from '@/types/api';

interface UseScrapeStatusOptions {
  /**
   * Enable/disable polling (useful for conditional rendering)
   */
  enabled?: boolean;
}

export const useScrapeStatus = (
  jobId: string | undefined | null,
  options?: UseScrapeStatusOptions
) => {
  return useQuery({
    queryKey: ['scrape-status', jobId],
    queryFn: () => api.getScrapeStatus(jobId!),
    enabled: !!jobId && (options?.enabled !== false),
    staleTime: 0, // Always fetch fresh job status

    // Intelligent polling: fast for active jobs, stop for completed
    refetchInterval: (query) => {
      const data = query.state.data as JobStatus | undefined;
      if (!data) return false;

      const activeStatuses = ['waiting', 'active', 'delayed'];
      const isActive = activeStatuses.includes(data.status);

      return isActive ? 2000 : false; // 2s polling for active, stop otherwise
    },

    // Keep refetching even when window is not focused (background jobs)
    refetchIntervalInBackground: true,
  });
};

/**
 * Type helper for accessing query data
 */
export type UseScrapeStatusData = JobStatus;
