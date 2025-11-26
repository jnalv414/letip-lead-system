'use client';

import React from 'react';
import { cn } from '@/lib/utils';

type SkeletonVariant = 'default' | 'rounded' | 'circle';

interface LoadingSkeletonProps {
  width?: string;
  height?: string;
  count?: number;
  variant?: SkeletonVariant;
  className?: string;
}

export function LoadingSkeleton({
  width,
  height = '1rem',
  count = 1,
  variant = 'default',
  className,
}: LoadingSkeletonProps) {
  const skeletons = Array.from({ length: count }, (_, i) => i);

  return (
    <>
      {skeletons.map((index) => (
        <div
          key={index}
          data-testid="loading-skeleton"
          className={cn(
            'shimmer bg-white/5',
            variant === 'default' && 'rounded',
            variant === 'rounded' && 'rounded-lg',
            variant === 'circle' && 'rounded-full',
            className
          )}
          style={{ width, height }}
        />
      ))}
    </>
  );
}

interface CardSkeletonProps {
  count?: number;
  className?: string;
}

export function CardSkeleton({ count = 1, className }: CardSkeletonProps) {
  const cards = Array.from({ length: count }, (_, i) => i);

  return (
    <>
      {cards.map((index) => (
        <div
          key={index}
          data-testid="card-skeleton"
          className={cn(
            'rounded-2xl border border-white/10 glass-card-premium p-5 space-y-4',
            className
          )}
        >
          <div className="flex items-center gap-3">
            <LoadingSkeleton variant="circle" width="40px" height="40px" />
            <div className="flex-1 space-y-2">
              <LoadingSkeleton width="60%" height="1rem" />
              <LoadingSkeleton width="40%" height="0.75rem" />
            </div>
          </div>
          <LoadingSkeleton width="100%" height="0.75rem" />
          <LoadingSkeleton width="80%" height="0.75rem" />
          <div className="flex gap-2 pt-2 border-t border-white/5">
            <LoadingSkeleton variant="rounded" width="60px" height="24px" />
            <LoadingSkeleton variant="rounded" width="60px" height="24px" />
          </div>
        </div>
      ))}
    </>
  );
}

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export function TableSkeleton({
  rows = 5,
  columns = 4,
  className,
}: TableSkeletonProps) {
  const rowItems = Array.from({ length: rows }, (_, i) => i);

  return (
    <div
      data-testid="table-skeleton"
      className={cn('rounded-xl border border-white/10 glass-card-glow', className)}
    >
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b border-white/10">
        {Array.from({ length: columns }, (_, i) => (
          <LoadingSkeleton key={i} width={`${100 / columns}%`} height="1rem" />
        ))}
      </div>

      {/* Rows */}
      {rowItems.map((index) => (
        <div
          key={index}
          data-testid="table-row-skeleton"
          className="flex items-center gap-4 p-4 border-b border-white/5 last:border-b-0"
        >
          {Array.from({ length: columns }, (_, i) => (
            <LoadingSkeleton
              key={i}
              width={`${100 / columns}%`}
              height="0.875rem"
            />
          ))}
        </div>
      ))}
    </div>
  );
}

interface ListSkeletonProps {
  count?: number;
  className?: string;
}

export function ListSkeleton({ count = 5, className }: ListSkeletonProps) {
  const items = Array.from({ length: count }, (_, i) => i);

  return (
    <div className={cn('space-y-3', className)}>
      {items.map((index) => (
        <div
          key={index}
          data-testid="list-item-skeleton"
          className="flex items-center gap-3 p-4 rounded-xl border border-white/10 glass-card-glow"
        >
          <LoadingSkeleton variant="circle" width="32px" height="32px" />
          <div className="flex-1 space-y-2">
            <LoadingSkeleton width="70%" height="0.875rem" />
            <LoadingSkeleton width="50%" height="0.625rem" />
          </div>
          <LoadingSkeleton variant="rounded" width="48px" height="24px" />
        </div>
      ))}
    </div>
  );
}

export default LoadingSkeleton;
