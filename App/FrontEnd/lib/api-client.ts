/**
 * API Client
 *
 * Complete REST API client for Le Tip Lead System backend.
 * Axios-based with TypeScript interfaces, request/response interceptors,
 * and comprehensive error handling.
 *
 * @usage
 * import { api } from '@/lib/api-client';
 * const businesses = await api.getBusinesses({ page: 1, limit: 20 });
 */

import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import type {
  Business,
  PaginatedResponse,
  Stats,
  CreateBusinessDto,
  UpdateBusinessDto,
  QueryBusinessesDto,
  ScrapeRequestDto,
  ScrapeResponse,
  JobStatus,
  EnrichmentResult,
  BatchEnrichmentDto,
  BatchEnrichmentResult,
} from '../types/api';

// ============================================================================
// Axios Instance Configuration
// ============================================================================

const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================================================
// Request Interceptor
// ============================================================================

apiClient.interceptors.request.use(
  (config) => {
    // Future: Add authentication token
    // const token = getAuthToken();
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ============================================================================
// Response Interceptor
// ============================================================================

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Global error handling
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // Future: Handle unauthorized
          console.error('Unauthorized - please log in');
          break;
        case 403:
          console.error('Forbidden - insufficient permissions');
          break;
        case 404:
          console.error('Resource not found');
          break;
        case 500:
          console.error('Server error - please try again later');
          break;
        default:
          console.error(`Error: ${error.response.status}`);
      }
    } else if (error.request) {
      console.error('Network error - please check your connection');
    } else {
      console.error('Request error:', error.message);
    }

    return Promise.reject(error);
  }
);

// ============================================================================
// API Functions
// ============================================================================

export const api = {
  // ==========================================================================
  // Businesses
  // ==========================================================================

  /**
   * Get paginated list of businesses with optional filters
   */
  getBusinesses: async (
    params?: QueryBusinessesDto
  ): Promise<PaginatedResponse<Business>> => {
    const response = await apiClient.get<PaginatedResponse<Business>>(
      '/api/businesses',
      { params }
    );
    return response.data;
  },

  /**
   * Get single business by ID
   */
  getBusiness: async (id: number): Promise<Business> => {
    const response = await apiClient.get<Business>(`/api/businesses/${id}`);
    return response.data;
  },

  /**
   * Create new business
   */
  createBusiness: async (business: CreateBusinessDto): Promise<Business> => {
    const response = await apiClient.post<Business>('/api/businesses', business);
    return response.data;
  },

  /**
   * Update existing business
   */
  updateBusiness: async (
    id: number,
    updates: UpdateBusinessDto
  ): Promise<Business> => {
    const response = await apiClient.patch<Business>(
      `/api/businesses/${id}`,
      updates
    );
    return response.data;
  },

  /**
   * Delete business by ID
   */
  deleteBusiness: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/businesses/${id}`);
  },

  // ==========================================================================
  // Statistics
  // ==========================================================================

  /**
   * Get dashboard statistics
   */
  getStats: async (): Promise<Stats> => {
    const response = await apiClient.get<Stats>('/api/businesses/stats');
    return response.data;
  },

  // ==========================================================================
  // Scraping
  // ==========================================================================

  /**
   * Initiate Google Maps scraping job
   */
  startScrape: async (request: ScrapeRequestDto): Promise<ScrapeResponse> => {
    const response = await apiClient.post<ScrapeResponse>('/api/scrape', request);
    return response.data;
  },

  /**
   * Get scraping job status (alias for getJob)
   */
  getScrapeStatus: async (jobId: string): Promise<JobStatus> => {
    return api.getJob(jobId);
  },

  // ==========================================================================
  // Enrichment
  // ==========================================================================

  /**
   * Enrich single business with Hunter.io + AbstractAPI data
   */
  enrichBusiness: async (id: number): Promise<EnrichmentResult> => {
    const response = await apiClient.post<EnrichmentResult>(`/api/enrich/${id}`);
    return response.data;
  },

  /**
   * Batch enrich multiple pending businesses
   */
  batchEnrichment: async (
    count: number = 10
  ): Promise<BatchEnrichmentResult> => {
    const response = await apiClient.post<BatchEnrichmentResult>(
      '/api/enrich/batch/process',
      { count } as BatchEnrichmentDto
    );
    return response.data;
  },

  /**
   * Get batch enrichment job status
   */
  getBatchStatus: async (batchId: string): Promise<JobStatus> => {
    return api.getJob(batchId);
  },

  // ==========================================================================
  // Jobs (BullMQ)
  // ==========================================================================

  /**
   * Get job status by ID
   * Generic method for any BullMQ job (scraping, enrichment, etc.)
   */
  getJob: async (jobId: string): Promise<JobStatus> => {
    const response = await apiClient.get<JobStatus>(`/api/jobs/${jobId}`);
    return response.data;
  },

  /**
   * Retry failed job
   */
  retryJob: async (jobId: string): Promise<void> => {
    await apiClient.post(`/api/jobs/${jobId}/retry`);
  },

  /**
   * Cancel active/waiting job
   */
  cancelJob: async (jobId: string): Promise<void> => {
    await apiClient.post(`/api/jobs/${jobId}/cancel`);
  },

  /**
   * Get list of failed jobs
   */
  getFailedJobs: async (limit: number = 10): Promise<JobStatus[]> => {
    const response = await apiClient.get<JobStatus[]>('/api/jobs/failed', {
      params: { limit },
    });
    return response.data;
  },
};

// ============================================================================
// Export Axios Instance for Custom Requests
// ============================================================================

export default apiClient;
