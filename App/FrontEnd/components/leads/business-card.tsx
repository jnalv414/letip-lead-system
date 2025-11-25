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
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Business } from '@/types/api';

interface BusinessCardProps {
  business: Business;
  onClick?: (business: Business) => void;
  selected?: boolean;
  className?: string;
}

const statusColors: Record<string, string> = {
  enriched: 'bg-green-500/20 text-green-400 border-green-500/30',
  pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  failed: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export function BusinessCard({
  business,
  onClick,
  selected = false,
  className,
}: BusinessCardProps) {
  const contactCount = business._count?.contacts || 0;
  const location = [business.city, business.state].filter(Boolean).join(', ');

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card
        className={cn(
          'cursor-pointer transition-all duration-200',
          'bg-card/50 backdrop-blur-sm border-border/50',
          'hover:bg-card/70 hover:border-primary/30',
          selected && 'ring-2 ring-primary border-primary/50',
          className
        )}
        onClick={() => onClick?.(business)}
        data-testid="business-card"
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-foreground truncate">
                  {business.name}
                </h3>
                {location && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{location}</span>
                  </div>
                )}
              </div>
            </div>
            <Badge
              className={cn(
                'flex-shrink-0 capitalize',
                statusColors[business.enrichment_status]
              )}
            >
              {business.enrichment_status}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-2 space-y-3">
          {/* Contact Info */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {business.phone && (
              <div className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                <span>{business.phone}</span>
              </div>
            )}
            {business.website && (
              <div className="flex items-center gap-1">
                <Globe className="h-3 w-3" />
                <span className="truncate max-w-[120px]">
                  {business.website.replace(/^https?:\/\//, '')}
                </span>
              </div>
            )}
          </div>

          {/* Industry & Stats */}
          <div className="flex items-center justify-between pt-2 border-t border-border/30">
            <div className="flex items-center gap-2">
              {business.industry && (
                <Badge variant="outline" className="text-xs">
                  {business.industry}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Users className="h-3 w-3" />
                <span>{contactCount}</span>
              </div>
              {business._count?.outreach_messages && business._count.outreach_messages > 0 && (
                <div className="flex items-center gap-1 text-muted-foreground">
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
