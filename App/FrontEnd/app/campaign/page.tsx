'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Megaphone, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppShell } from '@/components/layout';
import { CampaignStats, OutreachFunnel, MessageStatusList } from '@/components/campaign';
import { useBusinesses } from '@/hooks/queries/use-businesses';
import { useOutreachMessages } from '@/hooks/queries/use-outreach-messages';
import { useStats } from '@/hooks/queries/use-stats';

export default function CampaignPage() {
  // Fetch businesses for the business map
  const { data: businessesData, isLoading: businessesLoading, refetch: refetchBusinesses } = useBusinesses();
  const { data: statsData, isLoading: statsLoading, refetch: refetchStats } = useStats();

  // Get all enriched businesses to fetch their messages
  const enrichedBusinesses = useMemo(() => {
    if (!businessesData?.businesses) return [];
    return businessesData.businesses.filter(b => b.enrichment_status === 'enriched');
  }, [businessesData]);

  // For now, get messages from the first enriched business if available
  // In a real app, you'd aggregate messages from all businesses or have a dedicated endpoint
  const firstEnrichedId = enrichedBusinesses[0]?.id;
  const { data: messagesData, isLoading: messagesLoading } = useOutreachMessages(
    firstEnrichedId || 0,
    !!firstEnrichedId
  );

  // Build business map for the message status list
  const businessMap = useMemo(() => {
    if (!businessesData?.businesses) return {};
    const map: Record<number, { name: string; city: string }> = {};
    businessesData.businesses.forEach(b => {
      map[b.id] = { name: b.name, city: b.city || '' };
    });
    return map;
  }, [businessesData]);

  // Calculate campaign stats from real data
  const campaignStats = useMemo(() => {
    const messages = messagesData?.messages || [];
    const totalMessages = messages.length;
    const sentMessages = messages.filter(m => m.status === 'sent').length;
    const pendingMessages = messages.filter(m => m.status === 'generated').length;
    const failedMessages = messages.filter(m => m.status === 'failed').length;

    // Calculate response rate (mock for now - would need tracking)
    const responseRate = sentMessages > 0 ? Math.round((sentMessages / totalMessages) * 10) : 0;

    return {
      totalMessages,
      sentMessages,
      pendingMessages,
      failedMessages,
      responseRate,
    };
  }, [messagesData]);

  // Calculate funnel data
  const funnelData = useMemo(() => {
    const messages = messagesData?.messages || [];
    return {
      generated: messages.length,
      sent: messages.filter(m => m.status === 'sent').length,
      opened: Math.floor(messages.filter(m => m.status === 'sent').length * 0.6), // Mock: 60% open rate
      responded: Math.floor(messages.filter(m => m.status === 'sent').length * 0.15), // Mock: 15% response rate
    };
  }, [messagesData]);

  const isLoading = businessesLoading || statsLoading || messagesLoading;

  const handleRefresh = () => {
    refetchBusinesses();
    refetchStats();
  };

  return (
    <AppShell title="Campaign">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20">
              <Megaphone className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Campaign Overview</h1>
              <p className="text-sm text-muted-foreground">
                Track your outreach performance and message status
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Campaign Stats */}
        <CampaignStats stats={campaignStats} isLoading={isLoading} />

        {/* Two Column Layout: Funnel + Message List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <OutreachFunnel data={funnelData} isLoading={isLoading} />
          <MessageStatusList
            messages={messagesData?.messages || []}
            businessMap={businessMap}
            isLoading={isLoading}
          />
        </div>
      </motion.div>
    </AppShell>
  );
}
