# Le Tip Lead System Development Instructions

## Project Overview

Automated business lead generation, enrichment, and outreach platform for Le Tip of Western Monmouth County, New Jersey. Built with NestJS backend + Next.js 16 dashboard, PostgreSQL/Prisma, Socket.io WebSockets, Apify scraping, and external API integrations (Hunter.io, AbstractAPI).

**Local Development:** http://localhost:3000

**Architecture:**
```
letip-lead-system/
├── nodejs_space/       # NestJS backend (Port 3000)
│   ├── src/
│   │   ├── businesses/  # CRUD + WebSocket events
│   │   ├── scraper/     # Google Maps scraping (Puppeteer)
│   │   ├── enrichment/  # Hunter.io + AbstractAPI
│   │   ├── outreach/    # AI message generation
│   │   ├── telegram/    # Telegram bot (optional)
│   │   ├── websocket/   # Socket.io gateway
│   │   └── prisma/      # Database client
│   └── prisma/
│       └── schema.prisma # 4 models: business, contact, enrichment_log, outreach_message
│
└── dashboard/          # Next.js 16 frontend (in development)
    └── (ShadCN + Magic-UI + Framer Motion + Socket.io client)
```

## Core Principles

1. **MODULE ISOLATION IS CRITICAL**
   - Each NestJS module is self-contained with its own controller, service, module file, and DTOs
   - Services are injected via dependency injection - never import instances directly
   - Database access goes through PrismaService only

2. **REAL-TIME FIRST**
   - All mutations emit WebSocket events via WebsocketGateway
   - Frontend consumes real-time updates for live dashboard experience
   - Never assume synchronous state - always listen for events

3. **EXTERNAL API RESILIENCE**
   - All external calls (Hunter.io, AbstractAPI, Abacus.AI) must handle failures gracefully
   - Implement fallback templates for AI message generation
   - Log all enrichment attempts to `enrichment_log` table for debugging
   - Respect rate limits: Hunter.io (500/month), AbstractAPI (3,000/month)

4. **API SECRETS ARE FILE-BASED, NOT ENV-BASED**
   - Secrets stored in `~/.config/abacusai_auth_secrets.json` (not `.env`)
   - ConfigService loads this file on startup
   - Never hardcode API keys or commit them to git

5. **DATABASE RELATIONSHIPS MATTER**
   - All foreign keys use `onDelete: Cascade` - deleting a business removes all related data
   - Enrichment status tracked on business: `pending`, `enriched`, `failed`
   - Always update business.updated_at on enrichment completion

---

## Development Workflow

### Backend (NestJS)

**Start development server:**
```bash
cd nodejs_space
yarn start:dev  # Hot-reload enabled
```

**Production build:**
```bash
yarn build
yarn start:prod
```

**Database operations:**
```bash
yarn prisma generate        # Generate client after schema.prisma changes
yarn prisma db push         # Push schema to database (dev/prototype)
yarn prisma migrate dev     # Create migration file (production)
yarn prisma studio          # Open Prisma Studio GUI (localhost:5555)
```

**Code quality:**
```bash
yarn lint                   # ESLint with auto-fix
yarn format                 # Prettier formatting
```

**Testing:**
```bash
yarn test                   # Run all tests
yarn test:watch             # Watch mode
yarn test:cov               # Coverage report
yarn test:e2e               # End-to-end tests
```

### Dashboard (Next.js 16)

**Start development server:**
```bash
cd dashboard
npm run dev                 # Runs on port 3001
```

**Production build:**
```bash
npm run build               # Creates optimized production build
npm run start               # Starts production server
```

**Export static:**
```bash
npm run build && npm run export  # Creates /out directory for NestJS static serving
```

---

## Module Documentation Standards

Every NestJS module follows this pattern and MUST include proper documentation:

### Controller Documentation (Swagger/OpenAPI)

Controllers expose HTTP endpoints and MUST be fully documented for Swagger UI.

