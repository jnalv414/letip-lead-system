# Le Tip Lead System - Frontend Documentation

## Cross-References

- **Root Documentation**: [../../CLAUDE.md](../../CLAUDE.md)
- **Backend Documentation**: [../BackEnd/CLAUDE.md](../BackEnd/CLAUDE.md)

---

## Frontend Overview

Next.js 16 dashboard providing real-time business lead management with WebSocket-driven updates, premium glassmorphism UI, and responsive design.

**Port:** 3001 (development)
**Framework:** Next.js 16.0.3 (App Router, Turbopack stable)
**Real-time:** Socket.io client connected to backend WebSocket

---

## Technology Stack

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| Framework | Next.js | 16.0.3 | App Router + Turbopack |
| UI Library | React | 19.2.0 | View Transitions, new hooks |
| State Management | TanStack React Query | 5.90.10 | Server state caching |
| Real-time | Socket.io Client | 4.8.1 | WebSocket events |
| Animations | Framer Motion | 12.23.24 | Spring physics, stagger |
| UI Components | ShadCN/UI | Custom | Badge, Card, Button, etc. |
| UI Effects | Magic UI | Custom | NumberTicker, Shimmer, Shine |
| Charts | Recharts | 3.4.1 | Area, Pie, Bar charts |
| Styling | Tailwind CSS | 4.1.17 | Dark mode utilities |
| Icons | Lucide React | 0.554.0 | 500+ icons |
| Notifications | Sonner | 2.0.7 | Toast notifications |
| HTTP Client | Axios | 1.7.9 | API requests |
| Utilities | Clsx + Tailwind Merge | 2.1.1 + 3.4.0 | Class management |
| Testing | Jest + Testing Library | 30.2.0 + 16.3.0 | Unit/integration tests |

---

## Development Workflow

### Start Development Server

```bash
cd App/FrontEnd
npm run dev                 # Runs on port 3001 (Turbopack enabled)
```

### Production Build

```bash
npm run build               # Creates optimized production build
npm run start               # Starts production server
```

### Testing

```bash
npm test                    # Run all tests
npm test -- --watch         # Watch mode
npm test -- --coverage      # Coverage report
```

---

## Directory Structure

```
App/FrontEnd/
├── app/                          # Next.js App Router (pages)
│   ├── page.tsx                  # Main dashboard (850 lines)
│   ├── layout.tsx                # Root layout
│   └── globals.css               # Global styles
├── components/
│   ├── dashboard/               # Dashboard-specific components
│   │   ├── stats/               # Stats cards with WebSocket
│   │   ├── sections/            # Dashboard sections (1,570 lines)
│   │   ├── visualizations/      # Data visualizations (1,185 lines)
│   │   ├── activity/            # Activity feed
│   │   └── index.ts             # Barrel export
│   ├── layout/                  # Layout components
│   │   ├── app-shell.tsx        # Main layout with animated background
│   │   ├── sidebar.tsx          # Navigation with active state
│   │   └── header.tsx           # Top navigation bar
│   ├── magicui/                 # Magic UI effects (474 lines)
│   │   ├── animated-list.tsx    # Staggered list animations
│   │   ├── bento-grid.tsx       # Bento grid layout
│   │   ├── blur-fade.tsx        # Blur fade effect
│   │   ├── number-ticker.tsx    # Animated number counter
│   │   ├── shimmer-button.tsx   # Button with shimmer effect
│   │   └── shine-border.tsx     # Border with shine animation
│   ├── ui/                      # Foundation UI components (11 files)
│   │   ├── badge.tsx            # Status and trend badges
│   │   ├── card.tsx             # Card container with variants
│   │   ├── button.tsx           # Primary buttons
│   │   ├── skeleton.tsx         # Loading skeleton
│   │   └── data-table.tsx       # Data table component
│   └── charts/                  # Recharts visualizations
│       ├── area-chart.tsx
│       ├── bar-chart.tsx
│       └── sparkline.tsx
├── core/                        # Core providers and API clients
│   ├── providers/
│   │   ├── app-providers.tsx    # Combined providers
│   │   └── websocket-provider.tsx # Socket.io provider
│   └── api/
│       └── api-client.ts        # Axios configuration
├── features/                    # Vertical slice feature modules
│   ├── business-management/     # Business CRUD operations
│   ├── dashboard-analytics/     # Statistics & metrics
│   ├── lead-enrichment/         # Enrichment operations
│   └── map-scraping/            # Scraping operations
├── hooks/                       # Custom React hooks
│   ├── queries/                 # TanStack Query hooks (GET)
│   └── mutations/               # TanStack Query hooks (POST/PUT/DELETE)
└── types/                       # Global TypeScript definitions
```

