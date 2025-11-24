/**
 * Query Hooks Barrel Export
 *
 * Central export for all TanStack Query hooks.
 *
 * @usage
 * import { useBusinesses, useStats, useScrapeStatus } from '@/hooks/queries';
 */

export { useBusinesses } from './use-businesses';
export type { UseBusinessesData } from './use-businesses';

export { useBusiness } from './use-business';
export type { UseBusinessData } from './use-business';

export { useStats } from './use-stats';
export type { UseStatsData } from './use-stats';

export { useScrapeStatus } from './use-scrape-status';
export type { UseScrapeStatusData } from './use-scrape-status';

export { useJobStatus } from './use-job-status';
export type { UseJobStatusData } from './use-job-status';

export { useFailedJobs } from './use-failed-jobs';
export type { UseFailedJobsData } from './use-failed-jobs';
