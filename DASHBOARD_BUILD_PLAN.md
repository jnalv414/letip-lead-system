# Le Tip Lead System - Next.js 15 Dashboard Build Plan

## Project Overview

Building a stunning dark-mode dashboard for the Le Tip Lead Management System with real-time WebSocket updates and modern animations.

## Backend API Reference (Already Built)

### Core Endpoints
- `GET /api/businesses` - List with pagination, filtering by city/status/industry
- `GET /api/businesses/:id` - Single business with contacts and enrichment logs
- `GET /api/businesses/stats` - System statistics (total, enriched, pending, failed, by city, by industry)
- `POST /api/scrape` - Start scraping (location, radius, max_results)
- `POST /api/enrich/:id` - Single business enrichment
- `POST /api/enrich/batch/process` - Batch enrichment with limit
- `POST /api/outreach/:id` - Generate outreach message
- `GET /api/outreach/:id` - Get outreach messages

### WebSocket Events (Socket.io)
- Scraping progress: `scraping_progress`, `scraping_complete`, `scraping_error`
- Enrichment progress: `enrichment_progress`, `enrichment_complete`, `enrichment_error`
- Real-time stats updates: `stats_update`, `business_created`, `business_updated`

## Database Schema (Already Built)

### Models
- **Business**: id, name, address, city, state, zip, phone, website, category, rating, reviews, latitude, longitude, enriched, contacted, createdAt, updatedAt
- **Contact**: id, business_id, name, title, email, email_verified, phone, is_primary, created_at, updated_at
- **EnrichmentLog**: id, business_id, service, status, request_data, response_data, error_message, created_at
- **OutreachMessage**: id, business_id, contact_id, message_text, status, generated_at, sent_at, created_at, updated_at

## MVP Features

### 1. Dashboard Stats Page
- 6 stat cards with real-time updates (AnimatedNumber from Magic-UI)
  - Total Businesses
  - Enriched Count
  - Pending Count
  - Failed Count
  - Top City
  - Top Industry
- Activity Feed (recent businesses/enrichments)
- Real-time WebSocket integration
- Mobile responsive grid

### 2. Business Management
- Paginated table with sorting, filtering, search
- Business columns: Name, City, Category, Status, Contacts, Actions
- Business Detail page with:
  - Contact information
  - Enrichment status
  - Outreach history
  - Edit/Delete actions
- Real-time status updates

### 3. Scraper Interface
- Form to input location, radius, max_results
- Real-time progress tracking
- Scraping results display
- Error handling and retry

### 4. Enrichment Manager
- View pending businesses
- Batch enrichment form
- Real-time progress updates
- Enrichment logs display
- Success/failure counts

## Design System

### Theme
- Dark mode primary (no light mode)
- 8px baseline grid system
- 3D depth effects with drop shadows
- Smooth Framer Motion animations

### Typography
- Headings: Space Grotesk (bold, 700)
- Body: Inter (regular, 400)
- Sizes: 12px, 14px, 16px, 18px, 24px, 32px

### Colors (Tailwind Dark)
- Background: #0f0f0f (slate-950)
- Surface: #1a1a1a (slate-900)
- Accent: #3b82f6 (blue-500)
- Text Primary: #f1f5f9 (slate-100)
- Text Secondary: #94a3b8 (slate-400)
- Success: #10b981 (emerald-500)
- Warning: #f59e0b (amber-500)
- Error: #ef4444 (red-500)

### Component Spacing
- xs: 4px (0.5 * 8px)
- sm: 8px (1 * 8px)
- md: 16px (2 * 8px)
- lg: 24px (3 * 8px)
- xl: 32px (4 * 8px)

### Shadows (3D Depth)
- sm: 0 1px 2px 0 rgb(0 0 0 / 0.05)
- md: 0 4px 6px -1px rgb(0 0 0 / 0.1)
- lg: 0 10px 15px -3px rgb(0 0 0 / 0.1)
- xl: 0 20px 25px -5px rgb(0 0 0 / 0.1)

## Tech Stack

### Core
- Next.js 15 (App Router)
- React 19
- TypeScript 5.7
- Tailwind CSS 3.4
- Zustand (state management)

