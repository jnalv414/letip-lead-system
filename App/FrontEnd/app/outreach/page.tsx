'use client'

import { useState, useCallback } from 'react'
import { Info } from 'lucide-react'
import { AppShell } from '@/shared/components/layout'
import { useAuth } from '@/features/auth'
import {
  CampaignStatsCard,
  BusinessSelector,
  MessageGenerator,
  MessageHistory,
  useCampaignStats,
  useMessageTemplates,
  useOutreachHistory,
  useGenerateMessage,
  useSendMessage,
} from '@/features/outreach'
import { useLeads } from '@/features/leads'
import { useEnrichmentResult } from '@/features/enrichment'
import type { Business } from '@/shared/types'
import type { GeneratedMessage } from '@/features/outreach'

export default function OutreachPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null)
  const [generatedMessage, setGeneratedMessage] = useState<GeneratedMessage | null>(null)
  const [historyPage, setHistoryPage] = useState(1)

  // Queries
  const { data: stats, isLoading: statsLoading } = useCampaignStats()
  const { data: templates = [] } = useMessageTemplates()
  const { data: history, isLoading: historyLoading } = useOutreachHistory(historyPage)
  const { data: leadsData, isLoading: leadsLoading } = useLeads(1, 100, {
    enrichment_status: 'enriched',
  })
  const { data: enrichmentResult } = useEnrichmentResult(selectedBusiness?.id ?? '')

  // Mutations
  const generateMessage = useGenerateMessage()
  const sendMessage = useSendMessage()

  const handleSelectBusiness = useCallback((business: Business) => {
    setSelectedBusiness(business)
    setGeneratedMessage(null)
  }, [])

  const handleGenerate = useCallback(
    async (contactId: string, templateId: string, type: 'email' | 'linkedin' | 'sms') => {
      if (!selectedBusiness) return

      try {
        const result = await generateMessage.mutateAsync({
          business_id: selectedBusiness.id,
          contact_id: contactId,
          template_id: templateId || undefined,
          message_type: type,
        })
        setGeneratedMessage(result)
      } catch (error) {
        console.error('Failed to generate message:', error)
      }
    },
    [selectedBusiness, generateMessage]
  )

  const handleSend = useCallback(
    async (contactId: string, message: GeneratedMessage, type: 'email' | 'linkedin' | 'sms') => {
      if (!selectedBusiness) return

      try {
        await sendMessage.mutateAsync({
          businessId: selectedBusiness.id,
          contactId,
          message,
          type,
        })
        setGeneratedMessage(null)
      } catch (error) {
        console.error('Failed to send message:', error)
      }
    },
    [selectedBusiness, sendMessage]
  )

  return (
    <AppShell title="Outreach">
      <div className="space-y-6">
        {!isAdmin && (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <Info className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <p className="text-sm">Only administrators can generate and send outreach messages.</p>
          </div>
        )}

        {/* Stats */}
        <CampaignStatsCard stats={stats} isLoading={statsLoading} />

        {/* Main content */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Business Selector */}
          <BusinessSelector
            businesses={leadsData?.data}
            selectedBusiness={selectedBusiness}
            onSelect={handleSelectBusiness}
            isLoading={leadsLoading}
          />

          {/* Message Generator */}
          <MessageGenerator
            business={selectedBusiness}
            contacts={enrichmentResult?.contacts ?? []}
            templates={templates}
            generatedMessage={generatedMessage}
            onGenerate={handleGenerate}
            onSend={handleSend}
            isGenerating={generateMessage.isPending}
            isSending={sendMessage.isPending}
            isAdmin={isAdmin}
          />

          {/* Message History */}
          <MessageHistory
            history={history}
            isLoading={historyLoading}
            page={historyPage}
            onPageChange={setHistoryPage}
          />
        </div>
      </div>
    </AppShell>
  )
}
