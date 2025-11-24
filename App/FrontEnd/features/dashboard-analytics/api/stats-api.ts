/**
 * Dashboard Analytics API Client
 */

import { apiClient, handleApiError } from '@/core/api/api-client';
import type { Stats } from '@/core/types/global.types';

export const statsApi = {
  /**
   * Get dashboard statistics
   */
  async getStats(): Promise<Stats> {
    try {
      const response = await apiClient.get<Stats>('/api/businesses/stats');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
};
