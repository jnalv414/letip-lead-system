# Quick Start Guide

Get the Le Tip dashboard running in 5 minutes.

## Prerequisites

- Node.js 20.9.0+
- Backend running at http://localhost:3000

## Installation

```bash
cd dashboard
npm install
```

## Environment Setup

Create `.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Start Development Server

```bash
npm run dev
```

Dashboard: http://localhost:3001

## Verify Setup

### 1. Test API Connection

```bash
curl http://localhost:3000/api/businesses/stats
```

Should return JSON with business statistics.

### 2. Check React Query DevTools

Open http://localhost:3001 and look for the React Query DevTools icon in the bottom-right corner.

## Basic Usage

### Create a Page with Business List

```tsx
// app/businesses/page.tsx
'use client';

import { useBusinesses } from '@/hooks/queries';

export default function BusinessesPage() {
  const { data, isLoading, error } = useBusinesses({ page: 1, limit: 20 });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1>Businesses ({data.meta.total})</h1>
      {data.data.map(business => (
        <div key={business.id}>
          <h2>{business.name}</h2>
          <p>{business.city}, {business.state}</p>
        </div>
      ))}
    </div>
  );
}
```

### Add Create Business Button

```tsx
// app/businesses/page.tsx
'use client';

import { useBusinesses } from '@/hooks/queries';
import { useCreateBusiness } from '@/hooks/mutations';

export default function BusinessesPage() {
  const { data } = useBusinesses();
  const createBusiness = useCreateBusiness();

  const handleCreate = async () => {
    await createBusiness.mutateAsync({
      name: 'New Business',
      city: 'Freehold',
      phone: '555-1234'
    });
  };

  return (
    <div>
      <button onClick={handleCreate}>Create Business</button>
      {/* Business list */}
    </div>
  );
}
```

### Add Stats Dashboard

```tsx
// app/dashboard/page.tsx
'use client';

import { useStats } from '@/hooks/queries';

export default function DashboardPage() {
  const { data: stats } = useStats(); // Auto-refreshes every 30s

  return (
    <div>
      <h1>Dashboard</h1>
      <div className="grid grid-cols-4 gap-4">
        <div>Total: {stats?.total}</div>
        <div>Enriched: {stats?.enriched}</div>
        <div>Pending: {stats?.pending}</div>
        <div>Failed: {stats?.failed}</div>
      </div>
    </div>
  );
}
```

### Start Scraping with Progress

```tsx
// app/scraper/page.tsx
'use client';

import { useState } from 'react';
import { useStartScrape } from '@/hooks/mutations';
import { useScrapeStatus } from '@/hooks/queries';

export default function ScraperPage() {
  const [jobId, setJobId] = useState(null);
  const startScrape = useStartScrape();
  const { data: job } = useScrapeStatus(jobId);

  const handleScrape = async () => {
    const result = await startScrape.mutateAsync({
      location: 'Route 9, Freehold, NJ',
      radius: 1,
      business_type: 'restaurant'
    });
    setJobId(result.jobId);
  };

  return (
    <div>
      <button onClick={handleScrape}>Start Scraping</button>
      {job && (
        <div>
          <p>Status: {job.status}</p>
          <p>Progress: {job.progress}%</p>
        </div>
      )}
    </div>
  );
}
```

## Add Toast Notifications

```tsx
// app/layout.tsx
import { Toaster } from 'sonner';
import { QueryProvider } from '@/providers/query-provider';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <QueryProvider>
          {children}
          <Toaster position="top-right" />
        </QueryProvider>
      </body>
    </html>
  );
}
```

## Common Patterns

### Pagination

```tsx
const [page, setPage] = useState(1);
const { data } = useBusinesses({ page, limit: 20 });

<button onClick={() => setPage(page - 1)}>Previous</button>
<button onClick={() => setPage(page + 1)}>Next</button>
```

### Filtering

```tsx
const [city, setCity] = useState('');
const { data } = useBusinesses({ city, enrichment_status: 'pending' });

<select onChange={(e) => setCity(e.target.value)}>
  <option value="">All Cities</option>
  <option value="Freehold">Freehold</option>
  <option value="Manalapan">Manalapan</option>
</select>
```

### Loading States

```tsx
const { data, isLoading, isFetching } = useBusinesses();

if (isLoading) return <div>Loading...</div>;

return (
  <div>
    {isFetching && <div>Refreshing...</div>}
    {/* Content */}
  </div>
);
```

### Error Handling

```tsx
const { data, error, isError } = useBusinesses();

if (isError) {
  return (
    <div>
      <h2>Error loading businesses</h2>
      <p>{error.message}</p>
    </div>
  );
}
```

### Mutation Status

```tsx
const createBusiness = useCreateBusiness();

<button
  onClick={handleCreate}
  disabled={createBusiness.isPending}
>
  {createBusiness.isPending ? 'Creating...' : 'Create'}
</button>

{createBusiness.isError && (
  <div>Error: {createBusiness.error.message}</div>
)}

{createBusiness.isSuccess && (
  <div>Business created successfully!</div>
)}
```

## Available Hooks

### Query Hooks

```tsx
import {
  useBusinesses,    // Paginated list
  useBusiness,      // Single business
  useStats,         // Dashboard stats
  useScrapeStatus,  // Scraping job
  useJobStatus,     // Generic job
  useFailedJobs     // Failed jobs
} from '@/hooks/queries';
```

### Mutation Hooks

```tsx
import {
  useCreateBusiness,   // Create
  useUpdateBusiness,   // Update
  useDeleteBusiness,   // Delete
  useStartScrape,      // Start scraping
  useEnrichBusiness,   // Enrich one
  useBatchEnrichment   // Enrich many
} from '@/hooks/mutations';
```

## Debug with DevTools

1. Open app in browser
2. Click React Query DevTools icon (bottom-right)
3. View active queries, mutations, and cache
4. Manually trigger refetches

## Troubleshooting

### API Not Connecting

Check backend is running:

```bash
curl http://localhost:3000/api/businesses/stats
```

Verify `NEXT_PUBLIC_API_URL` in `.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Queries Not Refetching

Check query keys are consistent:

```tsx
// Good
useBusinesses({ page: 1 });
queryClient.invalidateQueries(['businesses']);

// Bad
useBusinesses({ page: 1 });
queryClient.invalidateQueries(['business']); // Wrong key
```

### Toast Not Showing

Add Toaster component:

```tsx
import { Toaster } from 'sonner';

<Toaster position="top-right" />
```

### TypeScript Errors

Import types:

```tsx
import type { Business, Stats } from '@/types/api';
```

## Next Steps

1. Review full documentation in `README.md`
2. Explore complete example in `examples/complete-example.tsx`
3. Build UI components using these hooks
4. Add WebSocket integration for real-time updates

## Production Deployment

```bash
npm run build
npm run start
```

Set production environment variable:

```bash
NEXT_PUBLIC_API_URL=https://your-api-domain.com
```

## Support

- Full docs: `README.md`
- Implementation details: `docs/IMPLEMENTATION_SUMMARY.md`
- Example component: `examples/complete-example.tsx`
- Type definitions: `types/api.ts`
