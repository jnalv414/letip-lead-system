// Shared type definitions that mirror backend entities

export interface Business {
  id: string
  name: string
  address: string | null
  phone: string | null
  website: string | null
  email: string | null
  latitude: number | null
  longitude: number | null
  enrichment_status: 'pending' | 'enriched' | 'failed'
  industry: string | null
  employee_count: number | null
  year_founded: number | null
  created_at: string
  updated_at: string
}

export interface Contact {
  id: string
  business_id: string
  first_name: string | null
  last_name: string | null
  email: string
  position: string | null
  confidence: number | null
  created_at: string
}

export interface EnrichmentLog {
  id: string
  business_id: string
  source: string
  status: 'success' | 'failed'
  error_message: string | null
  created_at: string
}

export interface OutreachMessage {
  id: string
  business_id: string
  message_type: string
  content: string
  status: 'draft' | 'sent' | 'failed'
  created_at: string
}

// API Response types
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

// WebSocket event types
export type WebSocketEvent =
  | 'business:created'
  | 'business:updated'
  | 'business:deleted'
  | 'enrichment:completed'
  | 'enrichment:failed'
  | 'scrape:progress'
  | 'scrape:completed'
