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
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.95 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={cn(
          'fixed bottom-6 left-1/2 -translate-x-1/2 z-50',
          'flex items-center gap-5 px-6 py-4 rounded-2xl',
          'glass-card-premium',
          'shadow-2xl',
          className
        )}
        style={{
          boxShadow: '0 20px 60px rgba(139, 92, 246, 0.25), 0 0 0 1px rgba(139, 92, 246, 0.2)',
        }}
      >
        {/* Selection count - Enhanced with glow */}
        <div className="flex items-center gap-3 pr-5 border-r border-white/10">
          <motion.div
            className="flex items-center justify-center h-8 w-8 rounded-lg text-white text-sm font-semibold glow-pulse-purple"
            style={{
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.4) 0%, rgba(99, 102, 241, 0.3) 100%)',
            }}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {selectedCount}
          </motion.div>
          <span className="text-sm text-slate-400 font-medium">selected</span>
        </div>

        {/* Actions - Enhanced buttons */}
        <div className="flex items-center gap-3">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="outline"
              size="sm"
              onClick={onEnrich}
              disabled={isLoading}
              className="gap-2 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-all duration-300 btn-shimmer"
            >
              <Sparkles className="h-4 w-4" />
              Enrich
            </Button>
          </motion.div>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="destructive"
              size="sm"
              onClick={onDelete}
              disabled={isLoading}
              className="gap-2 bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 hover:border-red-500/50 transition-all duration-300"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </motion.div>
        </div>

        {/* Clear selection - Enhanced close button */}
        <motion.div whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }}>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClearSelection}
            className="h-8 w-8 ml-2 rounded-lg border border-white/10 hover:border-slate-500/30 hover:bg-white/5 text-slate-400 hover:text-white transition-all duration-300"
            aria-label="Clear selection"
          >
            <X className="h-4 w-4" />
          </Button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default BulkActionsBar;
