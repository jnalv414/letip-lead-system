/**
 * useStartScrape Mutation Hook
 *
 * Initiates Google Maps scraping job and returns jobId for polling.
 * Use with useScrapeStatus to monitor progress.
 *
 * @usage
 * const startScrape = useStartScrape();
 * const [jobId, setJobId] = useState<string | null>(null);
 *
 * const handleScrape = async () => {
 *   const result = await startScrape.mutateAsync({
 *     location: 'Route 9, Freehold, NJ',
 *     radius: 1,
 *     business_type: 'restaurant'
 *   });
 *   setJobId(result.jobId); // Start polling with useScrapeStatus
 * };
 */

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import type { ScrapeRequestDto, ScrapeResponse } from '@/types/api';

export const useStartScrape = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: ScrapeRequestDto) => api.startScrape(request),

    onSuccess: (response: ScrapeResponse) => {
      // Show success notification with job ID
      toast.success('Scraping started', {
        description: `Job ${response.jobId} initiated. Monitoring progress...`,
      });

      // Note: Don't invalidate businesses yet - wait for job completion
      // The useScrapeStatus polling will handle cache invalidation
    },

    onError: (error: any) => {
      // Show error notification
      toast.error('Failed to start scraping', {
        description: error.response?.data?.message || error.message || 'Please try again.',
      });
    },
  });
};
