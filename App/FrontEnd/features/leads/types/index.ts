// Lead feature specific types
import type { Business, Contact } from '@/shared/types'

export interface LeadFilters {
  search?: string
  enrichment_status?: Business['enrichment_status'] | 'all'
  industry?: string
  sortBy?: 'name' | 'created_at' | 'updated_at'
  sortOrder?: 'asc' | 'desc'
}

export interface LeadWithContacts extends Business {
  contacts?: Contact[]
}

export interface CreateLeadInput {
  name: string
  address?: string
  phone?: string
  website?: string
  email?: string
  industry?: string
}

export interface UpdateLeadInput extends Partial<CreateLeadInput> {
  id: string
}

export interface BulkActionResult {
  success: number
  failed: number
  errors?: string[]
}