**Required elements:**
1. `@ApiTags()` - Group related endpoints
2. `@ApiOperation()` - Describe what endpoint does
3. `@ApiResponse()` - Document all possible responses
4. `@ApiParam()` / `@ApiQuery()` - Document parameters

**Example:**
```typescript
@Controller('api/businesses')
@ApiTags('Businesses')
export class BusinessesController {

  @Get()
  @ApiOperation({
    summary: 'List all businesses with filtering and pagination',
    description: 'Returns paginated list of businesses. Supports filtering by city, industry, and enrichment status.'
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'city', required: false, type: String, example: 'Freehold' })
  @ApiQuery({ name: 'enrichment_status', required: false, enum: ['pending', 'enriched', 'failed'] })
  @ApiResponse({ status: 200, description: 'Success', type: PaginatedBusinessesDto })
  @ApiResponse({ status: 400, description: 'Invalid query parameters' })
  async findAll(@Query() query: QueryBusinessesDto) {
    return this.businessesService.findAll(query);
  }
}
```

### Service Documentation

Services contain business logic and MUST document complex operations with JSDoc.

**Required elements:**
1. **Purpose** - What this method does
2. **Parameters** - Type, description, valid values
3. **Returns** - What it returns and format
4. **Side Effects** - Database writes, WebSocket events, external API calls
5. **Error Cases** - What exceptions can be thrown

**Example:**
```typescript
/**
 * Enriches a business with contact and firmographic data.
 *
 * Makes sequential calls to:
 * 1. AbstractAPI - Company firmographics (industry, employees, year founded)
 * 2. Hunter.io - Email discovery and verification
 *
 * @param businessId - Database ID of business to enrich
 * @returns Object with enrichment results: { abstract: boolean, hunter: boolean, errors: string[] }
 *
 * @side-effects
 * - Updates business.enrichment_status to 'enriched' or 'failed'
 * - Creates contact records for discovered emails
 * - Logs all attempts to enrichment_log table
 * - Emits 'business:enriched' WebSocket event
 *
 * @throws {NotFoundException} If business ID doesn't exist
 * @throws {BadRequestException} If business has no website (required for enrichment)
 *
 * @performance
 * - AbstractAPI: ~500-1000ms per call
 * - Hunter.io: ~800-1500ms per call
 * - Total: ~2-3 seconds per business
 * - Rate limits: Hunter 500/month, Abstract 3,000/month
 *
 * @example
 * // Enrich single business
 * const result = await enrichmentService.enrichBusiness(123);
 * // { abstract: true, hunter: true, errors: [] }
 *
 * @example
 * // Business with no website fails
 * const result = await enrichmentService.enrichBusiness(456);
 * // { abstract: false, hunter: false, errors: ['No website found'] }
 */
async enrichBusiness(businessId: number): Promise<EnrichmentResult> {
  // Implementation
}
```

### DTO (Data Transfer Object) Documentation

DTOs define request/response shapes and MUST use `class-validator` decorators + Swagger annotations.

**Required:**
1. `@ApiProperty()` - Describe each field with type, example, description
2. Validation decorators - `@IsString()`, `@IsNumber()`, `@IsOptional()`, etc.
3. Transformation - `@Transform()` if needed

**Example:**
```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class ScrapeRequestDto {
  @ApiProperty({
    description: 'Location to search for businesses (city, address, or landmark)',
    example: 'Route 9, Freehold, NJ',
    required: true
  })
  @IsString()
  location: string;

  @ApiProperty({
    description: 'Search radius in miles',
    example: 1,
    minimum: 0.5,
    maximum: 5,
    default: 1,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(0.5)
  @Max(5)
  @Type(() => Number)
  radius?: number = 1;

  @ApiProperty({
    description: 'Business category to filter (e.g., restaurants, lawyers, dentists)',
    example: 'plumbing services',
    required: false
  })
  @IsOptional()
  @IsString()
  business_type?: string;

  @ApiProperty({
    description: 'Maximum number of businesses to scrape',
    example: 50,
    minimum: 1,
    maximum: 500,
    default: 50,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(500)
  @Type(() => Number)
  max_results?: number = 50;
}
```

