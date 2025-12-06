import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchMessageTemplates,
  generateMessage,
  sendMessage,
  fetchCampaignStats,
  fetchCampaigns,
  fetchOutreachHistory,
  createCampaign,
  updateCampaignStatus,
} from '../api/outreach-api'
import type { GenerateMessageRequest, GeneratedMessage, OutreachCampaign } from '../types'

export const outreachKeys = {
  all: ['outreach'] as const,
  templates: () => [...outreachKeys.all, 'templates'] as const,
  stats: () => [...outreachKeys.all, 'stats'] as const,
  campaigns: () => [...outreachKeys.all, 'campaigns'] as const,
  history: (page: number, pageSize: number) =>
    [...outreachKeys.all, 'history', { page, pageSize }] as const,
}

export function useMessageTemplates() {
  return useQuery({
    queryKey: outreachKeys.templates(),
    queryFn: fetchMessageTemplates,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useCampaignStats() {
  return useQuery({
    queryKey: outreachKeys.stats(),
    queryFn: fetchCampaignStats,
    refetchInterval: 30000, // Refresh every 30 seconds
  })
}

export function useCampaigns() {
  return useQuery({
    queryKey: outreachKeys.campaigns(),
    queryFn: fetchCampaigns,
  })
}

export function useOutreachHistory(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: outreachKeys.history(page, pageSize),
    queryFn: () => fetchOutreachHistory(page, pageSize),
    placeholderData: (previousData) => previousData,
  })
}

export function useGenerateMessage() {
  return useMutation({
    mutationFn: (request: GenerateMessageRequest) => generateMessage(request),
  })
}

export function useSendMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      businessId,
      contactId,
      message,
      type,
    }: {
      businessId: string
      contactId: string
      message: GeneratedMessage
      type: 'email' | 'linkedin' | 'sms'
    }) => sendMessage(businessId, contactId, message, type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: outreachKeys.stats() })
      queryClient.invalidateQueries({ queryKey: outreachKeys.history(1, 20) })
    },
  })
}

export function useCreateCampaign() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (campaign: Partial<OutreachCampaign>) => createCampaign(campaign),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: outreachKeys.campaigns() })
    },
  })
}

export function useUpdateCampaignStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      campaignId,
      status,
    }: {
      campaignId: string
      status: OutreachCampaign['status']
    }) => updateCampaignStatus(campaignId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: outreachKeys.campaigns() })
    },
  })
}
