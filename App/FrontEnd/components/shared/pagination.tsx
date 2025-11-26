'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showFirstLast?: boolean;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  showFirstLast = true,
  className,
}: PaginationProps) {
  const hasPrevPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;

  const handlePrevious = () => {
    if (hasPrevPage) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (hasNextPage) {
      onPageChange(currentPage + 1);
    }
  };

  const handleFirst = () => {
    onPageChange(1);
  };

  const handleLast = () => {
    onPageChange(totalPages);
  };

  // Generate page numbers to display
  const getPageNumbers = (): (number | 'ellipsis')[] => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage > 3) {
        pages.push('ellipsis');
      }

      // Show pages around current
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('ellipsis');
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn('flex items-center justify-center gap-2', className)}
      data-testid="pagination"
    >
      {/* First Page */}
      {showFirstLast && (
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleFirst}
            disabled={!hasPrevPage}
            className="h-9 w-9 rounded-lg border border-white/10 hover:border-violet-500/30 hover:bg-white/5 disabled:opacity-40 transition-all duration-300"
            aria-label="First page"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
        </motion.div>
      )}

      {/* Previous */}
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePrevious}
          disabled={!hasPrevPage}
          className="h-9 w-9 rounded-lg border border-white/10 hover:border-violet-500/30 hover:bg-white/5 disabled:opacity-40 transition-all duration-300"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </motion.div>

      {/* Page Numbers */}
      <div className="flex items-center gap-1.5 mx-2">
        {getPageNumbers().map((page, index) =>
          page === 'ellipsis' ? (
            <span
              key={`ellipsis-${index}`}
              className="px-2 text-slate-500"
            >
              ...
            </span>
          ) : (
            <motion.div
              key={page}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant={currentPage === page ? 'default' : 'ghost'}
                size="icon"
                onClick={() => onPageChange(page)}
                className={cn(
                  'h-9 w-9 rounded-lg transition-all duration-300',
                  currentPage === page
                    ? 'bg-gradient-to-br from-violet-500 to-indigo-600 text-white glow-pulse-purple border-0'
                    : 'border border-white/10 hover:border-violet-500/30 hover:bg-white/5 text-slate-300'
                )}
                aria-label={`Page ${page}`}
                aria-current={currentPage === page ? 'page' : undefined}
              >
                {page}
              </Button>
            </motion.div>
          )
        )}
      </div>

      {/* Next */}
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleNext}
          disabled={!hasNextPage}
          className="h-9 w-9 rounded-lg border border-white/10 hover:border-violet-500/30 hover:bg-white/5 disabled:opacity-40 transition-all duration-300"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </motion.div>

      {/* Last Page */}
      {showFirstLast && (
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLast}
            disabled={!hasNextPage}
            className="h-9 w-9 rounded-lg border border-white/10 hover:border-violet-500/30 hover:bg-white/5 disabled:opacity-40 transition-all duration-300"
            aria-label="Last page"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </motion.div>
      )}

      {/* Page Info - Enhanced styling */}
      <span className="ml-3 px-3 py-1.5 text-sm text-slate-400 bg-white/5 rounded-lg border border-white/10">
        Page <span className="text-white font-medium">{currentPage}</span> of{' '}
        <span className="text-white font-medium">{totalPages}</span>
      </span>
    </motion.div>
  );
}

export default Pagination;
