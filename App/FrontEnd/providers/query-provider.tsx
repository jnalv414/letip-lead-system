'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, ReactNode } from 'react';

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Stale time: how long until a query is considered stale
            staleTime: 30 * 1000, // 30 seconds
            // GC time: how long to keep unused data in cache (renamed from cacheTime in v5)
            gcTime: 5 * 60 * 1000, // 5 minutes
            // Retry configuration
            retry: (failureCount, error: any) => {
              // Don't retry on 4xx errors except 429 (rate limit)
              if (error?.status >= 400 && error?.status < 500 && error?.status !== 429) {
                return false;
              }
              // Retry up to 3 times
              return failureCount < 3;
            },
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
            // Refetch on window focus
            refetchOnWindowFocus: false,
            // Refetch on reconnect
            refetchOnReconnect: 'always',
          },
          mutations: {
            // Retry failed mutations once
            retry: 1,
            retryDelay: 1000,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
