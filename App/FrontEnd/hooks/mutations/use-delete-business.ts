/**
 * useDeleteBusiness Mutation Hook
 *
 * Deletes business with optimistic update and rollback on error.
 * Immediately removes from cache, then restores if deletion fails.
 *
 * @usage
 * const deleteBusiness = useDeleteBusiness();
 *
 * const handleDelete = async (businessId: number) => {
 *   if (confirm('Are you sure?')) {
 *     await deleteBusiness.mutateAsync(businessId);
 *   }
 * };
 */

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import type { Business, PaginatedResponse } from '@/types/api';

export const useDeleteBusiness = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => api.deleteBusiness(id),

    // Optimistic update: remove business from cache before API call
    onMutate: async (deletedId: number) => {
      // Cancel outgoing refetches so they don't overwrite optimistic update
      await queryClient.cancelQueries({ queryKey: ['businesses'] });

      // Snapshot current businesses list for rollback
      const previousBusinesses = queryClient.getQueriesData<PaginatedResponse<Business>>({
        queryKey: ['businesses'],
      });

      // Optimistically remove business from all business list queries
      queryClient.setQueriesData<PaginatedResponse<Business>>(
        { queryKey: ['businesses'] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.filter((b) => b.id !== deletedId),
            meta: {
              ...old.meta,
              total: old.meta.total - 1,
            },
          };
        }
      );

      // Remove single business cache
      queryClient.removeQueries({ queryKey: ['businesses', deletedId] });

      // Return context for rollback
      return { previousBusinesses };
    },

    onSuccess: () => {
      // Invalidate stats to update dashboard counts
      queryClient.invalidateQueries({ queryKey: ['stats'] });

      // Show success notification
      toast.success('Business deleted', {
        description: 'The business has been removed successfully.',
      });
    },

    onError: (error: any, deletedId, context) => {
      // Rollback optimistic update on error
      if (context?.previousBusinesses) {
        context.previousBusinesses.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      // Show error notification
      toast.error('Failed to delete business', {
        description: error.response?.data?.message || error.message || 'Please try again.',
      });
    },

    onSettled: () => {
      // Always refetch businesses list and stats after mutation settles
      queryClient.invalidateQueries({ queryKey: ['businesses'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
};
