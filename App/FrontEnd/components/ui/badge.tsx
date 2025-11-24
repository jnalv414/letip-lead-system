/**
 * Badge Component
 *
 * Small pill badges following 60/30/10 color rule:
 * - Orange variant: Primary accent (10% rule)
 * - Teal variant: Secondary (30% rule)
 * - Charcoal variant: Neutral background (60% rule)
 *
 * Usage:
 * <Badge variant="orange">New</Badge>
 * <Badge variant="teal">Active</Badge>
 * <Badge variant="success">+12%</Badge>
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { useKeyboardClick } from '@/hooks/use-keyboard-click';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition-all duration-200',
  {
    variants: {
      variant: {
        // Primary accent (10% rule)
        orange: 'bg-orange/20 text-orange border border-orange/40 hover:bg-orange/30',

        // Secondary (30% rule)
        teal: 'bg-teal-light/20 text-teal-lighter border border-teal-light/40 hover:bg-teal-light/30',

        // Neutral (60% rule)
        charcoal: 'bg-charcoal-light text-gray-300 border border-gray-700 hover:bg-charcoal',

        // Status badges
        success: 'bg-green-500/20 text-green-400 border border-green-500/40 hover:bg-green-500/30',
        warning: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 hover:bg-yellow-500/30',
        error: 'bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30',
        info: 'bg-blue-500/20 text-blue-400 border border-blue-500/40 hover:bg-blue-500/30',

        // Outline variants
        outline: 'border border-orange/40 text-orange bg-transparent hover:bg-orange/10',
        outlineTeal: 'border border-teal-light/40 text-teal-lighter bg-transparent hover:bg-teal-light/10',
      },
      size: {
        sm: 'px-2 py-0.5 text-[10px]',
        md: 'px-3 py-1 text-xs',
        lg: 'px-4 py-1.5 text-sm',
      },
    },
    defaultVariants: {
      variant: 'orange',
      size: 'md',
    },
  }
);

export interface BadgeProps extends VariantProps<typeof badgeVariants> {
  as?: React.ElementType;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  onClick?: React.MouseEventHandler;
  [key: string]: any; // Allow any HTML attributes
}

function Badge({
  as: Component = 'div',
  className,
  variant,
  size,
  icon,
  children,
  onClick,
  ...props
}: BadgeProps) {
  const handleKeyDown = useKeyboardClick(onClick);

  return (
    <Component
      className={cn(badgeVariants({ variant, size }), className)}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      {...props}
    >
      {icon && <span className="inline-flex items-center">{icon}</span>}
      {children}
    </Component>
  );
}

export { Badge, badgeVariants };

// Pre-built badge components for common use cases
export const TrendBadge = ({ value, ...props }: { value: string } & Omit<BadgeProps, 'children'>) => {
  const isPositive = value.startsWith('+');
  const isNegative = value.startsWith('-');

  return (
    <Badge
      variant={isPositive ? 'success' : isNegative ? 'error' : 'charcoal'}
      icon={
        isPositive ? (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        ) : isNegative ? (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
          </svg>
        ) : null
      }
      {...props}
    >
      {value}
    </Badge>
  );
};

export const StatusBadge = ({
  status,
  ...props
}: {
  status: 'pending' | 'enriched' | 'failed' | 'active' | 'inactive'
} & Omit<BadgeProps, 'children' | 'variant'>) => {
  const statusConfig = {
    pending: { variant: 'warning' as const, label: 'Pending' },
    enriched: { variant: 'success' as const, label: 'Enriched' },
    failed: { variant: 'error' as const, label: 'Failed' },
    active: { variant: 'teal' as const, label: 'Active' },
    inactive: { variant: 'charcoal' as const, label: 'Inactive' },
  };

  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} {...props}>
      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      {config.label}
    </Badge>
  );
};