---

## Design System

### Color Palette (60/30/10 Rule)

**60% Deep Navy Backgrounds (Primary)**
```css
--bg-primary:       #0a0a0f  /* darkest, main background */
--bg-secondary:     #111118  /* slightly lighter */
--bg-tertiary:      #1a1a24  /* card backgrounds */
--bg-card:          rgba(20, 20, 35, 0.8)      /* glassmorphic */
--bg-card-elevated: rgba(30, 30, 50, 0.9)     /* raised cards */
```

**30% Purple/Blue Accents (Secondary)**
```css
--accent-purple:       #9b6dff  /* primary accent */
--accent-purple-light: #b794ff  /* hover state */
--accent-blue:         #3b9eff  /* secondary accent */
--accent-gradient:     linear-gradient(135deg, #9b6dff 0%, #3b9eff 100%)
```

**10% Highlights (Tertiary)**
```css
--highlight-cyan:    #06d6f4  /* bright accent */
--highlight-pink:    #ff4d9d  /* error highlight */
--highlight-emerald: #10d980  /* success highlight */
```

**Status Colors**
```css
Success:  #22C55E /* green - enriched */
Warning:  #F59E0B /* amber - pending */
Error:    #EF4444 /* red - failed */
Info:     #3B82F6 /* blue - info */
```

### Typography

**Font Stack**
- Body: `'Inter', system-ui, sans-serif` (16px, line-height 1.6)
- Headings: `'Space Grotesk', system-ui, sans-serif` (weight 600, line-height 1.3)

**Text Colors**
```css
--text-primary:   #ffffff        /* 100% opacity, main text */
--text-secondary: #b4b6c0        /* secondary text */
--text-muted:     #7a7c8a        /* disabled/muted */
```

### Glassmorphism Styling

**Glass Effect CSS Pattern**
```css
.glass {
  background: rgba(20, 20, 35, 0.8);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow:
    0 4px 24px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.glass-elevated {
  background: rgba(30, 30, 50, 0.9);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(155, 109, 255, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}
```

---

## Component Architecture

### Provider Chain

```
RootLayout
└── AppProviders
    ├── QueryClientProvider (TanStack React Query)
    ├── WebSocketProvider
    │   ├── useWebSocket()       # Get socket instance
    │   ├── useSocketStatus()    # Connection status
    │   ├── useSocketListener()  # Single event subscription
    │   ├── useSocketEvents()    # Multiple event subscriptions
    │   └── useSocketEmit()      # Event emission
    └── ReactQueryDevtools
```

### Dashboard Page Composition

```
DashboardPage
├── Connection Status Badge (WebSocket indicator)
├── Hero Section: AIChatbot
│   ├── Suggested questions
│   ├── Message history
│   └── Animated input with glow border
├── Stats Grid (4 columns)
│   ├── StatCard [Total Leads] with NumberTicker
│   ├── StatCard [Enriched]
│   ├── StatCard [Total Contacts]
│   └── StatCard [Pending]
├── Charts (2 columns)
│   ├── AreaChart [Weekly Leads]
│   └── PieChart [Enrichment Status]
├── Outreach Funnel (4 columns)
├── Top Businesses & Activity (2 columns)
│   ├── Business Cards Grid (6 cards)
│   └── Activity Feed
└── Lead Sources (BarChart horizontal)
```

