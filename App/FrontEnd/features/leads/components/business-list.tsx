'use client'

import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Building2 } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { SkeletonCard } from '@/shared/components/ui/skeleton'
import { useDebounce } from '@/shared/hooks/use-debounce'
import { BusinessCard } from './business-card'
import { FilterBar } from './filter-bar'
import { BulkActionsBar } from './bulk-actions-bar'
import { CreateLeadModal, ViewLeadModal, DeleteLeadModal } from './modals'
import { useLeads, useIndustries, useBulkEnrichLeads, useBulkDeleteLeads } from '../hooks/use-leads'
import type { LeadFilters } from '../types'
import type { Business } from '@/shared/types'

interface BusinessListProps {
  pageSize?: number
}

export function BusinessList({ pageSize = 12 }: BusinessListProps) {
  // Modal state
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null)
  const [businessToDelete, setBusinessToDelete] = useState<Business | null>(null)

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Filter state
  const [filters, setFilters] = useState<LeadFilters>({
    sortBy: 'created_at',
    sortOrder: 'desc',
  })
  const debouncedSearch = useDebounce(filters.search || '', 300)

  // Pagination state (simple manual state since usePagination requires total upfront)
  const [page, setPage] = useState(1)

  // Queries
  const { data: industries = [] } = useIndustries()
  const { data, isLoading, isFetching } = useLeads(page, pageSize, {
    ...filters,
    search: debouncedSearch,
  })

  // Mutations
  const bulkEnrich = useBulkEnrichLeads()
  const bulkDelete = useBulkDeleteLeads()

  // Derived pagination values
  const totalPages = useMemo(() => {
    return data ? Math.ceil(data.total / pageSize) : 1
  }, [data, pageSize])

  const hasNextPage = page < totalPages
  const hasPreviousPage = page > 1

  const nextPage = useCallback(() => {
    if (hasNextPage) setPage((p) => p + 1)
  }, [hasNextPage])

  const previousPage = useCallback(() => {
    if (hasPreviousPage) setPage((p) => p - 1)
  }, [hasPreviousPage])

  // Selection handlers
  const handleSelect = useCallback((id: string, selected: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (selected) {
        next.add(id)
      } else {
        next.delete(id)
      }
      return next
    })
  }, [])

  const handleClearSelection = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  const handleSelectAll = useCallback(() => {
    if (data?.data) {
      setSelectedIds(new Set(data.data.map((b) => b.id)))
    }
  }, [data?.data])

  // Action handlers
  const handleView = useCallback((business: Business) => {
    setSelectedBusinessId(business.id)
    setViewModalOpen(true)
  }, [])

  const handleEnrich = useCallback((business: Business) => {
    bulkEnrich.mutate([business.id])
  }, [bulkEnrich])

  const handleDelete = useCallback((business: Business) => {
    setBusinessToDelete(business)
    setDeleteModalOpen(true)
  }, [])

  const handleBulkEnrich = useCallback(() => {
    bulkEnrich.mutate(Array.from(selectedIds), {
      onSuccess: () => handleClearSelection(),
    })
  }, [bulkEnrich, selectedIds, handleClearSelection])

  const handleBulkDelete = useCallback(() => {
    bulkDelete.mutate(Array.from(selectedIds), {
      onSuccess: () => handleClearSelection(),
    })
  }, [bulkDelete, selectedIds, handleClearSelection])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">All Leads</h2>
          <p className="text-sm text-muted-foreground">
            {data?.total ?? 0} businesses in your database
          </p>
        </div>
        <div className="flex items-center gap-2">
          {data?.data && data.data.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleSelectAll}>
              Select All
            </Button>
          )}
          <Button size="sm" onClick={() => setCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Add Lead
          </Button>
        </div>
      </div>

      {/* Filters */}
      <FilterBar
        filters={filters}
        industries={industries}
        onFiltersChange={setFilters}
      />

      {/* List */}
      <div className="relative min-h-[400px]">
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : data?.data && data.data.length > 0 ? (
          <>
            <AnimatePresence mode="popLayout">
              <motion.div
                className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                initial={false}
              >
                {data.data.map((business) => (
                  <BusinessCard
                    key={business.id}
                    business={business}
                    isSelected={selectedIds.has(business.id)}
                    onSelect={handleSelect}
                    onView={handleView}
                    onEnrich={handleEnrich}
                    onDelete={handleDelete}
                  />
                ))}
              </motion.div>
            </AnimatePresence>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={previousPage}
                  disabled={!hasPreviousPage || isFetching}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground px-4">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={nextPage}
                  disabled={!hasNextPage || isFetching}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Building2 className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">No leads found</h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-6">
              {filters.search
                ? 'Try adjusting your search or filters to find what you\'re looking for.'
                : 'Get started by adding your first lead or running a map scrape.'}
            </p>
            <Button onClick={() => setCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-1.5" />
              Add Your First Lead
            </Button>
          </div>
        )}

        {/* Loading overlay for refetches */}
        {isFetching && !isLoading && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        )}
      </div>

      {/* Bulk Actions */}
      <BulkActionsBar
        selectedCount={selectedIds.size}
        onClearSelection={handleClearSelection}
        onBulkEnrich={handleBulkEnrich}
        onBulkDelete={handleBulkDelete}
        isEnriching={bulkEnrich.isPending}
        isDeleting={bulkDelete.isPending}
      />

      {/* Modals */}
      <CreateLeadModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
      />
      <ViewLeadModal
        open={viewModalOpen}
        onOpenChange={setViewModalOpen}
        businessId={selectedBusinessId}
        onEnrich={handleEnrich}
      />
      <DeleteLeadModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        business={businessToDelete}
      />
    </div>
  )
}
