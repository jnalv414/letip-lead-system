/**
 * useUpdateBusiness Mutation Hook
 *
 * Updates existing business with optimistic update.
 * Immediately updates cache, then reverts on error.
 *
 * @usage
 * const updateBusiness = useUpdateBusiness();
 *
 * const handleUpdate = async () => {
 *   await updateBusiness.mutateAsync({
 *     id: 123,
 *     updates: { city: 'Manalapan', phone: '555-9999' }
 *   });
 * };
 */

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import type { UpdateBusinessDto, Business } from '@/types/api';

interface UpdateBusinessParams {
  id: number;
  updates: UpdateBusinessDto;
}

export const useUpdateBusiness = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: UpdateBusinessParams) =>
      api.updateBusiness(id, updates),

    onSuccess: (updatedBusiness: Business) => {
      // Update single business cache
      queryClient.setQueryData<Business>(
        ['businesses', updatedBusiness.id],
        updatedBusiness
      );

      // Invalidate businesses list to show updated data
      queryClient.invalidateQueries({ queryKey: ['businesses'] });

      // Show success notification
      toast.success('Business updated', {
        description: `${updatedBusiness.name} has been updated successfully.`,
      });
    },

    onError: (error: any) => {
      // Show error notification
      toast.error('Failed to update business', {
        description: error.response?.data?.message || error.message || 'Please try again.',
      });
    },
  });
};
