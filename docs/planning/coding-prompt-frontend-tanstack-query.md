# Coding Prompt: TanStack Query Integration for Next.js 16 Dashboard

## Feature Description and Problem Solving

### Problem
The dashboard will need to fetch data from the NestJS backend API, but without proper server state management, the frontend will face critical issues:

1. **No Caching Strategy**
   ```typescript
   // Without TanStack Query: Fetch on every component mount
   useEffect(() => {
     fetch('/api/businesses')
       .then(res => res.json())
       .then(data => setBusinesses(data));
   }, []);  // Runs every time component mounts
   ```
   **Problems:**
   - Same data fetched multiple times across components
   - No caching = unnecessary API calls
   - Stale data when navigating between pages
   - Loading state management duplicated everywhere

2. **Manual Loading/Error States**
   ```typescript
   // Current: Manual state management for every API call
   const [data, setData] = useState(null);
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState(null);

   useEffect(() => {
     setLoading(true);
     fetch('/api/businesses')
       .then(res => res.json())
       .then(data => {
         setData(data);
         setLoading(false);
       })
       .catch(err => {
         setError(err);
         setLoading(false);
       });
   }, []);
   ```
   **Problems:**
   - Boilerplate code repeated across every component
   - Easy to forget error handling
   - Race conditions if multiple requests
   - No retry logic

3. **No Background Refetching**
   - Data never updates unless manually refreshed
   - WebSocket updates and API data out of sync
   - Users see stale data after returning to tab
   - No polling for long-running operations

4. **Mutations Not Optimized**
   ```typescript
   // Without TanStack Query: Manual cache invalidation
   const deleteBusiness = async (id) => {
     await fetch(`/api/businesses/${id}`, { method: 'DELETE' });
     // Now what? Refetch entire list? Update local state manually?
     fetchBusinesses();  // Crude solution
   };
   ```
   **Problems:**
   - No optimistic updates (slow UI feedback)
   - Manual cache invalidation (error-prone)
   - Can't rollback on failure
   - Loading states managed manually

### Solution
Implement **TanStack Query v5** (React Query) for powerful, declarative server state management:

**TanStack Query Benefits:**
- **Automatic Caching:** Fetch once, cache everywhere (5min default staleTime)
- **Background Refetching:** Auto-update stale data on window focus
- **Loading/Error States:** Built-in `isLoading`, `isError`, `error`, `data`
- **Optimistic Updates:** Instant UI feedback, rollback on failure
- **Request Deduplication:** Multiple components request same data → 1 API call
- **Pagination:** Built-in pagination helpers
- **Infinite Queries:** Load more with infinite scroll
- **Retry Logic:** Automatic retries with exponential backoff
- **DevTools:** React Query DevTools for debugging

**Before (Without TanStack Query):**
```typescript
// 50+ lines of boilerplate per API call
const [businesses, setBusinesses] = useState([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);
const [page, setPage] = useState(1);

useEffect(() => {
  setLoading(true);
  fetch(`/api/businesses?page=${page}`)
    .then(res => res.json())
    .then(data => {
      setBusinesses(data);
      setLoading(false);
    })
    .catch(err => {
      setError(err);
      setLoading(false);
    });
}, [page]);
```

**After (With TanStack Query):**
```typescript
// 3 lines of code
const { data, isLoading, error } = useQuery({
  queryKey: ['businesses', { page }],
  queryFn: () => fetchBusinesses(page),
});
```

**Real-World Example - Stats Dashboard:**

**Without TanStack Query:**
```typescript
// Stats component
const [stats, setStats] = useState(null);
const [loading, setLoading] = useState(false);

useEffect(() => {
  const fetchStats = async () => {
    setLoading(true);
    const res = await fetch('/api/businesses/stats');
    const data = await res.json();
    setStats(data);
    setLoading(false);
  };
  fetchStats();

  // Poll every 30 seconds
  const interval = setInterval(fetchStats, 30000);
  return () => clearInterval(interval);
}, []);

// Business list component (separate component)
const [businesses, setBusinesses] = useState([]);
useEffect(() => {
  fetch('/api/businesses')
    .then(res => res.json())
    .then(setBusinesses);
}, []);

// When business created, manually update both:
const createBusiness = async (data) => {
  await fetch('/api/businesses', { method: 'POST', body: JSON.stringify(data) });
  // Problem: Must manually refetch stats AND businesses
  fetchStats();
  fetchBusinesses();
};
```

