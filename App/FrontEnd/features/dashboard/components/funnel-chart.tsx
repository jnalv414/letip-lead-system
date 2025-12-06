'use client'

import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent, Skeleton } from '@/shared/components/ui'
import type { FunnelStats, FunnelStage } from '../types'

interface FunnelChartProps {
  data?: FunnelStats
  isLoading?: boolean
}

const STAGE_COLORS: Record<string, string> = {
  scraped: '#3b82f6', // blue-500
  pending: '#f59e0b', // amber-500
  enriched: '#10b981', // emerald-500
  contacted: '#8b5cf6', // violet-500
  converted: '#ec4899', // pink-500
}

export function FunnelChart({ data, isLoading }: FunnelChartProps) {
  if (isLoading) {
    return (
      <Card variant="glass">
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-80 w-full rounded-lg" />
        </CardContent>
      </Card>
    )
  }

  if (!data || data.stages.length === 0) {
    return (
      <Card variant="glass">
        <CardHeader>
          <CardTitle className="text-lg">Conversion Funnel</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No funnel data available
          </p>
        </CardContent>
      </Card>
    )
  }

  const maxCount = Math.max(...data.stages.map((s) => s.count))

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="h-full"
    >
      <Card variant="glass" className="h-full flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Conversion Funnel</CardTitle>
          <span className="text-sm text-muted-foreground">
            Overall: {(data.overallConversionRate * 100).toFixed(1)}%
          </span>
        </CardHeader>
        <CardContent className="flex-1">
          <div className="space-y-4">
            {data.stages.map((stage, index) => (
              <FunnelStageRow
                key={stage.stage}
                stage={stage}
                index={index}
                maxCount={maxCount}
                isLast={index === data.stages.length - 1}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

interface FunnelStageRowProps {
  stage: FunnelStage
  index: number
  maxCount: number
  isLast: boolean
}

function FunnelStageRow({ stage, index, maxCount, isLast }: FunnelStageRowProps) {
  const widthPercent = maxCount > 0 ? (stage.count / maxCount) * 100 : 0
  const color = STAGE_COLORS[stage.stage.toLowerCase()] || '#6b7280'

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 * index }}
      className="space-y-1"
    >
      <div className="flex justify-between text-sm">
        <span className="font-medium capitalize">{stage.stage}</span>
        <span className="text-muted-foreground">
          {stage.count.toLocaleString()} ({stage.percentage.toFixed(1)}%)
        </span>
      </div>
      <div className="relative h-8">
        <div
          className="h-full rounded-md transition-all duration-500"
          style={{
            width: `${Math.max(widthPercent, 5)}%`,
            backgroundColor: color,
          }}
        />
      </div>
      {!isLast && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground pl-2">
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
          <span>
            {(stage.conversionRate * 100).toFixed(1)}% conversion
          </span>
          <span className="text-destructive">
            ({(stage.dropOffRate * 100).toFixed(1)}% drop-off)
          </span>
        </div>
      )}
    </motion.div>
  )
}
