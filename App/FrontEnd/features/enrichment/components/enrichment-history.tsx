'use client'

import { formatDistanceToNow } from 'date-fns'
import { CheckCircle, XCircle, RefreshCw, ExternalLink } from 'lucide-react'
import { Card } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Skeleton } from '@/shared/components/ui/skeleton'
import type { EnrichmentLog, PaginatedResponse } from '@/shared/types'

interface EnrichmentHistoryProps {
  history: PaginatedResponse<EnrichmentLog> | undefined
  isLoading?: boolean
  onRetry?: (businessId: string) => void
  onViewBusiness?: (businessId: string) => void
  isRetrying?: boolean
  page: number
  onPageChange: (page: number) => void
}

export function EnrichmentHistory({
  history,
  isLoading,
  onRetry,
  onViewBusiness,
  isRetrying,
  page,
  onPageChange,
}: EnrichmentHistoryProps) {
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
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      </Card>
    )
  }

  const totalPages = history ? Math.ceil(history.total / history.pageSize) : 1

  return (
    <Card variant="glass" className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
          <RefreshCw className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Enrichment History</h2>
          <p className="text-sm text-muted-foreground">
            {history?.total ?? 0} enrichment attempts
          </p>
        </div>
      </div>

      {history?.data && history.data.length > 0 ? (
        <>
          <div className="space-y-2">
            {history.data.map((log) => (
              <div
                key={log.id}
                className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
              >
                <div
                  className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    log.status === 'success'
                      ? 'bg-emerald-500/20'
                      : 'bg-red-500/20'
                  }`}
                >
                  {log.status === 'success' ? (
                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant={log.status === 'success' ? 'enriched' : 'failed'}>
                      {log.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      via {log.source}
                    </span>
                  </div>
                  {log.error_message && (
                    <p className="text-xs text-destructive mt-1 truncate">
                      {log.error_message}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {log.status === 'failed' && onRetry && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRetry(log.business_id)}
                      disabled={isRetrying}
                      className="h-8 w-8 p-0"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  )}
                  {onViewBusiness && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewBusiness(log.business_id)}
                      className="h-8 w-8 p-0"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(page - 1)}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground px-2">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(page + 1)}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <RefreshCw className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No enrichment history yet</p>
        </div>
      )}
    </Card>
  )
}