**With TanStack Query:**
```typescript
// Stats component
const { data: stats, isLoading } = useQuery({
  queryKey: ['stats'],
  queryFn: fetchStats,
  refetchInterval: 30000,  // Auto-poll every 30s
});

// Business list component
const { data: businesses } = useQuery({
  queryKey: ['businesses'],
  queryFn: fetchBusinesses,
});

// Create business mutation
const createMutation = useMutation({
  mutationFn: createBusiness,
  onSuccess: () => {
    // Auto-invalidate related queries
    queryClient.invalidateQueries({ queryKey: ['stats'] });
    queryClient.invalidateQueries({ queryKey: ['businesses'] });
  },
});
```

**Optimistic Updates Example:**
```typescript
// Delete business with instant UI feedback
const deleteMutation = useMutation({
  mutationFn: deleteBusiness,
  onMutate: async (businessId) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['businesses'] });

    // Snapshot previous value
    const previousBusinesses = queryClient.getQueryData(['businesses']);

    // Optimistically update UI
    queryClient.setQueryData(['businesses'], (old) =>
      old?.data.filter((b) => b.id !== businessId)
    );

    return { previousBusinesses };
  },
  onError: (err, businessId, context) => {
    // Rollback on error
    queryClient.setQueryData(['businesses'], context.previousBusinesses);
  },
  onSettled: () => {
    // Refetch to ensure server state
    queryClient.invalidateQueries({ queryKey: ['businesses'] });
  },
});

// Usage: Instant UI update, auto-rollback if fails
deleteMutation.mutate(123);
```

---

## User Story

**As a** Le Tip dashboard user
**I want** API data to load instantly from cache, auto-update in the background, and reflect changes immediately
**So that** the dashboard feels fast, responsive, and always shows up-to-date information

**Acceptance:**
- Initial page load shows cached data instantly (<50ms)
- Data auto-updates in background when stale
- Mutations show optimistic UI updates (instant feedback)
- Loading/error states handled automatically
- Pagination works smoothly with prefetching
- WebSocket events trigger cache invalidation
- React Query DevTools available in development

---

## Solution and Approach Rationale

### Why TanStack Query Over Alternatives

| Solution | Pros | Cons | Verdict |
|----------|------|------|---------|
| **TanStack Query v5** | Best-in-class caching, optimistic updates, 50KB gzipped, excellent DX | Learning curve | ✅ **Best choice** |
| SWR | Simpler API, smaller bundle (5KB) | Less features (no mutations, limited invalidation) | ❌ Too basic |
| RTK Query | Integrates with Redux | Requires Redux (heavy), complex setup | ❌ Overkill |
| Apollo Client | Powerful GraphQL client | GraphQL only, 100KB+ bundle | ❌ Wrong tool |
| Manual fetch | No dependencies | Reinventing the wheel, 100+ lines per API | ❌ Waste of time |

**Why TanStack Query v5 wins:**
- Already planning Next.js 16 dashboard (React 19.2)
- TanStack Query v5 fully supports React 19
- Handles 95% of server state needs out of the box
- Excellent TypeScript support
- Active development and community
- First-class devtools for debugging
- Perfect for REST APIs (our NestJS backend)

### Integration with Existing Tech Stack

**Current Stack:**
- Next.js 16 (App Router)
- React 19.2
- Socket.io (WebSocket events)
- Zustand (client state)

**TanStack Query Role:**
- **Server State:** API data, background refetching, caching
- **Zustand:** Client-only state (UI toggles, modals, filters)
- **Socket.io:** Real-time events → trigger TanStack Query cache invalidation

**Example - WebSocket + TanStack Query Integration:**
```typescript
// WebSocket event triggers cache refresh
socket.on('business:created', (business) => {
  // Option 1: Invalidate queries (refetch from server)
  queryClient.invalidateQueries({ queryKey: ['businesses'] });

  // Option 2: Optimistic update (instant UI update)
  queryClient.setQueryData(['businesses'], (old) => ({
    ...old,
    data: [...old.data, business],
  }));
});

socket.on('stats:updated', () => {
  queryClient.invalidateQueries({ queryKey: ['stats'] });
});
```

---

## Relevant Files and Context

### Files to Create

1. **dashboard/lib/api-client.ts**
   - Axios instance with base URL and interceptors
   - Typed API functions for all endpoints
   - Error handling and retries

2. **dashboard/lib/query-client.ts**
   - TanStack Query client configuration
   - Default staleTime, cacheTime, retry logic
   - Error handlers

3. **dashboard/providers/query-provider.tsx**
   - QueryClientProvider wrapper
   - React Query DevTools (development only)

4. **dashboard/hooks/queries/use-businesses.ts**
   - `useBusinesses(filters)` - List with pagination
   - `useBusiness(id)` - Single business
   - `useStats()` - Dashboard stats

5. **dashboard/hooks/mutations/use-business-mutations.ts**
   - `useCreateBusiness()` - Create business
   - `useDeleteBusiness()` - Delete with optimistic update
   - `useUpdateBusiness()` - Update business

