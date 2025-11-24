/**
 * Dashboard Analytics Feature Types
 */

import type { Stats } from '@/core/types/global.types';

export type { Stats };

// Individual stat card configuration
export interface StatCardConfig {
  label: string;
  value: number;
  icon?: string;
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}
