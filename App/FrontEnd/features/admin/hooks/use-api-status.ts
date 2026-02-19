'use client'

import { useQuery } from '@tanstack/react-query'
import { getApiStatus } from '../api/admin-api'

export const adminKeys = {
  all: ['admin'] as const,
  apiStatus: () => [...adminKeys.all, 'api-status'] as const,
}

export function useApiStatus() {
  return useQuery({
    queryKey: adminKeys.apiStatus(),
    queryFn: getApiStatus,
    staleTime: 1000 * 60 * 2, // 2 minutes
    retry: false,
  })
}