6. **dashboard/hooks/mutations/use-enrichment-mutations.ts**
   - `useEnrichBusiness(id)` - Single enrichment
   - `useBatchEnrichment()` - Batch enrichment

7. **dashboard/hooks/queries/use-scraper.ts**
   - `useScrapeStatus(jobId)` - Poll scrape job status
   - `useScrapingHistory()` - Past scraping jobs

### Environment Variables

**Add to `dashboard/.env.local`:**
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=http://localhost:3000
```

### Dependencies

**Install TanStack Query v5:**
```bash
cd dashboard
npm install @tanstack/react-query @tanstack/react-query-devtools
npm install axios  # HTTP client
```

**package.json dependencies:**
```json
{
  "dependencies": {
    "@tanstack/react-query": "^5.62.0",
    "@tanstack/react-query-devtools": "^5.62.0",
    "axios": "^1.7.9",
    "next": "^16.0.0",
    "react": "^19.2.0",
    "react-dom": "^19.2.0"
  }
}
```

---

## Implementation Plan

### Phase 1: Setup TanStack Query (30-45 minutes)

**Step 1.1: Install dependencies**
```bash
cd dashboard
npm install @tanstack/react-query@^5.62.0
npm install @tanstack/react-query-devtools@^5.62.0
npm install axios@^1.7.9
```

**Step 1.2: Create API client**

**File:** `dashboard/lib/api-client.ts`
```typescript
import axios, { AxiosError, AxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000,  // 30 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor (add auth tokens here later)
apiClient.interceptors.request.use(
  (config) => {
    // Future: Add JWT token
    // const token = localStorage.getItem('auth_token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor (handle errors)
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Handle common errors
    if (error.response?.status === 401) {
      // Future: Redirect to login
      console.error('Unauthorized - redirect to login');
    }

    if (error.response?.status === 500) {
      console.error('Server error:', error.response.data);
    }

    return Promise.reject(error);
  }
);

// API Functions

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface Business {
  id: number;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  phone: string | null;
  website: string | null;
  email: string | null;
  category: string | null;
  rating: number | null;
  reviews: number | null;
  latitude: number | null;
  longitude: number | null;
  enrichment_status: 'pending' | 'enriched' | 'failed';
  contacted: boolean;
  created_at: string;
  updated_at: string;
  contacts?: Contact[];
  enrichment_logs?: EnrichmentLog[];
}

export interface Contact {
  id: number;
  business_id: number;
  name: string | null;
  title: string | null;
  email: string;
  email_verified: boolean;
  phone: string | null;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface EnrichmentLog {
  id: number;
  business_id: number;
  service: 'hunter' | 'abstract';
  status: 'success' | 'failed';
  request_data: any;
  response_data: any | null;
  error_message: string | null;
  created_at: string;
}

export interface Stats {
  total: number;
  enriched: number;
  pending: number;
  failed: number;
  totalContacts: number;
  messagesSent: number;
  messagesPending: number;
  byCity: Array<{ city: string; count: number }>;
  byIndustry: Array<{ industry: string; count: number }>;
}

export interface ScrapeRequest {
  location: string;
  radius?: number;
  business_type?: string;
  max_results?: number;
}

export interface ScrapeResponse {
  jobId: string;
  status: 'waiting' | 'active' | 'completed' | 'failed';
  message: string;
}

export interface JobStatus {
  jobId: string;
  status: 'waiting' | 'active' | 'completed' | 'failed';
  progress: number;
  data: any;
  result?: any;
  failedReason?: string;
  attemptsMade: number;
  createdAt: string;
  finishedAt?: string;
}

// API endpoint functions

export const api = {
  // Businesses
  getBusinesses: async (params?: {
    page?: number;
    limit?: number;
    city?: string;
    enrichment_status?: string;
    search?: string;
  }): Promise<PaginatedResponse<Business>> => {
    const { data } = await apiClient.get('/api/businesses', { params });
    return data;
  },

  getBusiness: async (id: number): Promise<Business> => {
    const { data } = await apiClient.get(`/api/businesses/${id}`);
    return data;
  },

  createBusiness: async (business: Partial<Business>): Promise<Business> => {
    const { data } = await apiClient.post('/api/businesses', business);
    return data;
  },

  updateBusiness: async (id: number, updates: Partial<Business>): Promise<Business> => {
    const { data } = await apiClient.patch(`/api/businesses/${id}`, updates);
    return data;
  },

  deleteBusiness: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/businesses/${id}`);
  },

  // Stats
  getStats: async (): Promise<Stats> => {
    const { data } = await apiClient.get('/api/businesses/stats');
    return data;
  },

  // Scraping
  startScrape: async (request: ScrapeRequest): Promise<ScrapeResponse> => {
    const { data } = await apiClient.post('/api/scraper/scrape', request);
    return data;
  },

  getScrapeStatus: async (jobId: string): Promise<JobStatus> => {
    const { data } = await apiClient.get(`/api/scraper/status/${jobId}`);
    return data;
  },

  // Enrichment
  enrichBusiness: async (id: number): Promise<any> => {
    const { data } = await apiClient.post(`/api/enrichment/${id}`);
    return data;
  },

  batchEnrichment: async (count: number = 10): Promise<any> => {
    const { data } = await apiClient.post('/api/enrichment/batch', { count });
    return data;
  },

  getBatchStatus: async (batchId: string): Promise<any> => {
    const { data } = await apiClient.get(`/api/enrichment/batch/${batchId}/status`);
    return data;
  },

  // Jobs
  getJob: async (jobId: string): Promise<JobStatus> => {
    const { data } = await apiClient.get(`/api/jobs/${jobId}`);
    return data;
  },

  retryJob: async (jobId: string): Promise<void> => {
    await apiClient.post(`/api/jobs/${jobId}/retry`);
  },

  cancelJob: async (jobId: string): Promise<void> => {
    await apiClient.delete(`/api/jobs/${jobId}`);
  },

  getFailedJobs: async (limit: number = 50): Promise<any> => {
    const { data } = await apiClient.get('/api/jobs/failed', { params: { limit } });
    return data;
  },
};
```

**Step 1.3: Create Query Client configuration**

**File:** `dashboard/lib/query-client.ts`
```typescript
import { QueryClient, DefaultOptions } from '@tanstack/react-query';

const queryConfig: DefaultOptions = {
  queries: {
    // Default staleTime: 5 minutes
    staleTime: 5 * 60 * 1000,

    // Cache data for 10 minutes
    gcTime: 10 * 60 * 1000,

    // Retry failed requests
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

    // Refetch on window focus (keep data fresh)
    refetchOnWindowFocus: true,

    // Don't refetch on reconnect (WebSocket handles this)
    refetchOnReconnect: false,

    // Show cached data while revalidating
    refetchOnMount: 'always',
  },
  mutations: {
    // Retry mutations once on failure
    retry: 1,
  },
};

export const createQueryClient = () => new QueryClient({ defaultOptions: queryConfig });

// Singleton for app
export const queryClient = createQueryClient();
```

**Step 1.4: Create Query Provider**

**File:** `dashboard/providers/query-provider.tsx`
```typescript
'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '@/lib/query-client';
import { ReactNode } from 'react';

export function QueryProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
```

**Step 1.5: Wrap app with Query Provider**

**File:** `dashboard/app/layout.tsx`
```typescript
import { QueryProvider } from '@/providers/query-provider';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.Node;
}) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
```

---

### Phase 2: Create Query Hooks (1-2 hours)

**Step 2.1: Business Queries**

**File:** `dashboard/hooks/queries/use-businesses.ts`
```typescript
import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { api, PaginatedResponse, Business } from '@/lib/api-client';

interface UseBusinessesParams {
  page?: number;
  limit?: number;
  city?: string;
  enrichment_status?: string;
  search?: string;
}

export function useBusinesses(
  params: UseBusinessesParams = {},
  options?: Omit<UseQueryOptions<PaginatedResponse<Business>>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: ['businesses', params],
    queryFn: () => api.getBusinesses(params),
    ...options,
  });
}

export function useBusiness(
  id: number,
  options?: Omit<UseQueryOptions<Business>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: ['businesses', id],
    queryFn: () => api.getBusiness(id),
    enabled: !!id,  // Only fetch if ID exists
    ...options,
  });
}

export function useStats(
  options?: Omit<UseQueryOptions<any>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: ['stats'],
    queryFn: api.getStats,
    // Poll every 30 seconds
    refetchInterval: 30000,
    ...options,
  });
}
```

**Step 2.2: Scraper Queries**

**File:** `dashboard/hooks/queries/use-scraper.ts`
```typescript
import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { api, JobStatus } from '@/lib/api-client';

export function useScrapeStatus(
  jobId: string | null,
  options?: Omit<UseQueryOptions<JobStatus>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: ['scrape-status', jobId],
    queryFn: () => api.getScrapeStatus(jobId!),
    enabled: !!jobId,
    // Poll every 2 seconds while job is active
    refetchInterval: (data) => {
      if (!data) return false;
      return data.status === 'active' || data.status === 'waiting' ? 2000 : false;
    },
    ...options,
  });
}

export function useJobStatus(
  jobId: string | null,
  options?: Omit<UseQueryOptions<JobStatus>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: ['job-status', jobId],
    queryFn: () => api.getJob(jobId!),
    enabled: !!jobId,
    // Poll while active
    refetchInterval: (data) => {
      if (!data) return false;
      return data.status === 'active' || data.status === 'waiting' ? 2000 : false;
    },
    ...options,
  });
}

export function useFailedJobs(
  limit: number = 50,
  options?: Omit<UseQueryOptions<any>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: ['failed-jobs', limit],
    queryFn: () => api.getFailedJobs(limit),
    ...options,
  });
}
```

**Step 2.3: Enrichment Queries**

**File:** `dashboard/hooks/queries/use-enrichment.ts`
```typescript
import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

export function useBatchEnrichmentStatus(
  batchId: string | null,
  options?: Omit<UseQueryOptions<any>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: ['batch-enrichment', batchId],
    queryFn: () => api.getBatchStatus(batchId!),
    enabled: !!batchId,
    // Poll every 3 seconds while processing
    refetchInterval: (data) => {
      if (!data) return false;
      const { total, completed, failed } = data;
      return completed + failed < total ? 3000 : false;
    },
    ...options,
  });
}
```

---

### Phase 3: Create Mutation Hooks (1-2 hours)

**Step 3.1: Business Mutations**

**File:** `dashboard/hooks/mutations/use-business-mutations.ts`
```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, Business } from '@/lib/api-client';
import { toast } from 'sonner';  // Assuming sonner for toast notifications

export function useCreateBusiness() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (business: Partial<Business>) => api.createBusiness(business),
    onSuccess: (newBusiness) => {
      // Invalidate businesses list to refetch
      queryClient.invalidateQueries({ queryKey: ['businesses'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });

      toast.success(`Business "${newBusiness.name}" created successfully`);
    },
    onError: (error: any) => {
      toast.error(`Failed to create business: ${error.message}`);
    },
  });
}

export function useUpdateBusiness() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<Business> }) =>
      api.updateBusiness(id, updates),
    onSuccess: (updatedBusiness) => {
      // Update cache for specific business
      queryClient.setQueryData(['businesses', updatedBusiness.id], updatedBusiness);

      // Invalidate list
      queryClient.invalidateQueries({ queryKey: ['businesses'] });

      toast.success('Business updated successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to update business: ${error.message}`);
    },
  });
}

