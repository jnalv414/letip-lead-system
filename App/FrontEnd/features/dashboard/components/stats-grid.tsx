'use client'

import { motion } from 'framer-motion'
import { Building2, Users, CheckCircle, Clock, XCircle, MessageSquare } from 'lucide-react'
import { Card, CardContent, Skeleton } from '@/shared/components/ui'
import { cn } from '@/shared/lib/utils'
import type { DashboardStats } from '../types'

interface StatsGridProps {
  stats?: DashboardStats
  isLoading?: boolean
}

interface StatCardProps {
  title: string
  value: number | string
  subtitle?: string
  icon: React.ElementType
  trend?: number
  color: 'violet' | 'blue' | 'emerald' | 'amber' | 'red'
  delay?: number
}

const colorVariants = {
  violet: 'from-violet-500/20 to-violet-500/5 text-violet-400',
  blue: 'from-blue-500/20 to-blue-500/5 text-blue-400',
  emerald: 'from-emerald-500/20 to-emerald-500/5 text-emerald-400',
  amber: 'from-amber-500/20 to-amber-500/5 text-amber-400',
  red: 'from-red-500/20 to-red-500/5 text-red-400',
}

function StatCard({ title, value, subtitle, icon: Icon, trend, color, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
    >
      <Card variant="glass" className="overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{title}</p>
              <p className="text-3xl font-bold tracking-tight">{value}</p>
              {subtitle && (
                <p className="text-xs text-muted-foreground">{subtitle}</p>
              )}
              {trend !== undefined && (
                <p className={cn(
                  'text-xs font-medium',
                  trend >= 0 ? 'text-emerald-400' : 'text-red-400'
                )}>
                  {trend >= 0 ? '+' : ''}{trend}% from last week
                </p>
              )}
            </div>
            <div className={cn(
              'p-3 rounded-xl bg-gradient-to-br',
              colorVariants[color]
            )}>
              <Icon className="h-6 w-6" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function StatCardSkeleton() {
  return (
    <Card variant="glass">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-12 w-12 rounded-xl" />
        </div>
      </CardContent>
    </Card>
  )
}

export function StatsGrid({ stats, isLoading }: StatsGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      <StatCard
        title="Total Businesses"
        value={stats.totalBusinesses.toLocaleString()}
        icon={Building2}
        color="violet"
        delay={0}
      />
      <StatCard
        title="Enriched"
        value={stats.enrichedCount.toLocaleString()}
        subtitle={`${stats.enrichmentRate.toFixed(1)}% rate`}
        icon={CheckCircle}
        color="emerald"
        delay={0.05}
      />
      <StatCard
        title="Pending"
        value={stats.pendingCount.toLocaleString()}
        icon={Clock}
        color="amber"
        delay={0.1}
      />
      <StatCard
        title="Failed"
        value={stats.failedCount.toLocaleString()}
        icon={XCircle}
        color="red"
        delay={0.15}
      />
      <StatCard
        title="Total Contacts"
        value={stats.totalContacts.toLocaleString()}
        subtitle={`${stats.avgContactsPerBusiness.toFixed(1)} avg per business`}
        icon={Users}
        color="blue"
        delay={0.2}
      />
      <StatCard
        title="Messages"
        value={stats.messagesGenerated.toLocaleString()}
        icon={MessageSquare}
        color="violet"
        delay={0.25}
      />
    </div>
  )
}
