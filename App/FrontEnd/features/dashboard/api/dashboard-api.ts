import { api, uploadFile } from '@/shared/lib/api'
import type {
  DashboardStats,
  LocationStat,
  SourceStat,
  PipelineStat,
  TimelineStat,
  RecentBusiness,
  DashboardOverview,
  FilterOptions,
  AnalyticsFilter,
  FunnelStats,
  HeatmapStats,
  ComparisonStats,
  TopPerformersData,
  CostAnalysisData,
} from '../types'

// ==========================================
// CSV Import Types (local to API)
// ==========================================

export interface CsvColumnMapping {
  csvColumn: string
  targetField: string
  isRequired: boolean
}

export interface CsvValidationResult {
  valid: boolean
  totalRows: number
  validRows: number
  errorRows: number
  duplicatesDetected: number
  errors: Array<{ row: number; column: string; message: string }>
  detectedColumns: string[]
  sampleRows: Record<string, string>[]
}

export interface CsvImportParams {
  filePath: string
  originalFilename: string
  columnMappings: CsvColumnMapping[]
  skipHeader: boolean
  duplicateHandling: 'skip' | 'update' | 'create_new'
  defaultCity?: string
  defaultState?: string
  defaultIndustry?: string
  sourceTag?: string
}

export interface CsvImportJob {
  id: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  progress?: number
  imported?: number
  skipped?: number
  failed?: number
}

// Backend response type for dashboard
interface BackendMetric {
  name: string
  value: number
  change: number
  sparkline: number[]
  color: string
}

interface BackendDashboardResponse {
  metrics: BackendMetric[]
  dateRange: { start: string; end: string }
}

/**
 * Fetch dashboard overview stats
 * Transforms backend metrics array to frontend expected format
 */
export async function fetchDashboardStats(): Promise<DashboardStats> {
  const response = await api<BackendDashboardResponse>('/api/analytics/dashboard')

  // Create a lookup map for metrics by name
  const metricsMap = new Map<string, number>()
  for (const metric of response.metrics || []) {
    metricsMap.set(metric.name, metric.value)
  }

  // Map backend metrics to frontend expected format
  const totalBusinesses = metricsMap.get('Businesses Found') || 0
  const enrichedCount = metricsMap.get('Enriched Leads') || 0
  const enrichmentRate = metricsMap.get('Enrichment Rate') || 0

  // Calculate pending and failed from total and enriched
  // These are approximations since backend doesn't provide exact counts
  const pendingCount = Math.max(0, totalBusinesses - enrichedCount)

  return {
    totalBusinesses,
    enrichedCount,
    pendingCount,
    failedCount: 0, // Not available from current backend
    totalContacts: 0, // Not available from current backend
    messagesGenerated: 0, // Not available from current backend
    enrichmentRate,
    avgContactsPerBusiness: 0, // Not available from current backend
  }
}

/**
 * Fetch location breakdown
 */
export async function fetchLocationStats(): Promise<LocationStat[]> {
  const response = await api<{ locations: LocationStat[]; total: number }>('/api/analytics/locations')
  return response.locations || []
}

/**
 * Fetch source breakdown
 */
export async function fetchSourceStats(): Promise<SourceStat[]> {
  const response = await api<{ sources: SourceStat[]; total: number }>('/api/analytics/sources')
  return response.sources || []
}

/**
 * Fetch pipeline breakdown (enrichment status)
 */
export async function fetchPipelineStats(): Promise<PipelineStat[]> {
  const response = await api<{ stages: Array<{ stage: string; count: number; percentage: number }>; total: number }>('/api/analytics/pipeline')
  // Map backend stage names to frontend status values
  const stageToStatus: Record<string, PipelineStat['status']> = {
    'New Leads': 'pending',
    'Qualified': 'enriched',
    'Needs Review': 'failed',
  }
  return (response.stages || []).map(item => ({
    status: stageToStatus[item.stage] || 'pending',
    count: item.count,
    percentage: item.percentage,
  }))
}

/**
 * Fetch timeline data for charts
 * Note: Backend timeline endpoint doesn't accept 'days' param - uses default range
 */
export async function fetchTimelineStats(_days: number = 30): Promise<TimelineStat[]> {
  const response = await api<{ data: Array<{ date: string; searches: number; businessesFound: number; enriched: number; cost: number }>; dateRange: { start: string; end: string } }>('/api/analytics/timeline')
  // Map backend field names to frontend field names
  return (response.data || []).map(item => ({
    date: item.date,
    businesses: item.businessesFound,
    enriched: item.enriched,
    contacts: 0, // Not available from timeline endpoint
  }))
}

/**
 * Fetch recent businesses
 * Note: Backend doesn't support sorting params - returns default order
 */
