// Dashboard Feature - Public API
// Only export from this file, not from internal modules

// Components
export {
  StatsGrid,
  PipelineChart,
  TimelineChart,
  LocationChart,
  RecentBusinesses,
  // Advanced Analytics
  FunnelChart,
  HeatmapChart,
  TopPerformers,
  CostAnalysis,
  CsvImport,
} from './components'

// Hooks
export {
  useDashboardStats,
  useLocationStats,
  useSourceStats,
  usePipelineStats,
  useTimelineStats,
  useRecentBusinesses,
  useDashboardOverview,
  // Advanced Analytics Hooks
  useFilterOptions,
  useFunnelStats,
  useHeatmapStats,
  useComparisonStats,
  useTopPerformers,
  useCostAnalysis,
  // CSV Import Hooks
  useValidateCsv,
  useImportCsv,
  useCsvImportStatus,
} from './hooks/use-dashboard'

// Types
export type {
  DashboardStats,
  LocationStat,
  SourceStat,
  PipelineStat,
  TimelineStat,
  RecentBusiness,
  ActivityItem,
  DashboardOverview,
  // Advanced Analytics Types
  FilterOptions,
  AnalyticsFilter,
  FunnelStats,
  FunnelStage,
  HeatmapStats,
  HeatmapDataPoint,
  ComparisonStats,
  ComparisonSegment,
  TopPerformersData,
  TopPerformer,
  CostAnalysisData,
  CostBreakdownItem,
  BudgetStatus,
} from './types'
