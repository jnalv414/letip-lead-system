'use client'

import { formatDistanceToNow } from 'date-fns'
import { Mail, Linkedin, MessageSquare, CheckCircle, XCircle, Clock, Send, Eye, MousePointer, AlertTriangle, Inbox } from 'lucide-react'
import { Card } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Skeleton } from '@/shared/components/ui/skeleton'
import type { PaginatedResponse } from '@/shared/types'
import type { OutreachHistoryItem } from '../types'

interface MessageHistoryProps {
  history: PaginatedResponse<OutreachHistoryItem> | undefined
  isLoading?: boolean
  page: number
  onPageChange: (page: number) => void
}

export function MessageHistory({
  history,
  isLoading,
  page,
  onPageChange,
}: MessageHistoryProps) {
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
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      </Card>
    )
  }

  const totalPages = history ? Math.ceil(history.total / history.pageSize) : 1

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email':
        return Mail
      case 'linkedin':
        return Linkedin
      case 'sms':
        return MessageSquare
      default:
        return Send
    }
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'sent':
        return { icon: Send, color: 'text-blue-400', bg: 'bg-blue-500/20', label: 'Sent' }
      case 'delivered':
        return { icon: Inbox, color: 'text-emerald-400', bg: 'bg-emerald-500/20', label: 'Delivered' }
      case 'opened':
        return { icon: Eye, color: 'text-amber-400', bg: 'bg-amber-500/20', label: 'Opened' }
      case 'clicked':
        return { icon: MousePointer, color: 'text-purple-400', bg: 'bg-purple-500/20', label: 'Clicked' }
      case 'bounced':
        return { icon: AlertTriangle, color: 'text-orange-400', bg: 'bg-orange-500/20', label: 'Bounced' }
      case 'failed':
        return { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/20', label: 'Failed' }
      case 'spam':
        return { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/20', label: 'Spam' }
      case 'unsubscribed':
        return { icon: XCircle, color: 'text-gray-400', bg: 'bg-gray-500/20', label: 'Unsubscribed' }
      case 'generated':
      case 'draft':
        return { icon: Clock, color: 'text-gray-400', bg: 'bg-gray-500/20', label: 'Draft' }
      case 'pending':
        return { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/20', label: 'Pending' }
      default:
        return { icon: Send, color: 'text-blue-400', bg: 'bg-blue-500/20', label: status }
    }
  }

  return (
    <Card variant="glass" className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
          <Send className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Message History</h2>
          <p className="text-sm text-muted-foreground">
            {history?.total ?? 0} messages sent
          </p>
        </div>
      </div>

      {history?.data && history.data.length > 0 ? (
        <>
          <div className="space-y-3">
            {history.data.map((item) => {
              const TypeIcon = getTypeIcon(item.message_type)
              const statusConfig = getStatusConfig(item.status)
              const StatusIcon = statusConfig.icon

              return (
                <div
                  key={item.id}
                  className="p-4 bg-muted/50 rounded-lg space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`h-8 w-8 rounded-lg ${statusConfig.bg} flex items-center justify-center`}>
                        <TypeIcon className={`h-4 w-4 ${statusConfig.color}`} />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {item.business?.name ?? 'Unknown Business'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.contact?.email ?? 'No contact'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusIcon className={`h-4 w-4 ${statusConfig.color}`} />
                      <Badge variant={
                        ['delivered', 'opened', 'clicked'].includes(item.status) ? 'enriched' :
                        ['failed', 'bounced', 'spam'].includes(item.status) ? 'failed' :
                        item.status === 'sent' ? 'default' :
                        'pending'
                      }>
                        {statusConfig.label}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {item.content}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                  </p>
                </div>
              )
            })}
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
          <Send className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No messages sent yet</p>
        </div>
      )}
    </Card>
  )
}
