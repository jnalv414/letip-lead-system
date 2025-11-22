/**
 * Top Businesses List
 *
 * Ranked list of businesses with badges showing enrichment status.
 * Uses 60/30/10 color rule: Charcoal cards (60%), Teal accents (30%), Orange highlights (10%)
 */

'use client';

import * as React from 'react';
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
  const { data: businesses, isLoading } = useQuery({
    queryKey: ['top-businesses'],
    queryFn: async () => {
      // TODO: Replace with actual API endpoint
      // return apiClient.get('/api/businesses/top', { params: { limit: 5 } });

      await new Promise((resolve) => setTimeout(resolve, 500));

      const mockBusinesses: Business[] = [
        {
          id: 1,
          name: 'ABC Plumbing Services',
          city: 'Freehold',
          industry: 'Plumbing',
          enrichment_status: 'enriched',
          contacts_count: 3,
          created_at: new Date().toISOString(),
        },
        {
          id: 2,
          name: 'Elite Legal Advisors',
          city: 'Manalapan',
          industry: 'Legal',
          enrichment_status: 'enriched',
          contacts_count: 5,
          created_at: new Date().toISOString(),
        },
        {
          id: 3,
          name: 'Precision Dental Care',
          city: 'Howell',
          industry: 'Healthcare',
          enrichment_status: 'pending',
          contacts_count: 0,
          created_at: new Date().toISOString(),
        },
        {
          id: 4,
          name: 'Sunrise Construction LLC',
          city: 'Marlboro',
          industry: 'Construction',
          enrichment_status: 'enriched',
          contacts_count: 4,
          created_at: new Date().toISOString(),
        },
        {
          id: 5,
          name: 'TechStart Solutions',
          city: 'Freehold',
          industry: 'Technology',
          enrichment_status: 'failed',
          contacts_count: 0,
          created_at: new Date().toISOString(),
        },
      ];

      return mockBusinesses;
    },
  });

  return (
    <Card variant="charcoal" hover animated>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-medium">Top Businesses</CardTitle>
          <button className="px-4 py-1 rounded-full text-sm font-medium bg-orange text-white hover:bg-orange-dark transition-colors duration-200">
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
                className="flex items-center gap-4 bg-charcoal-light p-4 rounded-2xl border border-orange/10 animate-pulse"
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
                className="flex items-center justify-between bg-teal-light/5 p-4 rounded-2xl border border-orange/10 hover:border-orange/30 hover:bg-teal-light/10 transition-all duration-200 cursor-pointer group"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ x: 4 }}
              >
                <div className="flex items-center gap-4 flex-1">
                  {/* Rank badge (10% orange accent) */}
                  <div className="w-12 h-12 rounded-xl bg-charcoal-light border border-orange/20 flex items-center justify-center font-bold text-xl text-gray-400 group-hover:bg-orange group-hover:text-white transition-all duration-200">
                    {index + 1}
                  </div>

                  {/* Business info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm text-white group-hover:text-orange transition-colors duration-200">
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
                  className="w-5 h-5 text-gray-600 group-hover:text-orange transition-colors duration-200"
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
            className="mt-6 pt-4 border-t border-orange/10 flex justify-between items-center"
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
