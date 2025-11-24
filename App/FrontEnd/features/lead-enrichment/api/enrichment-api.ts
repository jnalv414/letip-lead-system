/**
 * Lead Enrichment API Client
 */

import { apiClient, handleApiError } from '@/core/api/api-client';
import type { EnrichmentResult, BatchEnrichmentResult } from '@/core/types/global.types';

export const enrichmentApi = {
  /**
   * Enrich single business
   */
  async enrichBusiness(id: number): Promise<EnrichmentResult> {
    try {
      const response = await apiClient.post<EnrichmentResult>(`/api/enrich/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Batch enrich multiple businesses
   */
  async batchEnrich(count: number = 10): Promise<BatchEnrichmentResult> {
    try {
      const response = await apiClient.post<BatchEnrichmentResult>(
        '/api/enrich/batch/process',
        { count }
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
};
