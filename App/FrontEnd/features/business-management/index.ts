/**
 * Business Management Feature - Barrel Export
 *
 * Public API for the business-management feature.
 * Only export what other features need to consume.
 */

// Components
export { BusinessList } from './components/business-list';

// Hooks
export { useBusinesses, useBusiness, useCreateBusiness, useUpdateBusiness, useDeleteBusiness, useBulkDeleteBusinesses, businessKeys } from './hooks/use-businesses';
export { useBusinessWebSocket } from './hooks/use-business-websocket';

// Types
export type { Business, BusinessFilters, BusinessSort, BusinessViewState } from './types/business.types';

// API (usually not exported, but available if needed)
export { businessApi } from './api/business-api';
