# Le Tip Lead System - Global Rule Sections

This document extracts the core principles and patterns from CLAUDE.md that form the permanent foundation for all code in this project.

---

## 1. Core Principles

### MODULE ISOLATION IS CRITICAL
- Each NestJS module is self-contained with its own controller, service, module file, and DTOs
- Services are injected via dependency injection - never import instances directly
- Database access goes through PrismaService only

### REAL-TIME FIRST
- All mutations emit WebSocket events via WebsocketGateway
- Frontend consumes real-time updates for live dashboard experience
- Never assume synchronous state - always listen for events

### EXTERNAL API RESILIENCE
- All external calls (Hunter.io, AbstractAPI) must handle failures gracefully
- Implement fallback templates for AI message generation
- Log all enrichment attempts to `enrichment_log` table for debugging
- Respect rate limits: Hunter.io (500/month), AbstractAPI (3,000/month)

### DATABASE RELATIONSHIPS MATTER
- All foreign keys use `onDelete: Cascade` - deleting a business removes all related data
- Enrichment status tracked on business: `pending`, `enriched`, `failed`
- Always update business.updated_at on enrichment completion

### API SECRETS ARE FILE-BASED
- Secrets stored in `~/.config/letip_api_secrets.json` (not `.env`)
- ConfigService loads this file on startup
- Never hardcode API keys or commit them to git

---

## 2. Tech Stack Decisions

### Backend Stack
- **Framework:** NestJS with TypeScript
- **Database:** PostgreSQL 14+ with Prisma ORM
- **WebSockets:** Socket.io for real-time updates
- **Scraping:** Puppeteer for Google Maps scraping
- **External APIs:** Hunter.io, AbstractAPI
- **Testing:** Jest (unit + e2e)

### Frontend Stack
- **Framework:** Next.js 16 (App Router, Turbopack stable)
- **Language:** TypeScript 5.7 (strict mode)
- **Styling:** Tailwind CSS 3.4 (dark-first)
- **Components:** ShadCN/UI + Magic-UI
- **Animations:** Framer Motion
- **State Management:** Zustand
- **HTTP Client:** Axios
- **Real-time:** Socket.io client
- **Forms:** React Hook Form + Zod

### Development Tools
- **Backend Linting:** ESLint + Prettier
- **Frontend Linting:** ESLint + Prettier
- **Type Checking:** TypeScript strict mode (both backend and frontend)
- **Package Managers:** Yarn (backend), npm (frontend)

---

## 3. Architecture Patterns

### VERTICAL SLICE ARCHITECTURE

We use **vertical slicing** where each feature owns its complete stack from UI → API → Database. This improves:
- **Cohesion**: Related code lives together
- **Independence**: Features can be developed in parallel
- **Clarity**: Easy to find all code for a feature
- **Testability**: Each slice can be tested in isolation

### Backend Architecture

**Vertical Slice Structure:**
```
nodejs_space/src/
├── businesses/      # VERTICAL SLICE: Business management
│   ├── businesses.controller.ts    # HTTP endpoints
│   ├── businesses.service.ts       # Business logic
│   ├── businesses.module.ts        # DI configuration
│   ├── dto/                        # Request/response types
│   └── tests/                      # Feature tests
│
├── scraper/         # VERTICAL SLICE: Google Maps scraping
│   ├── scraper.controller.ts
│   ├── scraper.service.ts
│   ├── scraper.module.ts
│   └── dto/
│
├── enrichment/      # VERTICAL SLICE: Lead enrichment
│   ├── enrichment.controller.ts
│   ├── enrichment.service.ts
│   ├── enrichment.module.ts
│   └── dto/
│
├── outreach/        # VERTICAL SLICE: AI message generation
│   ├── outreach.controller.ts
│   ├── outreach.service.ts
│   ├── outreach.module.ts
│   └── dto/
│
└── shared/          # HORIZONTAL: Cross-cutting concerns
    ├── prisma/      # Database client
    ├── websocket/   # Socket.io gateway
    ├── telegram/    # Notifications
    └── config/      # Configuration
```

**Vertical Slice Principles:**
- Each slice is self-contained (controller + service + DTOs + tests)
- Slices communicate through well-defined interfaces
- Shared infrastructure lives in `shared/` directory
- Database access always goes through PrismaService (shared)
- WebSocket events emitted through WebsocketGateway (shared)

**Service Layer Pattern:**
- Controllers handle HTTP/validation
- Services contain business logic
- WebsocketGateway emits events (shared service)
- PrismaService handles database (shared service)

### Frontend Architecture

