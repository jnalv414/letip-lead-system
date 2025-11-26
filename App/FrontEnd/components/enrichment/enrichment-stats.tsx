'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Users, CheckCircle2, Clock, UserPlus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { Stats } from '@/types/api';

interface EnrichmentStatsProps {
  stats: Stats;
  isLoading?: boolean;
  className?: string;
}

const statConfig = [
  {
    key: 'totalBusinesses',
    label: 'Total Leads',
    icon: Users,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
  },
  {
    key: 'enrichedBusinesses',
    label: 'Enriched',
    icon: CheckCircle2,
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
  },
  {
    key: 'pendingEnrichment',
    label: 'Pending',
    icon: Clock,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/20',
  },
  {
    key: 'totalContacts',
    label: 'Contacts Found',
    icon: UserPlus,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
  },
] as const;

export function EnrichmentStats({ stats, isLoading, className }: EnrichmentStatsProps) {
  const enrichmentRate =
    stats.totalBusinesses > 0
      ? Math.round((stats.enrichedBusinesses / stats.totalBusinesses) * 100)
      : 0;

  if (isLoading) {
    return (
      <div className={cn('grid grid-cols-2 lg:grid-cols-4 gap-4', className)}>
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="glass-card rounded-2xl">
            <CardContent className="pt-6">
              <Skeleton data-testid="skeleton" className="h-4 w-20 mb-2" />
              <Skeleton data-testid="skeleton" className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {statConfig.map((config, index) => {
          const Icon = config.icon;
          const value = stats[config.key as keyof Stats];

          return (
            <motion.div
              key={config.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className="glass-card rounded-2xl">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className={cn('p-2.5 rounded-xl', config.bgColor)}>
                      <Icon className={cn('h-5 w-5', config.color)} />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-0.5">{config.label}</p>
                      <p className="text-2xl font-bold text-foreground">{value}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Enrichment Rate Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
      >
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Enrichment Rate</p>
                <p className="text-3xl font-bold text-primary">{enrichmentRate}%</p>
              </div>
              <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-xl font-bold text-primary">{enrichmentRate}%</span>
              </div>
            </div>
            <div className="mt-5 h-2.5 bg-background/50 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${enrichmentRate}%` }}
                transition={{ duration: 1, delay: 0.5 }}
                className="h-full bg-primary rounded-full"
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export default EnrichmentStats;
