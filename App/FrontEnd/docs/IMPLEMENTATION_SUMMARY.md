# TanStack Query Implementation Summary

## Overview

Complete implementation of Layers 1 & 2 of the TanStack Query architecture for the Le Tip Lead System dashboard.

## What Was Built

### Layer 1: API Client (`lib/api-client.ts`)

Complete Axios-based REST API client with:

- **Axios Instance**: Configured with baseURL, 30s timeout, JSON headers
- **Request Interceptor**: Placeholder for future auth token injection
- **Response Interceptor**: Global error handling (401, 403, 404, 500)
- **15 API Functions**:
  - `getBusinesses(params)` - Paginated list with filters
  - `getBusiness(id)` - Single business details
  - `createBusiness(dto)` - Create new business
  - `updateBusiness(id, updates)` - Update existing business
  - `deleteBusiness(id)` - Delete business
  - `getStats()` - Dashboard statistics
  - `startScrape(request)` - Initiate Google Maps scraping
  - `getScrapeStatus(jobId)` - Poll scraping job
  - `enrichBusiness(id)` - Enrich single business
  - `batchEnrichment(count)` - Batch enrich multiple businesses
  - `getBatchStatus(batchId)` - Poll batch enrichment job
  - `getJob(jobId)` - Generic job status
  - `retryJob(jobId)` - Retry failed job
  - `cancelJob(jobId)` - Cancel active job
  - `getFailedJobs(limit)` - List failed jobs

### Layer 2: Query/Mutation Hooks

#### Query Hooks (`hooks/queries/`)

1. **useBusinesses** - Paginated business list
   - Query key: `['businesses', params]`
   - Supports: page, limit, city, industry, enrichment_status, search
   - Stale time: 5 minutes

2. **useBusiness** - Single business details
   - Query key: `['businesses', id]`
   - Enabled only when ID exists
   - Stale time: 10 minutes

3. **useStats** - Dashboard statistics
   - Query key: `['stats']`
   - Auto-polls every 30 seconds
   - Stale time: 30 seconds

4. **useScrapeStatus** - Scraping job polling
   - Query key: `['scrape-status', jobId]`
   - Smart polling: 2s for active jobs, stops when complete
   - Polls even in background

5. **useJobStatus** - Generic job polling
   - Query key: `['job-status', jobId]`
   - Same smart polling as useScrapeStatus
   - Configurable polling interval

6. **useFailedJobs** - Failed jobs list
   - Query key: `['failed-jobs', limit]`
   - Stale time: 1 minute

#### Mutation Hooks (`hooks/mutations/`)

1. **useCreateBusiness** - Create new business
   - Invalidates: `['businesses']`, `['stats']`
   - Shows success/error toast

2. **useUpdateBusiness** - Update existing business
   - Updates single business cache
   - Invalidates: `['businesses']`
   - Shows success/error toast

3. **useDeleteBusiness** - Delete business with optimistic update
   - Optimistically removes from cache
   - Rolls back on error
   - Invalidates: `['businesses']`, `['stats']`
   - Shows success/error toast

4. **useStartScrape** - Start Google Maps scraping
   - Returns jobId for polling
   - Shows success/error toast

5. **useEnrichBusiness** - Enrich single business
   - Invalidates: `['businesses', id]`, `['businesses']`, `['stats']`
   - Shows detailed success message with contact count

6. **useBatchEnrichment** - Batch enrich multiple businesses
   - Invalidates: `['businesses']`, `['stats']`
   - Shows summary toast with counts

### Supporting Files

- **types/api.ts** - Complete TypeScript interfaces (200 lines)
- **lib/query-client.ts** - QueryClient configuration
- **providers/query-provider.tsx** - React Query provider wrapper
- **hooks/queries/index.ts** - Query hooks barrel export
- **hooks/mutations/index.ts** - Mutation hooks barrel export
- **hooks/index.ts** - Top-level barrel export
- **examples/complete-example.tsx** - Full working example component
- **README.md** - Comprehensive documentation with usage examples

