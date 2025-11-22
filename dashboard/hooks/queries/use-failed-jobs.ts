/**
 * useFailedJobs Query Hook
 *
 * Fetches list of failed BullMQ jobs for monitoring and retry.
 * Useful for admin dashboard to track system health.
 *
 * @usage
 * const { data: failedJobs } = useFailedJobs(10);
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { JobStatus } from '@/types/api';

export const useFailedJobs = (limit: number = 10) => {
  return useQuery({
    queryKey: ['failed-jobs', limit],
    queryFn: () => api.getFailedJobs(limit),
    staleTime: 60 * 1000, // 1 minute
    refetchOnWindowFocus: true,
  });
};

/**
 * Type helper for accessing query data
 */
export type UseFailedJobsData = JobStatus[];