### Compound Component Pattern

```typescript
// Card compound components
<Card variant="glass" hover>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>Content</CardContent>
  <CardFooter>Footer</CardFooter>
</Card>

// Badge variants
<Badge variant="success">Enriched</Badge>
<TrendBadge value={12.5} />
<StatusBadge status="pending" />
```

---

## WebSocket Integration

### WebSocket Provider (core/providers/websocket-provider.tsx)

**Provider Setup:**
```typescript
<WebSocketProvider>
  {children}
</WebSocketProvider>
```

**Configuration:**
```typescript
WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000'
Transports: ['websocket', 'polling']
Reconnection: enabled, max 5 attempts
Reconnection Delay: 1000-5000ms exponential backoff
```

### WebSocket Hooks

**useWebSocket()** - Full Context Access
```typescript
const { socket, isConnected, connectionError } = useWebSocket();
```

**useSocketStatus()** - Status Only (Lightweight)
```typescript
const { isConnected, connectionError } = useSocketStatus();
```

**useSocketListener(event, handler)** - Single Event
```typescript
useSocketListener('stats:updated', (data) => {
  setLastUpdate(new Date());
  queryClient.invalidateQueries({ queryKey: ['stats'] });
});
```

**useSocketEvents(handlers)** - Multiple Events
```typescript
useSocketEvents({
  'business:created': handleCreate,
  'business:enriched': handleEnrich,
  'business:deleted': handleDelete,
});
```

**useSocketEmit()** - Send Events
```typescript
const emit = useSocketEmit();
emit('start-scrape', { location: 'Freehold' });
```

### Event Types

| Event | Description | Payload |
|-------|-------------|---------|
| `business:created` | New lead added | `{ id, name, city, ... }` |
| `business:enriched` | Enrichment complete | `{ id, enrichment_status, contacts }` |
| `business:deleted` | Lead removed | `{ id }` |
| `stats:updated` | Dashboard metrics changed | `{ total, enriched, pending }` |
| `scraping:progress` | Scrape job progress | `{ progress, found, jobId }` |
| `enrichment:progress` | Enrichment batch progress | `{ progress, completed, total }` |

---

## TanStack Query Integration

### Query Client Configuration

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60000,           // 1 minute
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      retry: 1,
    },
    mutations: {
      retry: 1,
    },
  },
});
```

### Query Hooks Pattern

```typescript
// hooks/queries/use-stats.ts
export const statsKeys = {
  all: ['stats'] as const,
  current: () => [...statsKeys.all, 'current'] as const,
};

export function useStats() {
  return useQuery({
    queryKey: statsKeys.current(),
    queryFn: () => statsApi.getStats(),
    staleTime: 30000,
    refetchInterval: 60000,
  });
}
```

### Mutation Hooks Pattern

```typescript
// hooks/mutations/use-create-business.ts
export function useCreateBusiness() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => businessApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['businesses'] });
    },
  });
}
```

### Query Keys Organization

```
['stats']
  └── ['stats', 'current']
['businesses']
  └── ['businesses', 'detail', id]
['analytics']
  └── ['analytics', 'locations']
  └── ['analytics', 'sources']
  └── ['analytics', 'pipeline']
  └── ['analytics', 'growth']
```

---

## Animation System

### Framer Motion Patterns

```typescript
// Entrance animation
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3, ease: 'easeOut' }}
>
  Content
</motion.div>

// Hover effect
<motion.div
  whileHover={{ scale: 1.02, y: -4 }}
  whileTap={{ scale: 0.98 }}
>
  Interactive element
