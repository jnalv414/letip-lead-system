/**
 * Generate Outreach Message Mutation Hook
 *
 * TanStack mutation hook for generating outreach messages.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { OutreachMessage } from '@/types/api';

interface GenerateMessageVariables {
  businessId: number;
  regenerate?: boolean;
}

export function useGenerateMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ businessId, regenerate = false }: GenerateMessageVariables) =>
      api.generateMessage(businessId, regenerate),
    onSuccess: (data, variables) => {
      // Invalidate outreach messages query
      queryClient.invalidateQueries({
        queryKey: ['outreach', 'messages', variables.businessId],
      });
      // Invalidate stats (messages count may have changed)
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}

export type { GenerateMessageVariables };
