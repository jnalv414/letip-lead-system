'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Search,
  FileText,
  Inbox,
  FolderOpen,
  AlertCircle,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type IconName = 'users' | 'search' | 'file' | 'inbox' | 'folder' | 'alert';
type EmptyStateVariant = 'default' | 'search' | 'not-found' | 'error';

const iconMap: Record<IconName, LucideIcon> = {
  users: Users,
  search: Search,
  file: FileText,
  inbox: Inbox,
  folder: FolderOpen,
  alert: AlertCircle,
};

interface EmptyStateAction {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
}

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: IconName;
  action?: EmptyStateAction;
  variant?: EmptyStateVariant;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon = 'inbox',
  action,
  variant = 'default',
  className,
}: EmptyStateProps) {
  const Icon = iconMap[icon];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn(
        'empty-state flex flex-col items-center justify-center py-16 px-8 text-center',
        'rounded-xl border border-dashed border-border/50',
        'bg-card/30 backdrop-blur-sm',
        variant === 'error' && 'border-destructive/50 bg-destructive/5',
        className
      )}
    >
      <div
        className={cn(
          'mb-4 rounded-full p-4',
          'bg-muted/50',
          variant === 'error' && 'bg-destructive/10'
        )}
        data-testid="empty-state-icon"
      >
        <Icon
          className={cn(
            'h-8 w-8 text-muted-foreground',
            variant === 'error' && 'text-destructive'
          )}
        />
      </div>

      <h3 className="text-lg font-semibold text-foreground">{title}</h3>

      {description && (
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          {description}
        </p>
      )}

      {action && (
        <Button
          onClick={action.onClick}
          variant={action.variant || 'default'}
          className="mt-6"
        >
          {action.label}
        </Button>
      )}
    </motion.div>
  );
}

export default EmptyState;
