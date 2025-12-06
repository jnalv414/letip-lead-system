# CLAUDE.md - Frontend

Instructions for AI agents working on the Le Tip Lead System frontend.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server (port 3001)
npm run dev

# Type check
npm run type-check

# Build for production
npm run build
```

## Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | Next.js | 15.1.0 |
| React | React | 19.0.0 |
| Language | TypeScript | 5.7.2 (strict mode) |
| Styling | Tailwind CSS | 3.4.16 |
| Animations | Framer Motion | 11.15.0 |
| Icons | Lucide React | 0.468.0 |
| WebSocket | Socket.io-client | 4.8.1 |
| Utilities | clsx, tailwind-merge, cva | Latest |

## Architecture: Vertical Slice (VSA)

**MANDATORY:** All code follows Vertical Slice Architecture. See `GlobalRuleSections.md` for full standards.

### Directory Structure

```
App/FrontEnd/
├── app/                         # Next.js App Router pages
│   ├── layout.tsx               # Root layout (dark mode, Inter font)
│   ├── page.tsx                 # Home page
│   └── globals.css              # CSS variables, Tailwind base
│
├── features/                    # VERTICAL SLICES - one per capability
│   ├── dashboard/
│   │   ├── components/          # Dashboard-specific components
│   │   ├── hooks/               # useDashboardData, useStats
│   │   ├── api/                 # API calls for dashboard
│   │   ├── types/               # Dashboard TypeScript interfaces
│   │   └── index.ts             # Public exports ONLY
│   ├── leads/
│   ├── search/
│   ├── enrichment/
│   └── outreach/
│
├── shared/                      # Cross-cutting concerns (use sparingly)
│   ├── components/ui/           # Reusable UI (Button, Card, etc.)
│   ├── hooks/                   # useDebounce, usePagination
│   ├── lib/
│   │   ├── api.ts               # Fetch wrapper → localhost:3000
│   │   ├── socket.ts            # Socket.io singleton
│   │   └── utils.ts             # cn() for Tailwind merging
│   └── types/index.ts           # Shared entity types
│
├── tailwind.config.ts           # Tailwind with CSS variables
├── tsconfig.json                # Path aliases: @/, @/features/*, @/shared/*
└── next.config.ts               # React strict mode, typed routes
```

### VSA Rules

1. **Feature isolation** - Each feature folder contains ALL its code
2. **No cross-feature imports** - Features NEVER import from other features
3. **Shared only when proven** - Move to shared/ only after 3+ features need it
4. **Barrel exports** - Only export from index.ts, keep internals private

```typescript
// GOOD: Import from feature barrel
import { BusinessCard, useBusinesses } from '@/features/leads'

// BAD: Import internal component directly
import { BusinessCard } from '@/features/leads/components/BusinessCard'

// BAD: Cross-feature import
import { useStats } from '@/features/dashboard/hooks/useStats'
```

## Path Aliases

```typescript
import { cn } from '@/shared/lib/utils'
import { Business } from '@/shared/types'
import { useLeads } from '@/features/leads'
```

## Backend Connection

- **API Base URL:** `http://localhost:3000` (NestJS backend)
- **WebSocket:** Same URL, transport: websocket only
- **Env override:** `NEXT_PUBLIC_API_URL`

### API Client Usage

```typescript
import { api } from '@/shared/lib/api'

// GET request
const businesses = await api<Business[]>('/api/businesses')

// POST request
const result = await api<Business>('/api/businesses', {
  method: 'POST',
  body: { name: 'Acme Corp', address: '123 Main St' }
})
```

### WebSocket Usage

```typescript
import { getSocket, connectSocket, disconnectSocket } from '@/shared/lib/socket'

// In a component or hook
useEffect(() => {
  connectSocket()
  const socket = getSocket()

  socket.on('business:updated', (data) => {
    console.log('Business updated:', data)
  })

  return () => disconnectSocket()
}, [])
```

## Shared Types

Located in `shared/types/index.ts`:

```typescript
interface Business {
  id: string
  name: string
  address: string | null
  phone: string | null
  website: string | null
  email: string | null
  latitude: number | null
  longitude: number | null
  enrichment_status: 'pending' | 'enriched' | 'failed'
  industry: string | null
  employee_count: number | null
  year_founded: number | null
  created_at: string
  updated_at: string
}

interface Contact { ... }
interface EnrichmentLog { ... }
interface OutreachMessage { ... }
interface PaginatedResponse<T> { ... }
```

## Styling

### CSS Variables (globals.css)

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --primary: 222.2 47.4% 11.2%;
  --muted: 210 40% 96.1%;
  --accent: 210 40% 96.1%;
  --destructive: 0 84.2% 60.2%;
  --border: 214.3 31.8% 91.4%;
  --radius: 0.5rem;
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  /* ... dark variants */
}
```

### Tailwind Usage

```typescript
import { cn } from '@/shared/lib/utils'

// Merge conditional classes
<div className={cn(
  'rounded-lg border bg-card',
  isActive && 'ring-2 ring-primary',
  className
)} />
```

### Dark Mode

Dark mode is enabled by default via `<html className="dark">` in layout.tsx.

## Current Status

**Implemented:**
- [x] Next.js 15 with App Router
- [x] TypeScript strict mode
- [x] VSA directory structure scaffolded
- [x] Tailwind with CSS variables
- [x] API client with typed fetch
- [x] WebSocket singleton
- [x] Shared type definitions
- [x] Path aliases configured

**Pending:**
- [ ] UI components (Button, Card, Input, etc.)
- [ ] Feature implementations (dashboard, leads, search, enrichment, outreach)
- [ ] TanStack Query integration
- [ ] React Hook Form integration
- [ ] Zod validation
- [ ] Layout components (Sidebar, Header)
- [ ] Page implementations

## Development Workflow

### Adding a New Feature

1. Create feature directory: `features/{feature-name}/`
2. Add subdirectories: `components/`, `hooks/`, `api/`, `types/`
3. Create barrel export: `index.ts`
4. Implement components and hooks
5. Export only public API from index.ts

### Adding Shared Components

Only add to shared/ when:
- 3+ features need the same component
- It has no feature-specific logic
- It's purely presentational

```bash
# Example: Adding a Button component
touch shared/components/ui/button.tsx
```

## Commands

```bash
npm run dev          # Start dev server (port 3001)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint check
npm run type-check   # TypeScript check
```

## Environment Variables

```bash
# .env.local (create if needed)
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Global Rules

See `GlobalRuleSections.md` for complete project standards including:
- Core principles (data-first, performance, progressive enhancement)
- Multi-tenancy patterns
- Export format specifications (CSV, PDF, Excel)
- Logging rules
- Testing patterns
- PR checklists

## Related Documentation

- **Backend:** `../BackEnd/CLAUDE.md`
- **Project Standards:** `./GlobalRuleSections.md`
- **Progress:** `../../PROGRESS.md`
