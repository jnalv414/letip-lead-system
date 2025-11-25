'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Building2,
  MapPin,
  Phone,
  Globe,
  Calendar,
  Users,
  Briefcase,
  Sparkles,
  Loader2,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Business } from '@/types/api';

interface BusinessDetailCardProps {
  business: Business;
  onEnrich: (businessId: number) => void;
  isEnriching: boolean;
  className?: string;
}

const statusConfig = {
  pending: {
    icon: Clock,
    label: 'Pending',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/20',
    borderColor: 'border-amber-500/50',
  },
  enriched: {
    icon: CheckCircle2,
    label: 'Enriched',
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
    borderColor: 'border-green-500/50',
  },
  failed: {
    icon: XCircle,
    label: 'Failed',
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
    borderColor: 'border-red-500/50',
  },
};

export function BusinessDetailCard({
  business,
  onEnrich,
  isEnriching,
  className,
}: BusinessDetailCardProps) {
  const status = statusConfig[business.enrichment_status];
  const StatusIcon = status.icon;
  const isPending = business.enrichment_status === 'pending';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={cn('bg-card/50 backdrop-blur-sm border-border/50', className)}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">{business.name}</h3>
                {business.city && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {business.city}
                    {business.state && `, ${business.state}`}
                  </p>
                )}
              </div>
            </div>
            <Badge variant="outline" className={cn(status.color, status.borderColor)}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {status.label}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Contact Info */}
          <div className="grid grid-cols-2 gap-4">
            {business.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">{business.phone}</span>
              </div>
            )}
            {business.website && (
              <div className="flex items-center gap-2 text-sm">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <a
                  href={business.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline truncate"
                >
                  {business.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                </a>
              </div>
            )}
          </div>

          {/* Enrichment Data */}
          {business.enrichment_status === 'enriched' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-3 gap-3 p-3 rounded-lg bg-background/30"
            >
              {business.industry && (
                <div className="text-center">
                  <Briefcase className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                  <p className="text-xs text-muted-foreground">Industry</p>
                  <p className="text-sm font-medium text-foreground">{business.industry}</p>
                </div>
              )}
              {business.employee_count && (
                <div className="text-center">
                  <Users className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                  <p className="text-xs text-muted-foreground">Employees</p>
                  <p className="text-sm font-medium text-foreground">{business.employee_count}</p>
                </div>
              )}
              {business.year_founded && (
                <div className="text-center">
                  <Calendar className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                  <p className="text-xs text-muted-foreground">Founded</p>
                  <p className="text-sm font-medium text-foreground">{business.year_founded}</p>
                </div>
              )}
            </motion.div>
          )}

          {/* Enrich Button */}
          {isPending && (
            <Button
              onClick={() => onEnrich(business.id)}
              disabled={isEnriching}
              className="w-full gap-2"
            >
              {isEnriching ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enriching...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Enrich Now
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default BusinessDetailCard;
