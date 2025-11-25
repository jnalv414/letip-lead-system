'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs } from '@/components/ui/tabs';
import { NumberTicker } from '@/components/magicui/number-ticker';
import { BlurFade } from '@/components/magicui/blur-fade';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { chartConfig, createGradientDefs } from '@/lib/chart-config';
import { cn } from '@/lib/utils';

// Data types
interface LeadData {
  period: string;
  leads: number;
  enriched: number;
}

interface LeadStats {
  total: number;
  enriched: number;
  pending: number;
  trend: number; // percentage change
}

// Period options
type Period = '24h' | 'week' | 'month';

const periodTabs = [
  { id: '24h', label: '24 Hours' },
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
];

// Static mock data to avoid hydration errors (no random values)
const mockChartData: Record<Period, LeadData[]> = {
  '24h': [
    { period: '0:00', leads: 45, enriched: 32 },
    { period: '2:00', leads: 38, enriched: 28 },
    { period: '4:00', leads: 42, enriched: 31 },
    { period: '6:00', leads: 55, enriched: 42 },
    { period: '8:00', leads: 78, enriched: 58 },
    { period: '10:00', leads: 92, enriched: 71 },
    { period: '12:00', leads: 85, enriched: 66 },
    { period: '14:00', leads: 88, enriched: 69 },
    { period: '16:00', leads: 95, enriched: 74 },
    { period: '18:00', leads: 82, enriched: 62 },
    { period: '20:00', leads: 68, enriched: 51 },
    { period: '22:00', leads: 52, enriched: 38 },
  ],
  'week': [
    { period: 'Mon', leads: 120, enriched: 92 },
    { period: 'Tue', leads: 145, enriched: 112 },
    { period: 'Wed', leads: 138, enriched: 105 },
    { period: 'Thu', leads: 162, enriched: 128 },
    { period: 'Fri', leads: 155, enriched: 118 },
    { period: 'Sat', leads: 88, enriched: 65 },
    { period: 'Sun', leads: 72, enriched: 52 },
  ],
  'month': [
    { period: 'Week 1', leads: 580, enriched: 445 },
    { period: 'Week 2', leads: 620, enriched: 482 },
    { period: 'Week 3', leads: 695, enriched: 538 },
    { period: 'Week 4', leads: 752, enriched: 592 },
  ],
};

// Custom tooltip for chart
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div
      className="glass rounded-lg p-3 border border-[var(--border-accent)] shadow-xl"
      style={chartConfig.chart.tooltip.contentStyle}
    >
      <p className="text-[var(--text-secondary)] text-xs font-semibold mb-2">
        {payload[0].payload.period}
      </p>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[var(--accent-purple)]" />
          <span className="text-[var(--text-primary)] text-sm font-medium">
            Total: {payload[0].value}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[var(--accent-blue)]" />
          <span className="text-[var(--text-primary)] text-sm font-medium">
            Enriched: {payload[1]?.value || 0}
          </span>
        </div>
      </div>
    </div>
  );
}