</motion.div>
```

### Magic UI Components

**NumberTicker** - Animated counter
```typescript
<NumberTicker value={847} prefix="$" suffix="k" decimalPlaces={0} />
```

**ShimmerButton** - Button with sweep effect
```typescript
<ShimmerButton>Enrich Leads</ShimmerButton>
```

**BlurFade** - Staggered entrance
```typescript
<BlurFade delay={0.2}>Content</BlurFade>
```

**AnimatedList** - Staggered list items
```typescript
<AnimatedList items={items} delay={0.1} />
```

### Background Animations (AppShell)

The dashboard features animated gradient orbs for ambient visual depth:
- 4 orbs with different sizes (200-350px)
- Blur effects (35-40px)
- Continuous opacity and scale animations
- Phase offsets for natural movement

---

## Dashboard Sections

### Stats Cards (components/dashboard/stats/)

**DashboardStats** - Real-time stats display
```typescript
interface StatCardProps {
  title: string;
  value: number;
  change: number;      // +/- percentage
  icon: React.ComponentType;
  color: string;       // hex color
  chart?: React.ReactNode;
}
```

Features:
- NumberTicker animation for value
- Trend indicator (up/down arrow)
- Optional sparkline chart
- WebSocket listener for updates

### Visualizations (components/dashboard/visualizations/)

| Component | API Endpoint | Purpose |
|-----------|--------------|---------|
| GeographicStats | `/api/analytics/locations` | Cities with lead counts |
| LeadSourcesChart | `/api/analytics/sources` | Lead source breakdown |
| PipelineBubbles | `/api/analytics/pipeline` | Enrichment stages |
| BusinessGrowthChart | `/api/analytics/growth` | Time series data |
| TopBusinessesList | `/api/businesses?limit=5` | Top businesses list |

### Sections (components/dashboard/sections/)

| Component | API Endpoint | Purpose |
|-----------|--------------|---------|
| MyLeadsSection | `/api/businesses/stats` | Lead summary cards |
| TopBusinessesGrid | `/api/businesses?limit=6` | Business card grid |
| RecentBusinessesTable | `/api/businesses?limit=10` | Recent businesses table |

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

## Testing Strategy

### Component Tests

```typescript
import { render, screen } from '@testing-library/react';
import { BusinessCard } from '@/components/dashboard/sections/top-businesses-grid';

describe('BusinessCard', () => {
  it('renders business name', () => {
    render(<BusinessCard business={mockBusiness} />);
    expect(screen.getByText('Test Business')).toBeInTheDocument();
  });
});
```

### Hook Tests

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useStats } from '@/hooks/queries/use-stats';

describe('useStats', () => {
  it('fetches stats data', async () => {
    const { result } = renderHook(() => useStats(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});
```

---

## Troubleshooting

### WebSocket Not Connecting

1. Verify `NEXT_PUBLIC_WS_URL` matches backend URL
2. Check backend CORS configuration
3. Inspect browser console for connection errors
4. Test with: `wscat -c ws://localhost:3000/socket.io/?EIO=4&transport=websocket`

### API Requests Failing

1. Verify `NEXT_PUBLIC_API_URL` is set correctly
2. Ensure backend server is running
3. Test endpoint directly: `curl http://localhost:3000/api/businesses`

### Build Errors

```bash
# Clean install
rm -rf node_modules .next
npm install
npm run build
```

---

## Performance Notes

### Query Optimization

- Use `staleTime: 30000` for frequently accessed data
- Use `refetchInterval` sparingly (only for real-time needs)
- Prefer WebSocket events over polling for updates

### Animation Performance

- NumberTicker triggers only on viewport visibility
- Stagger entrance animations with increasing delays
- Use `will-change: transform` for animated elements

### Bundle Size

- Dynamic import heavy components
- Tree-shake unused Magic UI components
- Prefer specific Lucide icon imports

---

## File Statistics

| Category | Files | Lines |
|----------|-------|-------|
| Dashboard Components | 18 | ~3,000 |
| Magic UI Effects | 7 | ~474 |
| UI Foundation | 10 | ~500 |
| Feature Modules | 19 | ~1,200 |
| Hooks | 13 | ~600 |
| Core Providers | 3 | ~300 |
| **Total** | **~165** | **~15,000** |
