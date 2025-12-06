// Outreach feature types
import type { Business, Contact, OutreachMessage } from '@/shared/types'

/**
 * Message template for outreach
 */
export interface MessageTemplate {
  id: string
  name: string
  subject?: string
  body: string
  type: 'email' | 'linkedin' | 'sms'
  created_at: string
}

/**
 * Request to generate a message
 */
export interface GenerateMessageRequest {
  business_id: string
  contact_id?: string
  template_id?: string
  message_type: 'email' | 'linkedin' | 'sms'
  custom_prompt?: string
}

/**
 * Generated outreach message from backend
 * Matches OutreachMessageDto
 */
export interface GeneratedMessage {
  id: number
  businessId: number
  subject: string
  body: string
  createdAt: string
}

/**
 * Response from GET /api/outreach/:id
 * Contains business info and all messages
 */
export interface BusinessOutreachResponse {
  business: {
    id: number
    name: string
    email: string | null
    enrichmentStatus: string
  }
  messages: GeneratedMessage[]
  totalMessages: number
}

/**
 * Campaign statistics
 */
export interface CampaignStats {
  total_sent: number
  total_delivered: number
  total_opened: number
  total_replied: number
  total_failed: number
  open_rate: number
  reply_rate: number
}

/**
 * Outreach campaign
 */
export interface OutreachCampaign {
  id: string
  name: string
  status: 'draft' | 'active' | 'paused' | 'completed'
  type: 'email' | 'linkedin' | 'sms'
  template_id: string
  target_count: number
  sent_count: number
  created_at: string
  updated_at: string
}

/**
 * Outreach history item for display
 */
export interface OutreachHistoryItem extends OutreachMessage {
  business?: Business
  contact?: Contact
}
