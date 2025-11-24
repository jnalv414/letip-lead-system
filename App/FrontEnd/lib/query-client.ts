/**
 * TanStack Query Client Configuration
 *
 * Global QueryClient instance with optimized defaults for Le Tip dashboard.
 * Configured for 5-minute stale time, 10-minute garbage collection, and 3 retries.
 *
 * @usage
 * import { queryClient } from '@/lib/query-client';
 */

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes before considering stale
      staleTime: 5 * 60 * 1000, // 5 minutes

      // Keep unused data in cache for 10 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)

      // Retry failed queries 3 times with exponential backoff
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Refetch on window focus for fresh data
      refetchOnWindowFocus: true,

      // Don't refetch on reconnect (already handled by window focus)
      refetchOnReconnect: false,

      // Don't refetch on mount if data is fresh
      refetchOnMount: false,
    },
    mutations: {
      // Retry failed mutations once
      retry: 1,
      retryDelay: 1000,

      // Global error handling
      onError: (error: any) => {
        console.error('Mutation error:', error);
        // Future: Add toast notification here
      },
    },
  },
});
