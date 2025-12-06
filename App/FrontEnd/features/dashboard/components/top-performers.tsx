'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent, Skeleton, Badge } from '@/shared/components/ui'
import type { TopPerformersData, TopPerformer } from '../types'

interface TopPerformersProps {
  data?: TopPerformersData
  isLoading?: boolean
  onDimensionChange?: (dimension: 'city' | 'industry' | 'source') => void
  onMetricChange?: (metric: 'count' | 'enrichment_rate' | 'contacts') => void
}

const DIMENSION_LABELS = {
  city: 'Cities',
  industry: 'Industries',
  source: 'Sources',
}

const METRIC_LABELS = {
  count: 'Business Count',
  enrichment_rate: 'Enrichment Rate',
  contacts: 'Contacts',
}

export function TopPerformers({
  data,
  isLoading,
  onDimensionChange,
  onMetricChange,
}: TopPerformersProps) {
  const [selectedDimension, setSelectedDimension] = useState<'city' | 'industry' | 'source'>('city')
  const [selectedMetric, setSelectedMetric] = useState<'count' | 'enrichment_rate' | 'contacts'>('count')

  const handleDimensionChange = (dimension: 'city' | 'industry' | 'source') => {
    setSelectedDimension(dimension)
    onDimensionChange?.(dimension)
  }

  const handleMetricChange = (metric: 'count' | 'enrichment_rate' | 'contacts') => {
    setSelectedMetric(metric)
    onMetricChange?.(metric)
  }

  if (isLoading) {
    return (
      <Card variant="glass">
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full rounded-lg" />
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="h-full"
    >
      <Card variant="glass" className="h-full flex flex-col">
        <CardHeader className="space-y-4">
          <CardTitle className="text-lg">Top Performers</CardTitle>

          {/* Dimension Selector */}
          <div className="flex flex-wrap gap-2">
            {(Object.keys(DIMENSION_LABELS) as Array<keyof typeof DIMENSION_LABELS>).map((dim) => (
              <button
                key={dim}
                onClick={() => handleDimensionChange(dim)}
                className={`
                  px-3 py-1 rounded-full text-xs font-medium transition-colors
                  ${selectedDimension === dim
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                  }
                `}
              >
                {DIMENSION_LABELS[dim]}
              </button>
            ))}
          </div>

          {/* Metric Selector */}
          <div className="flex flex-wrap gap-2">
            {(Object.keys(METRIC_LABELS) as Array<keyof typeof METRIC_LABELS>).map((metric) => (
              <button
                key={metric}
                onClick={() => handleMetricChange(metric)}
                className={`
                  px-3 py-1 rounded-full text-xs font-medium transition-colors
                  ${selectedMetric === metric
                    ? 'bg-secondary text-secondary-foreground'
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                  }
                `}
              >
                {METRIC_LABELS[metric]}
              </button>
            ))}
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col">
          {!data || data.performers.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No data available
            </p>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={`${data.dimension}-${data.metric}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-3"
              >
                {data.performers.map((performer, index) => (
                  <PerformerRow
                    key={performer.name}
                    performer={performer}
                    index={index}
                    metric={selectedMetric}
                  />
                ))}
              </motion.div>
            </AnimatePresence>
          )}

          {data && (
            <div className="mt-4 pt-4 border-t border-border text-sm text-muted-foreground text-center">
              Showing top {data.performers.length} of {data.totalSegments} {data.dimension === 'city' ? 'cities' : data.dimension === 'industry' ? 'industries' : 'sources'}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

interface PerformerRowProps {
  performer: TopPerformer
  index: number
  metric: 'count' | 'enrichment_rate' | 'contacts'
}

function PerformerRow({ performer, index, metric }: PerformerRowProps) {
  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return 'default'
    if (rank === 2) return 'secondary'
    if (rank === 3) return 'outline'
    return 'outline'
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    if (trend === 'up') {
      return (
        <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      )
    }
    if (trend === 'down') {
      return (
        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      )
    }
    return (
      <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
      </svg>
    )
  }

  const getMetricValue = () => {
    switch (metric) {
      case 'count':
        return performer.totalBusinesses.toLocaleString()
      case 'enrichment_rate':
        return `${(performer.enrichmentRate * 100).toFixed(1)}%`
      case 'contacts':
        return performer.enrichedCount.toLocaleString()
      default:
        return performer.totalBusinesses.toLocaleString()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.05 * index }}
      className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
    >
      <Badge variant={getRankBadgeColor(performer.rank)} className="w-6 h-6 p-0 flex items-center justify-center">
        {performer.rank}
      </Badge>

      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{performer.name}</p>
        <p className="text-xs text-muted-foreground">
          {performer.totalBusinesses} businesses, {performer.enrichedCount} enriched
        </p>
      </div>

      <div className="flex items-center gap-2">
        <span className="font-semibold tabular-nums">{getMetricValue()}</span>
        <div className="flex items-center gap-1">
          {getTrendIcon(performer.trend)}
          <span
            className={`text-xs ${
              performer.trend === 'up'
                ? 'text-emerald-500'
                : performer.trend === 'down'
                ? 'text-red-500'
                : 'text-muted-foreground'
            }`}
          >
            {performer.change > 0 ? '+' : ''}{performer.change.toFixed(1)}%
          </span>
        </div>
      </div>
    </motion.div>
  )
}
