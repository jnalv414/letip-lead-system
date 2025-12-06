import { api } from '@/shared/lib/api'
import type { ScrapeRequest, ScrapeJob, RecentSearch } from '../types'

// Map Apify status to our internal status
function normalizeStatus(
  apifyStatus?: string
): ScrapeJob['status'] {
  switch (apifyStatus) {
    case 'RUNNING':
    case 'STARTING':
    case 'READY':
      return 'running'
    case 'SUCCEEDED':
      return 'completed'
    case 'FAILED':
    case 'ABORTED':
    case 'ABORTING':
      return 'failed'
    default:
      return 'pending'
  }
}

/**
 * Start a new scraping job on Google Maps
 * POST /api/scrape
 */
export async function startScrape(request: ScrapeRequest): Promise<ScrapeJob> {
  const response = await api<{
    runId: string
    status: string
    message: string
  }>('/api/scrape', {
    method: 'POST',
    body: request,
  })

  return {
    id: response.runId,
    runId: response.runId,
    query: request.query,
    location: request.location,
    status: normalizeStatus(response.status),
    progress: 0,
    total: request.limit || 100,
    found: 0,
    errors: 0,
    started_at: new Date().toISOString(),
  }
}

/**
 * Get the status of a scraping job
 * GET /api/scrape/status/:runId
 */
export async function getScrapeStatus(runId: string): Promise<ScrapeJob> {
  const response = await api<{
    runId: string
    status: string
    progress?: number
    itemCount?: number
    startedAt?: string
    finishedAt?: string
  }>(`/api/scrape/status/${runId}`)

  return {
    id: runId,
    runId,
    query: '',
    location: '',
    status: normalizeStatus(response.status),
    progress: response.progress || 0,
    total: 100,
    found: response.itemCount || 0,
    errors: 0,
    started_at: response.startedAt || new Date().toISOString(),
    completed_at: response.finishedAt,
  }
}

/**
 * Cancel a scrape job (not supported by backend currently)
 */
export async function cancelScrape(runId: string): Promise<void> {
  // Backend doesn't support cancel - this is a placeholder
  console.log('Cancel requested for:', runId)
}

/**
 * Fetch recent search history from jobs table
 * GET /api/jobs?type=scraping&limit=X
 */
export async function fetchRecentSearches(limit = 10): Promise<RecentSearch[]> {
  const response = await api<{ data: RecentSearch[] }>(
    `/api/jobs?type=scraping&limit=${limit}&orderBy=created_at&order=desc`
  )
  return response.data || []
}

/**
 * Fetch active scraping jobs
 * GET /api/jobs?type=scraping&status=running
 */
export async function fetchActiveJobs(): Promise<ScrapeJob[]> {
  const response = await api<{ data: ScrapeJob[] }>(
    `/api/jobs?type=scraping&status=running`
  )
  return response.data || []
}
