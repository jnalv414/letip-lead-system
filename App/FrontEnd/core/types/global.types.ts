/**
 * Global Type Definitions
 *
 * Re-exports from the main types directory for convenience.
 * Add any global types that span multiple features here.
 */

export type {
  Business,
  Contact,
  EnrichmentLog,
  OutreachMessage,
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
  WebSocketEvent,
  BusinessEvent,
  StatsEvent,
  ProgressEvent,
} from '../../types/api';

// Global UI types
export type EnrichmentStatus = 'pending' | 'enriched' | 'failed';
export type JobState = 'waiting' | 'active' | 'completed' | 'failed' | 'delayed';

// Feature flag type for future use
export interface FeatureFlags {
  enableBatchEnrichment: boolean;
  enableMapScraping: boolean;
  enableOutreach: boolean;
}

// App-wide theme types
export type Theme = 'dark' | 'light';
export type ViewMode = 'table' | 'grid' | 'map';