**Vertical Slice Structure (Next.js 16 App Router):**
```
dashboard/
├── app/                          # Routes (vertical slices by page)
│   ├── (auth)/
│   │   └── login/               # SLICE: Authentication
│   │       └── page.tsx
│   └── dashboard/
│       ├── page.tsx             # SLICE: Stats Dashboard
│       ├── businesses/          # SLICE: Business Management
│       │   ├── page.tsx         # List view
│       │   └── [id]/
│       │       └── page.tsx     # Detail view
│       ├── scraper/             # SLICE: Scraper Tool
│       │   └── page.tsx
│       └── enrichment/          # SLICE: Enrichment Manager
│           └── page.tsx
│
├── features/                     # Feature-specific components
│   ├── stats/
│   │   ├── StatsGrid.tsx
│   │   ├── StatsCard.tsx
│   │   └── useStats.ts          # Feature hook
│   ├── businesses/
│   │   ├── BusinessTable.tsx
│   │   ├── BusinessDetail.tsx
│   │   ├── BusinessForm.tsx
│   │   └── useBusinesses.ts     # Feature hook
│   ├── scraper/
│   │   ├── ScraperForm.tsx
│   │   ├── ScrapingProgress.tsx
│   │   └── useScraper.ts        # Feature hook
│   └── enrichment/
│       ├── EnrichmentQueue.tsx
│       ├── EnrichmentLogs.tsx
│       └── useEnrichment.ts     # Feature hook
│
├── components/                   # Shared components
│   ├── ui/                      # ShadCN primitives
│   └── layout/                  # Layout components
│       ├── Header.tsx
│       ├── Sidebar.tsx
│       └── PageContainer.tsx
│
├── lib/                         # Shared infrastructure
│   ├── api/                     # API service layer
│   │   ├── businesses.ts
│   │   ├── scraper.ts
│   │   ├── enrichment.ts
│   │   └── outreach.ts
│   ├── hooks/                   # Shared hooks
│   │   ├── useWebSocket.ts
│   │   └── useAuth.ts
│   ├── axios.ts                 # HTTP client
│   └── socket.ts                # WebSocket client
│
├── stores/                      # Zustand state (by feature)
│   ├── businessStore.ts
│   ├── statsStore.ts
│   ├── scraperStore.ts
│   └── enrichmentStore.ts
│
├── types/                       # TypeScript definitions
│   ├── models.ts
│   ├── api.ts
│   └── events.ts
│
└── styles/                      # Global styles
    ├── globals.css
    └── animations.ts
```

**Vertical Slice Principles (Frontend):**
- Each feature owns its page routes + components + hooks + store
- Feature components live in `features/<name>/` directory
- Shared components (layout, primitives) in `components/`
- Shared infrastructure (API, WebSocket) in `lib/`
- Feature-specific state in separate Zustand stores

**State Management Pattern:**
- One Zustand store per feature (vertical slice)
- Feature hooks consume feature stores
- Shared hooks (useWebSocket, useAuth) for cross-cutting concerns
- WebSocket events update stores
- Components render from stores

---

## 4. Documentation Standards

### Backend Documentation (Swagger/OpenAPI)

**Controller Annotations:**
```typescript
@ApiTags('Resource')
@ApiOperation({ summary: 'What it does' })
@ApiResponse({ status: 200, description: 'Success' })
@ApiParam({ name: 'id', type: Number })
```

**Service JSDoc:**
```typescript
/**
 * What this method does
 *
 * @param businessId - Database ID
 * @returns Object with results
 *
 * @side-effects
 * - Database writes
 * - WebSocket events
 * - External API calls
 *
 * @throws {NotFoundException} If not found
 *
 * @performance
 * - Execution time estimates
 * - Rate limit considerations
 */
async method(businessId: number): Promise<Result> {
  // Implementation
}
```

**DTO Documentation:**
```typescript
export class CreateDto {
  @ApiProperty({
    description: 'Field description',
    example: 'example value',
    required: true
  })
  @IsString()
  field: string;
}
```

### Frontend Documentation

**Component Documentation:**
```typescript
/**
 * Component purpose
 *
 * @example
 * <Component prop={value} />
 */
interface ComponentProps {
  /** Prop description */
  prop: string;
}
```

**Hook Documentation:**
```typescript
/**
 * Hook purpose
 *
 * @returns { data, loading, error }
 *
 * @example
 * const { data } = useHook();
 */
export function useHook() {
  // Implementation
}
```

---

## 5. WebSocket Event Standards

### Event Naming Convention
Format: `<resource>:<action>`

Examples:
- `business:created`
- `business:enriched`
- `business:deleted`
- `stats:updated`
- `scraping:progress`
- `enrichment:progress`

### Event Payload Structure
**Required fields:**
```typescript
{
  timestamp: string;  // ISO 8601
  type: string;       // Event type
  data: any;          // Event payload
}
```

### Emitting Pattern
```typescript
// ✅ CORRECT - Use WebsocketGateway service
this.websocketGateway.emitEvent('business:created', business);

// ❌ WRONG - Don't use Socket.io directly
this.io.emit('business:created', business);
```