export function useDeleteBusiness() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => api.deleteBusiness(id),
    onMutate: async (businessId) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['businesses'] });

      // Snapshot previous value
      const previousBusinesses = queryClient.getQueryData(['businesses']);

      // Optimistically remove from cache
      queryClient.setQueryData<any>(['businesses'], (old) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.filter((b: Business) => b.id !== businessId),
          meta: {
            ...old.meta,
            total: old.meta.total - 1,
          },
        };
      });

      return { previousBusinesses };
    },
    onError: (error: any, businessId, context) => {
      // Rollback on error
      if (context?.previousBusinesses) {
        queryClient.setQueryData(['businesses'], context.previousBusinesses);
      }
      toast.error(`Failed to delete business: ${error.message}`);
    },
    onSuccess: () => {
      toast.success('Business deleted successfully');
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['businesses'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}
```

**Step 3.2: Scraper Mutations**

**File:** `dashboard/hooks/mutations/use-scraper-mutations.ts`
```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ScrapeRequest } from '@/lib/api-client';
import { toast } from 'sonner';

export function useStartScrape() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: ScrapeRequest) => api.startScrape(request),
    onSuccess: (response) => {
      toast.success(`Scraping job started: ${response.jobId}`);

      // Optionally start polling job status
      queryClient.invalidateQueries({ queryKey: ['scrape-status', response.jobId] });
    },
    onError: (error: any) => {
      toast.error(`Failed to start scrape: ${error.message}`);
    },
  });
}

