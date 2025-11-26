'use client';

import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Lightbulb, Clock, ArrowRight, TrendingUp, Sparkles } from 'lucide-react';
import { AppShell } from '@/components/layout';
import { PageHeader } from '@/components/shared/page-header';
import { SearchForm, ScrapeProgress } from '@/components/search';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  const { progress, startScrape, isStarting, resetProgress } = useScraping();

  const handleSearch = useCallback(
    (data: ScrapingFormData) => {
      startScrape({
        location: data.location,
        business_type: data.businessType,
        radius: data.radius,
        max_results: data.maxResults,
      });
    },
    [startScrape]
  );

  const isSearching = progress.status !== 'idle';

  return (
    <AppShell title="Search">
      {/* Page Header */}
      <PageHeader
        title="Search"
        subtitle="Find new business leads from Google Maps"
      />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Main Search Form */}
          <div className="lg:col-span-2">
            {!isSearching ? (
              <SearchForm onSubmit={handleSearch} isLoading={isStarting} />
            ) : (
              <ScrapeProgress progress={progress} onReset={resetProgress} />
            )}

            {/* Search Tips */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
              className="mt-6"
            >
              <Card className="glass-card-glow rounded-2xl">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <motion.div
                      className="p-2 rounded-xl bg-amber-500/20"
                      animate={{ rotate: [0, 5, -5, 0] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    >
                      <Lightbulb className="h-5 w-5 text-amber-400" />
                    </motion.div>
                    <span>Search Tips</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="space-y-4">
                    {searchTips.map((item, index) => (
                      <motion.li
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15 + 0.1 * index, duration: 0.3 }}
                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-background/20 transition-colors"
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
              transition={{ duration: 0.4, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
            >
              <Card className="glass-card-premium rounded-2xl">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <motion.div
                      className="p-2 rounded-xl bg-accent-blue/20"
                      whileHover={{ scale: 1.05 }}
                    >
                      <Clock className="h-5 w-5 text-accent-blue" />
                    </motion.div>
                    <span>Recent Searches</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="space-y-3">
                    {recentSearches.map((search, index) => (
                      <motion.li
                        key={index}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.25 + 0.08 * index, duration: 0.3 }}
                        whileHover={{ scale: 1.02, x: 4 }}
                        className="p-4 rounded-xl bg-background/20 hover:bg-background/40 transition-all duration-300 cursor-pointer inner-glow border border-white/5 hover:border-primary/30"
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-3.5 w-3.5 text-primary" />
                              <span className="font-medium text-sm">{search.location}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {search.businessType}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className="text-xs border-highlight-emerald/30 text-highlight-emerald bg-highlight-emerald/10"
                          >
                            {search.results} found
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-3">{search.date}</p>
                      </motion.li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick Stats - Enhanced */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3, ease: [0.4, 0, 0.2, 1] }}
              whileHover={{ scale: 1.02 }}
            >
              <Card className="glass-card-premium rounded-2xl overflow-hidden gradient-border">
                <CardContent className="pt-6 pb-6 relative">
                  {/* Background glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent-purple/5 to-accent-blue/10 pointer-events-none" />

                  <div className="text-center space-y-3 relative z-10">
                    <motion.div
                      className="inline-flex items-center justify-center p-3 rounded-full bg-primary/20 mb-2"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <TrendingUp className="h-6 w-6 text-primary" />
                    </motion.div>
                    <motion.p
                      className="text-5xl font-bold gradient-text-glow"
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
                    >
                      {recentSearches.reduce((sum, s) => sum + s.results, 0)}
                    </motion.p>
                    <p className="text-sm text-muted-foreground">Total leads found recently</p>
                    <div className="flex items-center justify-center gap-1 text-xs text-highlight-emerald">
                      <Sparkles className="h-3 w-3" />
                      <span>Ready to enrich</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
    </AppShell>
  );
}
