import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSocket, connectSocket } from '@/shared/lib/socket'
import {
  fetchEnrichmentQueue,
  fetchEnrichmentStats,
  fetchEnrichmentHistory,
  fetchEnrichmentResult,
  enrichBusiness,
  batchEnrich,
  retryFailedEnrichment,
} from '../api/enrichment-api'
import type { BatchEnrichmentRequest } from '../types'

export const enrichmentKeys = {
  all: ['enrichment'] as const,
  queue: () => [...enrichmentKeys.all, 'queue'] as const,
  stats: () => [...enrichmentKeys.all, 'stats'] as const,
  history: (page: number, pageSize: number) =>
    [...enrichmentKeys.all, 'history', { page, pageSize }] as const,
  result: (id: string) => [...enrichmentKeys.all, 'result', id] as const,
}

export function useEnrichmentQueue() {
  return useQuery({
    queryKey: enrichmentKeys.queue(),
    queryFn: fetchEnrichmentQueue,
    refetchInterval: 5000,
  })
}

export function useEnrichmentStats() {
  return useQuery({
    queryKey: enrichmentKeys.stats(),
    queryFn: fetchEnrichmentStats,
    refetchInterval: 10000,
  })
}

export function useEnrichmentHistory(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: enrichmentKeys.history(page, pageSize),
    queryFn: () => fetchEnrichmentHistory(page, pageSize),
    placeholderData: (previousData) => previousData,
  })
}

export function useEnrichmentResult(businessId: string) {
  return useQuery({
    queryKey: enrichmentKeys.result(businessId),
    queryFn: () => fetchEnrichmentResult(businessId),
    enabled: !!businessId,
  })
}

export function useEnrichBusiness() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (businessId: string) => enrichBusiness(businessId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: enrichmentKeys.queue() })
      queryClient.invalidateQueries({ queryKey: enrichmentKeys.stats() })
    },
  })
}

export function useBatchEnrich() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: BatchEnrichmentRequest) => batchEnrich(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: enrichmentKeys.queue() })
      queryClient.invalidateQueries({ queryKey: enrichmentKeys.stats() })
    },
  })
}

export function useRetryEnrichment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (businessId: string) => retryFailedEnrichment(businessId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: enrichmentKeys.queue() })
      queryClient.invalidateQueries({ queryKey: enrichmentKeys.history(1, 20) })
    },
  })
}

// Hook for real-time enrichment updates via WebSocket
export function useEnrichmentUpdates() {
  const queryClient = useQueryClient()

  useEffect(() => {
    connectSocket()
    const socket = getSocket()

    const handleCompleted = () => {
      queryClient.invalidateQueries({ queryKey: enrichmentKeys.queue() })
      queryClient.invalidateQueries({ queryKey: enrichmentKeys.stats() })
      queryClient.invalidateQueries({ queryKey: enrichmentKeys.history(1, 20) })
      queryClient.invalidateQueries({ queryKey: ['leads'] })
    }

    const handleFailed = () => {
      queryClient.invalidateQueries({ queryKey: enrichmentKeys.queue() })
      queryClient.invalidateQueries({ queryKey: enrichmentKeys.stats() })
      queryClient.invalidateQueries({ queryKey: enrichmentKeys.history(1, 20) })
    }

    socket.on('enrichment:completed', handleCompleted)
    socket.on('enrichment:failed', handleFailed)

    return () => {
      socket.off('enrichment:completed', handleCompleted)
      socket.off('enrichment:failed', handleFailed)
    }
  }, [queryClient])
}
