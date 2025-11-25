'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface BentoGridProps {
  children: ReactNode;
  className?: string;
}

export function BentoGrid({ children, className }: BentoGridProps) {
  return (
    <div
      className={cn(
        'grid auto-rows-[minmax(180px,auto)] gap-4',
        'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
        className
      )}
    >
      {children}
    </div>
  );
}

interface BentoGridItemProps {
  children: ReactNode;
  className?: string;
  colSpan?: 1 | 2 | 3 | 4;
  rowSpan?: 1 | 2;
}

export function BentoGridItem({
  children,
  className,
  colSpan = 1,
  rowSpan = 1,
}: BentoGridItemProps) {
  const colSpanClasses = {
    1: 'col-span-1',
    2: 'sm:col-span-2',
    3: 'sm:col-span-2 lg:col-span-3',
    4: 'sm:col-span-2 lg:col-span-3 xl:col-span-4',
  };

  const rowSpanClasses = {
    1: 'row-span-1',
    2: 'row-span-2',
  };

  return (
    <div
      className={cn(
        'rounded-lg bg-[var(--bg-card)] border border-[var(--border-default)]',
        'p-6 transition-all duration-300',
        'hover:border-violet-500/30 hover:shadow-lg hover:shadow-violet-500/5',
        colSpanClasses[colSpan],
        rowSpanClasses[rowSpan],
        className
      )}
    >
      {children}
    </div>
  );
}
