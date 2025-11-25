'use client';

import { Card } from '@/components/ui/card';
import { NumberTicker } from '@/components/magicui/number-ticker';
import { BlurFade } from '@/components/magicui/blur-fade';
import { ShineBorder } from '@/components/magicui/shine-border';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { TrendingUp, CheckCircle2, Clock, Users } from 'lucide-react';

interface PipelineStats {
  totalBusinesses: number;
  enrichedBusinesses: number;
  pendingEnrichment: number;
  totalContacts: number;
  messagesSent?: number;
  messagesPending?: number;
}

/**
 * Pipeline Overview Section Component
 *
 * Premium card displaying total businesses in pipeline with:
 * - Animated number ticker for main metric
 * - Trend indicator with percentage change
 * - Sub-metrics for enriched, pending, and contacts
 * - 3D animated gradient wave decoration
 * - Shine border accent for premium feel
 *
 * Maps to "Total Balance" section in reference design.
 *
 * @example
 * ```tsx
 * <PipelineOverviewSection />
 * ```
 */
export function PipelineOverviewSection() {
  // Fetch pipeline statistics
  const { data, isLoading, error } = useQuery<PipelineStats>({
    queryKey: ['pipeline-stats'],
    queryFn: async () => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/businesses/stats`);
      if (!response.ok) throw new Error('Failed to fetch pipeline stats');
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const stats = data || {
    totalBusinesses: 0,
    enrichedBusinesses: 0,
    pendingEnrichment: 0,
    totalContacts: 0,
  };

  // Calculate trend (mock for now - can be computed from historical data)
  const trendValue = stats.totalBusinesses > 0 ? 12.5 : 0;
  const trendPositive = trendValue >= 0;

  return (
    <BlurFade delay={0.1} inView>
      <ShineBorder
        className="w-full rounded-2xl"
        color={['#8b5cf6', '#3b82f6', '#06b6d4']}
        borderWidth={1.5}
      >
        <Card
          variant="glass"
          className="glass-elevated relative overflow-hidden p-8 border-0"
        >
          {/* Animated gradient wave decoration */}
          <div
            className="gradient-wave absolute -bottom-20 -right-20 opacity-50"
            style={{
              width: '300px',
              height: '300px',
            }}
          />

          {/* Content overlay */}
          <div className="relative z-10">
            {/* Header label */}
            <motion.p
              className="text-sm font-medium text-muted-foreground mb-2"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              Pipeline Overview
            </motion.p>

            {/* Main metric */}
            <motion.div
              className="mb-4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, type: 'spring' }}
            >
              <div className="text-5xl font-bold text-[var(--text-primary)] mb-2">
                {isLoading ? (
                  <span className="animate-pulse">---</span>
                ) : error ? (
                  <span className="text-red-400 text-xl">Error loading</span>
                ) : (
                  <NumberTicker value={stats.totalBusinesses} />
                )}
              </div>
              <p className="text-sm text-[var(--text-muted)]">Total Businesses</p>
            </motion.div>

            {/* Trend indicator */}
            <motion.div
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium mb-6 ${
                trendPositive
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'bg-red-500/10 text-red-400'
              }`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <TrendingUp className={`w-4 h-4 ${!trendPositive && 'rotate-180'}`} />
              <span>
                {trendPositive ? '+' : ''}{trendValue}% from last month
              </span>
            </motion.div>

            {/* Sub-metrics grid */}
            <motion.div
              className="grid grid-cols-3 gap-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              {/* Enriched count */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-medium">Enriched</span>
                </div>
                <p className="text-2xl font-bold text-[var(--text-primary)]">
                  {isLoading ? (
                    <span className="animate-pulse">--</span>
                  ) : (
                    <NumberTicker value={stats.enrichedBusinesses} />
                  )}
                </p>
              </div>

              {/* Pending count */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-medium">Pending</span>
                </div>
                <p className="text-2xl font-bold text-[var(--text-primary)]">
                  {isLoading ? (
                    <span className="animate-pulse">--</span>
                  ) : (
                    <NumberTicker value={stats.pendingEnrichment} />
                  )}
                </p>
              </div>

              {/* Contacts count */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
                  <Users className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-medium">Contacts</span>
                </div>
                <p className="text-2xl font-bold text-[var(--text-primary)]">
                  {isLoading ? (
                    <span className="animate-pulse">--</span>
                  ) : (
                    <NumberTicker value={stats.totalContacts} />
                  )}
                </p>
              </div>
            </motion.div>
          </div>
        </Card>
      </ShineBorder>
    </BlurFade>
  );
}
