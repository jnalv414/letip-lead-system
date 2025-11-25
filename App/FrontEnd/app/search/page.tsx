'use client';

import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Lightbulb, Clock, ArrowRight } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { SearchForm } from '@/components/search/search-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ErrorBoundary } from '@/components/shared/error-boundary';
import { useScraping, type ScrapingFormData } from '@/features/map-scraping';

const searchTips = [
  { tip: 'Be specific with location', example: '"Freehold, NJ" works better than just "NJ"' },
  { tip: 'Use business categories', example: '"Italian restaurant" vs just "restaurant"' },
  { tip: 'Adjust radius wisely', example: 'Smaller radius = more targeted results' },
  { tip: 'Start with 50 results', example: 'You can always search again for more' },
];

const recentSearches = [
  { location: 'Freehold, NJ', businessType: 'restaurant', results: 47, date: '2 hours ago' },
  { location: 'Marlboro, NJ', businessType: 'plumber', results: 23, date: 'Yesterday' },
  { location: 'Holmdel, NJ', businessType: 'dentist', results: 18, date: '3 days ago' },
];

export default function SearchPage() {
  const { progress, startScrape, isStarting } = useScraping();

  const handleSearch = useCallback(
    (data: ScrapingFormData) => {
      startScrape({
        location: data.location,
        businessType: data.businessType,
        radius: data.radius,
        maxResults: data.maxResults,
      });
    },
    [startScrape]
  );

  return (
    <ErrorBoundary>
      <div className="p-6 space-y-6">
        {/* Page Header */}
        <PageHeader
          title="Search"
          subtitle="Find new business leads from Google Maps"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Search Form */}
          <div className="lg:col-span-2">
            <SearchForm onSubmit={handleSearch} isLoading={isStarting} />

            {/* Search Tips */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="mt-6"
            >
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Lightbulb className="h-5 w-5 text-amber-400" />
                    Search Tips
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {searchTips.map((item, index) => (
                      <motion.li
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * index }}
                        className="flex items-start gap-3"
                      >
                        <ArrowRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="font-medium text-foreground">{item.tip}</span>
                          <span className="text-muted-foreground"> - {item.example}</span>
                        </div>
                      </motion.li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Searches */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    Recent Searches
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {recentSearches.map((search, index) => (
                      <motion.li
                        key={index}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.05 * index }}
                        className="p-3 rounded-lg bg-background/30 hover:bg-background/50 transition-colors cursor-pointer"
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-3 w-3 text-primary" />
                              <span className="font-medium text-sm">{search.location}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {search.businessType}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {search.results} found
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">{search.date}</p>
                      </motion.li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                <CardContent className="pt-6">
                  <div className="text-center space-y-2">
                    <p className="text-4xl font-bold text-primary">
                      {recentSearches.reduce((sum, s) => sum + s.results, 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">Total leads found recently</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
