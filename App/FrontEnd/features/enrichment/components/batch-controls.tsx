'use client'

import { Play, Pause, Sparkles, AlertCircle } from 'lucide-react'
import { Card } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'

interface BatchControlsProps {
  pendingCount: number
  isQueuePaused?: boolean
  onBatchEnrich: () => void
  onPauseQueue: () => void
  onResumeQueue: () => void
  isBatchEnriching?: boolean
  isPausing?: boolean
  isResuming?: boolean
}

export function BatchControls({
  pendingCount,
  isQueuePaused = false,
  onBatchEnrich,
  onPauseQueue,
  onResumeQueue,
  isBatchEnriching,
  isPausing,
  isResuming,
}: BatchControlsProps) {
  return (
    <Card variant="glass" className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Batch Controls</h2>
          <p className="text-sm text-muted-foreground">
            Manage enrichment queue processing
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Batch enrich all pending */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div>
            <p className="font-medium text-foreground">Enrich All Pending</p>
            <p className="text-sm text-muted-foreground">
              Process {pendingCount} businesses in queue
            </p>
          </div>
          <Button
            onClick={onBatchEnrich}
            isLoading={isBatchEnriching}
            disabled={pendingCount === 0 || isBatchEnriching}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Start Batch
          </Button>
        </div>

        {/* Queue controls */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div>
            <p className="font-medium text-foreground">Queue Processing</p>
            <p className="text-sm text-muted-foreground">
              {isQueuePaused ? 'Queue is paused' : 'Queue is active'}
            </p>
          </div>
          {isQueuePaused ? (
            <Button
              variant="outline"
              onClick={onResumeQueue}
              isLoading={isResuming}
            >
              <Play className="h-4 w-4 mr-2" />
              Resume
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={onPauseQueue}
              isLoading={isPausing}
            >
              <Pause className="h-4 w-4 mr-2" />
              Pause
            </Button>
          )}
        </div>

        {/* Info */}
        <div className="flex items-start gap-2 p-3 bg-blue-500/10 rounded-lg">
          <AlertCircle className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-blue-400">
            Enrichment uses external APIs and may take time. Each business will be
            processed to find contact information, social profiles, and company details.
          </p>
        </div>
      </div>
    </Card>
  )
}
