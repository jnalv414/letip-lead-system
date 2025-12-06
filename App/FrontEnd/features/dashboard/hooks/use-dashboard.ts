'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchDashboardStats,
  fetchLocationStats,
  fetchSourceStats,
  fetchPipelineStats,
  fetchTimelineStats,
  fetchRecentBusinesses,
  fetchDashboardOverview,
  fetchFilterOptions,
  fetchFunnelStats,
  fetchHeatmapStats,
  fetchComparisonStats,
  fetchTopPerformers,
  fetchCostAnalysis,
  validateCsvFile,
  importCsvFile,
  getCsvImportStatus,
} from '../api/dashboard-api'
import type { AnalyticsFilter } from '../types'
import type { CsvImportParams } from '../api/dashboard-api'

/**
 * Fetch dashboard stats
 */
export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: fetchDashboardStats,
    staleTime: 30 * 1000, // 30 seconds
  })
}

/**
 * Fetch location stats
 */
export function useLocationStats() {
  return useQuery({
    queryKey: ['dashboard', 'locations'],
    queryFn: fetchLocationStats,
    staleTime: 60 * 1000, // 1 minute
  })
}

/**
 * Fetch source stats
 */
export function useSourceStats() {
  return useQuery({
    queryKey: ['dashboard', 'sources'],
    queryFn: fetchSourceStats,
    staleTime: 60 * 1000,
  })
}

/**
 * Fetch pipeline stats
 */
export function usePipelineStats() {
  return useQuery({
    queryKey: ['dashboard', 'pipeline'],
    queryFn: fetchPipelineStats,
    staleTime: 30 * 1000,
  })
}

/**
 * Fetch timeline stats
 */
export function useTimelineStats(days: number = 30) {
  return useQuery({
    queryKey: ['dashboard', 'timeline', days],
    queryFn: () => fetchTimelineStats(days),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Fetch recent businesses
 */
export function useRecentBusinesses(limit: number = 10) {
  return useQuery({
    queryKey: ['dashboard', 'recent', limit],
    queryFn: () => fetchRecentBusinesses(limit),
    staleTime: 30 * 1000,
  })
}

/**
 * Fetch complete dashboard overview
 * Use this for initial page load
 */
export function useDashboardOverview() {
  return useQuery({
    queryKey: ['dashboard', 'overview'],
    queryFn: fetchDashboardOverview,
    staleTime: 30 * 1000,
  })
}

// ==========================================
// Advanced Analytics Hooks
// ==========================================

/**
 * Fetch filter options for analytics
 */
export function useFilterOptions() {
  return useQuery({
    queryKey: ['analytics', 'filter-options'],
    queryFn: fetchFilterOptions,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Fetch funnel conversion stats
 */
export function useFunnelStats(filter?: AnalyticsFilter) {
  return useQuery({
    queryKey: ['analytics', 'funnel', filter],
    queryFn: () => fetchFunnelStats(filter),
    staleTime: 60 * 1000, // 1 minute
  })
}

/**
 * Fetch activity heatmap data
 */
export function useHeatmapStats(filter?: AnalyticsFilter) {
  return useQuery({
    queryKey: ['analytics', 'heatmap', filter],
    queryFn: () => fetchHeatmapStats(filter),
    staleTime: 60 * 1000,
  })
}

/**
 * Fetch comparison stats by dimension
 */
export function useComparisonStats(
  dimension: 'city' | 'industry' | 'source',
  filter?: AnalyticsFilter
) {
  return useQuery({
    queryKey: ['analytics', 'comparison', dimension, filter],
    queryFn: () => fetchComparisonStats(dimension, filter),
    staleTime: 60 * 1000,
  })
}

/**
 * Fetch top performers data
 */
export function useTopPerformers(
  dimension: 'city' | 'industry' | 'source',
  metric: 'count' | 'enrichment_rate' | 'contacts',
  limit: number = 10,
  filter?: AnalyticsFilter
) {
  return useQuery({
    queryKey: ['analytics', 'top-performers', dimension, metric, limit, filter],
    queryFn: () => fetchTopPerformers(dimension, metric, limit, filter),
    staleTime: 60 * 1000,
  })
}

/**
 * Fetch cost analysis data
 */
export function useCostAnalysis(filter?: AnalyticsFilter) {
  return useQuery({
    queryKey: ['analytics', 'cost-analysis', filter],
    queryFn: () => fetchCostAnalysis(filter),
    staleTime: 60 * 1000,
  })
}

// ==========================================
// CSV Import Hooks
// ==========================================

/**
 * Validate CSV file mutation
 */
export function useValidateCsv() {
  return useMutation({
    mutationFn: (file: File) => validateCsvFile(file),
  })
}

/**
 * Import CSV file mutation
 */
export function useImportCsv() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      file,
      params,
    }: {
      file: File
      params: Omit<CsvImportParams, 'filePath' | 'originalFilename'>
    }) => importCsvFile(file, params),
    onSuccess: () => {
      // Invalidate dashboard data after successful import
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['analytics'] })
      queryClient.invalidateQueries({ queryKey: ['businesses'] })
    },
  })
}

/**
 * Fetch CSV import job status
 */
export function useCsvImportStatus(jobId: string | null) {
  return useQuery({
    queryKey: ['csv-import', jobId],
    queryFn: () => getCsvImportStatus(jobId!),
    enabled: !!jobId,
    refetchInterval: (query) => {
      // Stop polling when job is complete or failed
      const data = query.state.data
      if (data?.status === 'completed' || data?.status === 'failed') {
        return false
      }
      return 2000 // Poll every 2 seconds
    },
  })
}
