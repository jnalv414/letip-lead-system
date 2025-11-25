/**
 * Lead Sources Chart
 *
 * Stacked bar chart showing where leads come from (scraping, manual entry, import).
 * Uses 60/30/10 color rule: Teal/Orange bars with charcoal background.
 */

'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart } from '@/components/charts/bar-chart';
import { SkeletonChart } from '@/components/ui/skeleton';
import { formatNumber } from '@/lib/utils';
import { motion } from 'framer-motion';

interface SourceData {
  day: string;
  scraping: number;
  manual: number;
  import: number;
}

export function LeadSourcesChart() {
  // Fetch lead sources data from API
  const { data: sourcesData, isLoading, error } = useQuery({
    queryKey: ['lead-sources'],
    queryFn: async () => {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const response = await fetch(`${API_URL}/api/analytics/sources`);
      if (!response.ok) {
        throw new Error('Failed to fetch sources data');
      }
      return response.json();
    },
    staleTime: 30000, // Cache for 30 seconds
  });

  // Transform API response to chart format (sources array to daily breakdown)
  // API returns: { sources: [{ source, count, percentage }], total }
  // Chart expects: { day, scraping, manual, import }[]
  const data: SourceData[] = React.useMemo(() => {
    if (!sourcesData?.sources) return [];

    // If API returns aggregated totals, create a single data point
    // or transform to daily format if daily data is provided
    const sources = sourcesData.sources;
    const scrapingSource = sources.find((s: { source: string; count: number }) =>
      s.source.toLowerCase().includes('scraping') || s.source.toLowerCase().includes('google')
    );
    const manualSource = sources.find((s: { source: string; count: number }) =>
      s.source.toLowerCase().includes('manual')
    );
    const importSource = sources.find((s: { source: string; count: number }) =>
      s.source.toLowerCase().includes('import')
    );

    // Return aggregated data as a single entry for display
    return [{
      day: 'Total',
      scraping: scrapingSource?.count || 0,
      manual: manualSource?.count || 0,
      import: importSource?.count || 0,
    }];
  }, [sourcesData]);

  // Calculate totals
  const totals = data?.reduce(
    (acc, item) => ({
      scraping: acc.scraping + item.scraping,
      manual: acc.manual + item.manual,
      import: acc.import + item.import,
    }),
    { scraping: 0, manual: 0, import: 0 }
  ) || { scraping: 0, manual: 0, import: 0 };

  const grandTotal = totals.scraping + totals.manual + totals.import;

  // Handle error state
  if (error) {
    return (
      <Card variant="charcoal" hover animated>
        <CardHeader>
          <CardDescription className="text-gray-400 text-xs uppercase tracking-wider font-bold">
            Lead Sources
          </CardDescription>
          <CardTitle className="text-4xl font-light tracking-tight mt-2">--</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-400 text-center py-8">Failed to load sources data</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="charcoal" hover animated>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardDescription className="text-gray-400 text-xs uppercase tracking-wider font-bold">
              Lead Sources
            </CardDescription>
            <CardTitle className="text-4xl font-light tracking-tight mt-2">
              {formatNumber(grandTotal)}
            </CardTitle>
          </div>

          {/* Source type badges (30% teal + 10% orange) */}
          <div className="flex flex-col gap-2">
            <Badge variant="outline" size="sm">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path
                  fillRule="evenodd"
                  d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                  clipRule="evenodd"
                />
              </svg>
              Scraping
            </Badge>
            <Badge variant="outline" size="sm">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Manual
            </Badge>
            <Badge variant="outline" size="sm">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
              Import
            </Badge>
          </div>
        </div>

        {/* Totals breakdown */}
        <div className="flex gap-3 mt-4">
          <div className="flex-1 bg-charcoal-light/50 rounded-lg p-2 border border-gray-700">
            <p className="text-xs text-gray-400">Scraping</p>
            <p className="text-xl font-semibold text-teal-lighter">{formatNumber(totals.scraping)}</p>
          </div>
          <div className="flex-1 bg-charcoal-light/50 rounded-lg p-2 border border-gray-700">
            <p className="text-xs text-gray-400">Manual</p>
            <p className="text-xl font-semibold text-teal-lighter">{formatNumber(totals.manual)}</p>
          </div>
          <div className="flex-1 bg-charcoal-light rounded-lg p-2 border border-gray-700">
            <p className="text-xs text-gray-400">Import</p>
            <p className="text-xl font-semibold text-gray-300">{formatNumber(totals.import)}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <SkeletonChart />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="h-[180px] sm:h-[200px] lg:h-[220px]"
          >
            <BarChart
              data={data || []}
              bars={[
                { dataKey: 'scraping', name: 'Scraping', color: '#145A5A' },
                { dataKey: 'manual', name: 'Manual', color: '#6B7280' },
                { dataKey: 'import', name: 'Import', color: '#4A4A4E' },
              ]}
              xAxisKey="day"
              height={200}
              stacked
              showGrid
              showXAxis
            />
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
