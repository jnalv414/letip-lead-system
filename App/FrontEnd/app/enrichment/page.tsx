'use client';

import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Info } from 'lucide-react';
import { AppShell } from '@/components/layout';
import { PageHeader } from '@/components/shared/page-header';
import { EnrichmentStats, EnrichmentQueue, BatchControls } from '@/components/enrichment';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useStats } from '@/features/dashboard-analytics';
import { useBusinesses } from '@/features/business-management';
import { useEnrichBusiness, useBatchEnrichment } from '@/features/lead-enrichment';

export default function EnrichmentPage() {
  const { data: stats, isLoading: statsLoading } = useStats();
  const { data: businessesData, isLoading: businessesLoading } = useBusinesses({
    enrichment_status: 'pending',
    limit: 50,
  });

  const enrichBusiness = useEnrichBusiness();
  const batchEnrichment = useBatchEnrichment();

  const handleEnrichSingle = useCallback(
    (businessId: number) => {
      enrichBusiness.mutate(businessId);
    },
    [enrichBusiness]
  );

  const handleStartBatch = useCallback(
    (count: number) => {
      batchEnrichment.mutate(count);
    },
    [batchEnrichment]
  );

  const defaultStats = {
    totalBusinesses: 0,
    enrichedBusinesses: 0,
    pendingEnrichment: 0,
    totalContacts: 0,
    messagesSent: 0,
    messagesPending: 0,
  };

  const pendingBusinesses = businessesData?.data || [];

  return (
    <AppShell title="Enrichment">
      {/* Page Header */}
      <PageHeader
        title="Enrichment"
        subtitle="Discover contacts and company data for your leads"
      />

      {/* Stats Section */}
      <EnrichmentStats stats={stats || defaultStats} isLoading={statsLoading} className="mb-8" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Enrichment Queue */}
        <div className="lg:col-span-2">
          <EnrichmentQueue
            businesses={pendingBusinesses}
            onEnrich={handleEnrichSingle}
            isEnriching={enrichBusiness.isPending}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Batch Controls */}
          <BatchControls
            onStartBatch={handleStartBatch}
            isPending={batchEnrichment.isPending}
            pendingCount={stats?.pendingEnrichment || 0}
          />

          {/* Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Card className="glass-card-premium rounded-2xl gradient-border">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2.5 text-lg">
                  <Info className="h-5 w-5 text-blue-400" />
                  How It Works
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground pt-0">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <p>
                    <strong className="text-foreground">Hunter.io</strong> discovers
                    email addresses from company domains
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <p>
                    <strong className="text-foreground">AbstractAPI</strong> provides
                    company firmographics (industry, size, etc.)
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <p>
                    Enrichment requires a valid website URL on the business record
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </AppShell>
  );
}