export function MyLeadsSection() {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('week');

  // Mock stats for when API is unavailable
  const mockStatsData: LeadStats = {
    total: 847,
    enriched: 612,
    pending: 235,
    trend: 18.5,
  };

  // Fetch stats from API with mock data fallback
  const { data: stats } = useQuery<LeadStats>({
    queryKey: ['leads-stats', selectedPeriod],
    queryFn: async () => {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      try {
        const response = await fetch(`${API_URL}/api/businesses/stats`);
        if (!response.ok) {
          throw new Error('Failed to fetch stats');
        }
        const data = await response.json();
        return {
          total: data.total || 0,
          enriched: data.enriched || 0,
          pending: data.pending || 0,
          trend: data.enrichmentRate || 0,
        };
      } catch {
        // Return mock data when API is unavailable
        return mockStatsData;
      }
    },
    staleTime: 30000,
    refetchInterval: 60000,
    initialData: mockStatsData, // Use mock data while loading
  });

  // Use static mock chart data (since we don't have historical data API yet)
  const leadData = mockChartData[selectedPeriod];

  const trendPositive = (stats?.trend || 0) >= 0;

  return (
    <BlurFade delay={0.2} duration={0.5}>
      <motion.div
        whileHover={{ scale: 1.002 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        <Card variant="glass" className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-3 tracking-tight">
                My Leads
              </h2>
              <div className="flex items-center gap-3">
                <span className="text-5xl font-bold text-[var(--accent-purple)]">
                  <NumberTicker value={stats?.total || 0} />
                </span>
                <div
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold backdrop-blur-sm',
                    trendPositive
                      ? 'bg-[var(--highlight-emerald)]/10 text-[var(--highlight-emerald)] border border-[var(--highlight-emerald)]/20'
                      : 'bg-red-500/10 text-red-400 border border-red-500/20'
                  )}
                >
                  {trendPositive ? (
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 10l7-7m0 0l7 7m-7-7v18"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 14l-7 7m0 0l-7-7m7 7V3"
                      />
                    </svg>
                  )}
                  <span>{Math.abs(stats?.trend || 0).toFixed(1)}%</span>
                </div>
              </div>
            </div>

            {/* Period selector */}
            <Tabs
              tabs={periodTabs}
              defaultTab={selectedPeriod}
              onChange={(tabId) => setSelectedPeriod(tabId as Period)}
            />
          </div>

          {/* Chart */}
          <div className="h-72 mb-8">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={leadData || []}>
                {createGradientDefs()}

                <CartesianGrid
                  {...chartConfig.chart.grid}
                  vertical={false}
                />

                <XAxis
                  dataKey="period"
                  {...chartConfig.chart.axis}
                  tick={{ fill: chartConfig.colors.text.muted, fontSize: 12 }}
                  axisLine={{ stroke: chartConfig.colors.axis }}
                />

                <YAxis
                  {...chartConfig.chart.axis}
                  tick={{ fill: chartConfig.colors.text.muted, fontSize: 12 }}
                  axisLine={{ stroke: chartConfig.colors.axis }}
                />

                <Tooltip content={<CustomTooltip />} />

                {/* Total leads area */}
                <Area
                  type="monotone"
                  dataKey="leads"
                  stroke={chartConfig.colors.primary}
                  strokeWidth={chartConfig.chart.area.strokeWidth}
                  fill="url(#gradient-purple)"
                  fillOpacity={chartConfig.chart.area.fillOpacity}
                  activeDot={chartConfig.chart.area.activeDot}
                />

                {/* Enriched leads area */}
                <Area
                  type="monotone"
                  dataKey="enriched"
                  stroke={chartConfig.colors.secondary}
                  strokeWidth={chartConfig.chart.area.strokeWidth}
                  fill="url(#gradient-blue)"
                  fillOpacity={chartConfig.chart.area.fillOpacity}
                  activeDot={chartConfig.chart.area.activeDot}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Mini stats row */}
          <div className="grid grid-cols-3 gap-6">
            <div className="glass-subtle rounded-xl p-6 border border-[var(--border-subtle)] hover:border-[var(--border-default)] transition-colors">
              <p className="text-sm font-semibold text-[var(--text-muted)] mb-2 uppercase tracking-wide">
                Total Leads
              </p>
              <p className="text-3xl font-bold text-[var(--text-primary)]">
                <NumberTicker value={stats?.total || 0} />
              </p>
            </div>

            <div className="glass-subtle rounded-xl p-6 border border-[var(--border-subtle)] hover:border-[var(--accent-purple)]/30 transition-colors">
              <p className="text-sm font-semibold text-[var(--text-muted)] mb-2 uppercase tracking-wide">
                Enriched
              </p>
              <p className="text-3xl font-bold text-[var(--accent-purple)]">
                <NumberTicker value={stats?.enriched || 0} />
              </p>
            </div>

            <div className="glass-subtle rounded-xl p-6 border border-[var(--border-subtle)] hover:border-[var(--border-default)] transition-colors">
              <p className="text-sm font-semibold text-[var(--text-muted)] mb-2 uppercase tracking-wide">
                Pending
              </p>
              <p className="text-3xl font-bold text-[var(--text-secondary)]">
                <NumberTicker value={stats?.pending || 0} />
              </p>
            </div>
          </div>
        </Card>
      </motion.div>
    </BlurFade>
  );
}
