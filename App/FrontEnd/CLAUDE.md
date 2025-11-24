# Le Tip Lead System - Frontend Documentation

## Cross-References

- **Root Documentation**: [../../CLAUDE.md](../../CLAUDE.md)
- **Backend Documentation**: [../BackEnd/CLAUDE.md](../BackEnd/CLAUDE.md)

---

## Frontend Overview

Next.js 16 dashboard providing real-time business lead management with WebSocket-driven updates, modern UI components, and responsive design.

**Port:** 3001 (development)
**Framework:** Next.js 16 (App Router, Turbopack stable)
**Real-time:** Socket.io client connected to backend WebSocket

---

## Technology Stack

- **Framework:** Next.js 16 (App Router, Turbopack stable)
- **UI Components:** ShadCN/UI + Magic-UI
- **Animations:** Framer Motion
- **Real-time:** Socket.io client
- **State:** Zustand + SWR
- **Forms:** React Hook Form + Zod
- **Styling:** Tailwind CSS (dark mode)

---

## Development Workflow

### Start Development Server

```bash
cd App/FrontEnd
npm run dev                 # Runs on port 3001
```

### Production Build

```bash
npm run build               # Creates optimized production build
npm run start               # Starts production server
```

### Export Static

```bash
npm run build && npm run export  # Creates /out directory for NestJS static serving
```

---

## Next.js 16 Features

### Requirements

- Node.js 20.9.0+ (minimum for Next.js 16)
- TypeScript 5.1.0+

### Key Features

**Turbopack (Stable):** 2-5x faster builds, 10x faster Fast Refresh
**Cache Components:** Use `use cache` directive for explicit caching
**React 19.2:** View Transitions, useEffectEvent, Activity components
**Enhanced Routing:** Layout deduplication for shared layouts

### Development Commands

```bash
npm run dev          # Development server (Turbopack enabled by default)
npm run build        # Production build with Turbopack
npm run start        # Start production server
npm run lint         # ESLint
```

---

## Environment Variables

### Development (.env.local)

```bash
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=http://localhost:3000
```

### Production

```bash
NEXT_PUBLIC_API_URL=https://your-production-domain.com
NEXT_PUBLIC_WS_URL=https://your-production-domain.com
```

---

## WebSocket Integration

### Client-Side Setup

**Socket.io client pattern:**
```typescript
import { io } from 'socket.io-client';

const socket = io(process.env.NEXT_PUBLIC_API_URL);

socket.on('business:created', (payload) => {
  console.log('New business:', payload.data);
  // Update UI state
});

socket.on('stats:updated', (payload) => {
  console.log('Stats changed:', payload.data);
  // Refresh dashboard
});
```

### Event Consumption

**Listen for backend events:**
```typescript
// Business events
socket.on('business:created', handleBusinessCreated);
socket.on('business:enriched', handleBusinessEnriched);
socket.on('business:deleted', handleBusinessDeleted);

// Stats events
socket.on('stats:updated', handleStatsUpdated);

// Progress events
socket.on('scraping:progress', handleScrapingProgress);
socket.on('enrichment:progress', handleEnrichmentProgress);
```

### State Management with WebSocket

**Zustand store pattern:**
```typescript
import create from 'zustand';
import { io } from 'socket.io-client';

interface BusinessStore {
  businesses: Business[];
  stats: Stats;
  socket: Socket | null;
  initializeSocket: () => void;
}

export const useBusinessStore = create<BusinessStore>((set) => ({
  businesses: [],
  stats: null,
  socket: null,

  initializeSocket: () => {
    const socket = io(process.env.NEXT_PUBLIC_API_URL);

    socket.on('business:created', (payload) => {
      set((state) => ({
        businesses: [payload.data, ...state.businesses]
      }));
    });

    socket.on('business:enriched', (payload) => {
      set((state) => ({
        businesses: state.businesses.map(b =>
          b.id === payload.data.id ? payload.data : b
        )
      }));
    });

    set({ socket });
  }
}));
```

---

## Component Development Standards

### Component Structure

**Recommended pattern:**
```typescript
// components/BusinessCard.tsx
'use client'; // For client components with interactivity

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Business } from '@/types';

interface BusinessCardProps {
  business: Business;
  onEnrich?: (id: number) => void;
}

export function BusinessCard({ business, onEnrich }: BusinessCardProps) {
  const statusColor = {
    pending: 'bg-yellow-500',
    enriched: 'bg-green-500',
    failed: 'bg-red-500'
  }[business.enrichment_status];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {business.name}
          <Badge className={statusColor}>
            {business.enrichment_status}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{business.city}</p>
        {onEnrich && (
          <button
            onClick={() => onEnrich(business.id)}
            className="mt-2 btn-primary"
          >
            Enrich
          </button>
        )}
      </CardContent>
    </Card>
  );
}
```

### ShadCN/UI Components

**Available components:**
- Card, CardHeader, CardTitle, CardContent
- Badge, Button, Input, Select
- Dialog, Sheet, Popover
- Table, DataTable
- Toast, Alert
- Form components with React Hook Form integration

**Usage:**
```typescript
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';

// Use as building blocks
<Dialog>
  <DialogContent>
    <DialogHeader>Create Business</DialogHeader>
    <form>
      <Input placeholder="Business name" />
      <Button type="submit">Create</Button>
    </form>
  </DialogContent>
</Dialog>
```

---

## UI/UX Guidelines

### Design System

