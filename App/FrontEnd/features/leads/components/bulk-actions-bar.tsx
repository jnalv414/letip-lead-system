'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Trash2, Sparkles, CheckSquare } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'

interface BulkActionsBarProps {
  selectedCount: number
  onClearSelection: () => void
  onBulkEnrich: () => void
  onBulkDelete: () => void
  isEnriching?: boolean
  isDeleting?: boolean
}

export function BulkActionsBar({
  selectedCount,
  onClearSelection,
  onBulkEnrich,
  onBulkDelete,
  isEnriching = false,
  isDeleting = false,
}: BulkActionsBarProps) {
  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="flex items-center gap-3 px-4 py-3 bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-2xl">
            <div className="flex items-center gap-2 pr-3 border-r border-border">
              <CheckSquare className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">
                {selectedCount} selected
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onBulkEnrich}
                isLoading={isEnriching}
                disabled={isEnriching || isDeleting}
              >
                <Sparkles className="h-4 w-4 mr-1.5" />
                Enrich
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={onBulkDelete}
                isLoading={isDeleting}
                disabled={isEnriching || isDeleting}
                className="text-destructive border-destructive/50 hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4 mr-1.5" />
                Delete
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={onClearSelection}
                className="ml-1"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
