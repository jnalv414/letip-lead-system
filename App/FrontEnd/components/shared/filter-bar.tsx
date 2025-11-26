'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/use-debounce';

interface FilterOption {
  value: string;
  label: string;
}

interface FilterConfig {
  key: string;
  label: string;
  type: 'select' | 'text' | 'search';
  options?: FilterOption[];
  placeholder?: string;
}

interface FilterValues {
  [key: string]: string;
}

interface FilterBarProps {
  filters: FilterConfig[];
  values?: FilterValues;
  onFilterChange: (values: FilterValues) => void;
  searchable?: boolean;
  searchPlaceholder?: string;
  className?: string;
}

export function FilterBar({
  filters,
  values = {},
  onFilterChange,
  searchable = false,
  searchPlaceholder = 'Search...',
  className,
}: FilterBarProps) {
  const [searchInput, setSearchInput] = useState(values.search || '');
  const debouncedSearch = useDebounce(searchInput, 300);

  // Update parent when debounced search changes
  useEffect(() => {
    if (searchable && debouncedSearch !== values.search) {
      onFilterChange({ ...values, search: debouncedSearch });
    }
  }, [debouncedSearch, searchable]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  }, []);

  const handleSelectChange = useCallback(
    (key: string, value: string) => {
      onFilterChange({ ...values, [key]: value });
    },
    [values, onFilterChange]
  );

  const handleClearFilters = useCallback(() => {
    setSearchInput('');
    onFilterChange({});
  }, [onFilterChange]);

  const hasActiveFilters = Object.values(values).some((v) => v && v.length > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn(
        'flex flex-wrap items-center gap-4 p-4 rounded-xl',
        'glass-card-glow inner-glow',
        className
      )}
      data-testid="filter-bar"
    >
      {/* Search Input - Enhanced with focus glow */}
      {searchable && (
        <div className="relative flex-1 min-w-[200px] group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-violet-400 transition-colors" />
          <input
            type="search"
            placeholder={searchPlaceholder}
            value={searchInput}
            onChange={handleSearchChange}
            className={cn(
              'flex h-11 w-full rounded-lg border border-white/10 bg-white/5',
              'pl-10 pr-4 py-2 text-sm text-white',
              'placeholder:text-slate-500',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 focus-visible:border-violet-500/40',
              'hover:border-white/20 hover:bg-white/[0.07]',
              'transition-all duration-300'
            )}
            aria-label="Search"
          />
        </div>
      )}

      {/* Filter Controls - Enhanced select styling */}
      {filters
        .filter((f) => f.type === 'select')
        .map((filter) => (
          <select
            key={filter.key}
            value={values[filter.key] || ''}
            onChange={(e) => handleSelectChange(filter.key, e.target.value)}
            className={cn(
              'h-11 rounded-lg border border-white/10 bg-white/5',
              'px-4 py-2 text-sm text-white',
              'focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/40',
              'hover:border-white/20 hover:bg-white/[0.07]',
              'min-w-[150px] cursor-pointer',
              'transition-all duration-300',
              '[&>option]:bg-slate-900 [&>option]:text-white'
            )}
            aria-label={filter.label}
          >
            <option value="">{filter.label}</option>
            {filter.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ))}

      {/* Clear Filters - Enhanced button */}
      {hasActiveFilters && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="gap-1.5 text-slate-400 hover:text-white hover:bg-red-500/20 border border-transparent hover:border-red-500/30 transition-all duration-300"
          >
            <X className="h-4 w-4" />
            Clear
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}

export default FilterBar;
