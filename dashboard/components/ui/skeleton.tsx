/**
 * Skeleton Component
 *
 * Loading state placeholders following 60/30/10 color rule:
 * - Base: Charcoal light (#2A2A2E) - 60%
 * - Pulse: Teal tint - 30%
 * - Highlight: Orange glow - 10%
 *
 * Usage:
 * <Skeleton className="h-12 w-full" />
 * <Skeleton variant="teal" className="h-8 w-32" />
 * <Skeleton animated={false} /> // Disable animation
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'teal' | 'orange';
  animated?: boolean;
}

function Skeleton({
  className,
  variant = 'default',
  animated = true,
  ...props
}: SkeletonProps) {
  const variantClasses = {
    default: 'bg-charcoal-light',
    teal: 'bg-teal-light/20',
    orange: 'bg-orange/10',
  };

  const animationClasses = animated
    ? 'animate-pulse'
    : '';

  return (
    <div
      className={cn(
        'rounded-lg',
        variantClasses[variant],
        animationClasses,
        className
      )}
      {...props}
    />
  );
}

// Pre-built skeleton layouts for common patterns
const SkeletonCard = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn(
        'rounded-3xl bg-charcoal-light border border-orange/10 p-6 space-y-4',
        className
      )}
      {...props}
    >
      <div className="space-y-2">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-8 w-1/2" />
      </div>
      <Skeleton className="h-40 w-full" />
      <div className="flex gap-2">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-6 w-20" />
      </div>
    </div>
  );
};

const SkeletonTable = ({
  rows = 5,
  className,
  ...props
}: {
  rows?: number
} & React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className={cn('space-y-2', className)} {...props}>
      {/* Header */}
      <div className="flex gap-4 pb-2 border-b border-orange/10">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-28" />
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 py-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-28" />
        </div>
      ))}
    </div>
  );
};

const SkeletonChart = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className={cn('space-y-4', className)} {...props}>
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-6 w-12" />
          <Skeleton className="h-6 w-12" />
        </div>
      </div>

      {/* Chart bars */}
      <div className="flex items-end gap-2 h-40">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton
            key={i}
            className="flex-1"
            style={{ height: `${Math.random() * 60 + 40}%` }}
          />
        ))}
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-8" />
        ))}
      </div>
    </div>
  );
};

const SkeletonStats = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-4 gap-6', className)} {...props}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="rounded-3xl bg-charcoal-light border border-orange/10 p-6 space-y-3"
        >
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-3 w-16" />
        </div>
      ))}
    </div>
  );
};

export {
  Skeleton,
  SkeletonCard,
  SkeletonTable,
  SkeletonChart,
  SkeletonStats,
};
