# TanStack Query v5 Implementation Patterns

**Status**: Shared reference document for Le Tip Lead System dashboard agents
**Version**: 1.0
**Created**: 2025-11-22
**TanStack Query**: v5.x
**Next.js**: 16+ (App Router)
**React**: 19.2+

---

## Table of Contents

1. [Query Key Conventions](#query-key-conventions)
2. [Query Hook Patterns](#query-hook-patterns)
3. [Mutation Hook Patterns](#mutation-hook-patterns)
4. [Optimistic Update Patterns](#optimistic-update-patterns)
5. [Cache Invalidation Strategy](#cache-invalidation-strategy)
6. [WebSocket-Query Bridge](#websocket-query-bridge)
7. [Provider Setup](#provider-setup)
8. [Error Handling](#error-handling)
9. [API Client Integration](#api-client-integration)
10. [Testing Patterns](#testing-patterns)

---

## Query Key Conventions

### Standard Structure

All query keys follow this hierarchical structure:

```typescript
// Resource queries (list/paginated)
['businesses'] // All businesses
['businesses', { city: 'NYC', page: 1 }] // Filtered/paginated
['businesses', { status: 'enriching' }] // By status
['business-stats'] // Aggregated stats

// Single resource queries
['business', { id: 123 }] // Single business with contacts
['job', { id: 'job-uuid' }] // Job status polling

// Nested resource queries
['business', { id: 123 }, 'contacts'] // Contacts for business
['business', { id: 123 }, 'enrichment-history'] // Enrichment history
```

### Query Key Factory Pattern

Create typed query key factories to ensure consistency:

```typescript
// lib/queryKeys.ts
export const queryKeys = {
  businesses: {
    all: () => ['businesses'] as const,
    lists: () => [{ ...queryKeys.businesses.all()[0], scope: 'list' }] as const,
    list: (filters: BusinessFilters) =>
      ['businesses', filters] as const,
    detail: (id: number) =>
      ['business', { id }] as const,
    contacts: (id: number) =>
      ['business', { id }, 'contacts'] as const,
    enrichmentHistory: (id: number) =>
      ['business', { id }, 'enrichment-history'] as const,
  },
  stats: {
    all: () => ['business-stats'] as const,
    dashboard: () => ['business-stats', { scope: 'dashboard' }] as const,
  },
  scraper: {
    status: (jobId: string) =>
      ['scraper-job', { jobId }] as const,
    jobs: () => ['scraper-jobs'] as const,
  },
  enrichment: {
    status: (businessId: number) =>
      ['enrichment-status', { businessId }] as const,
    batch: () => ['enrichment-batch'] as const,
  },
  jobs: {
    detail: (jobId: string) =>
      ['job', { id: jobId }] as const,
    failed: () => ['jobs', { status: 'failed' }] as const,
  },
} as const
```

### Benefits

- Strongly typed query invalidation
- Centralized key management
- Predictable cache structure
- Easy refactoring

---

## Query Hook Patterns

### Basic Query Hook

```typescript
// hooks/useBusinesses.ts
import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { apiClient } from '@/lib/api'

interface BusinessFilters {
  city?: string
  enrichment_status?: 'pending' | 'enriching' | 'enriched' | 'failed'
  page?: number
  limit?: number
}

export function useBusinesses(filters?: BusinessFilters) {
  return useQuery({
    queryKey: queryKeys.businesses.list(filters || {}),
    queryFn: async ({ signal }) =>
      apiClient.get('/api/businesses', {
        params: filters,
        signal,
      }),
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    refetchOnWindowFocus: false,
    refetchOnReconnect: 'stale',
  })
}
```

### Single Resource Query

```typescript
// hooks/useBusiness.ts
import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { apiClient } from '@/lib/api'

export function useBusiness(id: number | null) {
  return useQuery({
    queryKey: queryKeys.business.detail(id!),
    queryFn: async ({ signal }) =>
      apiClient.get(`/api/businesses/${id}`, { signal }),
    enabled: id !== null && id !== undefined, // Don't fetch until ID is available
    staleTime: 60 * 1000, // 1 minute
    gcTime: 30 * 60 * 1000, // 30 minutes
  })
}
```

### Polling Pattern (Long-Running Jobs)

```typescript
// hooks/useJobStatus.ts
import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { apiClient } from '@/lib/api'

interface JobStatusResponse {
  jobId: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress?: number
  result?: unknown
  error?: string
}

export function useJobStatus(jobId: string | null) {
  return useQuery({
    queryKey: queryKeys.jobs.detail(jobId!),
    queryFn: async ({ signal }) =>
      apiClient.get<JobStatusResponse>(
        `/api/jobs/${jobId}`,
        { signal }
      ),
    enabled: jobId !== null && jobId !== undefined,
    staleTime: 0, // Always consider stale to enable polling
    refetchInterval: (data) => {
      // Stop polling when job completes
      if (data?.status === 'completed' || data?.status === 'failed') {
        return false
      }
      return 2000 // Poll every 2 seconds while running
    },
    refetchIntervalInBackground: true,
  })
}
```

### Dependent Query Pattern

```typescript
// hooks/useBusinessContacts.ts
export function useBusinessContacts(businessId: number | null) {
  const businessQuery = useBusiness(businessId)

  return useQuery({
    queryKey: queryKeys.businesses.contacts(businessId!),
    queryFn: async ({ signal }) =>
      apiClient.get(`/api/businesses/${businessId}/contacts`, { signal }),
    enabled:
      businessId !== null &&
      businessQuery.status === 'success' &&
      businessQuery.data !== null,
    staleTime: 30 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}
```

---

## Mutation Hook Patterns

### Basic Mutation

```typescript
// hooks/useScrapeBusinesses.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { apiClient } from '@/lib/api'

interface ScrapeStartResponse {
  jobId: string
  status: 'pending'
}

export function useScrapeBusinesses() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: { city: string; industry?: string }) =>
      apiClient.post<ScrapeStartResponse>('/api/scraper/scrape', payload),
    onSuccess: (data) => {
      // Invalidate businesses list to reflect potential new entries
      queryClient.invalidateQueries({
        queryKey: queryKeys.businesses.lists(),
      })
    },
    onError: (error) => {
      console.error('Scraping failed:', error)
      // Error toast is handled by global error boundary
    },
  })
}
```

### Mutation with Optimistic Update

```typescript
// hooks/useEnrichBusiness.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { apiClient } from '@/lib/api'

interface Business {
  id: number
  name: string
  enrichment_status: 'pending' | 'enriching' | 'enriched' | 'failed'
  // ... other fields
}

export function useEnrichBusiness() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (businessId: number) =>
      apiClient.post(`/api/enrichment/${businessId}`),
    onMutate: async (businessId: number) => {
      // Cancel any ongoing refetches for this business
      await queryClient.cancelQueries({
        queryKey: queryKeys.businesses.detail(businessId),
      })

      // Snapshot previous state
      const previousBusiness = queryClient.getQueryData<Business>(
        queryKeys.businesses.detail(businessId)
      )

      // Optimistically update to 'enriching' status
      queryClient.setQueryData(
        queryKeys.businesses.detail(businessId),
        (old: Business | undefined) =>
          old
            ? { ...old, enrichment_status: 'enriching' }
            : old
      )

      return { previousBusiness, businessId }
    },
    onError: (error, businessId, context) => {
      // Rollback on error
      if (context?.previousBusiness) {
        queryClient.setQueryData(
          queryKeys.businesses.detail(businessId),
          context.previousBusiness
        )
      }
    },
    onSettled: (data, error, businessId) => {
      // Refetch after success or error
      return queryClient.invalidateQueries({
        queryKey: queryKeys.businesses.detail(businessId),
      })
    },
  })
}
```

### Batch Mutation with Progress Tracking

```typescript
// hooks/useBatchEnrichment.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { apiClient } from '@/lib/api'

interface BatchEnrichmentResponse {
  jobId: string
  totalCount: number
  startedAt: string
}

export function useBatchEnrichment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (businessIds: number[]) =>
      apiClient.post<BatchEnrichmentResponse>(
        '/api/enrichment/batch',
        { businessIds }
      ),
    onSuccess: (data) => {
      // Invalidate all businesses since multiple will be updated
      queryClient.invalidateQueries({
        queryKey: queryKeys.businesses.lists(),
      })
      // Start polling the job status
      queryClient.prefetchQuery({
        queryKey: queryKeys.jobs.detail(data.jobId),
        queryFn: async ({ signal }) =>
          apiClient.get(`/api/jobs/${data.jobId}`, { signal }),
      })
    },
  })
}
```

---

## Optimistic Update Patterns

### Complete Optimistic Update with Rollback

```typescript
interface Context {
  previousData: Business[]
  optimisticTodo: Business
}

useMutation({
  mutationFn: (newBusiness: Omit<Business, 'id'>) =>
    apiClient.post('/api/businesses', newBusiness),

  onMutate: async (newBusiness) => {
    // Cancel pending refetches
    await queryClient.cancelQueries({
      queryKey: queryKeys.businesses.lists(),
    })

    // Snapshot
    const previousData = queryClient.getQueryData<Business[]>(
      queryKeys.businesses.all()
    )

    // Create optimistic entry with temporary ID
    const optimisticBusiness: Business = {
      id: -Date.now(), // Temporary negative ID
      ...newBusiness,
      enrichment_status: 'pending',
    }

    // Update cache
    queryClient.setQueryData(
      queryKeys.businesses.all(),
      (old: Business[] | undefined) =>
        old ? [optimisticBusiness, ...old] : [optimisticBusiness]
    )

    return { previousData, optimisticBusiness }
  },

  onError: (err, newBusiness, context) => {
    if (context?.previousData) {
      queryClient.setQueryData(
        queryKeys.businesses.all(),
        context.previousData
      )
    }
  },

  onSuccess: (data, newBusiness, context) => {
    // Replace optimistic entry with real data
    queryClient.setQueryData(
      queryKeys.businesses.all(),
      (old: Business[] | undefined) =>
        old
          ? old.map((b) =>
              b.id === context?.optimisticBusiness.id ? data : b
            )
          : [data]
    )
  },

  onSettled: () =>
    queryClient.invalidateQueries({
      queryKey: queryKeys.businesses.lists(),
    }),
})
```

---

## Cache Invalidation Strategy

### Decision Tree

```
Mutation succeeds
├─ Data returned from mutation?
│  ├─ Yes: Use onSuccess to update specific queries
│  │       Only invalidate if data shape differs from cache
│  └─ No: Invalidate in onSettled
├─ Multiple resources affected?
│  ├─ Yes: Invalidate with prefix matching
│  │       queryKey: ['businesses'] (invalidates all variations)
│  └─ No: Invalidate specific queryKey exactly
└─ Time-sensitive data?
   ├─ Yes: refetchType: 'active' (only refetch active queries)
   └─ No: default refetch behavior
```

### Invalidation Patterns

```typescript
// Single resource update - use onSuccess with setQueryData
onSuccess: (data) => {
  queryClient.setQueryData(
    queryKeys.businesses.detail(data.id),
    data
  )
}

// Multiple related resources - invalidate prefix
onSettled: () =>
  queryClient.invalidateQueries({
    queryKey: queryKeys.businesses.lists(), // Matches all filter variations
  })

// Time-sensitive (real-time) - only active queries
onSettled: () =>
  queryClient.invalidateQueries({
    queryKey: queryKeys.businesses.all(),
    refetchType: 'active',
  })

// Related but separate feature
onSettled: () =>
  queryClient.invalidateQueries({
    queryKey: queryKeys.stats.dashboard(),
  })
```

### WebSocket-Driven Invalidation

```typescript
// Triggered by WebSocket events from server
const setupWebSocketInvalidation = () => {
  socket.on('business:created', (data: Business) => {
    // Add to cache rather than invalidate
    queryClient.setQueryData(
      queryKeys.businesses.all(),
      (old: Business[] | undefined) =>
        old ? [data, ...old] : [data]
    )
  })

  socket.on('business:updated', (data: Business) => {
    // Update cache directly
    queryClient.setQueryData(
      queryKeys.businesses.detail(data.id),
      data
    )
    // Update in list cache
    queryClient.setQueryData(
      queryKeys.businesses.all(),
      (old: Business[] | undefined) =>
        old?.map((b) => (b.id === data.id ? data : b)) || undefined
    )
  })

  socket.on('business:deleted', ({ id }: { id: number }) => {
    queryClient.removeQueries({
      queryKey: queryKeys.businesses.detail(id),
    })
    queryClient.setQueryData(
      queryKeys.businesses.all(),
      (old: Business[] | undefined) =>
        old?.filter((b) => b.id !== id) || undefined
    )
  })

  socket.on('stats:updated', () => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.stats.dashboard(),
      refetchType: 'active',
    })
  })

  socket.on('scraping:progress', (data: ScrapeProgress) => {
    queryClient.setQueryData(
      queryKeys.jobs.detail(data.jobId),
      (old: JobStatusResponse | undefined) => ({
        ...old,
        progress: data.progress,
      })
    )
  })

  socket.on('scraping:complete', (data: ScrapeComplete) => {
    queryClient.setQueryData(
      queryKeys.jobs.detail(data.jobId),
      (old: JobStatusResponse | undefined) => ({
        ...old,
        status: 'completed',
        result: data,
      })
    )
    // Invalidate businesses list
    queryClient.invalidateQueries({
      queryKey: queryKeys.businesses.lists(),
    })
  })

  socket.on('enrichment:complete', ({ businessId }: { businessId: number }) => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.businesses.detail(businessId),
    })
  })
}
```

---

## WebSocket-Query Bridge

### Architecture

The WebSocket-Query bridge automatically synchronizes real-time updates from the server with TanStack Query cache:

```
[Socket.io Events] → [Bridge] → [Query Cache Updates]
     (server)          (hooks)    (React components)
```

### Implementation

```typescript
// hooks/useWebSocketSync.ts
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { io, Socket } from 'socket.io-client'
import { setupWebSocketInvalidation } from '@/lib/cache'

let socket: Socket | null = null

export function useWebSocketSync() {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!socket) {
      socket = io('http://localhost:3000', {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
      })
    }

    // Setup cache invalidation handlers
    setupWebSocketInvalidation(queryClient, socket)

    return () => {
      // Don't disconnect - keep socket alive for app lifetime
      // Only disconnect on app unmount
    }
  }, [queryClient])

  return socket
}
```

### Event Handlers

```typescript
// lib/cache/webSocketInvalidation.ts
import { QueryClient } from '@tanstack/react-query'
import { Socket } from 'socket.io-client'

export function setupWebSocketInvalidation(
  queryClient: QueryClient,
  socket: Socket
) {
  socket.on('business:created', (data: Business) => {
    queryClient.setQueryData(
      queryKeys.businesses.all(),
      (old: Business[] | undefined) =>
        old ? [data, ...old] : [data]
    )
  })

  socket.on('business:updated', (data: Business) => {
    queryClient.setQueryData(
      queryKeys.businesses.detail(data.id),
      data
    )
    queryClient.setQueryData(
      queryKeys.businesses.lists(),
      (old: Business[] | undefined) =>
        old?.map((b) => (b.id === data.id ? data : b))
    )
  })

  socket.on('business:deleted', ({ id }: { id: number }) => {
    queryClient.removeQueries({
      queryKey: queryKeys.businesses.detail(id),
    })
    queryClient.setQueryData(
      queryKeys.businesses.all(),
      (old: Business[] | undefined) =>
        old?.filter((b) => b.id !== id)
    )
  })

  socket.on('scraping:progress', (data: ScrapeProgress) => {
    queryClient.setQueryData(
      queryKeys.jobs.detail(data.jobId),
      (old: JobStatusResponse | undefined) => ({
        ...old!,
        progress: data.progress,
      })
    )
  })

  socket.on('scraping:complete', (data: ScrapeComplete) => {
    queryClient.setQueryData(
      queryKeys.jobs.detail(data.jobId),
      (old: JobStatusResponse | undefined) => ({
        ...old!,
        status: 'completed',
        result: data,
      })
    )
    queryClient.invalidateQueries({
      queryKey: queryKeys.businesses.lists(),
    })
  })

  socket.on('enrichment:complete', ({ businessId }: { businessId: number }) => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.businesses.detail(businessId),
    })
  })

  socket.on('stats:updated', () => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.stats.all(),
      refetchType: 'active',
    })
  })
}
```

---

## Provider Setup

### App Layout Configuration

```typescript
// app/layout.tsx
import type { Metadata } from 'next'
import { ReactQueryProvider } from '@/providers/ReactQueryProvider'
import { WebSocketProvider } from '@/providers/WebSocketProvider'

export const metadata: Metadata = {
  title: 'Le Tip Lead System',
  description: 'Business lead management and enrichment system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ReactQueryProvider>
          <WebSocketProvider>
            {children}
          </WebSocketProvider>
        </ReactQueryProvider>
      </body>
    </html>
  )
}
```

### React Query Provider

```typescript
// providers/ReactQueryProvider.tsx
'use client'

import { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export function ReactQueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000, // 30 seconds
            gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
            refetchOnWindowFocus: 'stale',
            refetchOnReconnect: 'stale',
            retry: (failureCount, error: any) => {
              // Don't retry 4xx errors
              if (error?.status >= 400 && error?.status < 500) {
                return false
              }
              // Retry up to 3 times for other errors
              return failureCount < 3
            },
          },
          mutations: {
            retry: (failureCount, error: any) => {
              // Don't retry 4xx errors
              if (error?.status >= 400 && error?.status < 500) {
                return false
              }
              return failureCount < 2
            },
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
```

### WebSocket Provider

```typescript
// providers/WebSocketProvider.tsx
'use client'

import { ReactNode } from 'react'
import { useWebSocketSync } from '@/hooks/useWebSocketSync'

export function WebSocketProvider({ children }: { children: ReactNode }) {
  useWebSocketSync()
  return <>{children}</>
}
```

---

## Error Handling

### Query-Level Error Handling

```typescript
function BusinessList() {
  const { data, error, isPending } = useBusinesses()

  if (isPending) {
    return <LoadingSpinner />
  }

  if (error) {
    return (
      <ErrorAlert
        title="Failed to load businesses"
        message={error.message}
        action={
          <button onClick={() => refetch()}>
            Retry
          </button>
        }
      />
    )
  }

  return <>{/* render data */}</>
}
```

### Mutation Error Handling

```typescript
function ScrapeForm() {
  const { mutate, isPending, error } = useScrapeBusinesses()

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        mutate({ city: 'NYC' })
      }}
    >
      {error && (
        <ErrorAlert
          title="Scrape Failed"
          message={error.message}
        />
      )}
      <button disabled={isPending} type="submit">
        {isPending ? 'Scraping...' : 'Start Scrape'}
      </button>
    </form>
  )
}
```

### Global Error Boundary

```typescript
// app/error.tsx
'use client'

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div>
      <h2>Something went wrong</h2>
      <p>{error.message}</p>
      <button onClick={() => reset()}>Try again</button>
    </div>
  )
}
```

---

## API Client Integration

### Axios Client with Interceptors

```typescript
// lib/api.ts
import axios, { AxiosError } from 'axios'

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
apiClient.interceptors.request.use((config) => {
  // Add auth token if available
  const token = typeof window !== 'undefined'
    ? localStorage.getItem('auth_token')
    : null
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response.data,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Handle unauthorized
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)
```

### TypeScript Types

```typescript
// types/api.ts
export interface Business {
  id: number
  name: string
  city: string
  industry?: string
  website?: string
  enrichment_status: 'pending' | 'enriching' | 'enriched' | 'failed'
  enrichment_error?: string
  created_at: string
  updated_at: string
}

export interface BusinessFilters {
  city?: string
  enrichment_status?: string
  page?: number
  limit?: number
}

export interface ScrapeStartResponse {
  jobId: string
  status: 'pending'
}

export interface JobStatusResponse {
  jobId: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress?: number
  result?: unknown
  error?: string
}

export interface ScrapeComplete {
  jobId: string
  found: number
  saved: number
}

export interface ScrapeProgress {
  jobId: string
  progress: number
}
```

---

## Testing Patterns

### Mock QueryClient Setup

```typescript
// __tests__/setup.ts
import { QueryClient } from '@tanstack/react-query'

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  })
}
```

### Testing Queries

```typescript
// __tests__/hooks/useBusinesses.test.ts
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { useBusinesses } from '@/hooks/useBusinesses'
import { createTestQueryClient } from '../setup'
import * as api from '@/lib/api'

vi.mock('@/lib/api')

it('fetches businesses', async () => {
  const queryClient = createTestQueryClient()
  const mockData = [{ id: 1, name: 'Test Business' }]
  vi.mocked(api.apiClient.get).mockResolvedValue(mockData)

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )

  const { result } = renderHook(() => useBusinesses(), { wrapper })

  await waitFor(() => expect(result.current.isPending).toBe(false))
  expect(result.current.data).toEqual(mockData)
})
```

### Testing Mutations

```typescript
// __tests__/hooks/useScrapeBusinesses.test.ts
it('invalidates businesses list on success', async () => {
  const queryClient = createTestQueryClient()
  const invalidateQuerySpy = vi.spyOn(queryClient, 'invalidateQueries')

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )

  const { result } = renderHook(() => useScrapeBusinesses(), { wrapper })

  await waitFor(() => {
    result.current.mutate({ city: 'NYC' })
  })

  await waitFor(() => {
    expect(invalidateQuerySpy).toHaveBeenCalledWith({
      queryKey: queryKeys.businesses.lists(),
    })
  })
})
```

---

## Implementation Checklist

### Layer 1: API Client
- [ ] Create typed axios client with interceptors
- [ ] Define TypeScript interfaces for all endpoints
- [ ] Setup request/response error handling
- [ ] Add authentication token management

### Layer 2: Query/Mutation Hooks
- [ ] Create query key factory with all endpoints
- [ ] Implement useQuery hooks for all GET endpoints
- [ ] Implement useMutation hooks for all POST/PUT endpoints
- [ ] Add staleTime and gcTime configs based on data volatility
- [ ] Test polling patterns for long-running jobs
- [ ] Implement optimistic updates for critical mutations
- [ ] Add proper error boundaries and fallbacks

### Layer 3: WebSocket-Query Bridge
- [ ] Create Socket.io client with reconnection logic
- [ ] Setup event handlers for all server events
- [ ] Implement cache invalidation/update logic
- [ ] Test real-time sync with polling queries
- [ ] Handle WebSocket disconnection gracefully

### Provider Setup
- [ ] Configure QueryClientProvider in app/layout.tsx
- [ ] Create WebSocketProvider component
- [ ] Setup error interceptors
- [ ] Configure retry logic globally

---

## Performance Optimization Tips

1. **Use `staleTime` wisely**: Higher staleTime = fewer refetches but staler data
2. **Prefer `setQueryData` over `invalidateQueries`**: Faster updates without refetch
3. **Use `gcTime` to preserve cache**: Prevents re-fetching on quick navigation
4. **Enable `refetchInBackground`**: Keep data fresh without blocking UI
5. **Use `enabled` for dependent queries**: Prevent unnecessary requests
6. **Batch mutations**: Use single request for multiple updates
7. **Prefetch on hover**: Anticipate user navigation
8. **Use Suspense**: Better UX for loading states

---

## Common Pitfalls to Avoid

1. ❌ Using wrong cache key structure - breaks invalidation
2. ❌ Mutating data directly instead of spreading - breaks reactivity
3. ❌ Over-invalidating - causes excessive refetching
4. ❌ Not handling enabled state - causes unwanted requests
5. ❌ Forgetting `signal` parameter in AbortController integration
6. ❌ Not returning Promise from onSettled - causes stuck loading states
7. ❌ WebSocket updates without checking data existence - causes crashes

---

## References

- [TanStack Query v5 Docs](https://tanstack.com/query/latest)
- [React Query Patterns Guide](https://tkdodo.eu/blog/practical-react-query)
- [Socket.io Real-time Patterns](https://socket.io/docs/)
- [Next.js App Router Guide](https://nextjs.org/docs/app)

---

**Last Updated**: 2025-11-22
**Document Owner**: Context Manager Agent
**Review Cycle**: Monthly or when major API changes occur
