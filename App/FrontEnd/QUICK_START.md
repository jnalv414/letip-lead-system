# Quick Start - Vertical Slice Architecture

Get started building features in 5 minutes.

## 1. Start Development Server

```bash
cd App/FrontEnd
npm run dev  # http://localhost:3001
```

## 2. Use Existing Features

Import from feature barrel exports:

```typescript
// Import business management features
import {
  BusinessList,
  useBusinesses,
  useCreateBusiness,
  useBusinessWebSocket
} from '@/features/business-management';

// Import scraping features
import {
  useScraping,
  scrapingApi
} from '@/features/map-scraping';

// Import enrichment features
import {
  useEnrichBusiness,
  useBatchEnrichment
} from '@/features/lead-enrichment';

// Import analytics features
import {
  useStats,
  useStatsWebSocket
} from '@/features/dashboard-analytics';
```

## 3. Create a New Page

```typescript
// app/(dashboard)/businesses/page.tsx
'use client';

import { BusinessList } from '@/features/business-management';

export default function BusinessesPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Businesses</h1>
      <BusinessList />
    </div>
  );
}
```

## 4. Fetch Data with Hooks

```typescript
'use client';

import { useBusinesses, useBusinessWebSocket } from '@/features/business-management';

export function MyComponent() {
  // Fetch data
  const { data, isLoading, error } = useBusinesses({
    page: 1,
    limit: 20,
    city: 'Freehold'
  });

  // Subscribe to real-time updates
  const { isConnected } = useBusinessWebSocket();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <div>WebSocket: {isConnected ? '🟢 Live' : '🔴 Offline'}</div>
      {data?.data.map(business => (
        <div key={business.id}>{business.name}</div>
      ))}
    </div>
  );
}
```

## 5. Make API Calls

```typescript
'use client';

import { useCreateBusiness } from '@/features/business-management';

export function CreateBusinessForm() {
  const createBusiness = useCreateBusiness();

  const handleSubmit = async () => {
    await createBusiness.mutateAsync({
      name: 'New Business',
      city: 'Freehold',
      state: 'NJ'
    });
  };

  return (
    <button
      onClick={handleSubmit}
      disabled={createBusiness.isPending}
    >
      {createBusiness.isPending ? 'Creating...' : 'Create Business'}
    </button>
  );
}
```

## 6. Add New Feature (Example)

```bash
# Create feature structure
mkdir -p features/my-feature/{components,hooks,api,types}
touch features/my-feature/index.ts
```

```typescript
// features/my-feature/api/my-api.ts
import { apiClient } from '@/core/api/api-client';

export const myApi = {
  async getData() {
    const response = await apiClient.get('/api/my-endpoint');
    return response.data;
  }
};

// features/my-feature/hooks/use-my-feature.ts
import { useQuery } from '@tanstack/react-query';
import { myApi } from '../api/my-api';

export function useMyFeature() {
  return useQuery({
    queryKey: ['my-feature'],
    queryFn: () => myApi.getData(),
  });
}

// features/my-feature/index.ts
export { useMyFeature } from './hooks/use-my-feature';
```

## Common Patterns

### Pattern 1: Fetch + Real-time Updates

```typescript
const { data } = useBusinesses();          // Initial fetch
const { isConnected } = useBusinessWebSocket(); // Auto-updates
```

### Pattern 2: Mutations

```typescript
const createBusiness = useCreateBusiness();
const updateBusiness = useUpdateBusiness();
const deleteBusiness = useDeleteBusiness();

// Use
await createBusiness.mutateAsync(data);
```

### Pattern 3: Progress Tracking

```typescript
const { progress, startScrape } = useScraping();

startScrape({ location: 'Freehold, NJ' });

// progress.status: 'idle' | 'scraping' | 'completed' | 'failed'
// progress.progress: 0-100
```

## File Structure Quick Reference

```
features/
  [feature-name]/
    components/      # React components
    hooks/           # Custom hooks
    api/             # API client
    types/           # TypeScript types
    index.ts         # Public exports

core/
  api/              # Base API client
  providers/        # React providers
  types/            # Global types

shared/
  ui/               # Shared UI components
  utils/            # Utilities
```

## Environment Variables

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=http://localhost:3000
```

## Import Paths

```typescript
// Feature imports (use barrel exports)
import { ... } from '@/features/business-management';

// Core imports
import { apiClient } from '@/core/api/api-client';
import { useWebSocket } from '@/core/providers/websocket-provider';

// Shared imports
import { Button } from '@/shared/ui/button';

// Type imports
import type { Business } from '@/core/types/global.types';
```

## Development Commands

```bash
npm run dev        # Start dev server (port 3001)
npm run build      # Production build
npm run start      # Start production server
npm run lint       # Run ESLint
npm run test       # Run tests
```

## Debugging

### Check WebSocket Connection

```typescript
const { socket, isConnected } = useWebSocket();

useEffect(() => {
  if (socket) {
    socket.on('connect', () => console.log('Connected'));
    socket.on('disconnect', () => console.log('Disconnected'));
  }
}, [socket]);
```

### Check API Calls

Open browser DevTools → Network tab → Filter by XHR/Fetch

### Check React Query Cache

React Query DevTools appear in bottom-right corner (dev mode only)

## Next Steps

1. Read: `ARCHITECTURE.md` for detailed architecture
2. Read: `VERTICAL_SLICE_IMPLEMENTATION.md` for implementation details
3. Build: Create feature components
4. Test: Write tests for critical paths

## Need Help?

- Architecture questions: `ARCHITECTURE.md`
- Implementation details: `VERTICAL_SLICE_IMPLEMENTATION.md`
- Frontend docs: `CLAUDE.md`
- Backend docs: `../BackEnd/CLAUDE.md`

Happy coding! 🚀
