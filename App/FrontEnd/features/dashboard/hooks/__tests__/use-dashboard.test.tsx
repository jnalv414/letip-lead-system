import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import {
  useDashboardStats,
  useLocationStats,
  useSourceStats,
  usePipelineStats,
  useTimelineStats,
  useRecentBusinesses,
  useDashboardOverview,
  useFilterOptions,
  useFunnelStats,
  useHeatmapStats,
  useComparisonStats,
  useTopPerformers,
  useCostAnalysis,
  useValidateCsv,
  useImportCsv,
  useCsvImportStatus,
} from '../use-dashboard'

// Mock the dashboard API module
vi.mock('../../api/dashboard-api', () => ({
  fetchDashboardStats: vi.fn(),
  fetchLocationStats: vi.fn(),
  fetchSourceStats: vi.fn(),
  fetchPipelineStats: vi.fn(),
  fetchTimelineStats: vi.fn(),
  fetchRecentBusinesses: vi.fn(),
  fetchDashboardOverview: vi.fn(),
  fetchFilterOptions: vi.fn(),
  fetchFunnelStats: vi.fn(),
  fetchHeatmapStats: vi.fn(),
  fetchComparisonStats: vi.fn(),
  fetchTopPerformers: vi.fn(),
  fetchCostAnalysis: vi.fn(),
  validateCsvFile: vi.fn(),
  importCsvFile: vi.fn(),
  getCsvImportStatus: vi.fn(),
}))

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
} from '../../api/dashboard-api'

// --- Mock Data ---

const mockStats = {
  totalBusinesses: 100,
  enrichedCount: 60,
  pendingCount: 35,
  failedCount: 5,
  totalContacts: 200,
  messagesGenerated: 50,
  enrichmentRate: 60,
  avgContactsPerBusiness: 2,
}

const mockLocations = [
  { city: 'New York', state: 'NY', count: 25, percentage: 50 },
  { city: 'Los Angeles', state: 'CA', count: 25, percentage: 50 },
]

const mockSources = [
  { source: 'Google Maps', count: 40, percentage: 40 },
  { source: 'Manual', count: 60, percentage: 60 },
]

const mockPipeline = [
  { status: 'pending' as const, count: 35, percentage: 35 },
  { status: 'enriched' as const, count: 60, percentage: 60 },
  { status: 'failed' as const, count: 5, percentage: 5 },
]

const mockTimeline = [
  { date: '2024-01-01', businesses: 10, enriched: 5, contacts: 0 },
  { date: '2024-01-02', businesses: 15, enriched: 8, contacts: 0 },
]

const mockRecentBusinesses = [
  { id: '1', name: 'Test Biz', enrichment_status: 'pending' as const },
]

