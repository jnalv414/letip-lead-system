/**
 * useBatchEnrichment Mutation Hook
 *
 * Batch enriches multiple pending businesses.
 * Invalidates businesses and stats queries on completion.
 *
 * @usage
 * const batchEnrich = useBatchEnrichment();
 *
 * const handleBatchEnrich = async () => {
 *   await batchEnrich.mutateAsync(10); // Enrich 10 businesses
 * };
 */

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import type { BatchEnrichmentResult } from '@/types/api';

export const useBatchEnrichment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (count: number = 10) => api.batchEnrichment(count),

    onSuccess: (result: BatchEnrichmentResult) => {
      // Invalidate businesses list to show updated enrichment statuses
      queryClient.invalidateQueries({ queryKey: ['businesses'] });

      // Invalidate stats to update dashboard counts
      queryClient.invalidateQueries({ queryKey: ['stats'] });

      // Show success notification with summary
      toast.success('Batch enrichment completed', {
        description: `Enriched ${result.enriched} of ${result.total} businesses. ${result.failed > 0 ? `${result.failed} failed.` : ''}`,
      });

      // Show errors if any
      if (result.errors.length > 0) {
        console.error('Batch enrichment errors:', result.errors);
      }
    },

    onError: (error: any) => {
      // Show error notification
      toast.error('Failed to start batch enrichment', {
        description: error.response?.data?.message || error.message || 'Please try again.',
      });
    },
  });
};
