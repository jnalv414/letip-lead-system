/**
 * Outreach Messages Query Hook
 *
 * TanStack query hook for fetching outreach messages for a business.
 */

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { OutreachMessage } from '@/types/api';

export interface OutreachMessagesResponse {
  business: {
    id: number;
    name: string;
    city: string | null;
  };
  messages: OutreachMessage[];
}

export const outreachKeys = {
  all: ['outreach'] as const,
  messages: (businessId: number) =>
    [...outreachKeys.all, 'messages', businessId] as const,
};

export function useOutreachMessages(businessId: number, enabled: boolean = true) {
  return useQuery({
    queryKey: outreachKeys.messages(businessId),
    queryFn: () => api.getOutreachMessages(businessId),
    enabled: enabled && businessId > 0,
    staleTime: 30000,
  });
}

export type UseOutreachMessagesData = OutreachMessagesResponse;
