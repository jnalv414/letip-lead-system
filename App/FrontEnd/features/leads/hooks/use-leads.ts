import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchLeads,
  fetchLead,
  createLead,
  updateLead,
  deleteLead,
  bulkDeleteLeads,
  bulkEnrichLeads,
  fetchIndustries,
} from '../api/leads-api'
import type { LeadFilters, CreateLeadInput, UpdateLeadInput } from '../types'

export const leadKeys = {
  all: ['leads'] as const,
  lists: () => [...leadKeys.all, 'list'] as const,
  list: (page: number, pageSize: number, filters?: LeadFilters) =>
    [...leadKeys.lists(), { page, pageSize, filters }] as const,
  details: () => [...leadKeys.all, 'detail'] as const,
  detail: (id: string) => [...leadKeys.details(), id] as const,
  industries: () => [...leadKeys.all, 'industries'] as const,
}

export function useLeads(page = 1, pageSize = 10, filters?: LeadFilters) {
  return useQuery({
    queryKey: leadKeys.list(page, pageSize, filters),
    queryFn: () => fetchLeads(page, pageSize, filters),
    placeholderData: (previousData) => previousData,
  })
}

export function useLead(id: string) {
  return useQuery({
    queryKey: leadKeys.detail(id),
    queryFn: () => fetchLead(id),
    enabled: !!id,
  })
}

export function useIndustries() {
  return useQuery({
    queryKey: leadKeys.industries(),
    queryFn: fetchIndustries,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useCreateLead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateLeadInput) => createLead(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() })
    },
  })
}

export function useUpdateLead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: UpdateLeadInput) => updateLead(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() })
      queryClient.setQueryData(leadKeys.detail(data.id), data)
    },
  })
}

export function useDeleteLead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteLead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() })
    },
  })
}

export function useBulkDeleteLeads() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (ids: string[]) => bulkDeleteLeads(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() })
    },
  })
}

export function useBulkEnrichLeads() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (ids: string[]) => bulkEnrichLeads(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() })
    },
  })
}
