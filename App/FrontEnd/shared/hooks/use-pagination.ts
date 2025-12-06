'use client'

import { useState, useMemo, useCallback } from 'react'

interface UsePaginationOptions {
  initialPage?: number
  initialPageSize?: number
  total?: number
}

interface UsePaginationReturn {
  page: number
  pageSize: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
  setPage: (page: number) => void
  setPageSize: (size: number) => void
  nextPage: () => void
  previousPage: () => void
  firstPage: () => void
  lastPage: () => void
}

/**
 * Manage pagination state
 */
export function usePagination({
  initialPage = 1,
  initialPageSize = 20,
  total = 0,
}: UsePaginationOptions = {}): UsePaginationReturn {
  const [page, setPageState] = useState(initialPage)
  const [pageSize, setPageSizeState] = useState(initialPageSize)

  const totalPages = useMemo(() => Math.ceil(total / pageSize) || 1, [total, pageSize])

  const hasNextPage = page < totalPages
  const hasPreviousPage = page > 1

  const setPage = useCallback((newPage: number) => {
    setPageState(Math.max(1, Math.min(newPage, totalPages)))
  }, [totalPages])

  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size)
    setPageState(1) // Reset to first page when page size changes
  }, [])

  const nextPage = useCallback(() => {
    if (hasNextPage) setPageState((p) => p + 1)
  }, [hasNextPage])

  const previousPage = useCallback(() => {
    if (hasPreviousPage) setPageState((p) => p - 1)
  }, [hasPreviousPage])

  const firstPage = useCallback(() => setPageState(1), [])
  const lastPage = useCallback(() => setPageState(totalPages), [totalPages])

  return {
    page,
    pageSize,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    setPage,
    setPageSize,
    nextPage,
    previousPage,
    firstPage,
    lastPage,
  }
}
