/**
 * Map Scraping Feature Types
 */

import type { ScrapeRequestDto, ScrapeResponse, JobStatus } from '@/core/types/global.types';

export type { ScrapeRequestDto, ScrapeResponse, JobStatus };

// Scraping form state
export interface ScrapingFormData {
  location: string;
  radius: number;
  businessType: string;
  maxResults: number;
}

// Scraping progress state
export interface ScrapingProgress {
  jobId: string | null;
  status: 'idle' | 'scraping' | 'completed' | 'failed';
  progress: number;
  found: number;
  saved: number;
  message: string;
}
