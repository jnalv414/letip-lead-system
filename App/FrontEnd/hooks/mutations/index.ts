/**
 * Mutation Hooks Barrel Export
 *
 * Central export for all TanStack Mutation hooks.
 *
 * @usage
 * import { useCreateBusiness, useEnrichBusiness } from '@/hooks/mutations';
 */

export { useCreateBusiness } from './use-create-business';
export { useUpdateBusiness } from './use-update-business';
export { useDeleteBusiness } from './use-delete-business';
export { useStartScrape } from './use-start-scrape';
export { useEnrichBusiness } from './use-enrich-business';
export { useBatchEnrichment } from './use-batch-enrichment';
export { useGenerateMessage } from './use-generate-message';
export type { GenerateMessageVariables } from './use-generate-message';
