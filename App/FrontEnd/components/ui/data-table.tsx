'use client';

import { ReactNode, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronUp, ChevronDown, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Column<T> {
  key: keyof T | string;
  header: string;
  sortable?: boolean;
  render?: (row: T, index: number) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  className?: string;
  onRowClick?: (row: T) => void;
}

export function DataTable<T extends object>({
  data,
  columns,
  className,
  onRowClick,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortKey) return 0;
    const aVal = (a as Record<string, unknown>)[sortKey];
    const bVal = (b as Record<string, unknown>)[sortKey];

    // Handle null/undefined values
    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return 1;
    if (bVal == null) return -1;

    // Type-safe comparison
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortDirection === 'asc'
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }

    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    }

    // Default comparison for other types
    const aStr = String(aVal);
    const bStr = String(bVal);
    return sortDirection === 'asc'
      ? aStr.localeCompare(bStr)
      : bStr.localeCompare(aStr);
  });

  return (
    <div className={cn('overflow-x-auto rounded-lg border border-[var(--border-default)]', className)}>
      <table className="w-full">
        <thead>
          <tr className="bg-white/5 border-b border-[var(--border-default)]">
            {columns.map((column) => (
              <th
                key={String(column.key)}
                onClick={() => column.sortable && handleSort(String(column.key))}
                className={cn(
                  'px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider',
                  column.sortable && 'cursor-pointer hover:text-[var(--text-secondary)]',
                  column.className
                )}
              >
                <div className="flex items-center gap-2">
                  {column.header}
                  {column.sortable && sortKey === String(column.key) && (
                    sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row, index) => (
            <motion.tr
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onRowClick?.(row)}
              className={cn(
                'border-b border-[var(--border-subtle)] last:border-b-0',
                'transition-colors hover:bg-white/5',
                onRowClick && 'cursor-pointer'
              )}
            >
              {columns.map((column) => (
                <td
                  key={String(column.key)}
                  className={cn('px-4 py-4 text-sm text-[var(--text-secondary)]', column.className)}
                >
                  {column.render
                    ? column.render(row, index)
                    : String((row as Record<string, unknown>)[String(column.key)] ?? '')}
                </td>
              ))}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface RankCellProps {
  rank: number;
}

export function RankCell({ rank }: RankCellProps) {
  return (
    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/20 to-blue-500/20 flex items-center justify-center">
      <span className="text-sm font-semibold text-violet-400">#{rank}</span>
    </div>
  );
}
