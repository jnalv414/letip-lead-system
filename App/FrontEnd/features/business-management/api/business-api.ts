/**
 * Business Management API Client
 *
 * Feature-specific API functions for business CRUD operations.
 * Uses core API client as base.
 */

import { apiClient, handleApiError } from '@/core/api/api-client';
import type {
  Business,
  PaginatedResponse,
  CreateBusinessDto,
  UpdateBusinessDto,
  QueryBusinessesDto,
} from '@/core/types/global.types';

export const businessApi = {
  /**
   * Get paginated list of businesses with filters
   */
  async getBusinesses(
    params?: QueryBusinessesDto
  ): Promise<PaginatedResponse<Business>> {
    try {
      const response = await apiClient.get<PaginatedResponse<Business>>(
        '/api/businesses',
        { params }
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Get single business by ID with related data
   */
  async getBusiness(id: number): Promise<Business> {
    try {
      const response = await apiClient.get<Business>(`/api/businesses/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Create new business
   */
  async createBusiness(business: CreateBusinessDto): Promise<Business> {
    try {
      const response = await apiClient.post<Business>(
        '/api/businesses',
        business
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Update existing business
   */
  async updateBusiness(
    id: number,
    updates: UpdateBusinessDto
  ): Promise<Business> {
    try {
      const response = await apiClient.patch<Business>(
        `/api/businesses/${id}`,
        updates
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Delete business by ID
   */
  async deleteBusiness(id: number): Promise<void> {
    try {
      await apiClient.delete(`/api/businesses/${id}`);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
};
