/**
 * Geographic Stats
 *
 * Location distribution showing businesses by city/region.
 * Uses 60/30/10 color rule with charcoal background and orange/teal accents.
 */

'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HorizontalBarChart } from '@/components/charts/bar-chart';
import { motion } from 'framer-motion';

interface LocationData {
  city: string;
  count: number;
  percentage: number;
}

export function GeographicStats() {
  const { data: locationsData, isLoading, error } = useQuery({
    queryKey: ['geographic-stats'],
    queryFn: async () => {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const response = await fetch(`${API_URL}/api/analytics/locations`);
      if (!response.ok) {
        throw new Error('Failed to fetch location data');
      }
      return response.json();
    },
    staleTime: 30000, // Cache for 30 seconds
  });

  // Map API response to component's expected format
  const locations: LocationData[] = locationsData?.locations || [];

  const totalBusinesses = locations?.reduce((sum, loc) => sum + loc.count, 0) || 0;

  // Handle error state
  if (error) {
    return (
      <Card variant="charcoal" hover animated>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Geographic Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-400 text-center py-8">Failed to load location data</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="charcoal" hover animated>
      <CardHeader>
        <div className="flex justify-between items-start mb-4">
          <div>
            <CardTitle className="text-lg font-medium">Geographic Distribution</CardTitle>
            <p className="text-sm text-gray-400 mt-1">Western Monmouth County</p>
          </div>

          {/* Globe icon with teal glow */}
          <motion.div
            className="w-12 h-12 rounded-xl bg-teal-light/20 border border-teal-light/40 flex items-center justify-center"
            whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(20, 90, 90, 0.4)' }}
          >
            <svg className="w-6 h-6 text-teal-lighter" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
              />
            </svg>
          </motion.div>
        </div>

        {/* Total count */}
        <div className="bg-teal-light/10 rounded-2xl p-4 border border-teal-light/20">
          <p className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-1">
            Total Businesses
          </p>
          <p className="text-4xl font-light text-white">
            {totalBusinesses.toLocaleString()}
          </p>
          <Badge variant="success" size="sm" className="mt-2">
            +12% this month
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-20 h-4 bg-charcoal-light rounded" />
                <div className="flex-1 h-8 bg-charcoal-light rounded" />
                <div className="w-12 h-4 bg-charcoal-light rounded" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Bar chart visualization */}
            <div className="mb-6">
              <HorizontalBarChart
                data={locations || []}
                dataKey="count"
                xAxisKey="city"
                height={200}
                showGrid={false}
                showLeftAxis
                showBottomAxis={false}
                barColors={['#FF5722', '#145A5A', '#1A7070', '#FF7043', '#0D3B3B']}
              />
            </div>

            {/* Detailed breakdown */}
            <div className="space-y-3">
              {locations?.map((location, index) => (
                <motion.div
                  key={location.city}
                  className="flex justify-between items-center py-3 border-b border-teal-light/10 last:border-0 hover:bg-charcoal-light/50 px-3 rounded-lg transition-all duration-200"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ x: 4 }}
                >
                  <div className="flex items-center gap-3">
                    {/* Rank indicator */}
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                      style={{
                        backgroundColor:
                          index === 0
                            ? 'rgba(255, 87, 34, 0.2)'
                            : index === 1
                            ? 'rgba(20, 90, 90, 0.2)'
                            : 'rgba(42, 42, 46, 1)',
                        color:
                          index === 0
                            ? '#FF5722'
                            : index === 1
                            ? '#145A5A'
                            : '#9CA3AF',
                      }}
                    >
                      {index + 1}
                    </div>

                    {/* City name */}
                    <span className="font-medium text-sm text-gray-300">
                      {location.city}
                    </span>
                  </div>

                  {/* Count and percentage */}
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-sm text-gray-400">
                      {location.count.toLocaleString()}
                    </span>
                    <Badge
                      variant={index === 0 ? 'teal' : index === 1 ? 'outlineTeal' : 'charcoal'}
                      size="sm"
                    >
                      {location.percentage}%
                    </Badge>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Coverage map placeholder */}
            <motion.div
              className="mt-6 pt-6 border-t border-teal-light/10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <div className="text-center text-xs text-gray-500 mb-3">
                Coverage Heat Map
              </div>
              <div className="relative h-24 bg-gradient-to-r from-teal/20 via-charcoal-light to-teal/20 rounded-lg border border-teal-light/10 overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-16 h-16 text-gray-700 opacity-30" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                  </svg>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
