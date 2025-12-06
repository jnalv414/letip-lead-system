'use client'

import { useState } from 'react'
import { Building2, Search, CheckCircle } from 'lucide-react'
import { Card } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { Badge } from '@/shared/components/ui/badge'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { useDebounce } from '@/shared/hooks/use-debounce'
import type { Business } from '@/shared/types'

interface BusinessSelectorProps {
  businesses: Business[] | undefined
  selectedBusiness: Business | null
  onSelect: (business: Business) => void
  isLoading?: boolean
}

export function BusinessSelector({
  businesses,
  selectedBusiness,
  onSelect,
  isLoading,
}: BusinessSelectorProps) {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)

  const filteredBusinesses = businesses?.filter((b) =>
    b.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    b.address?.toLowerCase().includes(debouncedSearch.toLowerCase())
  )

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
        <Skeleton className="h-10 w-full mb-4" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      </Card>
    )
  }

  // Only show enriched businesses for outreach
  const enrichedBusinesses = filteredBusinesses?.filter(
    (b) => b.enrichment_status === 'enriched'
  )

  return (
    <Card variant="glass" className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Building2 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Select Business</h2>
          <p className="text-sm text-muted-foreground">
            Choose an enriched business for outreach
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search businesses..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Business List */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {enrichedBusinesses && enrichedBusinesses.length > 0 ? (
          enrichedBusinesses.map((business) => (
            <button
              key={business.id}
              onClick={() => onSelect(business)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${
                selectedBusiness?.id === business.id
                  ? 'bg-primary/10 ring-2 ring-primary'
                  : 'bg-muted/50 hover:bg-muted'
              }`}
            >
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                {selectedBusiness?.id === business.id ? (
                  <CheckCircle className="h-4 w-4 text-primary" />
                ) : (
                  <Building2 className="h-4 w-4 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{business.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {business.address ?? 'No address'}
                </p>
              </div>
              <Badge variant="enriched">Enriched</Badge>
            </button>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">
              {debouncedSearch
                ? 'No matching businesses found'
                : 'No enriched businesses available'}
            </p>
          </div>
        )}
      </div>
    </Card>
  )
}
