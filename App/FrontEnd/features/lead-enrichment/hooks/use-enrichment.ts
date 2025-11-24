/**
 * Lead Enrichment Hooks
 */

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { enrichmentApi } from '../api/enrichment-api';
import { businessKeys } from '@/features/business-management';

/**
 * Hook to enrich single business
 */
export function useEnrichBusiness() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (businessId: number) => enrichmentApi.enrichBusiness(businessId),
    onSuccess: (_, businessId) => {
      // Invalidate business detail and list
      queryClient.invalidateQueries({ queryKey: businessKeys.detail(businessId) });
      queryClient.invalidateQueries({ queryKey: businessKeys.lists() });
    },
  });
}

/**
 * Hook to batch enrich businesses
 */
export function useBatchEnrichment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (count: number) => enrichmentApi.batchEnrich(count),
    onSuccess: () => {
      // Invalidate all business queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: businessKeys.lists() });
    },
  });
}
