/**
 * useJobStatus Query Hook
 *
 * Generic BullMQ job status polling hook.
 * Works for any job type (scraping, enrichment, batch operations).
 *
 * Same intelligent polling logic as useScrapeStatus:
 * - Active/waiting jobs: poll every 2 seconds
 * - Completed/failed jobs: stop polling
 *
 * @usage
 * const { data: job, isLoading } = useJobStatus(jobId);
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { JobStatus } from '@/types/api';

interface UseJobStatusOptions {
  /**
   * Enable/disable polling
   */
  enabled?: boolean;

  /**
   * Custom polling interval (ms) for active jobs
   * @default 2000
   */
  pollingInterval?: number;
}

export const useJobStatus = (
  jobId: string | undefined | null,
  options?: UseJobStatusOptions
) => {
  const pollingInterval = options?.pollingInterval ?? 2000;

  return useQuery({
    queryKey: ['job-status', jobId],
    queryFn: () => api.getJob(jobId!),
    enabled: !!jobId && (options?.enabled !== false),
    staleTime: 0, // Always fetch fresh job status

    // Intelligent polling: fast for active jobs, stop for completed
    refetchInterval: (query) => {
      const data = query.state.data as JobStatus | undefined;
      if (!data) return false;

      const activeStatuses = ['waiting', 'active', 'delayed'];
      const isActive = activeStatuses.includes(data.status);

      return isActive ? pollingInterval : false;
    },

    // Keep refetching even when window is not focused (background jobs)
    refetchIntervalInBackground: true,
  });
};

/**
 * Type helper for accessing query data
 */
export type UseJobStatusData = JobStatus;
