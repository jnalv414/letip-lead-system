'use client'

import { motion } from 'framer-motion'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { Card, CardHeader, CardTitle, CardContent, Skeleton, Badge } from '@/shared/components/ui'
import type { CostAnalysisData, CostBreakdownItem } from '../types'

interface CostAnalysisProps {
  data?: CostAnalysisData
  isLoading?: boolean
}

const COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
]

export function CostAnalysis({ data, isLoading }: CostAnalysisProps) {
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

  if (!data) {
    return (
      <Card variant="glass">
        <CardHeader>
          <CardTitle className="text-lg">Cost Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No cost data available
          </p>
        </CardContent>
      </Card>
    )
  }

  const chartData = data.breakdown.map((item, index) => ({
    name: item.name,
    value: item.cost,
    percentage: item.percentage,
    color: COLORS[index % COLORS.length],
  }))

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="h-full"
    >
      <Card variant="glass" className="h-full flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Cost Analysis</CardTitle>
          <span className="text-2xl font-bold text-primary">
            ${data.totalCost.toFixed(2)}
          </span>
        </CardHeader>

        <CardContent className="flex-1 space-y-6">
          {/* Cost Chart */}
          <div className="h-48 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={2}
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
                  formatter={(value: number) => [`$${value.toFixed(2)}`, 'Cost']}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value: string) => (
                    <span className="text-xs text-muted-foreground">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Cost Breakdown Table */}
          <div className="space-y-2">
            {data.breakdown.map((item, index) => (
              <CostBreakdownRow
                key={item.name}
                item={item}
                color={COLORS[index % COLORS.length]}
                index={index}
              />
            ))}
          </div>

          {/* Budget Status */}
          {data.budgetStatus && (
            <BudgetStatusCard budgetStatus={data.budgetStatus} />
          )}

          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
            <div className="text-center">
              <p className="text-2xl font-bold">{data.totalLeads.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Total Leads</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">${data.avgCostPerLead.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">Cost per Lead</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

interface CostBreakdownRowProps {
  item: CostBreakdownItem
  color: string
  index: number
}

function CostBreakdownRow({ item, color, index }: CostBreakdownRowProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.05 * index }}
      className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: color }}
        />
        <div>
          <p className="font-medium">{item.name}</p>
          <p className="text-xs text-muted-foreground">
            {item.operations.toLocaleString()} operations
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-semibold">${item.cost.toFixed(2)}</p>
        <p className="text-xs text-muted-foreground">
          ${item.costPerOperation.toFixed(4)}/op
        </p>
      </div>
    </motion.div>
  )
}

interface BudgetStatusCardProps {
  budgetStatus: NonNullable<CostAnalysisData['budgetStatus']>
}

function BudgetStatusCard({ budgetStatus }: BudgetStatusCardProps) {
  const progressPercent = Math.min(budgetStatus.percentUsed, 100)
  const isOverBudget = budgetStatus.percentUsed > 100
  const isWarning = budgetStatus.percentUsed > 80

  return (
    <div className="p-4 rounded-lg bg-muted/30 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Monthly Budget</h4>
        <Badge variant={isOverBudget ? 'destructive' : budgetStatus.onTrack ? 'default' : 'secondary'}>
          {isOverBudget ? 'Over Budget' : budgetStatus.onTrack ? 'On Track' : 'At Risk'}
        </Badge>
      </div>

      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className={`h-full ${
            isOverBudget
              ? 'bg-destructive'
              : isWarning
              ? 'bg-amber-500'
              : 'bg-emerald-500'
          }`}
        />
      </div>

      <div className="grid grid-cols-3 gap-2 text-sm">
        <div>
          <p className="text-muted-foreground">Spent</p>
          <p className="font-medium">${budgetStatus.currentSpend.toFixed(2)}</p>
        </div>
        <div className="text-center">
          <p className="text-muted-foreground">Remaining</p>
          <p className={`font-medium ${budgetStatus.remaining < 0 ? 'text-destructive' : ''}`}>
            ${budgetStatus.remaining.toFixed(2)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-muted-foreground">Projected</p>
          <p className={`font-medium ${budgetStatus.projectedSpend > budgetStatus.monthlyBudget ? 'text-amber-500' : ''}`}>
            ${budgetStatus.projectedSpend.toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  )
}
