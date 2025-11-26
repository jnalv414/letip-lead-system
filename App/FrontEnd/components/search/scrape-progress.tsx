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
    label: 'Ready',
  },
  scraping: {
    icon: Loader2,
    color: 'text-primary',
    bgColor: 'bg-primary/20',
    label: 'Scraping',
  },
  completed: {
    icon: CheckCircle2,
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
    label: 'Completed',
  },
  failed: {
    icon: XCircle,
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
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
        transition={{ duration: 0.3 }}
        className={className}
      >
        <Card className={cn('bg-card/50 backdrop-blur-sm border-border/50', className)}>
          <CardContent className="pt-6">
            {/* Status Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={cn('p-2 rounded-lg', config.bgColor)}>
                  <StatusIcon
                    className={cn(
                      'h-5 w-5',
                      config.color,
                      isActive && 'animate-spin'
                    )}
                  />
                </div>
                <div>
                  <p className="font-medium text-foreground">{config.label}</p>
                  <p className="text-sm text-muted-foreground">{progress.message}</p>
                </div>
              </div>
              {progress.jobId && (
                <span className="text-xs text-muted-foreground font-mono">
                  {progress.jobId.slice(0, 8)}...
                </span>
              )}
            </div>

            {/* Progress Bar */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium text-foreground">{progress.progress}%</span>
              </div>
              <div
                role="progressbar"
                aria-valuenow={progress.progress}
                aria-valuemin={0}
                aria-valuemax={100}
                className="h-2 bg-background/50 rounded-full overflow-hidden"
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress.progress}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className={cn(
                    'h-full rounded-full',
                    isComplete && 'bg-green-500',
                    isFailed && 'bg-red-500',
                    isActive && 'bg-primary'
                  )}
                />
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-3 rounded-lg bg-background/30">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  <Search className="h-4 w-4" />
                  <span>Found</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{progress.found}</p>
              </div>
              <div className="p-3 rounded-lg bg-background/30">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  <Users className="h-4 w-4" />
                  <span>Saved</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{progress.saved}</p>
              </div>
            </div>

            {/* Actions */}
            {(isComplete || isFailed) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex items-center gap-3"
              >
                <Button
                  variant="outline"
                  onClick={onReset}
                  className="flex-1 gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  New Search
                </Button>
                {isComplete && progress.found > 0 && (
                  <Link href="/leads" className="flex-1">
                    <Button className="w-full gap-2">
                      View Leads
                      <ArrowRight className="h-4 w-4" />
                    </Button>
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
