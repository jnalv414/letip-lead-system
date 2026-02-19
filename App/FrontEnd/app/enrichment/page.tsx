'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Info } from 'lucide-react'
import { AppShell } from '@/shared/components/layout'
import { useAuth } from '@/features/auth'
import {
  EnrichmentStatsCard,
  EnrichmentQueueCard,
  EnrichmentHistoryCard,
  BatchControls,
  useEnrichmentStats,
  useEnrichmentQueue,
  useEnrichmentHistory,
  useEnrichBusiness,
  useBatchEnrich,
  useRetryEnrichment,
  useEnrichmentUpdates,
} from '@/features/enrichment'
import type { Business } from '@/shared/types'

export default function EnrichmentPage() {
  const router = useRouter()
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'
  const [historyPage, setHistoryPage] = useState(1)
  const [isQueuePaused, setIsQueuePaused] = useState(false)

  // Enable real-time updates
  useEnrichmentUpdates()

  // Queries
  const { data: stats, isLoading: statsLoading } = useEnrichmentStats()
  const { data: queue, isLoading: queueLoading } = useEnrichmentQueue()
  const { data: history, isLoading: historyLoading } = useEnrichmentHistory(historyPage)

  // Mutations
  const enrichBusiness = useEnrichBusiness()
  const batchEnrich = useBatchEnrich()
  const retryEnrichment = useRetryEnrichment()

  const handleEnrichBusiness = useCallback(
    (business: Business) => {
      enrichBusiness.mutate(business.id)
    },
    [enrichBusiness]
  )

  const handleBatchEnrich = useCallback(() => {
    if (queue?.businesses) {
      const pendingIds = queue.businesses
        .filter((b) => b.enrichment_status === 'pending')
        .map((b) => b.id)
      batchEnrich.mutate({ business_ids: pendingIds })
    }
  }, [queue, batchEnrich])

  const handleRetry = useCallback(
    (businessId: string) => {
      retryEnrichment.mutate(businessId)
    },
    [retryEnrichment]
  )

  const handlePauseQueue = useCallback(() => {
    // Pause/resume not supported by backend - just toggle local state
    setIsQueuePaused(true)
  }, [])

  const handleResumeQueue = useCallback(() => {
    setIsQueuePaused(false)
  }, [])

  const handleViewBusiness = useCallback(
    (businessId: string) => {
      router.push(`/leads?id=${businessId}`)
    },
    [router]
  )

  return (
    <AppShell title="Enrichment">
      <div className="space-y-6">
        {!isAdmin && (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <Info className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <p className="text-sm">Only administrators can initiate enrichment jobs.</p>
          </div>
        )}

        {/* Stats */}
        <EnrichmentStatsCard stats={stats} isLoading={statsLoading} />

        {/* Main content */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left column */}
          <div className="space-y-6">
            <EnrichmentQueueCard
              queue={queue}
              isLoading={queueLoading}
              onEnrich={isAdmin ? handleEnrichBusiness : undefined}
              isEnriching={enrichBusiness.isPending}
            />
            <BatchControls
              pendingCount={queue?.pending ?? 0}
              isQueuePaused={isQueuePaused}
              onBatchEnrich={handleBatchEnrich}
              onPauseQueue={handlePauseQueue}
              onResumeQueue={handleResumeQueue}
              isBatchEnriching={batchEnrich.isPending}
              isPausing={false}
              isResuming={false}
              isAdmin={isAdmin}
            />
          </div>

          {/* Right column */}
          <EnrichmentHistoryCard
            history={history}
            isLoading={historyLoading}
            onRetry={handleRetry}
            onViewBusiness={handleViewBusiness}
            isRetrying={retryEnrichment.isPending}
            page={historyPage}
            onPageChange={setHistoryPage}
          />
        </div>
      </div>
    </AppShell>
  )
}