---

## WebSocket Event Standards

All real-time events follow consistent naming and payload structure.

### Event Naming Convention

Format: `<resource>:<action>`

Examples:
- `business:created` - New business added
- `business:enriched` - Business enrichment completed
- `business:deleted` - Business removed
- `stats:updated` - Dashboard statistics changed
- `scraping:progress` - Live scraping progress
- `enrichment:progress` - Batch enrichment progress

### Emitting Events

**Always emit through WebsocketGateway:**
```typescript
// ❌ WRONG - Don't use Socket.io directly
this.io.emit('business:created', business);

// ✅ CORRECT - Use WebsocketGateway service
this.websocketGateway.emitEvent('business:created', business);
```

### Event Payload Structure

**Required fields in all payloads:**
- `timestamp` - ISO 8601 timestamp
- `type` - Event type (matches event name)
- `data` - Event-specific payload

**Example:**
```typescript
{
  timestamp: '2025-01-21T15:30:00.000Z',
  type: 'business:enriched',
  data: {
    id: 123,
    name: 'ABC Plumbing',
    enrichment_status: 'enriched',
    contacts_count: 2
  }
}
```

### Frontend Event Consumption

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

---

## Database Schema & Migrations

### Schema Structure

**4 Core Models:**
```prisma
business (primary table)
├── contacts[] (one-to-many)
├── enrichment_logs[] (audit trail)
└── outreach_messages[]

Relationships: ALL use onDelete: Cascade
Indexes: city, industry, enrichment_status, email
```

### Making Schema Changes

**1. Edit `prisma/schema.prisma`:**
```prisma
model business {
  id                 Int       @id @default(autoincrement())
  new_field          String?   // Add new field
  // ...
}
```

**2. Generate Prisma Client:**
```bash
yarn prisma generate
```

**3. Push to database (development):**
```bash
yarn prisma db push  # Direct schema sync (no migration file)
```

**4. Create migration (production):**
```bash
yarn prisma migrate dev --name add_new_field_to_business
# Creates migration file in prisma/migrations/
```

**5. Apply migration (production):**
```bash
yarn prisma migrate deploy
```

### Querying Best Practices

**Include related data:**
```typescript
// ✅ GOOD - Include related records when needed
const business = await this.prisma.business.findUnique({
  where: { id },
  include: {
    contacts: true,
    enrichment_logs: { orderBy: { created_at: 'desc' } },
    outreach_messages: { where: { status: 'generated' } }
  }
});
```

**Optimize queries:**
```typescript
// ✅ GOOD - Only select fields you need
const businesses = await this.prisma.business.findMany({
  select: {
    id: true,
    name: true,
    city: true,
    enrichment_status: true,
    _count: { select: { contacts: true } }  // Get count without loading all contacts
  }
});
```

**Use indexes:**
```typescript
// ✅ GOOD - Filter on indexed fields for performance
const businesses = await this.prisma.business.findMany({
  where: {
    city: 'Freehold',                    // Indexed
    enrichment_status: 'pending'          // Indexed
  }
});
```

---

## External API Integration Patterns

### API Secrets Configuration

**Location:** `~/.config/letip_api_secrets.json`

**Format:**
```json
{
  "hunter.io": {
    "secrets": {
      "api_key": { "value": "your_hunter_api_key_here" }
    }
  },
  "abstractapi": {
    "secrets": {
      "api_key": { "value": "your_abstract_api_key_here" }
    }
  },
  "telegram": {
    "secrets": {
      "bot_token": { "value": "your_telegram_bot_token_here" }
    }
  }
}
```

**Loading in code:**
```typescript
// src/config/config.service.ts
import { Injectable } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';

@Injectable()
export class ConfigService {
  private secrets: Record<string, any>;

  constructor() {
    const secretsPath = join(process.env.HOME, '.config', 'letip_api_secrets.json');
    this.secrets = JSON.parse(readFileSync(secretsPath, 'utf-8'));
  }

  getHunterApiKey(): string {
    return this.secrets['hunter.io']?.secrets?.api_key?.value;
  }
}
```

