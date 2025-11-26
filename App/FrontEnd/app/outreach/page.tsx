'use client';

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Mail,
  Sparkles,
  MessageSquare,
  Info,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { AppShell } from '@/components/layout';
import { useBusinesses } from '@/hooks/queries';
import { useGenerateMessage } from '@/hooks/mutations';
import { useOutreachMessages } from '@/hooks/queries/use-outreach-messages';
import {
  BusinessSelector,
  MessageGenerator,
  MessagePreview,
  MessageHistory,
} from '@/components/outreach';
import type { Business, OutreachMessage } from '@/types/api';

export default function OutreachPage() {
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<OutreachMessage | null>(null);

  // Fetch enriched businesses
  const { data: businessesData, isLoading: businessesLoading } = useBusinesses({
    enrichment_status: 'enriched',
    limit: 100,
  });

  // Fetch outreach messages for selected business
  const {
    data: outreachData,
    isLoading: messagesLoading,
  } = useOutreachMessages(selectedBusiness?.id || 0, !!selectedBusiness);

  // Generate message mutation
  const generateMessage = useGenerateMessage();

  const handleBusinessSelect = useCallback((business: Business) => {
    setSelectedBusiness(business);
    setSelectedMessage(null);
  }, []);

  const handleGenerateMessage = useCallback(
    async (businessId: number, regenerate: boolean) => {
      try {
        const message = await generateMessage.mutateAsync({
          businessId,
          regenerate,
        });
        setSelectedMessage(message);
        toast.success('Message generated successfully!');
      } catch (error) {
        toast.error('Failed to generate message');
        console.error('Generate message error:', error);
      }
    },
    [generateMessage]
  );

  const handleMessageSelect = useCallback((message: OutreachMessage) => {
    setSelectedMessage(message);
  }, []);

  const businesses = businessesData?.data || [];
  const messages = outreachData?.messages || [];

  // Set initial selected message to most recent
  React.useEffect(() => {
    if (messages.length > 0 && !selectedMessage) {
      const sortedMessages = [...messages].sort(
        (a, b) => new Date(b.generated_at).getTime() - new Date(a.generated_at).getTime()
      );
      setSelectedMessage(sortedMessages[0]);
    }
  }, [messages, selectedMessage]);

  return (
    <AppShell title="Outreach">

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="glass-card rounded-2xl h-full">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-blue-500/20 shrink-0">
                  <MessageSquare className="h-5 w-5 text-blue-400" />
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-foreground">Template-Based</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Messages are personalized with business data
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
        >
          <Card className="glass-card rounded-2xl h-full">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-green-500/20 shrink-0">
                  <Sparkles className="h-5 w-5 text-green-400" />
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-foreground">Le Tip Focused</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Crafted for networking invitations
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="glass-card rounded-2xl h-full">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-amber-500/20 shrink-0">
                  <Info className="h-5 w-5 text-amber-400" />
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-foreground">Copy & Send</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Copy message to clipboard and send via email
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Business Selection */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.25 }}
          className="lg:col-span-1"
        >
          <BusinessSelector
            businesses={businesses}
            onSelect={handleBusinessSelect}
            selectedBusinessId={selectedBusiness?.id}
            isLoading={businessesLoading}
          />
        </motion.div>

        {/* Middle Column - Generator + History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="lg:col-span-1 space-y-6"
        >
          {selectedBusiness ? (
            <>
              <MessageGenerator
                business={selectedBusiness}
                onGenerate={handleGenerateMessage}
                isGenerating={generateMessage.isPending}
              />
              <MessageHistory
                messages={messages}
                onSelectMessage={handleMessageSelect}
                selectedMessageId={selectedMessage?.id}
                isLoading={messagesLoading}
              />
            </>
          ) : (
            <Card className="glass-card rounded-2xl">
              <CardContent className="p-8">
                <div className="text-center py-6">
                  <div className="p-4 rounded-2xl bg-amber-500/10 w-fit mx-auto mb-5">
                    <AlertTriangle className="h-10 w-10 text-amber-400" />
                  </div>
                  <p className="text-foreground font-medium mb-2">
                    Select a business to generate messages
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Only enriched businesses are shown
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* Right Column - Message Preview */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.35 }}
          className="lg:col-span-1"
        >
          <MessagePreview
            message={selectedMessage}
            isLoading={messagesLoading && !selectedMessage}
          />
        </motion.div>
      </div>
    </AppShell>
  );
}