---

## 6. Database Standards

### Schema Patterns

**4 Core Models:**
```prisma
business (primary table)
├── contacts[] (one-to-many)
├── enrichment_logs[] (audit trail)
└── outreach_messages[]
```

**All relationships use `onDelete: Cascade`**

**Indexes on:**
- `city`, `industry`, `enrichment_status`
- Foreign keys
- Email fields

### Querying Best Practices

**Include related data when needed:**
```typescript
const business = await this.prisma.business.findUnique({
  where: { id },
  include: {
    contacts: true,
    enrichment_logs: { orderBy: { created_at: 'desc' } }
  }
});
```

**Use indexes for performance:**
```typescript
const businesses = await this.prisma.business.findMany({
  where: {
    city: 'Freehold',                    // Indexed
    enrichment_status: 'pending'          // Indexed
  }
});
```

**Select only needed fields:**
```typescript
const businesses = await this.prisma.business.findMany({
  select: {
    id: true,
    name: true,
    city: true,
    _count: { select: { contacts: true } }
  }
});
```

---

## 7. Testing Patterns

### Backend Testing

**Test Structure:**
```
src/businesses/businesses.service.ts  →  test/businesses/businesses.service.spec.ts
```

**Unit Test Pattern:**
```typescript
describe('Service', () => {
  let service: Service;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        Service,
        { provide: PrismaService, useValue: { /* mocks */ } }
      ]
    }).compile();

    service = module.get<Service>(Service);
  });

  it('should perform action', async () => {
    // Setup mocks
    // Execute
    // Assert
  });
});
```

**E2E Test Pattern:**
```typescript
describe('Controller (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  it('/api/resource (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/resource')
      .expect(200);
  });
});
```

### Frontend Testing

**Component Testing:**
```typescript
describe('Component', () => {
  it('renders correctly', () => {
    render(<Component />);
    expect(screen.getByText('text')).toBeInTheDocument();
  });
});
```

**Hook Testing:**
```typescript
describe('useHook', () => {
  it('returns data', async () => {
    const { result } = renderHook(() => useHook());
    await waitFor(() => expect(result.current.data).toBeDefined());
  });
});
```

---

## 8. Error Handling Standards

### Backend Error Handling

**Always log to enrichment_log:**
```typescript
try {
  const result = await this.callExternalAPI();
  await this.logSuccess(result);
  return result;
} catch (error) {
  await this.logFailure(error);
  throw error;
}
```

**Use NestJS exceptions:**
```typescript
import { NotFoundException, BadRequestException } from '@nestjs/common';

if (!business) {
  throw new NotFoundException(`Business ${id} not found`);
}

if (!business.website) {
  throw new BadRequestException('Business requires website for enrichment');
}
```

### Frontend Error Handling

**API calls:**
```typescript
try {
  const data = await api.fetchData();
  return data;
} catch (error) {
  if (error.response?.status === 404) {
    toast.error('Not found');
  } else {
    toast.error('An error occurred');
  }
  throw error;
}
```

**WebSocket disconnection:**
```typescript
socket.on('disconnect', () => {
  console.warn('Socket disconnected, attempting reconnect...');
  // Auto-reconnect handled by Socket.io
});
```

---

## 9. Security Standards

### Current State: NO AUTHENTICATION
**Before production:**
- [ ] Add JWT authentication to API
- [ ] Restrict WebSocket CORS
- [ ] Move API keys to encrypted secret management
- [ ] Implement rate limiting
- [ ] Enable HTTPS/SSL
- [ ] Add request validation
- [ ] Implement RBAC

### Current Security Practices
- API keys in file-based secrets (not git)
- Environment variables for frontend
- Password middleware for dashboard
- Input validation with class-validator
- CORS enabled (needs tightening)

---

## 10. Performance Standards

### Backend Performance

**Rate Limiting:**
```typescript
// Manual delays between API calls
for (const item of items) {
  await processItem(item);
  await new Promise(resolve => setTimeout(resolve, 1000));
}
```

**Database Optimization:**
- Use indexes on filtered fields
- Select only needed fields
- Paginate large result sets
- Use counts instead of loading all records

**Puppeteer Cleanup:**
```typescript
try {
  await page.goto(url);
  // Scraping logic
} finally {
  await browser.close();  // Critical!
}
```

### Frontend Performance

**Code Splitting:**
- Automatic with Next.js App Router
- Lazy load components: `dynamic(() => import())`

**Image Optimization:**
- Use Next.js Image component
- Specify width/height
- Use proper formats (WebP)

**State Management:**
- Use Zustand selectors
- Avoid unnecessary re-renders
- Debounce WebSocket updates

---

This document serves as the permanent foundation for all development in the Le Tip Lead System project. All code must adhere to these standards.