### Rate Limiting Pattern

**Manual delays between calls:**
```typescript
async enrichBatch(count: number = 10): Promise<BatchResult> {
  const businesses = await this.prisma.business.findMany({
    where: { enrichment_status: 'pending' },
    take: count
  });

  const results = [];

  for (const business of businesses) {
    results.push(await this.enrichBusiness(business.id));

    // Respect rate limits - 1 second delay between calls
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return { total: count, enriched: results.filter(r => r.success).length };
}
```

### Error Handling & Logging

**Always log to enrichment_log table:**
```typescript
async callHunterApi(domain: string): Promise<HunterResult> {
  try {
    const response = await axios.get(`https://api.hunter.io/v2/domain-search`, {
      params: { domain, api_key: this.configService.getHunterApiKey() }
    });

    // Log success
    await this.prisma.enrichment_log.create({
      data: {
        business_id: businessId,
        service: 'hunter',
        status: 'success',
        request_data: JSON.stringify({ domain }),
        response_data: JSON.stringify(response.data)
      }
    });

    return response.data;
  } catch (error) {
    // Log failure
    await this.prisma.enrichment_log.create({
      data: {
        business_id: businessId,
        service: 'hunter',
        status: 'failed',
        request_data: JSON.stringify({ domain }),
        error_message: error.message
      }
    });

    throw error;
  }
}
```

### Fallback Templates

**AI message generation with fallback:**
```typescript
async generateOutreachMessage(businessId: number): Promise<string> {
  try {
    // Try AI generation first
    return await this.callAbacusAI(business);
  } catch (error) {
    this.logger.warn('AI generation failed, using template', { error: error.message });

    // Fallback to hardcoded template
    return this.generateTemplateMessage(business);
  }
}

private generateTemplateMessage(business: Business): string {
  return `
Subject: Exclusive Business Networking Opportunity

Dear ${business.contacts[0]?.name || 'Business Owner'},

I'm reaching out on behalf of Le Tip of Western Monmouth County...
[Template continues]
  `.trim();
}
```

---

## Testing Strategy

### Test Structure

**Tests mirror source structure:**
```
src/businesses/businesses.service.ts  →  test/businesses/businesses.service.spec.ts
src/enrichment/enrichment.service.ts  →  test/enrichment/enrichment.service.spec.ts
src/scraper/scraper.service.ts        →  test/scraper/scraper.service.spec.ts
```

### Unit Testing Pattern

**Test services in isolation with mocked dependencies:**
```typescript
describe('EnrichmentService', () => {
  let service: EnrichmentService;
  let prisma: PrismaService;
  let config: ConfigService;
  let gateway: WebsocketGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnrichmentService,
        {
          provide: PrismaService,
          useValue: {
            business: {
              findUnique: jest.fn(),
              update: jest.fn()
            },
            enrichment_log: {
              create: jest.fn()
            }
          }
        },
        {
          provide: ConfigService,
          useValue: {
            getHunterApiKey: jest.fn().mockReturnValue('test_key')
          }
        },
        {
          provide: WebsocketGateway,
          useValue: {
            emitEvent: jest.fn()
          }
        }
      ]
    }).compile();

    service = module.get<EnrichmentService>(EnrichmentService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should enrich business successfully', async () => {
    // Setup mocks
    jest.spyOn(prisma.business, 'findUnique').mockResolvedValue(mockBusiness);
    jest.spyOn(service as any, 'callHunterApi').mockResolvedValue(mockHunterResponse);

    // Execute
    const result = await service.enrichBusiness(123);

    // Assert
    expect(result.hunter).toBe(true);
    expect(prisma.business.update).toHaveBeenCalledWith({
      where: { id: 123 },
      data: { enrichment_status: 'enriched' }
    });
  });
});
```

### E2E Testing Pattern

**Test full request flow:**
```typescript
describe('BusinessesController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/api/businesses (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/businesses?page=1&limit=20')
      .expect(200)
      .expect(res => {
        expect(res.body).toHaveProperty('data');
        expect(res.body).toHaveProperty('meta');
        expect(Array.isArray(res.body.data)).toBe(true);
      });
  });
});
```

### Running Tests

```bash
# All tests
yarn test

