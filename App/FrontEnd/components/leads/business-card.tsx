'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  MapPin,
  Phone,
  Globe,
  Building2,
  Users,
  Mail,
  Check,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Business } from '@/types/api';

interface BusinessCardProps {
  business: Business;
  onClick?: (business: Business) => void;
  onSelect?: (business: Business, selected: boolean) => void;
  selected?: boolean;
  selectable?: boolean;
  className?: string;
}

const statusColors: Record<string, { badge: string; glow: string }> = {
  enriched: {
    badge: 'bg-green-500/20 text-green-400 border-green-500/30',
    glow: 'glow-success',
  },
  pending: {
    badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    glow: 'glow-warning',
  },
  failed: {
    badge: 'bg-red-500/20 text-red-400 border-red-500/30',
    glow: 'glow-error',
  },
};

export function BusinessCard({
  business,
  onClick,
  onSelect,
  selected = false,
  selectable = false,
  className,
}: BusinessCardProps) {
  const contactCount = business._count?.contacts || 0;
  const location = [business.city, business.state].filter(Boolean).join(', ');

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect?.(business, !selected);
  };

  const statusConfig = statusColors[business.enrichment_status] || statusColors.pending;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      whileHover={{ y: -6, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card
        className={cn(
          'cursor-pointer transition-all duration-300',
          'glass-card-premium rounded-2xl',
          'hover:border-violet-500/40',
          selected && 'ring-2 ring-primary border-primary/50 glow-pulse-purple',
          className
        )}
        onClick={() => onClick?.(business)}
        data-testid="business-card"
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              {/* Selection Checkbox - Enhanced */}
              {selectable && (
                <motion.button
                  onClick={handleCheckboxClick}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    'flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200',
                    selected
                      ? 'bg-primary border-primary glow-purple'
                      : 'border-border/50 hover:border-primary/50 hover:bg-primary/10'
                  )}
                  aria-label={selected ? 'Deselect' : 'Select'}
                >
                  {selected && <Check className="h-3 w-3 text-primary-foreground" />}
                </motion.button>
              )}
              {/* Icon with gradient background */}
              <motion.div
                className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(99, 102, 241, 0.2) 100%)',
                }}
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <Building2 className="h-5 w-5 text-violet-400" />
              </motion.div>
              <div className="min-w-0">
                <h3 className="font-semibold text-white truncate">
                  {business.name}
                </h3>
                {location && (
                  <div className="flex items-center gap-1 text-sm text-slate-400">
                    <MapPin className="h-3 w-3 flex-shrink-0 text-slate-500" />
                    <span className="truncate">{location}</span>
                  </div>
                )}
              </div>
            </div>
            {/* Status Badge with Glow */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className={cn('rounded-md', statusConfig.glow)}
            >
              <Badge
                className={cn(
                  'flex-shrink-0 capitalize font-medium',
                  statusConfig.badge
                )}
              >
                {business.enrichment_status}
              </Badge>
            </motion.div>
          </div>
        </CardHeader>

        <CardContent className="pt-2 space-y-3">
          {/* Contact Info - Enhanced styling */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-400">
            {business.phone && (
              <div className="flex items-center gap-1.5 hover:text-white transition-colors">
                <Phone className="h-3 w-3 text-slate-500" />
                <span>{business.phone}</span>
              </div>
            )}
            {business.website && (
              <div className="flex items-center gap-1.5 hover:text-violet-400 transition-colors">
                <Globe className="h-3 w-3 text-slate-500" />
                <span className="truncate max-w-[120px]">
                  {business.website.replace(/^https?:\/\//, '')}
                </span>
              </div>
            )}
          </div>

          {/* Industry & Stats - Enhanced separator */}
          <div className="flex items-center justify-between pt-3 border-t border-white/5">
            <div className="flex items-center gap-2">
              {business.industry && (
                <Badge
                  variant="outline"
                  className="text-xs border-white/10 text-slate-300 hover:border-violet-500/30 transition-colors"
                >
                  {business.industry}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-1.5 text-slate-400">
                <Users className="h-3 w-3 text-slate-500" />
                <span>{contactCount}</span>
              </div>
              {business._count?.outreach_messages && business._count.outreach_messages > 0 && (
                <div className="flex items-center gap-1.5 text-violet-400">
                  <Mail className="h-3 w-3" />
                  <span>{business._count.outreach_messages}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default BusinessCard;
