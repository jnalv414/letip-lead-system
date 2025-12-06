// Dashboard Feature Types

export interface DashboardStats {
  totalBusinesses: number
  enrichedCount: number
  pendingCount: number
  failedCount: number
  totalContacts: number
  messagesGenerated: number
  enrichmentRate: number
  avgContactsPerBusiness: number
}

export interface LocationStat {
  city: string
  count: number
  percentage: number
}

export interface SourceStat {
  source: string
  count: number
  percentage: number
}

export interface PipelineStat {
  status: 'pending' | 'enriched' | 'failed'
  count: number
  percentage: number
}

export interface TimelineStat {
  date: string
  businesses: number
  enriched: number
  contacts: number
}

export interface RecentBusiness {
  id: string
  name: string
  city: string | null
  enrichment_status: 'pending' | 'enriched' | 'failed'
  created_at: string
  contacts_count: number
}

export interface ActivityItem {
  id: string
  type: 'business_added' | 'business_enriched' | 'message_generated' | 'enrichment_failed'
  businessName: string
  businessId: string
  timestamp: string
  details?: string
}

export interface DashboardOverview {
  stats: DashboardStats
  locations: LocationStat[]
  sources: SourceStat[]
  pipeline: PipelineStat[]
  timeline: TimelineStat[]
  recentBusinesses: RecentBusiness[]
}

// ==========================================
// New Analytics Types (Tableau-Like)
// ==========================================

// Filter Options
export interface FilterOptions {
  cities: string[]
  industries: string[]
  enrichmentStatuses: string[]
  sources: string[]
  dateRange: {
    minDate: string
    maxDate: string
  }
}

// Analytics Filter (for API queries)
export interface AnalyticsFilter {
  startDate?: string
  endDate?: string
  cities?: string[]
  industries?: string[]
  enrichmentStatuses?: string[]
  sources?: string[]
}

// Funnel Stats
export interface FunnelStage {
  stage: string
  count: number
  percentage: number
  conversionRate: number
  dropOffRate: number
}

export interface FunnelStats {
  stages: FunnelStage[]
  overallConversionRate: number
  dateRange: {
    start: string
    end: string
  }
}

// Heatmap Stats
export interface HeatmapDataPoint {
  dayOfWeek: number
  hour: number
  count: number
  intensity: number
}

export interface HeatmapStats {
  data: HeatmapDataPoint[]
  maxValue: number
  totalActivity: number
  peakDay: string
  peakHour: number
}

// Comparison Stats
export interface ComparisonSegment {
  name: string
  totalBusinesses: number
  enrichedCount: number
  contactsCount: number
  enrichmentRate: number
  avgContactsPerBusiness: number
  growthRate: number
}

export interface ComparisonStats {
  segmentType: string
  segments: ComparisonSegment[]
  dateRange: {
    start: string
    end: string
  }
}

// Top Performers
export interface TopPerformer {
  rank: number
  name: string
  totalBusinesses: number
  enrichedCount: number
  enrichmentRate: number
  change: number
  trend: 'up' | 'down' | 'stable'
}

export interface TopPerformersData {
  metric: string
  dimension: string
  performers: TopPerformer[]
  totalSegments: number
}

// Cost Analysis
export interface CostBreakdownItem {
  name: string
  cost: number
  operations: number
  costPerOperation: number
  percentage: number
}

export interface BudgetStatus {
  monthlyBudget: number
  currentSpend: number
  remaining: number
  percentUsed: number
  projectedSpend: number
  onTrack: boolean
}

export interface CostAnalysisData {
  totalCost: number
  breakdown: CostBreakdownItem[]
  budgetStatus?: BudgetStatus
  avgCostPerLead: number
  totalLeads: number
  dateRange: {
    start: string
    end: string
  }
}
