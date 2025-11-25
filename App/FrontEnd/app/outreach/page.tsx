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
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center gap-4"
      >
        <div className="p-3 rounded-xl bg-primary/20">
          <Mail className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Outreach</h1>
          <p className="text-muted-foreground">
            Generate personalized outreach messages for enriched businesses
          </p>
        </div>
      </motion.div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <MessageSquare className="h-4 w-4 text-blue-400" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Template-Based</p>
                  <p className="text-xs text-muted-foreground mt-1">
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
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-green-500/20">
                  <Sparkles className="h-4 w-4 text-green-400" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Le Tip Focused</p>
                  <p className="text-xs text-muted-foreground mt-1">
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
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-amber-500/20">
                  <Info className="h-4 w-4 text-amber-400" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Copy & Send</p>
                  <p className="text-xs text-muted-foreground mt-1">
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
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardContent className="py-12">
                <div className="text-center">
                  <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">
                    Select a business to generate messages
                  </p>
                  <p className="text-sm text-muted-foreground/70 mt-1">
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
    </div>
  );
}
