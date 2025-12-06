'use client'

import { motion } from 'framer-motion'
import { Loader2, CheckCircle, XCircle, AlertCircle, Building2, X } from 'lucide-react'
import { Card } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import type { ScrapeJob, ScrapeProgress as ScrapeProgressType } from '../types'

interface ScrapeProgressProps {
  job: ScrapeJob | null
  progress: ScrapeProgressType | null
  onCancel?: () => void
  onViewResults?: () => void
  isCancelling?: boolean
}

export function ScrapeProgress({
  job,
  progress,
  onCancel,
  onViewResults,
  isCancelling,
}: ScrapeProgressProps) {
  // Use real-time progress if available, otherwise fall back to job data
  const currentProgress = progress?.progress ?? job?.progress ?? 0
  const total = progress?.total ?? job?.total ?? 0
  const found = progress?.found ?? job?.found ?? 0
  const errors = progress?.errors ?? job?.errors ?? 0
  const status = progress?.status ?? job?.status ?? 'pending'
  const message = progress?.message

  const percentage = total > 0 ? Math.round((currentProgress / total) * 100) : 0

  const statusConfig = {
    pending: {
      icon: Loader2,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/20',
      label: 'Initializing...',
    },
    running: {
      icon: Loader2,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
      label: 'Scraping...',
    },
    completed: {
      icon: CheckCircle,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/20',
      label: 'Completed',
    },
    failed: {
      icon: XCircle,
      color: 'text-red-400',
      bgColor: 'bg-red-500/20',
      label: 'Failed',
    },
  }

  const config = statusConfig[status]
  const Icon = config.icon

  if (!job && !progress) return null

  return (
    <Card variant="glass" className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-lg ${config.bgColor} flex items-center justify-center`}>
            <Icon
              className={`h-5 w-5 ${config.color} ${
                status === 'pending' || status === 'running' ? 'animate-spin' : ''
              }`}
            />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{config.label}</h3>
            <p className="text-sm text-muted-foreground">
              {job?.query} in {job?.location}
            </p>
          </div>
        </div>
        {(status === 'pending' || status === 'running') && onCancel && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            isLoading={isCancelling}
            className="text-muted-foreground hover:text-destructive"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium text-foreground">{percentage}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center p-3 bg-muted/50 rounded-lg">
          <div className="text-2xl font-bold text-foreground">{currentProgress}</div>
          <div className="text-xs text-muted-foreground">Processed</div>
        </div>
        <div className="text-center p-3 bg-emerald-500/10 rounded-lg">
          <div className="text-2xl font-bold text-emerald-400">{found}</div>
          <div className="text-xs text-muted-foreground">Found</div>
        </div>
        <div className="text-center p-3 bg-red-500/10 rounded-lg">
          <div className="text-2xl font-bold text-red-400">{errors}</div>
          <div className="text-xs text-muted-foreground">Errors</div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Actions */}
      {status === 'completed' && onViewResults && (
        <Button className="w-full mt-4" onClick={onViewResults}>
          <Building2 className="h-4 w-4 mr-2" />
          View {found} Results
        </Button>
      )}
    </Card>
  )
}
