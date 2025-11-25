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
      transition={{ duration: 0.2 }}
      className={cn(
        'flex flex-wrap items-center gap-3 p-4 rounded-lg',
        'bg-card/50 backdrop-blur-sm border border-border/50',
        className
      )}
      data-testid="filter-bar"
    >
      {/* Search Input */}
      {searchable && (
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            placeholder={searchPlaceholder}
            value={searchInput}
            onChange={handleSearchChange}
            className={cn(
              'flex h-10 w-full rounded-md border border-border/50 bg-background/50',
              'pl-9 pr-3 py-2 text-sm text-foreground',
              'placeholder:text-muted-foreground',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
              'transition-colors duration-200'
            )}
            aria-label="Search"
          />
        </div>
      )}

      {/* Filter Controls */}
      {filters
        .filter((f) => f.type === 'select')
        .map((filter) => (
          <select
            key={filter.key}
            value={values[filter.key] || ''}
            onChange={(e) => handleSelectChange(filter.key, e.target.value)}
            className={cn(
              'h-10 rounded-md border border-border/50 bg-background/50',
              'px-3 py-2 text-sm text-foreground',
              'focus:outline-none focus:ring-2 focus:ring-primary/50',
              'min-w-[150px]'
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

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearFilters}
          className="gap-1 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
          Clear
        </Button>
      )}
    </motion.div>
  );
}

export default FilterBar;