const mockOverview = {
  stats: mockStats,
  locations: mockLocations,
  sources: mockSources,
  pipeline: mockPipeline,
  timeline: mockTimeline,
  recentBusinesses: mockRecentBusinesses,
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

// --- Query Hooks ---

describe('useDashboardStats', () => {
  it('fetches and returns dashboard stats', async () => {
    vi.mocked(fetchDashboardStats).mockResolvedValue(mockStats)

    const { result } = renderHook(() => useDashboardStats(), {
      wrapper: createWrapper(),
    })

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(mockStats)
    expect(fetchDashboardStats).toHaveBeenCalledOnce()
  })

  it('handles fetch error', async () => {
    vi.mocked(fetchDashboardStats).mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useDashboardStats(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

describe('useLocationStats', () => {
  it('fetches location stats', async () => {
    vi.mocked(fetchLocationStats).mockResolvedValue(mockLocations)

    const { result } = renderHook(() => useLocationStats(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(mockLocations)
  })
})

describe('useSourceStats', () => {
  it('fetches source stats', async () => {
    vi.mocked(fetchSourceStats).mockResolvedValue(mockSources)

    const { result } = renderHook(() => useSourceStats(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(mockSources)
  })
})

describe('usePipelineStats', () => {
  it('fetches pipeline stats', async () => {
    vi.mocked(fetchPipelineStats).mockResolvedValue(mockPipeline)

    const { result } = renderHook(() => usePipelineStats(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(mockPipeline)
  })
})

describe('useTimelineStats', () => {
  it('fetches timeline stats with default days', async () => {
    vi.mocked(fetchTimelineStats).mockResolvedValue(mockTimeline)

    const { result } = renderHook(() => useTimelineStats(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(fetchTimelineStats).toHaveBeenCalledWith(30)
    expect(result.current.data).toEqual(mockTimeline)
  })

  it('fetches timeline stats with custom days', async () => {
    vi.mocked(fetchTimelineStats).mockResolvedValue(mockTimeline)

    const { result } = renderHook(() => useTimelineStats(7), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(fetchTimelineStats).toHaveBeenCalledWith(7)
  })
})

describe('useRecentBusinesses', () => {
  it('fetches recent businesses with default limit', async () => {
    vi.mocked(fetchRecentBusinesses).mockResolvedValue(mockRecentBusinesses as any)

    const { result } = renderHook(() => useRecentBusinesses(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(fetchRecentBusinesses).toHaveBeenCalledWith(10)
  })

  it('fetches recent businesses with custom limit', async () => {
    vi.mocked(fetchRecentBusinesses).mockResolvedValue(mockRecentBusinesses as any)

    const { result } = renderHook(() => useRecentBusinesses(5), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(fetchRecentBusinesses).toHaveBeenCalledWith(5)
  })
})

describe('useDashboardOverview', () => {
  it('fetches complete dashboard overview', async () => {
    vi.mocked(fetchDashboardOverview).mockResolvedValue(mockOverview as any)

    const { result } = renderHook(() => useDashboardOverview(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(mockOverview)
  })
})

// --- Analytics Hooks ---

describe('useFilterOptions', () => {
  it('fetches filter options', async () => {
    const mockOptions = {
      cities: ['New York', 'LA'],
      industries: ['Tech', 'Finance'],
      sources: ['Google Maps'],
      enrichmentStatuses: ['pending', 'enriched'],
    }
    vi.mocked(fetchFilterOptions).mockResolvedValue(mockOptions as any)

    const { result } = renderHook(() => useFilterOptions(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(mockOptions)
  })
})

describe('useFunnelStats', () => {
  it('fetches funnel stats without filter', async () => {
    const mockFunnel = { stages: [], totalConversion: 0 }
    vi.mocked(fetchFunnelStats).mockResolvedValue(mockFunnel as any)

    const { result } = renderHook(() => useFunnelStats(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(fetchFunnelStats).toHaveBeenCalledWith(undefined)
  })

  it('fetches funnel stats with filter', async () => {
    const mockFunnel = { stages: [], totalConversion: 0 }
    const filter = { startDate: '2024-01-01', endDate: '2024-01-31' }
    vi.mocked(fetchFunnelStats).mockResolvedValue(mockFunnel as any)

    const { result } = renderHook(() => useFunnelStats(filter), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(fetchFunnelStats).toHaveBeenCalledWith(filter)
  })
})

describe('useHeatmapStats', () => {
  it('fetches heatmap stats', async () => {
    const mockHeatmap = { data: [] }
    vi.mocked(fetchHeatmapStats).mockResolvedValue(mockHeatmap as any)

    const { result } = renderHook(() => useHeatmapStats(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(fetchHeatmapStats).toHaveBeenCalledWith(undefined)
  })
})

describe('useComparisonStats', () => {
  it('fetches comparison stats with dimension', async () => {
    const mockComparison = { items: [] }
    vi.mocked(fetchComparisonStats).mockResolvedValue(mockComparison as any)

    const { result } = renderHook(() => useComparisonStats('city'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(fetchComparisonStats).toHaveBeenCalledWith('city', undefined)
  })

  it('fetches comparison stats with filter', async () => {
    const mockComparison = { items: [] }
    const filter = { cities: ['New York'] }
    vi.mocked(fetchComparisonStats).mockResolvedValue(mockComparison as any)

    const { result } = renderHook(() => useComparisonStats('industry', filter), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(fetchComparisonStats).toHaveBeenCalledWith('industry', filter)
  })
})

describe('useTopPerformers', () => {
  it('fetches top performers with all params', async () => {
    const mockPerformers = { items: [] }
    vi.mocked(fetchTopPerformers).mockResolvedValue(mockPerformers as any)

    const { result } = renderHook(
      () => useTopPerformers('city', 'count', 5),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(fetchTopPerformers).toHaveBeenCalledWith('city', 'count', 5, undefined)
  })
})

describe('useCostAnalysis', () => {
  it('fetches cost analysis data', async () => {
    const mockCost = { totalCost: 0, breakdown: [] }
    vi.mocked(fetchCostAnalysis).mockResolvedValue(mockCost as any)

    const { result } = renderHook(() => useCostAnalysis(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(fetchCostAnalysis).toHaveBeenCalledWith(undefined)
  })
})

// --- Mutation Hooks ---

describe('useValidateCsv', () => {
  it('validates a CSV file', async () => {
    const mockResult = { valid: true, totalRows: 10, validRows: 10, errorRows: 0 }
    vi.mocked(validateCsvFile).mockResolvedValue(mockResult as any)

    const file = new File(['name,address\nTest,123 St'], 'test.csv', { type: 'text/csv' })

    const { result } = renderHook(() => useValidateCsv(), {
      wrapper: createWrapper(),
    })

    act(() => {
      result.current.mutate(file)
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(validateCsvFile).toHaveBeenCalledWith(file)
    expect(result.current.data).toEqual(mockResult)
  })

  it('handles validation failure', async () => {
    vi.mocked(validateCsvFile).mockRejectedValue(new Error('Invalid CSV'))

    const file = new File(['bad data'], 'bad.csv', { type: 'text/csv' })

    const { result } = renderHook(() => useValidateCsv(), {
      wrapper: createWrapper(),
    })

    act(() => {
      result.current.mutate(file)
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

describe('useImportCsv', () => {
  it('imports CSV and invalidates dashboard/analytics/businesses queries', async () => {
    const mockJob = { id: 'job-1', status: 'queued' }
    vi.mocked(importCsvFile).mockResolvedValue(mockJob as any)

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    const file = new File(['name\nTest'], 'import.csv', { type: 'text/csv' })

    const { result } = renderHook(() => useImportCsv(), { wrapper })

    act(() => {
      result.current.mutate({
        file,
        params: {
          columnMappings: [],
          skipHeader: true,
          duplicateHandling: 'skip' as const,
        },
      })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['dashboard'] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['analytics'] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['businesses'] })
  })
})

describe('useCsvImportStatus', () => {
  it('polls for job status when jobId provided', async () => {
    vi.mocked(getCsvImportStatus).mockResolvedValue({
      id: 'job-1',
      status: 'processing',
      progress: 50,
    } as any)

    const { result } = renderHook(() => useCsvImportStatus('job-1'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(getCsvImportStatus).toHaveBeenCalledWith('job-1')
    expect(result.current.data?.status).toBe('processing')
  })

  it('does not fetch when jobId is null', () => {
    const { result } = renderHook(() => useCsvImportStatus(null), {
      wrapper: createWrapper(),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(getCsvImportStatus).not.toHaveBeenCalled()
  })
})
