/**
 * Business Management Feature Types
 *
 * Co-located types specific to the business management feature.
 */

import type { Business, QueryBusinessesDto } from '@/core/types/global.types';

export type { Business, QueryBusinessesDto };

// Business table view configuration
export interface BusinessTableColumn {
  key: keyof Business | string;
  label: string;
  sortable: boolean;
  width?: string;
}

// Business filter state
export interface BusinessFilters {
  city?: string;
  industry?: string;
  enrichmentStatus?: 'pending' | 'enriched' | 'failed';
  search?: string;
}

// Business sort configuration
export interface BusinessSort {
  field: keyof Business | string;
  direction: 'asc' | 'desc';
}

// Business view state
export interface BusinessViewState {
  filters: BusinessFilters;
  sort: BusinessSort;
  page: number;
  limit: number;
}
