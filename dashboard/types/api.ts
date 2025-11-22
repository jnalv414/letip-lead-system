/**
 * API Type Definitions
 *
 * Complete TypeScript interfaces matching backend Prisma schema and API responses.
 */

// ============================================================================
// Database Models
// ============================================================================

export interface Business {
  id: number;
  name: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  phone?: string | null;
  website?: string | null;
  business_type?: string | null;
  industry?: string | null;
  employee_count?: number | null;
  year_founded?: number | null;
  google_maps_url?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  enrichment_status: 'pending' | 'enriched' | 'failed';
  source: string;
  created_at: string;
  updated_at: string;
  contacts?: Contact[];
  enrichment_logs?: EnrichmentLog[];
  outreach_messages?: OutreachMessage[];
  _count?: {
    contacts?: number;
    enrichment_logs?: number;
    outreach_messages?: number;
  };
}

export interface Contact {
  id: number;
  business_id: number;
  name?: string | null;
  title?: string | null;
  email?: string | null;
  email_verified?: boolean | null;
  phone?: string | null;
  linkedin_url?: string | null;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
  business?: Business;
}

export interface EnrichmentLog {
  id: number;
  business_id: number;
  service: 'hunter' | 'abstract' | string;
  status: 'success' | 'failed';
  request_data?: string | null;
  response_data?: string | null;
  error_message?: string | null;
  created_at: string;
  business?: Business;
}

export interface OutreachMessage {
  id: number;
  business_id: number;
  contact_id?: number | null;
  message_text: string;
  generated_at: string;
  sent_at?: string | null;
  status: 'generated' | 'sent' | 'failed';
  business?: Business;
  contact?: Contact | null;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface Stats {
  total: number;
  enriched: number;
  pending: number;
  failed: number;
  totalContacts: number;
  messagesSent: number;
  byCity: Array<{ city: string; count: number }>;
  byIndustry: Array<{ industry: string; count: number }>;
}

// ============================================================================
// Request DTOs
// ============================================================================

export interface CreateBusinessDto {
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
  website?: string;
  business_type?: string;
  industry?: string;
  google_maps_url?: string;
  latitude?: number;
  longitude?: number;
}

export interface UpdateBusinessDto extends Partial<CreateBusinessDto> {
  enrichment_status?: 'pending' | 'enriched' | 'failed';
}

export interface QueryBusinessesDto {
  page?: number;
  limit?: number;
  city?: string;
  industry?: string;
  enrichment_status?: 'pending' | 'enriched' | 'failed';
  search?: string;
}

export interface ScrapeRequestDto {
  location: string;
  radius?: number;
  business_type?: string;
  max_results?: number;
}

// ============================================================================
// Scraping & Job Types
// ============================================================================

export interface ScrapeResponse {
  jobId: string;
  status: 'initiated' | 'active' | 'waiting';
  message: string;
  found?: number;
  saved?: number;
}

export interface JobStatus {
  jobId: string;
  status: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed';
  progress: number;
  data?: any;
  result?: any;
  failedReason?: string;
  createdAt?: string;
  processedAt?: string;
  finishedAt?: string;
}

// ============================================================================
// Enrichment Types
// ============================================================================

export interface EnrichmentResult {
  success: boolean;
  abstract?: boolean;
  hunter?: boolean;
  errors?: string[];
  contactsFound?: number;
}

export interface BatchEnrichmentDto {
  count: number;
}

export interface BatchEnrichmentResult {
  total: number;
  enriched: number;
  failed: number;
  errors: string[];
}

// ============================================================================
// WebSocket Event Types
// ============================================================================

export interface WebSocketEvent<T = any> {
  timestamp: string;
  type: string;
  data: T;
}

export type BusinessEvent = WebSocketEvent<Business>;
export type StatsEvent = WebSocketEvent<Stats>;
export type ProgressEvent = WebSocketEvent<{ progress: number; message: string }>;