## TypeScript Types

All types are fully defined in `types/api.ts`:

- **Database Models**: Business, Contact, EnrichmentLog, OutreachMessage
- **API Responses**: PaginatedResponse, Stats, ScrapeResponse, JobStatus
- **Request DTOs**: CreateBusinessDto, UpdateBusinessDto, QueryBusinessesDto, ScrapeRequestDto
- **WebSocket Events**: WebSocketEvent, BusinessEvent, StatsEvent, ProgressEvent

## Key Features

### 1. Intelligent Polling

Jobs auto-poll while active, stop when complete:

```typescript
refetchInterval: (query) => {
  const data = query.state.data;
  const isActive = ['waiting', 'active', 'delayed'].includes(data.status);
  return isActive ? 2000 : false; // 2s polling or stop
}
```

### 2. Optimistic Updates

Delete mutations immediately update UI, rollback on error:

```typescript
onMutate: async (id) => {
  // Save current state
  const previous = queryClient.getQueriesData(['businesses']);

  // Optimistically update cache
  queryClient.setQueriesData(['businesses'], (old) => {
    return { ...old, data: old.data.filter(b => b.id !== id) };
  });

  return { previous }; // For rollback
}

onError: (error, id, context) => {
  // Rollback on error
  queryClient.setQueryData(['businesses'], context.previous);
}
```

### 3. Toast Notifications

All mutations show user-friendly notifications using Sonner:

```typescript
onSuccess: (data) => {
  toast.success('Business created', {
    description: `${data.name} has been added successfully.`
  });
}

onError: (error) => {
  toast.error('Failed to create business', {
    description: error.response?.data?.message || error.message
  });
}
```

### 4. Query Key Structure

Consistent, hierarchical query keys:

```
['businesses']                    // All businesses queries
['businesses', { page: 1 }]       // Specific query
['businesses', 123]               // Single business
['stats']                         // Dashboard stats
['scrape-status', jobId]          // Job status
```

### 5. Cache Invalidation Strategy

Smart invalidation for data consistency:

| Action | Invalidates |
|--------|-------------|
| Create Business | `['businesses']`, `['stats']` |
| Update Business | `['businesses', id]`, `['businesses']` |
| Delete Business | `['businesses']`, `['stats']` |
| Enrich Business | `['businesses', id]`, `['businesses']`, `['stats']` |

## Configuration

### QueryClient Defaults

```typescript
{
  queries: {
    staleTime: 5 * 60 * 1000,      // 5 minutes
    gcTime: 10 * 60 * 1000,        // 10 minutes
    retry: 3,                       // 3 retries with exponential backoff
    refetchOnWindowFocus: true,     // Refetch on tab switch
  },
  mutations: {
    retry: 1,                       // 1 retry
    retryDelay: 1000,               // 1 second
  }
}
```

### Environment Variables

```bash
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Usage Examples

### Basic Query

```tsx
import { useBusinesses } from '@/hooks/queries';

const { data, isLoading } = useBusinesses({ page: 1, limit: 20 });
```

### Mutation with Optimistic Update

```tsx
import { useDeleteBusiness } from '@/hooks/mutations';

const deleteBusiness = useDeleteBusiness();
await deleteBusiness.mutateAsync(businessId);
```

### Job Polling

```tsx
import { useStartScrape, useScrapeStatus } from '@/hooks';

const [jobId, setJobId] = useState(null);
const startScrape = useStartScrape();
const { data: job } = useScrapeStatus(jobId);