### UI Components
- ShadCN/UI (buttons, cards, forms, tables, dialogs, etc.)
- Magic-UI (AnimatedNumber, animated components)
- Framer Motion (animations)

### Forms & Validation
- React Hook Form
- Zod (schema validation)

### Real-time & API
- Socket.io (WebSocket client)
- Axios (HTTP client)
- TanStack Query optional (for caching)

### Security
- Password middleware (simple auth)
- Environment variables for API endpoints

## Folder Structure

```
dashboard/
├── app/
│   ├── layout.tsx              # Root layout with providers
│   ├── middleware.ts           # Password protection
│   ├── page.tsx                # Redirect to /dashboard
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx        # Login page
│   └── dashboard/
│       ├── layout.tsx          # Dashboard layout (header, sidebar)
│       ├── page.tsx            # Stats dashboard
│       ├── businesses/
│       │   ├── page.tsx        # Business list
│       │   └── [id]/
│       │       └── page.tsx    # Business detail
│       ├── scraper/
│       │   └── page.tsx        # Scraper interface
│       └── enrichment/
│           └── page.tsx        # Enrichment manager
├── components/
│   ├── ui/                     # ShadCN components
│   ├── dashboard/
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   ├── StatsCard.tsx
│   │   ├── StatsGrid.tsx
│   │   ├── ActivityFeed.tsx
│   │   ├── BusinessTable.tsx
│   │   ├── BusinessDetail.tsx
│   │   ├── ScraperForm.tsx
│   │   ├── ScrapingProgressCard.tsx
│   │   ├── EnrichmentForm.tsx
│   │   └── EnrichmentLogs.tsx
│   └── common/
│       └── Providers.tsx       # React providers (Zustand, Socket.io, etc.)
├── lib/
│   ├── api/
│   │   ├── businesses.ts       # API calls
│   │   ├── scraper.ts
│   │   ├── enrichment.ts
│   │   └── outreach.ts
│   ├── hooks/
│   │   ├── useBusinesses.ts    # Custom hooks
│   │   ├── useStats.ts
│   │   ├── useWebSocket.ts
│   │   └── useScraper.ts
│   ├── socket.ts               # Socket.io client setup
│   ├── axios.ts                # Axios instance
│   └── utils.ts
├── stores/
│   ├── businessStore.ts        # Zustand stores
│   ├── statsStore.ts
│   ├── scraperStore.ts
│   └── enrichmentStore.ts
├── types/
│   ├── api.ts                  # Type definitions
│   ├── models.ts
│   └── events.ts
├── styles/
│   ├── globals.css             # Tailwind directives
│   └── animations.css          # Custom animations
├── .env.local                  # Local environment
├── .env.example
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## Implementation Phases

### Phase 1: Foundation Setup
- Initialize Next.js 15 with TypeScript
- Install all dependencies
- Configure Tailwind dark mode
- Create type definitions and API client
- Set up environment configuration

### Phase 2: Core Infrastructure
- Create Zustand stores
- Implement API service layer
- Set up Socket.io client
- Create custom hooks
- Build layout components (Header, Sidebar)

### Phase 3: Feature Pages
- Dashboard Stats page with real-time updates
- Business management (list + detail)
- Scraper interface with progress tracking
- Enrichment manager with logs

### Phase 4: Integration & Polish
- Password protection middleware
- WebSocket event handling
- Error handling and loading states
- Framer Motion animations
- Mobile responsiveness
- Testing and validation

## MCP Resources Required

### context7 MCP
- Next.js 15 App Router patterns
- ShadCN/UI component installation and customization
- Tailwind CSS dark mode configuration
- Framer Motion animation patterns
- Socket.io client setup
- Zustand store patterns
- React Hook Form + Zod validation

### chrome-devtools MCP
- Visual validation during development
- Responsive design testing
- Animation smoothness verification
- WebSocket connection testing
- Dark theme rendering validation
- Form submission testing

## Success Criteria

- All 4 MVP features fully implemented and working
- Real-time WebSocket updates functioning
- Dark theme with proper contrast and 3D effects
- Smooth Framer Motion animations (60fps)
- Fully responsive on mobile, tablet, desktop
- Password protection working
- No TypeScript errors
- No console errors during normal operation
- All API calls working with proper error handling
