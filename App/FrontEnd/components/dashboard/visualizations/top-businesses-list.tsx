/**
 * Top Businesses List
 *
 * Ranked list of businesses with badges showing enrichment status.
 * Uses 60/30/10 color rule: Charcoal cards (60%), Teal accents (30%), Orange highlights (10%)
 */

'use client';

import * as React from 'react';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

interface Business {
  id: number;
  name: string;
  city: string;
  industry: string;
  enrichment_status: 'pending' | 'enriched' | 'failed';
  contacts_count: number;
  created_at: string;
}

export function TopBusinessesList() {
  const { data: businessesResponse, isLoading, error } = useQuery({
    queryKey: ['top-businesses'],
    queryFn: async () => {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const response = await fetch(`${API_URL}/api/businesses?limit=5&orderBy=created_at&order=desc`);
      if (!response.ok) {
        throw new Error('Failed to fetch businesses');
      }
      return response.json();
    },
    staleTime: 30000, // Cache for 30 seconds
  });

  // Map API response to component format
  // API returns: { data: Business[], meta: { total, page, limit } }
  const businesses: Business[] = useMemo(() => {
    const rawData = businessesResponse?.data || [];
    return rawData.map((b: Record<string, unknown>) => ({
      id: b.id as number,
      name: b.name as string,
      city: b.city as string || 'Unknown',
      industry: b.industry as string || 'General',
      enrichment_status: (b.enrichment_status as 'pending' | 'enriched' | 'failed') || 'pending',
      contacts_count: (b.contacts as unknown[])?.length || b.contacts_count as number || 0,
      created_at: b.created_at as string || new Date().toISOString(),
    }));
  }, [businessesResponse]);

  // Handle error state
  if (error) {
    return (
      <Card variant="charcoal" hover animated>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Top Businesses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-400 text-center py-8">Failed to load businesses</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="charcoal" hover animated>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-medium">Top Businesses</CardTitle>
          <button className="px-4 py-1 rounded-full text-sm font-medium bg-teal-light text-white hover:bg-teal transition-colors duration-200">
            View All
          </button>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {isLoading ? (
            // Loading skeleton
            Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 bg-charcoal-light p-4 rounded-2xl border border-teal-light/10 animate-pulse"
              >
                <div className="w-12 h-12 rounded-xl bg-teal-light/20" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-teal-light/20 rounded" />
                  <div className="h-3 w-1/2 bg-teal-light/20 rounded" />
                </div>
              </div>
            ))
          ) : (
            businesses?.map((business, index) => (
              <motion.div
                key={business.id}
                className="flex items-center justify-between bg-charcoal-light/50 p-4 rounded-2xl border border-teal-light/10 hover:border-teal-light/30 hover:bg-charcoal-light transition-all duration-200 cursor-pointer group"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ x: 4 }}
              >
                <div className="flex items-center gap-4 flex-1">
                  {/* Rank badge (teal accent) */}
                  <div className="w-12 h-12 rounded-xl bg-charcoal-light border border-teal-light/20 flex items-center justify-center font-bold text-xl text-gray-400 group-hover:bg-charcoal group-hover:text-white transition-all duration-200">
                    {index + 1}
                  </div>

                  {/* Business info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm text-white group-hover:text-teal-lighter transition-colors duration-200">
                        {business.name}
                      </p>
                      <StatusBadge status={business.enrichment_status} size="sm" />
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge variant="outlineTeal" size="sm">
                        {business.industry}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {business.city}
                      </span>
                      {business.contacts_count > 0 && (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                          {business.contacts_count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Chevron indicator */}
                <svg
                  className="w-5 h-5 text-gray-600 group-hover:text-teal-lighter transition-colors duration-200"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </motion.div>
            ))
          )}
        </div>

        {/* Footer stats */}
        {!isLoading && businesses && (
          <motion.div
            className="mt-6 pt-4 border-t border-teal-light/10 flex justify-between items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className="text-xs text-gray-500">
              Showing {businesses.length} of {businesses.length * 10} businesses
            </div>
            <div className="flex gap-2">
              <Badge variant="success" size="sm">
                {businesses.filter((b) => b.enrichment_status === 'enriched').length} Enriched
              </Badge>
              <Badge variant="warning" size="sm">
                {businesses.filter((b) => b.enrichment_status === 'pending').length} Pending
              </Badge>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
