/**
 * Business WebSocket Hook
 *
 * Subscribes to real-time business events and updates cache.
 */

'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useWebSocket } from '@/core/providers/websocket-provider';
import { businessKeys } from './use-businesses';
import type { Business, BusinessEvent } from '@/core/types/global.types';

/**
 * Hook to listen for real-time business updates via WebSocket
 */
export function useBusinessWebSocket() {
  const { socket, isConnected } = useWebSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket || !isConnected) return;

    // Handle business created event
    const handleBusinessCreated = (event: BusinessEvent) => {
      console.log('[Business WebSocket] Business created:', event.data);

      // Invalidate business lists to refetch with new data
      queryClient.invalidateQueries({ queryKey: businessKeys.lists() });
    };

    // Handle business updated/enriched event
    const handleBusinessUpdated = (event: BusinessEvent) => {
      console.log('[Business WebSocket] Business updated:', event.data);

      const business = event.data;

      // Update cached business detail if it exists
      queryClient.setQueryData(businessKeys.detail(business.id), business);

      // Invalidate lists to refetch
      queryClient.invalidateQueries({ queryKey: businessKeys.lists() });
    };

    // Handle business deleted event
    const handleBusinessDeleted = (event: { timestamp: string; type: string; data: { id: number } }) => {
      console.log('[Business WebSocket] Business deleted:', event.data.id);

      // Remove from cache
      queryClient.removeQueries({ queryKey: businessKeys.detail(event.data.id) });

      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: businessKeys.lists() });
    };

    // Subscribe to events
    socket.on('business:created', handleBusinessCreated);
    socket.on('business:updated', handleBusinessUpdated);
    socket.on('business:enriched', handleBusinessUpdated); // Same handler as updated
    socket.on('business:deleted', handleBusinessDeleted);

    // Cleanup on unmount
    return () => {
      socket.off('business:created', handleBusinessCreated);
      socket.off('business:updated', handleBusinessUpdated);
      socket.off('business:enriched', handleBusinessUpdated);
      socket.off('business:deleted', handleBusinessDeleted);
    };
  }, [socket, isConnected, queryClient]);

  return { isConnected };
}