# Specific file
yarn test businesses.service.spec.ts

# Watch mode
yarn test:watch

# Coverage
yarn test:cov

# E2E only
yarn test:e2e
```

---

## Adding New Features

### 1. Create Module Structure

```bash
# Example: Adding a new "reports" module
cd nodejs_space/src
mkdir reports
cd reports
touch reports.module.ts reports.controller.ts reports.service.ts
mkdir dto
touch dto/create-report.dto.ts dto/query-reports.dto.ts
```

### 2. Define Database Schema (if needed)

**Edit `prisma/schema.prisma`:**
```prisma
model report {
  id          Int      @id @default(autoincrement())
  title       String
  type        String   // 'monthly', 'quarterly', 'custom'
  data        String   @db.Text
  created_at  DateTime @default(now())

  @@index([type])
  @@index([created_at])
}
```

**Generate client:**
```bash
yarn prisma generate
yarn prisma db push
```

### 3. Implement Service

**reports.service.ts:**
```typescript
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WebsocketGateway } from '../websocket/websocket.gateway';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    private prisma: PrismaService,
    private websocketGateway: WebsocketGateway
  ) {}

  /**
   * Generate a new report.
   *
   * @param data - Report configuration
   * @returns Created report
   *
   * @side-effects
   * - Creates report record in database
   * - Emits 'report:created' WebSocket event
   */
  async create(data: CreateReportDto): Promise<Report> {
    const report = await this.prisma.report.create({ data });

    this.websocketGateway.emitEvent('report:created', {
      timestamp: new Date().toISOString(),
      type: 'report:created',
      data: report
    });

    this.logger.log(`Report created: ${report.id}`);
    return report;
  }
}
```

### 4. Implement Controller

**reports.controller.ts:**
```typescript
import { Controller, Post, Get, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';

@Controller('api/reports')
@ApiTags('Reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new report' })
  @ApiResponse({ status: 201, description: 'Report created successfully' })
  async create(@Body() dto: CreateReportDto) {
    return this.reportsService.create(dto);
  }
}
```

### 5. Create Module

**reports.module.ts:**
```typescript
import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { PrismaModule } from '../prisma/prisma.module';
import { WebsocketModule } from '../websocket/websocket.module';

@Module({
  imports: [PrismaModule, WebsocketModule],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService]
})
export class ReportsModule {}
```

### 6. Register in AppModule

**app.module.ts:**
```typescript
@Module({
  imports: [
    // ... existing imports
    ReportsModule,  // Add here
  ],
})
export class AppModule {}
```

### 7. Write Tests

**reports.service.spec.ts:**
```typescript
describe('ReportsService', () => {
  let service: ReportsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: PrismaService, useValue: { report: { create: jest.fn() } } },
        { provide: WebsocketGateway, useValue: { emitEvent: jest.fn() } }
      ]
    }).compile();

    service = module.get<ReportsService>(ReportsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should create report', async () => {
    const mockReport = { id: 1, title: 'Test Report', type: 'monthly' };
    jest.spyOn(prisma.report, 'create').mockResolvedValue(mockReport);

    const result = await service.create({ title: 'Test Report', type: 'monthly' });

    expect(result).toEqual(mockReport);
    expect(prisma.report.create).toHaveBeenCalled();
  });
});
```

### 8. Verify

```bash
# Lint
yarn lint

# Test
yarn test reports.service.spec.ts

# Start server
yarn start:dev

