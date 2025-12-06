'use client'

import { motion } from 'framer-motion'
import { Send, Eye, MessageCircle, XCircle, TrendingUp } from 'lucide-react'
import { Card } from '@/shared/components/ui/card'
import { Skeleton } from '@/shared/components/ui/skeleton'
import type { CampaignStats as CampaignStatsType } from '../types'

interface CampaignStatsProps {
  stats: CampaignStatsType | undefined
  isLoading?: boolean
}

export function CampaignStats({ stats, isLoading }: CampaignStatsProps) {
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
      label: 'Sent',
      value: stats?.total_sent ?? 0,
      icon: Send,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
    },
    {
      label: 'Delivered',
      value: stats?.total_delivered ?? 0,
      icon: TrendingUp,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/20',
    },
    {
      label: 'Opened',
      value: stats?.total_opened ?? 0,
      subValue: `${Math.round(stats?.open_rate ?? 0)}%`,
      icon: Eye,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/20',
    },
    {
      label: 'Replied',
      value: stats?.total_replied ?? 0,
      subValue: `${Math.round(stats?.reply_rate ?? 0)}%`,
      icon: MessageCircle,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20',
    },
    {
      label: 'Failed',
      value: stats?.total_failed ?? 0,
      icon: XCircle,
      color: 'text-red-400',
      bgColor: 'bg-red-500/20',
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
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-foreground">{item.value}</p>
                  {'subValue' in item && item.subValue && (
                    <span className="text-sm text-muted-foreground">({item.subValue})</span>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}
