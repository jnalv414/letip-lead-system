'use client'

import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent, Skeleton } from '@/shared/components/ui'
import type { HeatmapStats, HeatmapDataPoint } from '../types'

interface HeatmapChartProps {
  data?: HeatmapStats
  isLoading?: boolean
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const HOURS = Array.from({ length: 24 }, (_, i) => i)

function getHeatColor(intensity: number): string {
  if (intensity === 0) return 'bg-muted/30'
  if (intensity < 0.25) return 'bg-emerald-500/30'
  if (intensity < 0.5) return 'bg-emerald-500/50'
  if (intensity < 0.75) return 'bg-emerald-500/70'
  return 'bg-emerald-500'
}

export function HeatmapChart({ data, isLoading }: HeatmapChartProps) {
  if (isLoading) {
    return (
      <Card variant="glass">
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full rounded-lg" />
        </CardContent>
      </Card>
    )
  }

  if (!data || data.data.length === 0) {
    return (
      <Card variant="glass">
        <CardHeader>
          <CardTitle className="text-lg">Activity Heatmap</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No activity data available
          </p>
        </CardContent>
      </Card>
    )
  }

  // Create a map for quick lookup
  const dataMap = new Map<string, HeatmapDataPoint>()
  data.data.forEach((point) => {
    dataMap.set(`${point.dayOfWeek}-${point.hour}`, point)
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="h-full"
    >
      <Card variant="glass" className="h-full flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Activity Heatmap</CardTitle>
          <div className="text-sm text-muted-foreground">
            Peak: {data.peakDay} at {data.peakHour}:00
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          <div className="overflow-x-auto flex-1">
            <div className="min-w-[600px]">
              {/* Hour labels */}
              <div className="flex mb-1 ml-12">
                {HOURS.filter((_, i) => i % 3 === 0).map((hour) => (
                  <div
                    key={hour}
                    className="flex-1 text-xs text-muted-foreground text-center"
                    style={{ minWidth: '36px' }}
                  >
                    {hour.toString().padStart(2, '0')}
                  </div>
                ))}
              </div>

              {/* Heatmap grid */}
              <div className="space-y-1">
                {DAYS.map((day, dayIndex) => (
                  <div key={day} className="flex items-center gap-2">
                    <span className="w-10 text-xs text-muted-foreground">
                      {day}
                    </span>
                    <div className="flex gap-0.5 flex-1">
                      {HOURS.map((hour) => {
                        const point = dataMap.get(`${dayIndex}-${hour}`)
                        return (
                          <motion.div
                            key={`${dayIndex}-${hour}`}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{
                              delay: 0.01 * (dayIndex * 24 + hour),
                              type: 'spring',
                              stiffness: 500,
                              damping: 30,
                            }}
                            className={`
                              w-3 h-5 rounded-sm cursor-pointer
                              hover:ring-2 hover:ring-primary/50
                              transition-all duration-200
                              ${getHeatColor(point?.intensity || 0)}
                            `}
                            title={`${day} ${hour}:00 - ${point?.count || 0} activities`}
                          />
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="flex items-center justify-end mt-4 gap-2">
                <span className="text-xs text-muted-foreground">Less</span>
                <div className="flex gap-0.5">
                  <div className="w-3 h-3 rounded-sm bg-muted/30" />
                  <div className="w-3 h-3 rounded-sm bg-emerald-500/30" />
                  <div className="w-3 h-3 rounded-sm bg-emerald-500/50" />
                  <div className="w-3 h-3 rounded-sm bg-emerald-500/70" />
                  <div className="w-3 h-3 rounded-sm bg-emerald-500" />
                </div>
                <span className="text-xs text-muted-foreground">More</span>
              </div>
            </div>
          </div>

          {/* Summary stats */}
          <div className="mt-4 pt-4 border-t border-border flex justify-between text-sm">
            <div>
              <span className="text-muted-foreground">Total Activity: </span>
              <span className="font-medium">{data.totalActivity.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Max Value: </span>
              <span className="font-medium">{data.maxValue.toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
