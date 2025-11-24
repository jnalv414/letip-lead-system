/**
 * useEnrichBusiness Mutation Hook
 *
 * Enriches single business with Hunter.io and AbstractAPI data.
 * Invalidates business and stats queries on success.
 *
 * @usage
 * const enrichBusiness = useEnrichBusiness();
 *
 * const handleEnrich = async (businessId: number) => {
 *   await enrichBusiness.mutateAsync(businessId);
 * };
 */

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import type { EnrichmentResult } from '@/types/api';

export const useEnrichBusiness = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => api.enrichBusiness(id),

    onSuccess: (result: EnrichmentResult, businessId: number) => {
      // Invalidate single business cache to refetch enriched data
      queryClient.invalidateQueries({ queryKey: ['businesses', businessId] });

      // Invalidate businesses list to update enrichment status
      queryClient.invalidateQueries({ queryKey: ['businesses'] });

      // Invalidate stats to update enrichment counts
      queryClient.invalidateQueries({ queryKey: ['stats'] });

      // Show success notification with details
      if (result.success) {
        toast.success('Business enriched successfully', {
          description: `Found ${result.contactsFound || 0} contacts. Hunter: ${result.hunter ? 'Success' : 'Failed'}, Abstract: ${result.abstract ? 'Success' : 'Failed'}`,
        });
      } else {
        toast.warning('Enrichment completed with errors', {
          description: result.errors?.join(', ') || 'Some enrichment steps failed.',
        });
      }
    },

    onError: (error: any) => {
      // Show error notification
      toast.error('Failed to enrich business', {
        description: error.response?.data?.message || error.message || 'Please try again.',
      });
    },
  });
};
