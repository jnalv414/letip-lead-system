'use client';

import React from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Search,
  Users,
  RotateCcw,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { ScrapingProgress } from '@/features/map-scraping';

interface ScrapeProgressProps {
  progress: ScrapingProgress;
  onReset: () => void;
  className?: string;
}

const statusConfig = {
  idle: {
    icon: Search,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted/20',
    glowClass: '',
    label: 'Ready',
  },
  scraping: {
    icon: Loader2,
    color: 'text-primary',
    bgColor: 'bg-primary/20',
    glowClass: 'glow-pulse-purple',
    label: 'Scraping',
  },
  completed: {
    icon: CheckCircle2,
    color: 'text-highlight-emerald',
    bgColor: 'bg-highlight-emerald/20',
    glowClass: 'glow-success',
    label: 'Completed',
  },
  failed: {
    icon: XCircle,
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
    glowClass: 'glow-error',
    label: 'Failed',
  },
};

export function ScrapeProgress({ progress, onReset, className }: ScrapeProgressProps) {
  if (progress.status === 'idle') {
    return null;
  }

  const config = statusConfig[progress.status];
  const StatusIcon = config.icon;
  const isActive = progress.status === 'scraping';
  const isComplete = progress.status === 'completed';
  const isFailed = progress.status === 'failed';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className={className}
      >
        <Card className={cn(
          'glass-card-premium rounded-2xl overflow-hidden',
          isComplete && 'border-highlight-emerald/30',
          isFailed && 'border-red-500/30',
          className
        )}>
          <CardContent className="pt-6">
            {/* Status Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <motion.div
                  className={cn('p-3 rounded-xl', config.bgColor, config.glowClass)}
                  animate={isActive ? { scale: [1, 1.05, 1] } : {}}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <StatusIcon
                    className={cn(
                      'h-6 w-6',
                      config.color,
                      isActive && 'animate-spin'
                    )}
                  />
                </motion.div>
                <div>
                  <p className={cn(
                    'font-semibold text-lg',
                    isComplete && 'gradient-text-glow',
                    isFailed && 'text-red-400',
                    isActive && 'text-foreground'
                  )}>
                    {config.label}
                  </p>
                  <p className="text-sm text-muted-foreground">{progress.message}</p>
                </div>
              </div>
              {progress.jobId && (
                <span className="text-xs text-muted-foreground font-mono px-2 py-1 rounded-md bg-background/30">
                  {progress.jobId.slice(0, 8)}...
                </span>
              )}
            </div>

            {/* Progress Bar with Glow */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-semibold text-foreground">{progress.progress}%</span>
              </div>
              <div
                role="progressbar"
                aria-valuenow={progress.progress}
                aria-valuemin={0}
                aria-valuemax={100}
                className="h-3 bg-background/30 rounded-full overflow-hidden border border-white/5"
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress.progress}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className={cn(
                    'h-full rounded-full relative progress-glow',
                    isComplete && 'bg-gradient-to-r from-highlight-emerald to-emerald-400',
                    isFailed && 'bg-gradient-to-r from-red-500 to-red-400',
                    isActive && 'bg-gradient-to-r from-primary via-accent-purple to-accent-blue'
                  )}
                >
                  {isActive && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                    />
                  )}
                </motion.div>
              </div>
            </div>

            {/* Stats with Inner Glow */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <motion.div
                className="p-4 rounded-xl bg-background/20 inner-glow border border-white/5"
                whileHover={{ scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                  <Search className="h-4 w-4 text-primary" />
                  <span>Found</span>
                </div>
                <p className="text-3xl font-bold gradient-text">{progress.found}</p>
              </motion.div>
              <motion.div
                className="p-4 rounded-xl bg-background/20 inner-glow border border-white/5"
                whileHover={{ scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                  <Users className="h-4 w-4 text-highlight-cyan" />
                  <span>Saved</span>
                </div>
                <p className="text-3xl font-bold gradient-text">{progress.saved}</p>
              </motion.div>
            </div>

            {/* Actions with Premium Styling */}
            {(isComplete || isFailed) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.3 }}
                className="flex items-center gap-3"
              >
                <motion.div
                  className="flex-1"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    variant="outline"
                    onClick={onReset}
                    className="w-full gap-2 h-11 border-white/10 hover:border-white/20 hover:bg-white/5"
                  >
                    <RotateCcw className="h-4 w-4" />
                    New Search
                  </Button>
                </motion.div>
                {isComplete && progress.found > 0 && (
                  <Link href="/leads" className="flex-1">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button className={cn(
                        'w-full gap-2 h-11',
                        'bg-gradient-to-r from-highlight-emerald to-emerald-500',
                        'hover:from-highlight-emerald/90 hover:to-emerald-500/90',
                        'shadow-lg shadow-highlight-emerald/25',
                        'btn-shimmer'
                      )}>
                        <Sparkles className="h-4 w-4" />
                        View Leads
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  </Link>
                )}
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}

export default ScrapeProgress;