export function useCancelJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (jobId: string) => api.cancelJob(jobId),
    onSuccess: (_, jobId) => {
      toast.success('Job cancelled');
      queryClient.invalidateQueries({ queryKey: ['job-status', jobId] });
    },
    onError: (error: any) => {
      toast.error(`Failed to cancel job: ${error.message}`);
    },
  });
}

export function useRetryJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (jobId: string) => api.retryJob(jobId),
    onSuccess: (_, jobId) => {
      toast.success('Job retry queued');
      queryClient.invalidateQueries({ queryKey: ['job-status', jobId] });
      queryClient.invalidateQueries({ queryKey: ['failed-jobs'] });
    },
    onError: (error: any) => {
      toast.error(`Failed to retry job: ${error.message}`);
    },
  });
}
```

**Step 3.3: Enrichment Mutations**

**File:** `dashboard/hooks/mutations/use-enrichment-mutations.ts`
```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';

export function useEnrichBusiness() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (businessId: number) => api.enrichBusiness(businessId),
    onSuccess: (_, businessId) => {
      toast.success('Enrichment job queued');

      // Invalidate business and stats
      queryClient.invalidateQueries({ queryKey: ['businesses', businessId] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
    onError: (error: any) => {
      toast.error(`Enrichment failed: ${error.message}`);
    },
  });
}

