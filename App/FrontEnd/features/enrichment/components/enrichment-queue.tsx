'use client'

import { motion } from 'framer-motion'
import { Building2, Sparkles, Clock, Loader2 } from 'lucide-react'
import { Card } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Skeleton } from '@/shared/components/ui/skeleton'
import type { EnrichmentQueue as EnrichmentQueueType } from '../types'
import type { Business } from '@/shared/types'

interface EnrichmentQueueProps {
  queue: EnrichmentQueueType | undefined
  isLoading?: boolean
  onEnrich?: (business: Business) => void
  isEnriching?: boolean
}

export function EnrichmentQueue({
  queue,
  isLoading,
  onEnrich,
  isEnriching,
}: EnrichmentQueueProps) {
  if (isLoading) {
    return (
      <Card variant="glass" className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      </Card>
    )
  }

  const pendingBusinesses = queue?.businesses.filter(
    (b) => b.enrichment_status === 'pending'
  ) ?? []

  return (
    <Card variant="glass" className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
            <Clock className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Pending Queue</h2>
            <p className="text-sm text-muted-foreground">
              {queue?.pending ?? 0} businesses awaiting enrichment
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="pending">{queue?.running ?? 0} running</Badge>
        </div>
      </div>

      {pendingBusinesses.length > 0 ? (
        <div className="space-y-2">
          {pendingBusinesses.slice(0, 5).map((business, index) => (
            <motion.div
              key={business.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
            >
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Building2 className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{business.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {business.address ?? 'No address'}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEnrich?.(business)}
                disabled={isEnriching}
              >
                {isEnriching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
              </Button>
            </motion.div>
          ))}
          {pendingBusinesses.length > 5 && (
            <p className="text-sm text-muted-foreground text-center pt-2">
              +{pendingBusinesses.length - 5} more in queue
            </p>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No businesses pending enrichment</p>
        </div>
      )}
    </Card>
  )
}
