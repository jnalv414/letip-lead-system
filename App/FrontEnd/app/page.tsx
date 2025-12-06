'use client'

import { useState } from 'react'
import { AppShell } from '@/shared/components/layout'
import {
  StatsGrid,
  PipelineChart,
  TimelineChart,
  LocationChart,
  RecentBusinesses,
  FunnelChart,
  HeatmapChart,
  TopPerformers,
  CostAnalysis,
  CsvImport,
  useDashboardStats,
  usePipelineStats,
  useTimelineStats,
  useLocationStats,
  useRecentBusinesses,
  useFunnelStats,
  useHeatmapStats,
  useTopPerformers,
  useCostAnalysis,
} from '@/features/dashboard'
import type { AnalyticsFilter } from '@/features/dashboard'

type DashboardTab = 'overview' | 'analytics' | 'import'

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview')
  const [analyticsFilter] = useState<AnalyticsFilter>({})
  const [topPerformersDimension, setTopPerformersDimension] = useState<'city' | 'industry' | 'source'>('city')
  const [topPerformersMetric, setTopPerformersMetric] = useState<'count' | 'enrichment_rate' | 'contacts'>('count')

  // Overview data
  const { data: stats, isLoading: statsLoading } = useDashboardStats()
  const { data: pipeline, isLoading: pipelineLoading } = usePipelineStats()
  const { data: timeline, isLoading: timelineLoading } = useTimelineStats()
  const { data: locations, isLoading: locationsLoading } = useLocationStats()
  const { data: businesses, isLoading: businessesLoading } = useRecentBusinesses()

  // Analytics data
  const { data: funnelData, isLoading: funnelLoading } = useFunnelStats(analyticsFilter)
  const { data: heatmapData, isLoading: heatmapLoading } = useHeatmapStats(analyticsFilter)
  const { data: topPerformersData, isLoading: topPerformersLoading } = useTopPerformers(
    topPerformersDimension,
    topPerformersMetric,
    10,
    analyticsFilter
  )
  const { data: costData, isLoading: costLoading } = useCostAnalysis(analyticsFilter)

  return (
    <AppShell title="Dashboard">
      <div className="space-y-6">
        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-border pb-2">
          {(['overview', 'analytics', 'import'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`
                px-4 py-2 rounded-t-lg text-sm font-medium transition-colors
                ${activeTab === tab
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }
              `}
            >
              {tab === 'overview' && 'Overview'}
              {tab === 'analytics' && 'Analytics'}
              {tab === 'import' && 'Import Data'}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <StatsGrid stats={stats} isLoading={statsLoading} />

            {/* Charts Row - Equal height cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 auto-rows-fr">
              <div className="h-full">
                <PipelineChart data={pipeline} isLoading={pipelineLoading} />
              </div>
              <div className="h-full">
                <LocationChart data={locations} isLoading={locationsLoading} />
              </div>
              <div className="h-full lg:col-span-2 xl:col-span-1">
                <TimelineChart data={timeline} isLoading={timelineLoading} />
              </div>
            </div>

            {/* Recent Businesses */}
            <RecentBusinesses businesses={businesses} isLoading={businessesLoading} />
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Row 1: Funnel and Heatmap - Equal height cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 auto-rows-fr">
              <div className="h-full">
                <FunnelChart data={funnelData} isLoading={funnelLoading} />
              </div>
              <div className="h-full">
                <HeatmapChart data={heatmapData} isLoading={heatmapLoading} />
              </div>
            </div>

            {/* Row 2: Top Performers and Cost Analysis - Equal height cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 auto-rows-fr">
              <div className="h-full">
                <TopPerformers
                  data={topPerformersData}
                  isLoading={topPerformersLoading}
                  onDimensionChange={setTopPerformersDimension}
                  onMetricChange={setTopPerformersMetric}
                />
              </div>
              <div className="h-full">
                <CostAnalysis data={costData} isLoading={costLoading} />
              </div>
            </div>
          </div>
        )}

        {/* Import Tab */}
        {activeTab === 'import' && (
          <div className="max-w-2xl mx-auto">
            <CsvImport
              onComplete={() => {
                // Switch to overview after import
                setActiveTab('overview')
              }}
            />
          </div>
        )}
      </div>
    </AppShell>
  )
}