export function useBatchEnrichment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (count: number) => api.batchEnrichment(count),
    onSuccess: (response) => {
      toast.success(`${response.totalJobs} enrichment jobs queued`);

      // Invalidate businesses and stats
      queryClient.invalidateQueries({ queryKey: ['businesses'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
    onError: (error: any) => {
      toast.error(`Batch enrichment failed: ${error.message}`);
    },
  });
}
```

---

### Phase 4: WebSocket Integration (1 hour)

**Step 4.1: Create WebSocket Hook with Query Invalidation**

**File:** `dashboard/hooks/use-socket.ts`
```typescript
'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000';

export function useSocket() {
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Create socket connection
    const socket = io(WS_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    // Connection events
    socket.on('connect', () => {
      console.log('WebSocket connected');
      toast.success('Connected to live updates');
    });

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      toast.error('Disconnected from live updates');
    });

    // Business events
    socket.on('business:created', (data) => {
      console.log('Business created:', data);
      queryClient.invalidateQueries({ queryKey: ['businesses'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      toast.success(`New business added: ${data.data.name}`);
    });

    socket.on('business:updated', (data) => {
      console.log('Business updated:', data);
      queryClient.invalidateQueries({ queryKey: ['businesses', data.data.id] });
      queryClient.invalidateQueries({ queryKey: ['businesses'] });
    });

    socket.on('business:deleted', (data) => {
      console.log('Business deleted:', data);
      queryClient.invalidateQueries({ queryKey: ['businesses'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    });

    // Scraping events
    socket.on('scraping:progress', (data) => {
      console.log('Scraping progress:', data);
      queryClient.setQueryData(['scrape-status', data.data.jobId], (old: any) => ({
        ...old,
        progress: data.data.progress,
        status: 'active',
      }));
    });

    socket.on('scraping:complete', (data) => {
      console.log('Scraping complete:', data);
      queryClient.invalidateQueries({ queryKey: ['scrape-status', data.data.jobId] });
      queryClient.invalidateQueries({ queryKey: ['businesses'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      toast.success(`Scraping complete: ${data.data.saved} businesses saved`);
    });

    socket.on('scraping:failed', (data) => {
      console.log('Scraping failed:', data);
      queryClient.invalidateQueries({ queryKey: ['scrape-status', data.data.jobId] });
      toast.error(`Scraping failed: ${data.data.error}`);
    });

    // Enrichment events
    socket.on('enrichment:progress', (data) => {
      console.log('Enrichment progress:', data);
      // Update specific business cache if available
      if (data.data.businessId) {
        queryClient.invalidateQueries({ queryKey: ['businesses', data.data.businessId] });
      }
    });

    socket.on('enrichment:complete', (data) => {
      console.log('Enrichment complete:', data);
      queryClient.invalidateQueries({ queryKey: ['businesses', data.data.businessId] });
      queryClient.invalidateQueries({ queryKey: ['businesses'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      toast.success('Business enriched successfully');
    });

    socket.on('enrichment:failed', (data) => {
      console.log('Enrichment failed:', data);
      queryClient.invalidateQueries({ queryKey: ['businesses', data.data.businessId] });
      toast.error(`Enrichment failed: ${data.data.error}`);
    });

    // Stats events
    socket.on('stats:updated', () => {
      console.log('Stats updated');
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    });

    // Cleanup
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [queryClient]);

  return socketRef.current;
}
```

**Step 4.2: Create Socket Provider**

**File:** `dashboard/providers/socket-provider.tsx`
```typescript
'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useSocket } from '@/hooks/use-socket';
import { Socket } from 'socket.io-client';

const SocketContext = createContext<Socket | null>(null);

export function SocketProvider({ children }: { children: ReactNode }) {
  const socket = useSocket();

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocketContext() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocketContext must be used within SocketProvider');
  }
  return context;
}
```

**Step 4.3: Wrap app with Socket Provider**

**File:** `dashboard/app/layout.tsx`
```typescript
import { QueryProvider } from '@/providers/query-provider';
import { SocketProvider } from '@/providers/socket-provider';
import { Toaster } from 'sonner';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.Node;
}) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>
          <SocketProvider>
            {children}
            <Toaster position="top-right" richColors />
          </SocketProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
```

---

### Phase 5: Example Component Usage (30-45 minutes)

**Step 5.1: Stats Dashboard Example**

**File:** `dashboard/app/dashboard/page.tsx`
```typescript
'use client';

import { useStats } from '@/hooks/queries/use-businesses';
import { Card } from '@/components/ui/card';

export default function DashboardPage() {
  const { data: stats, isLoading, error } = useStats();

  if (isLoading) {
    return <div>Loading stats...</div>;
  }

  if (error) {
    return <div>Error loading stats: {error.message}</div>;
  }

  return (
    <div className="grid grid-cols-4 gap-4">
      <Card>
        <h3>Total Businesses</h3>
        <p className="text-3xl">{stats?.total}</p>
      </Card>
      <Card>
        <h3>Enriched</h3>
        <p className="text-3xl">{stats?.enriched}</p>
      </Card>
      <Card>
        <h3>Pending</h3>
        <p className="text-3xl">{stats?.pending}</p>
      </Card>
      <Card>
        <h3>Failed</h3>
        <p className="text-3xl">{stats?.failed}</p>
      </Card>
    </div>
  );
}
```

**Step 5.2: Business List Example**

**File:** `dashboard/app/businesses/page.tsx`
```typescript
'use client';

import { useState } from 'react';
import { useBusinesses } from '@/hooks/queries/use-businesses';
import { useDeleteBusiness } from '@/hooks/mutations/use-business-mutations';
import { Button } from '@/components/ui/button';

export default function BusinessesPage() {
  const [page, setPage] = useState(1);
  const [city, setCity] = useState('');

  const { data, isLoading, error } = useBusinesses({ page, city });
  const deleteMutation = useDeleteBusiness();

  if (isLoading) {
    return <div>Loading businesses...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div>
      <h1>Businesses</h1>

      {/* Filter */}
      <input
        type="text"
        placeholder="Filter by city"
        value={city}
        onChange={(e) => setCity(e.target.value)}
      />

      {/* Table */}
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>City</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data?.data.map((business) => (
            <tr key={business.id}>
              <td>{business.name}</td>
              <td>{business.city}</td>
              <td>{business.enrichment_status}</td>
              <td>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteMutation.mutate(business.id)}
                  disabled={deleteMutation.isPending}
                >
                  Delete
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div>
        <Button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          Previous
        </Button>
        <span>Page {page} of {data?.meta.totalPages}</span>
        <Button
          onClick={() => setPage((p) => p + 1)}
          disabled={page >= (data?.meta.totalPages || 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
```

**Step 5.3: Scraper Example with Job Polling**

**File:** `dashboard/app/scraper/page.tsx`
```typescript
'use client';

import { useState } from 'react';
import { useStartScrape } from '@/hooks/mutations/use-scraper-mutations';
import { useScrapeStatus } from '@/hooks/queries/use-scraper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ScraperPage() {
  const [location, setLocation] = useState('');
  const [jobId, setJobId] = useState<string | null>(null);

  const startMutation = useStartScrape();
  const { data: jobStatus, isLoading: isPolling } = useScrapeStatus(jobId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const response = await startMutation.mutateAsync({
      location,
      max_results: 50,
    });
    setJobId(response.jobId);
  };

  return (
    <div>
      <h1>Scraper</h1>

      <form onSubmit={handleSubmit}>
        <Input
          type="text"
          placeholder="Location (e.g., Freehold, NJ)"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          required
        />
        <Button type="submit" disabled={startMutation.isPending}>
          {startMutation.isPending ? 'Starting...' : 'Start Scrape'}
        </Button>
      </form>

      {jobId && (
        <div>
          <h2>Job Status: {jobId}</h2>
          <p>Status: {jobStatus?.status}</p>
          <p>Progress: {jobStatus?.progress}%</p>

          {jobStatus?.status === 'completed' && (
            <div>
              <p>Found: {jobStatus.result?.found}</p>
              <p>Saved: {jobStatus.result?.saved}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

---

## Testing Strategy

### Unit Tests (6 tests)

1. **API Client - apiClient.get()** - Verify Axios GET request
2. **API Client - apiClient.post()** - Verify Axios POST with auth headers
3. **Query Client - staleTime** - Verify default cache config
4. **useBusinesses hook** - Mock useQuery, verify queryKey structure
5. **useDeleteBusiness hook** - Verify optimistic update logic
6. **WebSocket hook** - Verify query invalidation on events

### Integration Tests (3 tests)

1. **Fetch businesses → Display in component**
   - Mock API response
   - Render component with QueryProvider
   - Verify data displayed

2. **Delete business → Optimistic update → Rollback on error**
   - Trigger delete mutation
   - Verify immediate UI update
   - Mock API error
   - Verify rollback

3. **WebSocket event → Cache invalidation → Refetch**
   - Emit business:created event
   - Verify queryClient.invalidateQueries called
   - Verify API refetch triggered

### E2E Tests (2 tests)

1. **Complete CRUD Flow**
   - Create business via mutation
   - Verify in list (refetch)
   - Update business
   - Verify update in cache
   - Delete business
   - Verify optimistic removal

2. **Scraping with Real-Time Polling**
   - Submit scrape request
   - Verify job ID returned
   - Verify polling every 2 seconds
   - Mock progress events
   - Verify completion stops polling

---

## Acceptance Criteria

### Functional Requirements (15 criteria)

1. ✅ TanStack Query v5 installed and configured
2. ✅ QueryClientProvider wraps entire app
3. ✅ React Query DevTools available in development
4. ✅ API client (Axios) configured with base URL and interceptors
5. ✅ All API endpoints wrapped in typed functions
6. ✅ useBusinesses hook returns paginated data
7. ✅ useStats hook auto-refetches every 30 seconds
8. ✅ useDeleteBusiness implements optimistic updates
9. ✅ Failed mutations show error toast
10. ✅ Successful mutations show success toast
11. ✅ WebSocket events trigger cache invalidation
12. ✅ Job status hooks poll every 2 seconds while active
13. ✅ Polling stops when job completes/fails
14. ✅ Stale data refetches on window focus
15. ✅ Request deduplication works (multiple components, 1 API call)

### Performance Requirements

1. ✅ Cached data displayed in <50ms
2. ✅ Optimistic updates feel instant (<10ms UI feedback)
3. ✅ Background refetching doesn't block UI
4. ✅ Query cache persists across navigation

### Code Quality

1. ✅ All API functions TypeScript typed
2. ✅ All hooks use proper TypeScript generics
3. ✅ Query keys follow consistent pattern: `['resource', params]`
4. ✅ Error handling in all mutations
5. ✅ JSDoc comments on complex query logic

---

## Validation Commands

### 1. Install Dependencies
```bash
cd dashboard
npm install @tanstack/react-query@^5.62.0
npm install @tanstack/react-query-devtools@^5.62.0
npm install axios@^1.7.9
# Expected: All packages installed successfully
```

### 2. Verify React Query DevTools
```bash
npm run dev
# Open http://localhost:3001
# Open React Query DevTools (bottom-left icon)
# Expected: DevTools panel shows active queries
```

### 3. Test API Client
```bash
# In browser console (http://localhost:3001)
import { api } from './lib/api-client';
const stats = await api.getStats();
console.log(stats);
# Expected: Stats object returned
```

### 4. Test useBusinesses Hook
```bash
# In component:
const { data, isLoading } = useBusinesses({ page: 1 });
console.log('Data:', data, 'Loading:', isLoading);
# Expected: Data loaded from cache or API
```

### 5. Test Optimistic Delete
```bash
# Click delete button on business
# Expected:
# - Business instantly removed from UI
# - If API fails, business reappears
# - Toast shows error/success message
```

### 6. Test WebSocket Invalidation
```bash
# In backend, create a business via API:
curl -X POST http://localhost:3000/api/businesses \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Business", "city": "Freehold"}'

# Expected in frontend:
# - WebSocket receives business:created event
# - Business list automatically refetches
# - New business appears in UI
```

### 7. Test Job Polling
```bash
# Start scrape job
# Expected:
# - Job status polls every 2 seconds
# - Progress updates in UI (0% → 100%)
# - Polling stops when job completes
```

### 8. Test Cache Persistence
```bash
# 1. Navigate to /businesses
# 2. Wait for data to load
# 3. Navigate to /dashboard
# 4. Navigate back to /businesses
# Expected: Data shows instantly from cache
```

### 9. Test Stale Data Refetching
```bash
# 1. Load /businesses page
# 2. Switch to another browser tab
# 3. Wait 6 minutes (staleTime: 5min)
# 4. Switch back to dashboard tab
# Expected: Data auto-refetches in background
```

### 10. Test Request Deduplication
```bash
# Create 3 components that all use useStats()
# Expected in Network tab: Only 1 API call to /api/businesses/stats
```

---

## Summary

This implementation transforms the Le Tip dashboard from **manual fetch logic** to **declarative server state management** with:

✅ **Automatic Caching** (5min staleTime, 10min gcTime)
✅ **Optimistic Updates** (instant UI feedback)
✅ **Background Refetching** (keep data fresh)
✅ **Request Deduplication** (1 API call for multiple components)
✅ **Loading/Error States** (built-in, no boilerplate)
✅ **Retry Logic** (3 attempts with exponential backoff)
✅ **WebSocket Integration** (cache invalidation on events)
✅ **Polling** (job status updates every 2s)
✅ **DevTools** (debug cache in development)

**Estimated Implementation Time:** 4-6 hours
**Code Reduction:** 50+ lines per API call → 3 lines
**Performance:** Cached data loads in <50ms (vs 100-200ms from API)
