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

// Mock data generator (replace with real API calls)
const generateMockData = (period: Period): LeadData[] => {
  const dataPoints = period === '24h' ? 24 : period === 'week' ? 7 : 30;
  const data: LeadData[] = [];

  for (let i = 0; i < dataPoints; i++) {
    const baseValue = 50 + Math.random() * 50;
    const enrichedValue = baseValue * (0.6 + Math.random() * 0.3);

    let label = '';
    if (period === '24h') {
      label = `${i}:00`;
    } else if (period === 'week') {
      label = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i];
    } else {
      label = `Day ${i + 1}`;
    }

    data.push({
      period: label,
      leads: Math.round(baseValue),
      enriched: Math.round(enrichedValue),
    });
  }

  return data;
};

const generateMockStats = (period: Period): LeadStats => {
  const total = Math.round(500 + Math.random() * 500);
  const enriched = Math.round(total * (0.65 + Math.random() * 0.2));
  const pending = total - enriched;
  const trend = (Math.random() * 30) - 5; // -5% to +25% range

  return { total, enriched, pending, trend };
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

  // Fetch lead data (using mock data for now)
  const { data: leadData } = useQuery({
    queryKey: ['leads-trend', selectedPeriod],
    queryFn: () => Promise.resolve(generateMockData(selectedPeriod)),
    refetchInterval: 60000, // Refetch every minute
  });

  const { data: stats } = useQuery({
    queryKey: ['leads-stats', selectedPeriod],
    queryFn: () => Promise.resolve(generateMockStats(selectedPeriod)),
    refetchInterval: 60000,
  });

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
