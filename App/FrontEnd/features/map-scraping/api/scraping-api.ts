/**
 * Map Scraping API Client
 */

import { apiClient, handleApiError } from '@/core/api/api-client';
import type { ScrapeRequestDto, ScrapeResponse, JobStatus } from '@/core/types/global.types';

export const scrapingApi = {
  /**
   * Start Google Maps scraping job
   */
  async startScrape(request: ScrapeRequestDto): Promise<ScrapeResponse> {
    try {
      const response = await apiClient.post<ScrapeResponse>('/api/scrape', request);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Get scraping job status
   */
  async getJobStatus(jobId: string): Promise<JobStatus> {
    try {
      const response = await apiClient.get<JobStatus>(`/api/jobs/${jobId}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Cancel active scraping job
   */
  async cancelJob(jobId: string): Promise<void> {
    try {
      await apiClient.post(`/api/jobs/${jobId}/cancel`);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
};
