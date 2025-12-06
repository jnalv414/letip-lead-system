// Enrichment feature types
import type { Business, Contact, EnrichmentLog } from '@/shared/types'

export interface EnrichmentJob {
  id: string
  business_id: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  started_at?: string
  completed_at?: string
  error_message?: string
}

export interface EnrichmentQueue {
  pending: number
  running: number
  completed: number
  failed: number
  businesses: Business[]
}

export interface EnrichmentResult {
  business: Business
  contacts: Contact[]
  logs: EnrichmentLog[]
}

export interface BatchEnrichmentRequest {
  business_ids: string[]
  priority?: 'low' | 'normal' | 'high'
}

export interface BatchEnrichmentResult {
  queued: number
  skipped: number
  errors: string[]
}

export interface EnrichmentStats {
  total_enriched: number
  total_pending: number
  total_failed: number
  success_rate: number
  avg_contacts_per_business: number
}
