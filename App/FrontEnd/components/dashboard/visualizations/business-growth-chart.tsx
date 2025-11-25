/**
 * Business Growth Chart
 *
 * Area chart showing new businesses added over time with period selector.
 * Uses real-time data from TanStack Query and WebSocket updates.
 *
 * Color scheme: Teal gradient (30% primary), Orange accents (10%)
 */

'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DualAreaChart } from '@/components/charts/area-chart';
import { SkeletonChart } from '@/components/ui/skeleton';
import { formatCompactNumber } from '@/lib/utils';
import { motion } from 'framer-motion';

interface GrowthData {
  period: string;
  businesses: number;
  enriched: number;
}

type TimePeriod = 'week' | 'month' | 'quarter';

export function BusinessGrowthChart() {
  const [period, setPeriod] = React.useState<TimePeriod>('month');

  // Fetch growth data from API
  const { data: growthResponse, isLoading, error } = useQuery({
    queryKey: ['business-growth', period],
    queryFn: async () => {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const response = await fetch(`${API_URL}/api/analytics/growth?period=${period}`);
      if (!response.ok) {
        throw new Error('Failed to fetch growth data');
      }
      return response.json();
    },
    staleTime: 30000, // Cache for 30 seconds
  });

  // Map API response to component format
  // API returns: { data: [{ period, businesses, enriched }], total, enrichmentRate }
  const data: GrowthData[] = growthResponse?.data || [];

  // Calculate totals
  const totalBusinesses = data?.reduce((sum, item) => sum + item.businesses, 0) || 0;
  const totalEnriched = data?.reduce((sum, item) => sum + item.enriched, 0) || 0;
  const enrichmentRate = totalBusinesses > 0 ? ((totalEnriched / totalBusinesses) * 100).toFixed(1) : '0';

  // Handle error state
  if (error) {
    return (
      <Card variant="charcoal" hover animated>
        <CardHeader>
          <CardDescription className="text-gray-400 text-xs uppercase tracking-wider font-bold">
            Business Growth
          </CardDescription>
          <CardTitle className="text-4xl font-light tracking-tight mt-2">--</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-400 text-center py-8">Failed to load growth data</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="charcoal" hover animated>
      <CardHeader>
        <div className="flex justify-between items-start mb-2">
          <div>
            <CardDescription className="text-gray-400 text-xs uppercase tracking-wider font-bold">
              Business Growth
            </CardDescription>
            <CardTitle className="text-4xl font-light tracking-tight mt-2">
              {formatCompactNumber(totalBusinesses)}
            </CardTitle>
          </div>

          {/* Period Selector (10% orange accent) */}
          <div
            className="flex bg-charcoal rounded-full p-1 border border-teal-light/20"
            role="tablist"
            aria-label="Select time period for business growth data"
          >
            {(['week', 'month', 'quarter'] as TimePeriod[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                role="tab"
                aria-selected={period === p}
                aria-controls="growth-chart-content"
                aria-label={`View ${p === 'week' ? 'weekly' : p === 'month' ? 'monthly' : 'quarterly'} data`}
                tabIndex={period === p ? 0 : -1}
                className={`
                  px-4 py-1 rounded-full text-sm font-medium transition-all duration-200
                  ${
                    period === p
                      ? 'bg-orange text-white shadow-lg'
                      : 'text-gray-400 hover:text-white'
                  }
                `}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowRight') {
                    const periods: TimePeriod[] = ['week', 'month', 'quarter'];
                    const currentIndex = periods.indexOf(period);
                    const nextIndex = (currentIndex + 1) % periods.length;
                    setPeriod(periods[nextIndex]);
                  } else if (e.key === 'ArrowLeft') {
                    const periods: TimePeriod[] = ['week', 'month', 'quarter'];
                    const currentIndex = periods.indexOf(period);
                    const prevIndex = currentIndex === 0 ? periods.length - 1 : currentIndex - 1;
                    setPeriod(periods[prevIndex]);
                  }
                }}
              >
                {p === 'week' ? 'Wk' : p === 'month' ? 'Mo' : 'Qtr'}
              </button>
            ))}
          </div>
        </div>

        {/* Legend with badges */}
        <div className="flex gap-2 mt-4">
          <Badge variant="teal" size="sm">
            <span className="w-2 h-2 rounded-full bg-teal-lighter mr-1" />
            Total: {totalBusinesses}
          </Badge>
          <Badge variant="outlineTeal" size="sm">
            <span className="w-2 h-2 rounded-full bg-teal-lighter mr-1" />
            Enriched: {totalEnriched}
          </Badge>
          <Badge variant="success" size="sm">
            {enrichmentRate}% enrichment rate
          </Badge>
        </div>
      </CardHeader>

      <CardContent id="growth-chart-content" role="tabpanel">
        {isLoading ? (
          <div role="status" aria-label="Loading chart data">
            <SkeletonChart />
            <span className="sr-only">Loading business growth chart...</span>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="h-[200px] sm:h-[250px] lg:h-[300px]"
            role="img"
            aria-label={`Business growth chart showing ${totalBusinesses} total businesses and ${totalEnriched} enriched businesses over ${period}`}
          >
            <DualAreaChart
              data={data || []}
              dataKey1="businesses"
              dataKey2="enriched"
              label1="Total Businesses"
              label2="Enriched"
              xAxisKey="period"
              height={240}
              showGrid
              showXAxis
              ariaLabel={`Growth chart: ${totalBusinesses} businesses, ${totalEnriched} enriched, ${enrichmentRate}% enrichment rate`}
            />
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
