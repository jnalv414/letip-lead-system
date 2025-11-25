'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  Search,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { Business } from '@/types/api';

interface BusinessSelectorProps {
  businesses: Business[];
  onSelect: (business: Business) => void;
  selectedBusinessId?: number;
  isLoading?: boolean;
  className?: string;
}

export function BusinessSelector({
  businesses,
  onSelect,
  selectedBusinessId,
  isLoading,
  className,
}: BusinessSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter only enriched businesses and apply search
  const filteredBusinesses = useMemo(() => {
    const enrichedBusinesses = businesses.filter(
      (b) => b.enrichment_status === 'enriched'
    );

    if (!searchQuery.trim()) {
      return enrichedBusinesses;
    }

    const query = searchQuery.toLowerCase();
    return enrichedBusinesses.filter(
      (b) =>
        b.name.toLowerCase().includes(query) ||
        b.city?.toLowerCase().includes(query)
    );
  }, [businesses, searchQuery]);

  const enrichedCount = businesses.filter(
    (b) => b.enrichment_status === 'enriched'
  ).length;

  if (isLoading) {
    return (
      <Card className={cn('bg-card/50 backdrop-blur-sm border-border/50', className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            Select Business
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton data-testid="skeleton" className="h-10 w-full" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-background/30">
              <Skeleton data-testid="skeleton" className="h-10 w-10 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton data-testid="skeleton" className="h-4 w-32" />
                <Skeleton data-testid="skeleton" className="h-3 w-24" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('bg-card/50 backdrop-blur-sm border-border/50', className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <span>Select Business</span>
          </div>
          <Badge variant="outline" className="text-primary border-primary/50">
            {enrichedCount} enriched
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search businesses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background/30 border border-border/50 rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* Business List */}
        {filteredBusinesses.length === 0 ? (
          <div className="text-center py-8">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">No businesses found</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              {searchQuery ? 'Try a different search term' : 'Enrich businesses first'}
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[350px] overflow-y-auto pr-2">
            <AnimatePresence>
              {filteredBusinesses.map((business, index) => {
                const isSelected = selectedBusinessId === business.id;

                return (
                  <motion.button
                    key={business.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.03 }}
                    onClick={() => onSelect(business)}
                    className={cn(
                      'w-full p-3 rounded-lg text-left transition-colors',
                      isSelected
                        ? 'bg-primary/20 border border-primary/50'
                        : 'bg-background/30 hover:bg-background/50 border border-transparent'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/20">
                        <Building2 className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-foreground truncate">
                            {business.name}
                          </span>
                          {isSelected && (
                            <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                          )}
                        </div>
                        {business.city && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3 w-3" />
                            {business.city}
                            {business.state && `, ${business.state}`}
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default BusinessSelector;
