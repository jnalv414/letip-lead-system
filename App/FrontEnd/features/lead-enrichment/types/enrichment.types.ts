/**
 * Lead Enrichment Feature Types
 */

import type { EnrichmentResult, BatchEnrichmentResult } from '@/core/types/global.types';

export type { EnrichmentResult, BatchEnrichmentResult };

// Enrichment queue item
export interface EnrichmentQueueItem {
  businessId: number;
  businessName: string;
  status: 'pending' | 'enriching' | 'completed' | 'failed';
  progress: number;
  error?: string;
}

// Batch enrichment configuration
export interface BatchEnrichmentConfig {
  count: number;
  autoRetry: boolean;
  delayBetweenCalls: number; // milliseconds
}