# Check Swagger
open http://localhost:3000/api-docs
```

---

## Common Troubleshooting

### Scraping Returns 0 Results

**Symptoms:** `POST /api/scrape` returns `{ found: 0, saved: 0 }`

**Likely causes:**
1. Apify actor not responding
2. Invalid Apify API token
3. Apify quota exceeded
4. Location string not recognized by Google Maps actor

**Debug steps:**
```typescript
// Add logging to scraper.service.ts
this.logger.debug('Calling Apify Google Maps Actor', { location, radius });
this.logger.debug('Apify actor run ID', { runId });
this.logger.debug('Found businesses', { count: results.length });
```

**Fix:**
1. Check Apify API token in secrets file
2. Verify Apify actor is correct: `apify/google-maps-scraper`
3. Review Apify run logs in dashboard

---

### Enrichment Always Fails

**Symptoms:** Business.enrichment_status stuck on `pending` or changes to `failed`

**Check:**
1. **API keys:** Verify `~/.config/letip_api_secrets.json` has valid keys
2. **Rate limits:** Hunter.io (500/month), AbstractAPI (3,000/month)
3. **Website field:** Business must have valid website URL
4. **Logs:** Query enrichment_log table

**SQL query:**
```sql
SELECT * FROM enrichment_log
WHERE status = 'failed'
ORDER BY created_at DESC
LIMIT 10;
```

**Common errors:**
- `"No website found"` → Business needs website for domain-based enrichment
- `"API quota exceeded"` → Rate limit hit, wait until next month
- `"Invalid API key"` → Check secrets file

---

### WebSocket Not Connecting

**Symptoms:** Frontend dashboard doesn't show real-time updates

**Check:**
1. **CORS:** Verify `src/websocket/websocket.gateway.ts` allows origin
2. **Port:** WebSocket uses same port as HTTP (3000)
3. **URL:** Frontend must use correct WebSocket URL

**Test with wscat:**
```bash
npm install -g wscat
wscat -c ws://localhost:3000/socket.io/?EIO=4&transport=websocket
```

**Should see:** `{"sid":"xxx","upgrades":[],"pingInterval":25000,"pingTimeout":20000}`

---

### Telegram Bot Not Responding

**Symptoms:** `/start` command has no response

**Check:**
1. **Token:** Verify `~/.config/letip_api_secrets.json` has bot token
2. **Logs:** Look for "Telegram bot started successfully"
3. **Polling:** Bot uses long-polling (not webhooks)

**Debug:**
```bash
# Check logs
yarn start:dev | grep -i telegram
```

**Should see:**
```
[TelegramService] Telegram bot started successfully
[TelegramService] Bot polling active
```

---

## Performance Optimization

### Current Bottlenecks

1. **Sequential enrichment:** Batch operations process one at a time
2. **No caching:** Stats API queries database on every request
3. **No pagination limits:** Can load 1000+ businesses at once
4. **Puppeteer memory:** Each scrape session holds browser in memory

### Optimization Opportunities

**1. Implement BullMQ Queue:**
```typescript
// Move enrichment to background jobs
await this.enrichmentQueue.add('enrich-business', { businessId });
```

**2. Add caching layer:**
```typescript
// Cache stats for 30 seconds
@Cacheable({ ttl: 30 })
async getStats(): Promise<Stats> {
  // ...
}
```

**3. Enforce pagination:**
```typescript
// Max 100 per page
const limit = Math.min(query.limit || 20, 100);
```

**4. Close Puppeteer browsers:**
```typescript
// Always clean up
try {
  await page.goto(url);
  // ... scraping logic
} finally {
  await browser.close();  // Critical!
}
```

---

## Security Checklist

**Current state: NO AUTHENTICATION IMPLEMENTED**

Before deploying to production with sensitive data:

- [ ] Add JWT authentication to API endpoints
- [ ] Restrict WebSocket CORS (currently allows all origins)
- [ ] Move API keys to encrypted secret management (not filesystem)
- [ ] Implement rate limiting on public endpoints
- [ ] Add API key authentication for external access
- [ ] Enable HTTPS/SSL
- [ ] Add request validation and sanitization
- [ ] Implement RBAC for Telegram bot (user whitelist)

**Current vulnerabilities:**
- All API endpoints publicly accessible
- WebSocket accepts connections from any origin
- API keys stored in plaintext file
- No rate limiting on scraping/enrichment
- No audit logging for sensitive operations

---

## Key Files Reference

**Configuration:**
- `nodejs_space/src/config/config.service.ts:26-50` - API key loading
- `nodejs_space/prisma/schema.prisma:11-92` - Complete database schema
- `nodejs_space/src/app.module.ts:18-46` - Static file serving setup

**Core Services:**
- `nodejs_space/src/scraper/scraper.service.ts:80-177` - Puppeteer scraping (DOM selectors)
- `nodejs_space/src/enrichment/enrichment.service.ts:55-280` - Hunter.io + AbstractAPI integration
- `nodejs_space/src/outreach/outreach.service.ts:85-125` - AI fallback template logic
- `nodejs_space/src/businesses/businesses.service.ts:65-95` - WebSocket event emission

**WebSocket:**
- `nodejs_space/src/websocket/websocket.gateway.ts:8-40` - Socket.io gateway configuration
- `nodejs_space/src/businesses/businesses.service.ts` - Event emission pattern

**Testing:**
- `nodejs_space/test/app.e2e-spec.ts` - E2E test skeleton

---

## Next.js 16 Dashboard Development

### Technology Stack

- **Framework:** Next.js 16 (App Router, Turbopack stable)
- **UI Components:** ShadCN/UI + Magic-UI
- **Animations:** Framer Motion
- **Real-time:** Socket.io client
- **State:** Zustand + SWR
- **Forms:** React Hook Form + Zod
- **Styling:** Tailwind CSS (dark mode)

### Requirements

- Node.js 20.9.0+ (minimum for Next.js 16)
- TypeScript 5.1.0+

### Key Features (Next.js 16)

**Turbopack (Stable):** 2-5x faster builds, 10x faster Fast Refresh
**Cache Components:** Use `use cache` directive for explicit caching
**React 19.2:** View Transitions, useEffectEvent, Activity components
**Enhanced Routing:** Layout deduplication for shared layouts

### Development Commands

```bash
cd dashboard
npm run dev          # Development server (Turbopack enabled by default)
npm run build        # Production build with Turbopack
npm run start        # Start production server
npm run lint         # ESLint
```

### Environment Variables

**.env.local:**
```bash
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=http://localhost:3000
```

**Production:**
```bash
NEXT_PUBLIC_API_URL=https://your-production-domain.com
NEXT_PUBLIC_WS_URL=https://your-production-domain.com
```

---

## AI Agent Development Notes

When debugging this codebase:

**Backend issues:**
- Check NestJS logs for service-level errors
- Query `enrichment_log` table for external API failures
- Use Prisma Studio to inspect database state: `yarn prisma studio`
- Test WebSocket with wscat: `wscat -c ws://localhost:3000/socket.io/?EIO=4&transport=websocket`

**Frontend issues:**
- Check browser console for WebSocket connection errors
- Verify `NEXT_PUBLIC_API_URL` environment variable
- Test API directly with curl before implementing in frontend
- Use React DevTools to inspect Zustand state

**Database issues:**
- Use `yarn prisma studio` for visual inspection
- Check migration status: `yarn prisma migrate status`
- Reset database (dev only): `yarn prisma migrate reset`

**External API issues:**
- Review `enrichment_log` table for error messages
- Check rate limits: Hunter.io (500/month), AbstractAPI (3,000/month)
- Verify secrets file: `cat ~/.config/letip_api_secrets.json`
- Test APIs directly with curl to isolate issues

**Common pitfalls:**
- Forgetting to emit WebSocket events after mutations
- Not handling enrichment failures gracefully (no fallback)
- Apify actor runs not monitored for completion
- Missing `await` on async Prisma calls
- Cascade deletes removing more data than expected
- Apify quota exhausted without proper error handling
