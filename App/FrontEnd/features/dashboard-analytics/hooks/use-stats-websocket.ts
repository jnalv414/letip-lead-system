/**
 * Dashboard Stats WebSocket Hook
 */

'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useWebSocket } from '@/core/providers/websocket-provider';
import { statsKeys } from './use-stats';
import type { StatsEvent } from '@/core/types/global.types';

/**
 * Hook to listen for real-time stats updates via WebSocket
 */
export function useStatsWebSocket() {
  const { socket, isConnected } = useWebSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleStatsUpdated = (event: StatsEvent) => {
      console.log('[Stats WebSocket] Stats updated:', event.data);

      // Update cached stats
      queryClient.setQueryData(statsKeys.current(), event.data);
    };

    // Subscribe to stats updates
    socket.on('stats:updated', handleStatsUpdated);

    // Also invalidate on business events
    const handleBusinessEvent = () => {
      queryClient.invalidateQueries({ queryKey: statsKeys.current() });
    };

    socket.on('business:created', handleBusinessEvent);
    socket.on('business:enriched', handleBusinessEvent);
    socket.on('business:deleted', handleBusinessEvent);

    // Cleanup
    return () => {
      socket.off('stats:updated', handleStatsUpdated);
      socket.off('business:created', handleBusinessEvent);
      socket.off('business:enriched', handleBusinessEvent);
      socket.off('business:deleted', handleBusinessEvent);
    };
  }, [socket, isConnected, queryClient]);

  return { isConnected };
}
