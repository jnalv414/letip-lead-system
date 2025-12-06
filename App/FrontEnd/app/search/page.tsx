'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { AppShell } from '@/shared/components/layout'
import {
  SearchForm,
  ScrapeProgressCard,
  RecentSearches,
  useRecentSearches,
  useStartScrape,
  useCancelScrape,
  useScrapeJob,
  useScrapeProgress,
} from '@/features/search'
import type { ScrapeRequest, RecentSearch } from '@/features/search'

export default function SearchPage() {
  const router = useRouter()
  const [activeJobId, setActiveJobId] = useState<string | null>(null)

  const { data: recentSearches, isLoading: isLoadingRecent } = useRecentSearches()
  const { data: job } = useScrapeJob(activeJobId)
  const { progress, reset: resetProgress } = useScrapeProgress(activeJobId)

  const startScrape = useStartScrape()
  const cancelScrape = useCancelScrape()

  const handleStartScrape = useCallback(
    async (request: ScrapeRequest) => {
      try {
        resetProgress()
        const newJob = await startScrape.mutateAsync(request)
        setActiveJobId(newJob.id)
      } catch (error) {
        console.error('Failed to start scrape:', error)
      }
    },
    [startScrape, resetProgress]
  )

  const handleCancel = useCallback(async () => {
    if (activeJobId) {
      try {
        await cancelScrape.mutateAsync(activeJobId)
        setActiveJobId(null)
        resetProgress()
      } catch (error) {
        console.error('Failed to cancel scrape:', error)
      }
    }
  }, [activeJobId, cancelScrape, resetProgress])

  const handleViewResults = useCallback(() => {
    router.push('/leads')
  }, [router])

  const handleRepeatSearch = useCallback(
    (search: RecentSearch) => {
      handleStartScrape({
        query: search.query,
        location: search.location,
      })
    },
    [handleStartScrape]
  )

  const isJobActive =
    job?.status === 'pending' ||
    job?.status === 'running' ||
    progress?.status === 'pending' ||
    progress?.status === 'running'

  return (
    <AppShell title="Search">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Search Form */}
        <div className="space-y-6">
          <SearchForm
            onSubmit={handleStartScrape}
            isLoading={startScrape.isPending}
            isDisabled={isJobActive}
          />

          {/* Active Job Progress */}
          {activeJobId && (job || progress) && (
            <ScrapeProgressCard
              job={job ?? null}
              progress={progress}
              onCancel={handleCancel}
              onViewResults={handleViewResults}
              isCancelling={cancelScrape.isPending}
            />
          )}
        </div>

        {/* Recent Searches */}
        <RecentSearches
          searches={recentSearches}
          isLoading={isLoadingRecent}
          onRepeat={handleRepeatSearch}
        />
      </div>
    </AppShell>
  )
}
