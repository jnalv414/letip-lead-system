'use client'

import { Clock, Search, Building2, ChevronRight } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { Card } from '@/shared/components/ui/card'
import { Skeleton } from '@/shared/components/ui/skeleton'
import type { RecentSearch } from '../types'

interface RecentSearchesProps {
  searches: RecentSearch[] | undefined
  isLoading?: boolean
  onRepeat?: (search: RecentSearch) => void
}

export function RecentSearches({ searches, isLoading, onRepeat }: RecentSearchesProps) {
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

  return (
    <Card variant="glass" className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
          <Clock className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Recent Searches</h2>
          <p className="text-sm text-muted-foreground">
            Your last {searches?.length ?? 0} searches
          </p>
        </div>
      </div>

      {searches && searches.length > 0 ? (
        <div className="space-y-2">
          {searches.map((search) => (
            <button
              key={search.id}
              onClick={() => onRepeat?.(search)}
              className="w-full flex items-center gap-3 p-3 bg-muted/50 hover:bg-muted rounded-lg transition-colors text-left group"
            >
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Search className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{search.query}</p>
                <p className="text-xs text-muted-foreground truncate">{search.location}</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5" />
                  <span>{search.result_count}</span>
                </div>
                <span className="text-xs">
                  {formatDistanceToNow(new Date(search.created_at), { addSuffix: true })}
                </span>
                <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No recent searches</p>
        </div>
      )}
    </Card>
  )
}
