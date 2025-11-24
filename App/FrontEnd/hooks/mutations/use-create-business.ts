/**
 * useCreateBusiness Mutation Hook
 *
 * Creates a new business and invalidates related queries.
 * Shows toast notification on success/error.
 *
 * @usage
 * const createBusiness = useCreateBusiness();
 *
 * const handleCreate = async () => {
 *   await createBusiness.mutateAsync({
 *     name: 'ABC Plumbing',
 *     city: 'Freehold',
 *     phone: '555-1234'
 *   });
 * };
 */

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import type { CreateBusinessDto, Business } from '@/types/api';

export const useCreateBusiness = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (business: CreateBusinessDto) => api.createBusiness(business),

    onSuccess: (newBusiness: Business) => {
      // Invalidate businesses list to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['businesses'] });

      // Invalidate stats to update dashboard counts
      queryClient.invalidateQueries({ queryKey: ['stats'] });

      // Show success notification
      toast.success('Business created', {
        description: `${newBusiness.name} has been added successfully.`,
      });
    },

    onError: (error: any) => {
      // Show error notification
      toast.error('Failed to create business', {
        description: error.response?.data?.message || error.message || 'Please try again.',
      });
    },
  });
};