**Colors:**
- Primary: Blue (#3b82f6)
- Success: Green (#22c55e)
- Warning: Yellow (#eab308)
- Danger: Red (#ef4444)
- Muted: Gray (#6b7280)

**Typography:**
- Headings: `font-bold text-2xl` (h1), `font-semibold text-xl` (h2)
- Body: `text-base` (default)
- Small: `text-sm text-muted-foreground`

**Spacing:**
- Section spacing: `space-y-6`
- Component spacing: `space-y-4`
- Element spacing: `space-y-2`

### Dark Mode

**Implementation:**
```typescript
// Use Tailwind dark mode classes
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
  <h1 className="text-2xl font-bold">Dashboard</h1>
</div>
```

**Theme toggle:**
```typescript
import { useTheme } from 'next-themes';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      Toggle theme
    </button>
  );
}
```

### Responsive Design

**Breakpoints:**
- sm: 640px
- md: 768px
- lg: 1024px
- xl: 1280px
- 2xl: 1536px

**Example:**
```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Responsive grid: 1 col mobile, 2 cols tablet, 3 cols desktop */}
</div>
```

---

## Frontend Testing Strategy

### Component Testing

**Test with React Testing Library:**
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { BusinessCard } from '@/components/BusinessCard';

describe('BusinessCard', () => {
  const mockBusiness = {
    id: 1,
    name: 'Test Business',
    city: 'Freehold',
    enrichment_status: 'pending'
  };

  it('renders business name', () => {
    render(<BusinessCard business={mockBusiness} />);
    expect(screen.getByText('Test Business')).toBeInTheDocument();
  });

  it('calls onEnrich when button clicked', () => {
    const onEnrich = jest.fn();
    render(<BusinessCard business={mockBusiness} onEnrich={onEnrich} />);

    fireEvent.click(screen.getByText('Enrich'));
    expect(onEnrich).toHaveBeenCalledWith(1);
  });
});
```

### Integration Testing

**Test WebSocket integration:**
```typescript
import { renderHook, act } from '@testing-library/react-hooks';
import { useBusinessStore } from '@/store/business';
import { io } from 'socket.io-client';

jest.mock('socket.io-client');

describe('WebSocket Integration', () => {
  it('updates state when business:created event received', () => {
    const mockSocket = {
      on: jest.fn(),
      emit: jest.fn()
    };

    (io as jest.Mock).mockReturnValue(mockSocket);

    const { result } = renderHook(() => useBusinessStore());

    act(() => {
      result.current.initializeSocket();
    });

    expect(mockSocket.on).toHaveBeenCalledWith('business:created', expect.any(Function));
  });
});
```

---

## Common Troubleshooting

### WebSocket Not Connecting

**Symptoms:** Real-time updates not appearing in dashboard

**Check:**
1. **Environment variable:** Verify `NEXT_PUBLIC_WS_URL` is set correctly
2. **CORS:** Backend must allow frontend origin in WebSocket gateway
3. **Network:** Check browser console for connection errors

**Debug:**
```typescript
// Add logging to WebSocket initialization
const socket = io(process.env.NEXT_PUBLIC_WS_URL, {
  transports: ['websocket'],
  reconnection: true,
  reconnectionDelay: 1000
});

socket.on('connect', () => {
  console.log('WebSocket connected:', socket.id);
});

socket.on('connect_error', (error) => {
  console.error('WebSocket connection error:', error);
});
```

---

### API Requests Failing

**Symptoms:** HTTP requests to backend return errors

**Check:**
1. **Environment variable:** Verify `NEXT_PUBLIC_API_URL` matches backend port
2. **Backend running:** Ensure NestJS server is running on correct port
3. **CORS:** Backend must allow frontend origin

**Test API directly:**
```bash
# Test from command line first
curl http://localhost:3000/api/businesses
```

**Debug in frontend:**
```typescript
async function fetchBusinesses() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/businesses`);
    if (!response.ok) {
      console.error('API error:', response.status, response.statusText);
    }
    return await response.json();
  } catch (error) {
    console.error('Fetch error:', error);
  }
}
```

---

### State Not Updating

**Symptoms:** UI doesn't reflect new data from WebSocket or API

**Check:**
1. **Zustand store:** Verify store is properly updating state
2. **React DevTools:** Inspect state in browser
3. **Event listeners:** Ensure WebSocket events are properly registered

**Debug:**
```typescript
// Add logging to state updates
socket.on('business:created', (payload) => {
  console.log('Received business:created:', payload);
  set((state) => {
    const newState = {
      businesses: [payload.data, ...state.businesses]
    };
    console.log('New state:', newState);
    return newState;
  });
});
```

---

### Build Errors

**Symptoms:** `npm run build` fails

**Common causes:**
1. **TypeScript errors:** Fix type errors in components
2. **Missing dependencies:** Run `npm install`
3. **Environment variables:** Ensure all required vars are set

**Debug:**
```bash
# Check TypeScript errors
npm run type-check

# Clean install
rm -rf node_modules .next
npm install
npm run build
```

---

## Performance Optimization

### Code Splitting

**Dynamic imports:**
```typescript
import dynamic from 'next/dynamic';

// Lazy load heavy components
const BusinessTable = dynamic(() => import('@/components/BusinessTable'), {
  loading: () => <p>Loading...</p>,
  ssr: false
});
```

### Image Optimization

**Use Next.js Image:**
```typescript
import Image from 'next/image';

<Image
  src="/logo.png"
  alt="Le Tip Logo"
  width={200}
  height={100}
  priority // For above-the-fold images
/>
```

### Caching

**Use Next.js 16 cache directive:**
```typescript
'use cache';

export async function getStats() {
  const response = await fetch(`${API_URL}/api/stats`);
  return response.json();
}
```

---

## Deployment

### Production Build

```bash
npm run build
npm run start
```

### Static Export (for NestJS serving)

```bash
npm run build
npm run export
# Output in /out directory
# Copy to App/BackEnd/public/ for static serving
```

### Environment Setup

**Production environment variables:**
```bash
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_WS_URL=https://api.yourdomain.com
NODE_ENV=production
```
