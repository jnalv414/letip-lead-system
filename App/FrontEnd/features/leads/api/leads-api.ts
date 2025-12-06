import { api } from '@/shared/lib/api'
import type { Business, PaginatedResponse } from '@/shared/types'
import type { LeadFilters, CreateLeadInput, UpdateLeadInput, LeadWithContacts, BulkActionResult } from '../types'

export async function fetchLeads(
  page = 1,
  pageSize = 10,
  filters?: LeadFilters
): Promise<PaginatedResponse<Business>> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(pageSize),
  })

  if (filters?.search) params.set('search', filters.search)
  if (filters?.enrichment_status && filters.enrichment_status !== 'all') {
    params.set('enrichment_status', filters.enrichment_status)
  }
  if (filters?.industry) params.set('industry', filters.industry)
  // Note: Backend doesn't support sorting yet - sortBy/sortOrder ignored

  return api<PaginatedResponse<Business>>(`/api/businesses?${params.toString()}`)
}

export async function fetchLead(id: string): Promise<LeadWithContacts> {
  return api<LeadWithContacts>(`/api/businesses/${id}`)
}

export async function createLead(input: CreateLeadInput): Promise<Business> {
  return api<Business>('/api/businesses', {
    method: 'POST',
    body: input,
  })
}

export async function updateLead({ id, ...data }: UpdateLeadInput): Promise<Business> {
  return api<Business>(`/api/businesses/${id}`, {
    method: 'PATCH',
    body: data,
  })
}

export async function deleteLead(id: string): Promise<void> {
  return api<void>(`/api/businesses/${id}`, {
    method: 'DELETE',
  })
}

export async function bulkDeleteLeads(ids: string[]): Promise<BulkActionResult> {
  return api<BulkActionResult>('/api/businesses/bulk-delete', {
    method: 'POST',
    body: { ids },
  })
}

export async function bulkEnrichLeads(ids: string[]): Promise<BulkActionResult> {
  return api<BulkActionResult>('/api/businesses/bulk-enrich', {
    method: 'POST',
    body: { ids },
  })
}

export async function fetchIndustries(): Promise<string[]> {
  return api<string[]>('/api/businesses/industries')
}
