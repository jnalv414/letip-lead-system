'use client'

import { motion } from 'framer-motion'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { Card, CardHeader, CardTitle, CardContent, Skeleton } from '@/shared/components/ui'
import type { PipelineStat } from '../types'

interface PipelineChartProps {
  data?: PipelineStat[]
  isLoading?: boolean
}

const COLORS = {
  enriched: '#10b981', // emerald-500
  pending: '#f59e0b', // amber-500
  failed: '#ef4444', // red-500
}

const LABELS = {
  enriched: 'Enriched',
  pending: 'Pending',
  failed: 'Failed',
}

export function PipelineChart({ data, isLoading }: PipelineChartProps) {
  if (isLoading) {
    return (
      <Card variant="glass">
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full rounded-lg" />
        </CardContent>
      </Card>
    )
  }

  if (!data || data.length === 0) return null

  const chartData = data.map((item) => ({
    name: LABELS[item.status],
    value: item.count,
    percentage: item.percentage,
    color: COLORS[item.status],
  }))

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="h-full"
    >
      <Card variant="glass" className="h-full flex flex-col">
        <CardHeader>
          <CardTitle className="text-lg">Pipeline Status</CardTitle>
        </CardHeader>
        <CardContent className="flex-1">
          <div className="h-full min-h-[16rem]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number, name: string) => [
                    `${value.toLocaleString()} (${chartData.find(d => d.name === name)?.percentage.toFixed(1)}%)`,
                    name
                  ]}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value: string) => (
                    <span className="text-sm text-muted-foreground">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
