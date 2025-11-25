'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BulkActionsBarProps {
  selectedCount: number;
  onDelete: () => void;
  onEnrich: () => void;
  onClearSelection: () => void;
  isLoading?: boolean;
  className?: string;
}

export function BulkActionsBar({
  selectedCount,
  onDelete,
  onEnrich,
  onClearSelection,
  isLoading = false,
  className,
}: BulkActionsBarProps) {
  if (selectedCount === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        data-testid="bulk-actions-bar"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.2 }}
        className={cn(
          'fixed bottom-6 left-1/2 -translate-x-1/2 z-50',
          'flex items-center gap-4 px-6 py-3 rounded-xl',
          'bg-card/95 backdrop-blur-lg border border-border/50',
          'shadow-lg shadow-black/20',
          className
        )}
      >
        {/* Selection count */}
        <div className="flex items-center gap-2 pr-4 border-r border-border/50">
          <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/20 text-primary text-sm font-medium">
            {selectedCount}
          </div>
          <span className="text-sm text-muted-foreground">selected</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onEnrich}
            disabled={isLoading}
            className="gap-2"
          >
            <Sparkles className="h-4 w-4" />
            Enrich
          </Button>

          <Button
            variant="destructive"
            size="sm"
            onClick={onDelete}
            disabled={isLoading}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>

        {/* Clear selection */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onClearSelection}
          className="h-8 w-8 ml-2"
          aria-label="Clear selection"
        >
          <X className="h-4 w-4" />
        </Button>
      </motion.div>
    </AnimatePresence>
  );
}

export default BulkActionsBar;