export async function fetchRecentBusinesses(limit: number = 10): Promise<RecentBusiness[]> {
  const response = await api<{ data: RecentBusiness[] }>(
    `/api/businesses?limit=${limit}`
  )
  return response.data || []
}

/**
 * Fetch complete dashboard overview (combines all endpoints)
 */
export async function fetchDashboardOverview(): Promise<DashboardOverview> {
  const [stats, locations, sources, pipeline, timeline, recentBusinesses] = await Promise.all([
    fetchDashboardStats(),
    fetchLocationStats(),
    fetchSourceStats(),
    fetchPipelineStats(),
    fetchTimelineStats(),
    fetchRecentBusinesses(),
  ])

  return {
    stats,
    locations,
    sources,
    pipeline,
    timeline,
    recentBusinesses,
  }
}

// ==========================================
// Advanced Analytics API Functions
// ==========================================

/**
 * Build query string from analytics filter
 */
function buildFilterQuery(filter?: AnalyticsFilter): string {
  if (!filter) return ''

  const params = new URLSearchParams()

  if (filter.startDate) params.append('startDate', filter.startDate)
  if (filter.endDate) params.append('endDate', filter.endDate)
  if (filter.cities?.length) params.append('cities', filter.cities.join(','))
  if (filter.industries?.length) params.append('industries', filter.industries.join(','))
  if (filter.enrichmentStatuses?.length) params.append('enrichmentStatuses', filter.enrichmentStatuses.join(','))
  if (filter.sources?.length) params.append('sources', filter.sources.join(','))

  const query = params.toString()
  return query ? `?${query}` : ''
}

/**
 * Fetch available filter options
 */
export async function fetchFilterOptions(): Promise<FilterOptions> {
  return api<FilterOptions>('/api/analytics/filter-options')
}

/**
 * Fetch funnel conversion stats
 */
export async function fetchFunnelStats(filter?: AnalyticsFilter): Promise<FunnelStats> {
  return api<FunnelStats>(`/api/analytics/funnel${buildFilterQuery(filter)}`)
}

/**
 * Fetch activity heatmap data
 */
export async function fetchHeatmapStats(filter?: AnalyticsFilter): Promise<HeatmapStats> {
  return api<HeatmapStats>(`/api/analytics/heatmap${buildFilterQuery(filter)}`)
}

/**
 * Fetch comparison stats by dimension
 */
export async function fetchComparisonStats(
  dimension: 'city' | 'industry' | 'source',
  filter?: AnalyticsFilter
): Promise<ComparisonStats> {
  const baseQuery = buildFilterQuery(filter)
  const separator = baseQuery ? '&' : '?'
  return api<ComparisonStats>(`/api/analytics/comparison${baseQuery}${separator}dimension=${dimension}`)
}

/**
 * Fetch top performers data
 */
export async function fetchTopPerformers(
  dimension: 'city' | 'industry' | 'source',
  metric: 'count' | 'enrichment_rate' | 'contacts',
  limit: number = 10,
  filter?: AnalyticsFilter
): Promise<TopPerformersData> {
  const baseQuery = buildFilterQuery(filter)
  const separator = baseQuery ? '&' : '?'
  return api<TopPerformersData>(
    `/api/analytics/top-performers${baseQuery}${separator}dimension=${dimension}&metric=${metric}&limit=${limit}`
  )
}

/**
 * Fetch cost analysis data
 */
export async function fetchCostAnalysis(filter?: AnalyticsFilter): Promise<CostAnalysisData> {
  return api<CostAnalysisData>(`/api/analytics/cost-analysis${buildFilterQuery(filter)}`)
}

// ==========================================
// CSV Import API Functions
// ==========================================

/**
 * Validate a CSV file before import
 */
export async function validateCsvFile(file: File): Promise<CsvValidationResult> {
  const formData = new FormData()
  formData.append('file', file)

  return uploadFile<CsvValidationResult>('/api/jobs/csv/validate', formData)
}

/**
 * Import a CSV file with column mappings
 */
export async function importCsvFile(
  file: File,
  params: Omit<CsvImportParams, 'filePath' | 'originalFilename'>
): Promise<CsvImportJob> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('columnMappings', JSON.stringify(params.columnMappings))
  formData.append('skipHeader', String(params.skipHeader))
  formData.append('duplicateHandling', params.duplicateHandling)

  if (params.defaultCity) formData.append('defaultCity', params.defaultCity)
  if (params.defaultState) formData.append('defaultState', params.defaultState)
  if (params.defaultIndustry) formData.append('defaultIndustry', params.defaultIndustry)
  if (params.sourceTag) formData.append('sourceTag', params.sourceTag)

  return uploadFile<CsvImportJob>('/api/jobs/csv/import', formData)
}

/**
 * Get CSV import job status
 */
export async function getCsvImportStatus(jobId: string): Promise<CsvImportJob> {
  return api<CsvImportJob>(`/api/jobs/${jobId}`)
}
