'use client'

import { useMemo } from 'react'
import { Search, SortAsc, SortDesc } from 'lucide-react'
import { Input } from '@/shared/components/ui/input'
import { Button } from '@/shared/components/ui/button'
import { Select } from '@/shared/components/ui/select'
import type { LeadFilters } from '../types'

interface FilterBarProps {
  filters: LeadFilters
  industries: string[]
  onFiltersChange: (filters: LeadFilters) => void
}

export function FilterBar({ filters, industries, onFiltersChange }: FilterBarProps) {
  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value })
  }

  const handleStatusChange = (value: string) => {
    onFiltersChange({
      ...filters,
      enrichment_status: value as LeadFilters['enrichment_status'],
    })
  }

  const handleIndustryChange = (value: string) => {
    onFiltersChange({
      ...filters,
      industry: value === 'all' ? undefined : value,
    })
  }

  const handleSortChange = (value: string) => {
    onFiltersChange({
      ...filters,
      sortBy: value as LeadFilters['sortBy'],
    })
  }

  const toggleSortOrder = () => {
    onFiltersChange({
      ...filters,
      sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc',
    })
  }

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'enriched', label: 'Enriched' },
    { value: 'failed', label: 'Failed' },
  ]

  const industryOptions = useMemo(
    () => [
      { value: 'all', label: 'All Industries' },
      ...industries.map((ind) => ({ value: ind, label: ind })),
    ],
    [industries]
  )

  const sortOptions = [
    { value: 'name', label: 'Name' },
    { value: 'created_at', label: 'Date Added' },
    { value: 'updated_at', label: 'Last Updated' },
  ]

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search businesses..."
          value={filters.search || ''}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Status filter */}
      <Select
        value={filters.enrichment_status || 'all'}
        onChange={(e) => handleStatusChange(e.target.value)}
        options={statusOptions}
        className="w-[140px]"
      />

      {/* Industry filter */}
      <Select
        value={filters.industry || 'all'}
        onChange={(e) => handleIndustryChange(e.target.value)}
        options={industryOptions}
        className="w-[160px]"
      />

      {/* Sort */}
      <Select
        value={filters.sortBy || 'created_at'}
        onChange={(e) => handleSortChange(e.target.value)}
        options={sortOptions}
        className="w-[140px]"
      />

      <Button
        variant="outline"
        size="sm"
        onClick={toggleSortOrder}
        className="h-9 px-3"
      >
        {filters.sortOrder === 'asc' ? (
          <SortAsc className="h-4 w-4" />
        ) : (
          <SortDesc className="h-4 w-4" />
        )}
      </Button>
    </div>
  )
}
