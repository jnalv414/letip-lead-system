import { api } from '@/shared/lib/api'
import type { Business, OutreachMessage, PaginatedResponse } from '@/shared/types'
import type {
  MessageTemplate,
  GenerateMessageRequest,
  GeneratedMessage,
  BusinessOutreachResponse,
  CampaignStats,
  OutreachCampaign,
  OutreachHistoryItem,
} from '../types'

/**
 * Fetch message templates (placeholder - backend may not have this)
 */
export async function fetchMessageTemplates(): Promise<MessageTemplate[]> {
  // Return default templates since backend doesn't have template endpoint
  return [
    {
      id: 'default',
      name: 'Le Tip Introduction',
      subject: 'Business Networking Opportunity',
      body: 'Hi {{businessName}}, I wanted to reach out about a networking opportunity...',
      type: 'email',
      created_at: new Date().toISOString(),
    },
  ]
}

/**
 * Generate outreach message for a business
 * POST /api/outreach/:id
 *
 * @param request - The message generation request
 */
export async function generateMessage(
  request: GenerateMessageRequest
): Promise<GeneratedMessage> {
  return api<GeneratedMessage>(
    `/api/outreach/${request.business_id}`,
    { method: 'POST' }
  )
}

/**
 * Send an outreach message via job queue
 * POST /api/jobs/outreach
 *
 * @param businessId - Business to send message to
 * @param contactId - Contact to send message to
 * @param message - Generated message to send
 * @param type - Channel: email, linkedin, sms
 */
export async function sendMessage(
  businessId: string,
  contactId: string,
  message: GeneratedMessage,
  type: 'email' | 'linkedin' | 'sms'
): Promise<{ jobId: string }> {
  return api<{ jobId: string }>('/api/jobs/outreach', {
    method: 'POST',
    body: {
      businessId: parseInt(businessId, 10),
      contactId: contactId ? parseInt(contactId, 10) : undefined,
      messageId: message.id,
      channel: type,
    },
  })
}

/**
 * Get all outreach messages for a business
 * GET /api/outreach/:id
 */
export async function getBusinessMessages(
  businessId: string
): Promise<BusinessOutreachResponse> {
  return api<BusinessOutreachResponse>(`/api/outreach/${businessId}`)
}

/**
 * Email statistics from backend
 */
interface EmailStatsResponse {
  total: number
  sent: number
  delivered: number
  opened: number
  clicked: number
  bounced: number
  failed: number
}

/**
 * Fetch email/campaign stats from backend
 * GET /api/email/stats
 */
export async function fetchCampaignStats(): Promise<CampaignStats> {
  try {
    const stats = await api<EmailStatsResponse>('/api/email/stats')

    // Calculate rates
    const openRate = stats.delivered > 0 ? (stats.opened / stats.delivered) * 100 : 0
    const replyRate = stats.delivered > 0 ? (stats.clicked / stats.delivered) * 100 : 0

    return {
      total_sent: stats.sent,
      total_delivered: stats.delivered,
      total_opened: stats.opened,
      total_replied: stats.clicked, // Using clicked as reply proxy
      total_failed: stats.failed + stats.bounced,
      open_rate: openRate,
      reply_rate: replyRate,
    }
  } catch {
    // Return zeros if stats endpoint fails
    return {
      total_sent: 0,
      total_delivered: 0,
      total_opened: 0,
      total_replied: 0,
      total_failed: 0,
      open_rate: 0,
      reply_rate: 0,
    }
  }
}

/**
 * Fetch campaigns (placeholder)
 */
export async function fetchCampaigns(): Promise<OutreachCampaign[]> {
  return []
}

/**
 * Fetch enriched businesses for outreach (those with contacts/email)
 * GET /api/businesses?enrichment_status=enriched
 */
export async function fetchEnrichedBusinesses(
  page = 1,
  pageSize = 20
): Promise<PaginatedResponse<Business>> {
  return api<PaginatedResponse<Business>>(
    `/api/businesses?enrichment_status=enriched&page=${page}&pageSize=${pageSize}`
  )
}

/**
 * Fetch outreach message history
 */
export async function fetchOutreachHistory(
  page = 1,
  pageSize = 20
): Promise<PaginatedResponse<OutreachHistoryItem>> {
  // Return empty for now - could be replaced with dedicated endpoint
  return {
    data: [],
    total: 0,
    page,
    pageSize,
  }
}

/**
 * Create a campaign (placeholder)
 */
export async function createCampaign(campaign: Partial<OutreachCampaign>): Promise<OutreachCampaign> {
  return {
    id: crypto.randomUUID(),
    name: campaign.name || 'New Campaign',
    status: 'draft',
    type: campaign.type || 'email',
    template_id: campaign.template_id || 'default',
    target_count: 0,
    sent_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

/**
 * Update campaign status (placeholder)
 */
export async function updateCampaignStatus(
  campaignId: string,
  status: OutreachCampaign['status']
): Promise<void> {
  console.log('Updating campaign status:', { campaignId, status })
}
