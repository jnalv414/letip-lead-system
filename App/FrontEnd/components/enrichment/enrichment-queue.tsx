'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, MapPin, Sparkles, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Business } from '@/types/api';

interface EnrichmentQueueProps {
  businesses: Business[];
  onEnrich: (businessId: number) => void;
  isEnriching: boolean;
  className?: string;
}

export function EnrichmentQueue({
  businesses,
  onEnrich,
  isEnriching,
  className,
}: EnrichmentQueueProps) {
  const pendingBusinesses = businesses.filter((b) => b.enrichment_status === 'pending');

  return (
    <Card className={cn('bg-card/50 backdrop-blur-sm border-border/50', className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-400" />
            <span>Enrichment Queue</span>
          </div>
          <Badge variant="outline" className="text-amber-400 border-amber-400/50">
            {pendingBusinesses.length} pending
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {pendingBusinesses.length === 0 ? (
          <div className="text-center py-8">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">No pending businesses to enrich</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              All leads have been processed
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            <AnimatePresence>
              {pendingBusinesses.map((business, index) => (
                <motion.div
                  key={business.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className="flex items-center justify-between p-3 rounded-lg bg-background/30 hover:bg-background/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{business.name}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>{business.city || 'Unknown location'}</span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onEnrich(business.id)}
                    disabled={isEnriching}
                    className="ml-3 gap-1"
                  >
                    <Sparkles className="h-3 w-3" />
                    Enrich
                  </Button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default EnrichmentQueue;