const handleScrape = async () => {
  const result = await startScrape.mutateAsync({ location: 'Freehold, NJ' });
  setJobId(result.jobId); // Starts auto-polling
};
```

## File Structure

```
dashboard/
├── types/api.ts                          (200 lines)
├── lib/
│   ├── api-client.ts                     (250 lines)
│   └── query-client.ts                   (45 lines)
├── providers/
│   └── query-provider.tsx                (50 lines)
├── hooks/
│   ├── queries/
│   │   ├── use-businesses.ts             (25 lines)
│   │   ├── use-business.ts               (20 lines)
│   │   ├── use-stats.ts                  (20 lines)
│   │   ├── use-scrape-status.ts          (40 lines)
│   │   ├── use-job-status.ts             (45 lines)
│   │   ├── use-failed-jobs.ts            (20 lines)
│   │   └── index.ts                      (20 lines)
│   ├── mutations/
│   │   ├── use-create-business.ts        (35 lines)
│   │   ├── use-update-business.ts        (40 lines)
│   │   ├── use-delete-business.ts        (80 lines)
│   │   ├── use-start-scrape.ts           (35 lines)
│   │   ├── use-enrich-business.ts        (40 lines)
│   │   ├── use-batch-enrichment.ts       (35 lines)
│   │   └── index.ts                      (10 lines)
│   └── index.ts                          (5 lines)
├── examples/
│   └── complete-example.tsx              (400 lines)
├── docs/
│   └── IMPLEMENTATION_SUMMARY.md         (this file)
└── README.md                             (600 lines)
```

**Total**: ~1,900 lines of production-ready TypeScript

## Next Steps

### Layer 3: WebSocket Integration

Add real-time updates:

```tsx
import { io } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';

const socket = io(process.env.NEXT_PUBLIC_API_URL);

socket.on('business:created', (event) => {
  queryClient.invalidateQueries(['businesses']);
  queryClient.invalidateQueries(['stats']);
});

socket.on('business:enriched', (event) => {
  queryClient.setQueryData(['businesses', event.data.id], event.data);
  queryClient.invalidateQueries(['stats']);
});
```

### Layer 4: UI Components

Build dashboard using these hooks:

1. **BusinessTable** - Sortable, filterable table with pagination
2. **ScraperForm** - Google Maps scraping with live progress
3. **EnrichmentQueue** - Batch enrichment monitor
4. **StatsDashboard** - Real-time statistics with charts
5. **BusinessDetail** - Full business view with contacts

## Testing

All hooks can be tested with React Testing Library:

```tsx
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { useBusinesses } from '@/hooks/queries';

test('fetches businesses', async () => {
  const { result } = renderHook(() => useBusinesses(), {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )
  });

  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(result.current.data.data).toHaveLength(20);
});
```

## Performance Optimizations

1. **Smart Stale Times**: 5min for lists, 10min for single records, 30s for stats
2. **Intelligent Polling**: Only active jobs poll, stops when complete
3. **Optimistic Updates**: Instant UI feedback for deletions
4. **Background Polling**: Jobs poll even when tab not focused
5. **Query Key Structure**: Hierarchical invalidation for efficiency

## Dependencies Added

```json
{
  "@tanstack/react-query": "^5.90.10",
  "@tanstack/react-query-devtools": "^5.90.10",
  "axios": "^1.7.9",
  "sonner": "^2.0.7"
}
```

## Installation

```bash
cd dashboard
npm install
npm run dev
```

Dashboard runs on http://localhost:3001

## Accessibility Features

All components should follow WCAG 2.1 AA standards:

- Semantic HTML elements
- ARIA labels for dynamic content
- Keyboard navigation support
- Focus management for modals
- Screen reader announcements for mutations

## Security Considerations

- API client supports future auth token injection
- HTTPS recommended for production
- Input validation on all mutations
- CSRF protection via backend
- Rate limiting on API endpoints

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Conclusion

Complete TanStack Query architecture ready for production use. All 15 backend endpoints integrated with type-safe hooks, intelligent caching, optimistic updates, and comprehensive error handling.

**Ready for Layer 3 (WebSocket) and Layer 4 (UI Components) implementation.**
