import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSocket, connectSocket } from '@/shared/lib/socket'
import {
  startScrape,
  getScrapeStatus,
  cancelScrape,
  fetchRecentSearches,
  fetchActiveJobs,
} from '../api/search-api'
import type { ScrapeRequest, ScrapeJob, ScrapeProgress } from '../types'

export const searchKeys = {
  all: ['search'] as const,
  recentSearches: () => [...searchKeys.all, 'recent'] as const,
  activeJobs: () => [...searchKeys.all, 'active'] as const,
  job: (id: string) => [...searchKeys.all, 'job', id] as const,
}

export function useRecentSearches(limit = 10) {
  return useQuery({
    queryKey: searchKeys.recentSearches(),
    queryFn: () => fetchRecentSearches(limit),
  })
}

export function useActiveJobs() {
  return useQuery({
    queryKey: searchKeys.activeJobs(),
    queryFn: fetchActiveJobs,
    refetchInterval: 5000, // Poll every 5 seconds for active jobs
  })
}

export function useScrapeJob(jobId: string | null) {
  return useQuery({
    queryKey: searchKeys.job(jobId || ''),
    queryFn: () => getScrapeStatus(jobId!),
    enabled: !!jobId,
    refetchInterval: (query) => {
      // Stop polling when job is complete
      const job = query.state.data
      if (job?.status === 'completed' || job?.status === 'failed') {
        return false
      }
      return 2000 // Poll every 2 seconds while running
    },
  })
}

export function useStartScrape() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: ScrapeRequest) => startScrape(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: searchKeys.activeJobs() })
    },
  })
}

export function useCancelScrape() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (jobId: string) => cancelScrape(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: searchKeys.activeJobs() })
    },
  })
}

// Hook for real-time scrape progress via WebSocket
export function useScrapeProgress(jobId: string | null) {
  const [progress, setProgress] = useState<ScrapeProgress | null>(null)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!jobId) return

    connectSocket()
    const socket = getSocket()

    const handleProgress = (data: ScrapeProgress) => {
      if (data.jobId === jobId) {
        setProgress(data)

        // Update cached job data
        queryClient.setQueryData(searchKeys.job(jobId), (old: ScrapeJob | undefined) => {
          if (!old) return old
          return {
            ...old,
            status: data.status,
            progress: data.progress,
            total: data.total,
            found: data.found,
            errors: data.errors,
          }
        })

        // Invalidate leads list when scrape completes
        if (data.status === 'completed') {
          queryClient.invalidateQueries({ queryKey: ['leads'] })
          queryClient.invalidateQueries({ queryKey: searchKeys.recentSearches() })
        }
      }
    }

    socket.on('scrape:progress', handleProgress)
    socket.on('scrape:completed', handleProgress)
    socket.on('scrape:failed', handleProgress)

    return () => {
      socket.off('scrape:progress', handleProgress)
      socket.off('scrape:completed', handleProgress)
      socket.off('scrape:failed', handleProgress)
    }
  }, [jobId, queryClient])

  const reset = useCallback(() => {
    setProgress(null)
  }, [])

  return { progress, reset }
}
