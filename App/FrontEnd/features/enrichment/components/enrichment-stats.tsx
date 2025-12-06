'use client'

import { motion } from 'framer-motion'
import { CheckCircle, Clock, XCircle, TrendingUp, Users } from 'lucide-react'
import { Card } from '@/shared/components/ui/card'
import { Skeleton } from '@/shared/components/ui/skeleton'
import type { EnrichmentStats as EnrichmentStatsType } from '../types'

interface EnrichmentStatsProps {
  stats: EnrichmentStatsType | undefined
  isLoading?: boolean
}

export function EnrichmentStats({ stats, isLoading }: EnrichmentStatsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i} variant="glass" className="p-4">
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-8 w-16" />
          </Card>
        ))}
      </div>
    )
  }

  const statItems = [
    {
      label: 'Enriched',
      value: stats?.total_enriched ?? 0,
      icon: CheckCircle,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/20',
    },
    {
      label: 'Pending',
      value: stats?.total_pending ?? 0,
      icon: Clock,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/20',
    },
    {
      label: 'Failed',
      value: stats?.total_failed ?? 0,
      icon: XCircle,
      color: 'text-red-400',
      bgColor: 'bg-red-500/20',
    },
    {
      label: 'Success Rate',
      value: `${Math.round(stats?.success_rate ?? 0)}%`,
      icon: TrendingUp,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
    },
    {
      label: 'Avg. Contacts',
      value: stats?.avg_contacts_per_business?.toFixed(1) ?? '0',
      icon: Users,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20',
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {statItems.map((item, index) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card variant="glass" className="p-4">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg ${item.bgColor} flex items-center justify-center`}>
                <item.icon className={`h-5 w-5 ${item.color}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <p className="text-2xl font-bold text-foreground">{item.value}</p>
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}
