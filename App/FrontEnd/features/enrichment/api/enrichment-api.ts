import { api } from '@/shared/lib/api'
import type { Business, Contact, EnrichmentLog, PaginatedResponse } from '@/shared/types'
import type {
  EnrichmentQueue,
  EnrichmentResult,
  BatchEnrichmentRequest,
  BatchEnrichmentResult,
  EnrichmentStats,
} from '../types'

/**
 * Fetch pending businesses for enrichment queue
 * GET /api/businesses?enrichment_status=pending
 */
export async function fetchEnrichmentQueue(): Promise<EnrichmentQueue> {
  const [pending, running, completed, failed] = await Promise.all([
    api<PaginatedResponse<Business>>('/api/businesses?enrichment_status=pending&limit=50'),
    api<PaginatedResponse<Business>>('/api/businesses?enrichment_status=running&limit=10'),
    api<PaginatedResponse<Business>>('/api/businesses?enrichment_status=enriched&limit=1'),
    api<PaginatedResponse<Business>>('/api/businesses?enrichment_status=failed&limit=1'),
  ])

  return {
    pending: pending.total,
    running: running.total,
    completed: completed.total,
    failed: failed.total,
    businesses: pending.data || [],
  }
}

/**
 * Fetch enrichment stats from analytics
 * GET /api/analytics/dashboard
 */
export async function fetchEnrichmentStats(): Promise<EnrichmentStats> {
  const stats = await api<{
    metrics: Array<{
      label: string
      value: number
      change: number
    }>
  }>('/api/analytics/dashboard')

  // Extract enrichment-related metrics
  const enrichedMetric = stats.metrics?.find(m => m.label === 'Enriched Leads')
  const totalMetric = stats.metrics?.find(m => m.label === 'Businesses Found')
  const rateMetric = stats.metrics?.find(m => m.label === 'Enrichment Rate')

  const total = totalMetric?.value || 0
  const enriched = enrichedMetric?.value || 0

  return {
    total_enriched: enriched,
    total_pending: total - enriched,
    total_failed: 0,
    success_rate: rateMetric?.value || 0,
    avg_contacts_per_business: 0,
  }
}

/**
 * Fetch enrichment history from jobs table
 * GET /api/jobs?type=enrichment
 */
export async function fetchEnrichmentHistory(
  page = 1,
  pageSize = 20
): Promise<PaginatedResponse<EnrichmentLog>> {
  return api<PaginatedResponse<EnrichmentLog>>(
    `/api/jobs?type=enrichment&page=${page}&pageSize=${pageSize}&orderBy=created_at&order=desc`
  )
}

/**
 * Get enrichment result for a business
 * GET /api/businesses/:id
 */
export async function fetchEnrichmentResult(businessId: string): Promise<EnrichmentResult> {
  const business = await api<Business & { contacts?: Contact[] }>(`/api/businesses/${businessId}`)

  return {
    business,
    contacts: business.contacts || [],
    logs: [],
  }
}

/**
 * Enrich a specific business
 * POST /api/enrich/:id
 */
export async function enrichBusiness(businessId: string): Promise<Business> {
  return api<Business>(`/api/enrich/${businessId}`, {
    method: 'POST',
  })
}

/**
 * Batch enrich multiple pending businesses
 * POST /api/enrich/batch/process
 */
export async function batchEnrich(request: BatchEnrichmentRequest): Promise<BatchEnrichmentResult> {
  // The backend expects { count: number }
  const count = request.business_ids?.length || 10
  return api<BatchEnrichmentResult>('/api/enrich/batch/process', {
    method: 'POST',
    body: { count },
  })
}

/**
 * Retry enriching a failed business (same as enrich)
 * POST /api/enrich/:id
 */
export async function retryFailedEnrichment(businessId: string): Promise<Business> {
  return api<Business>(`/api/enrich/${businessId}`, {
    method: 'POST',
  })
}
