'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { BusinessCard } from './business-card';
import { EmptyState } from '@/components/shared/empty-state';
import { CardSkeleton } from '@/components/shared/loading-skeleton';
import { cn } from '@/lib/utils';
import type { Business } from '@/types/api';

type ViewMode = 'grid' | 'table';

interface BusinessListProps {
  businesses: Business[];
  onBusinessClick?: (business: Business) => void;
  isLoading?: boolean;
  viewMode?: ViewMode;
  totalCount?: number;
  selectedIds?: number[];
  onSelectionChange?: (ids: number[]) => void;
  className?: string;
}

export function BusinessList({
  businesses,
  onBusinessClick,
  isLoading = false,
  viewMode = 'grid',
  totalCount,
  selectedIds = [],
  onSelectionChange,
  className,
}: BusinessListProps) {
  if (isLoading) {
    return (
      <div
        data-testid="business-list-skeleton"
        className={cn(
          viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
            : 'space-y-2',
          className
        )}
      >
        <CardSkeleton count={viewMode === 'grid' ? 6 : 5} />
      </div>
    );
  }

  if (businesses.length === 0) {
    return (
      <EmptyState
        title="No leads found"
        description="Start by searching Google Maps or adding leads manually."
        icon="users"
        action={{
          label: 'Search Google Maps',
          onClick: () => (window.location.href = '/search'),
        }}
      />
    );
  }

  const handleCardClick = (business: Business) => {
    onBusinessClick?.(business);
  };

  const handleSelect = (business: Business, isSelected: boolean) => {
    if (!onSelectionChange) return;

    if (isSelected) {
      onSelectionChange([...selectedIds, business.id]);
    } else {
      onSelectionChange(selectedIds.filter((id) => id !== business.id));
    }
  };

  const selectable = !!onSelectionChange;

  if (viewMode === 'table') {
    return (
      <div data-view="table" className={cn('glass-card-glow rounded-xl overflow-hidden', className)}>
        {/* Table Header - Enhanced */}
        <div className={cn(
          'grid gap-4 px-5 py-3 text-sm font-medium text-slate-400 border-b border-white/10 bg-white/[0.02]',
          selectable ? 'grid-cols-13' : 'grid-cols-12'
        )}>
          {selectable && <div className="col-span-1"></div>}
          <div className="col-span-4">Business</div>
          <div className="col-span-2">Location</div>
          <div className="col-span-2">Industry</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Contacts</div>
        </div>

        {/* Table Rows - Enhanced */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: 0.03 } },
          }}
        >
          {businesses.map((business) => (
            <motion.div
              key={business.id}
              variants={{
                hidden: { opacity: 0, x: -10 },
                visible: { opacity: 1, x: 0 },
              }}
              whileHover={{ backgroundColor: 'rgba(139, 92, 246, 0.05)' }}
              className={cn(
                'grid gap-4 px-5 py-4 items-center',
                selectable ? 'grid-cols-13' : 'grid-cols-12',
                'border-b border-white/5 cursor-pointer',
                'transition-all duration-200',
                selectedIds.includes(business.id) && 'bg-violet-500/10 border-violet-500/20'
              )}
              onClick={() => handleCardClick(business)}
            >
              {selectable && (
                <div className="col-span-1">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelect(business, !selectedIds.includes(business.id));
                    }}
                    className={cn(
                      'w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200',
                      selectedIds.includes(business.id)
                        ? 'bg-violet-500 border-violet-500 glow-purple'
                        : 'border-white/20 hover:border-violet-500/50 hover:bg-violet-500/10'
                    )}
                    aria-label={selectedIds.includes(business.id) ? 'Deselect' : 'Select'}
                  >
                    {selectedIds.includes(business.id) && (
                      <Check className="h-3 w-3 text-white" />
                    )}
                  </motion.button>
                </div>
              )}
              <div className="col-span-4 font-medium text-white truncate">{business.name}</div>
              <div className="col-span-2 text-sm text-slate-400 truncate">
                {[business.city, business.state].filter(Boolean).join(', ') || '-'}
              </div>
              <div className="col-span-2 text-sm text-slate-400 truncate">
                {business.industry || '-'}
              </div>
              <div className="col-span-2">
                <span
                  className={cn(
                    'px-2.5 py-1 text-xs rounded-md capitalize font-medium',
                    business.enrichment_status === 'enriched' &&
                      'bg-emerald-500/20 text-emerald-400 glow-success',
                    business.enrichment_status === 'pending' &&
                      'bg-amber-500/20 text-amber-400 glow-warning',
                    business.enrichment_status === 'failed' &&
                      'bg-red-500/20 text-red-400 glow-error'
                  )}
                >
                  {business.enrichment_status}
                </span>
              </div>
              <div className="col-span-2 text-sm text-slate-400">
                {business._count?.contacts || 0}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {totalCount && (
          <div className="px-5 py-3 text-sm text-slate-500 border-t border-white/5 bg-white/[0.02]">
            Showing <span className="text-slate-300">{businesses.length}</span> of{' '}
            <span className="text-slate-300">{totalCount}</span> leads
          </div>
        )}
      </div>
    );
  }

  // Grid View - Enhanced
  return (
    <div data-view="grid" className={className}>
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
        initial="hidden"
        animate="visible"
        variants={{
          visible: { transition: { staggerChildren: 0.06 } },
        }}
      >
        {businesses.map((business) => (
          <motion.div
            key={business.id}
            variants={{
              hidden: { opacity: 0, y: 20, scale: 0.95 },
              visible: { opacity: 1, y: 0, scale: 1 },
            }}
          >
            <BusinessCard
              business={business}
              onClick={handleCardClick}
              onSelect={handleSelect}
              selected={selectedIds.includes(business.id)}
              selectable={selectable}
            />
          </motion.div>
        ))}
      </motion.div>

      {totalCount && (
        <div className="mt-6 text-sm text-slate-500 text-center">
          Showing <span className="text-slate-300 font-medium">{businesses.length}</span> of{' '}
          <span className="text-slate-300 font-medium">{totalCount}</span> leads
        </div>
      )}
    </div>
  );
}

export default BusinessList;
