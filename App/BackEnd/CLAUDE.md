# Le Tip Lead System - Backend Documentation

## Cross-References

- **Root Documentation**: [../../CLAUDE.md](../../CLAUDE.md)
- **Frontend Documentation**: [../FrontEnd/CLAUDE.md](../FrontEnd/CLAUDE.md)

---

## Backend Overview

NestJS-based REST API + WebSocket server providing business lead management, scraping, enrichment, and AI-powered outreach generation.

**Port:** 3000 (HTTP + WebSocket)
**Database:** PostgreSQL via Prisma ORM
**Real-time:** Socket.io WebSocket gateway

---

## Development Workflow

### Start Development Server

```bash
cd App/BackEnd
yarn start:dev  # Hot-reload enabled
```

### Production Build

```bash
yarn build
yarn start:prod
```

### Database Operations

```bash
yarn prisma generate        # Generate client after schema.prisma changes
yarn prisma db push         # Push schema to database (dev/prototype)
yarn prisma migrate dev     # Create migration file (production)
yarn prisma studio          # Open Prisma Studio GUI (localhost:5555)
```

### Code Quality

```bash
yarn lint                   # ESLint with auto-fix
yarn format                 # Prettier formatting
```

### Testing

```bash
yarn test                   # Run all tests
yarn test:watch             # Watch mode
yarn test:cov               # Coverage report
yarn test:e2e               # End-to-end tests
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

### Message Templates

**Template-based message generation:**
```typescript
async generateOutreachMessage(businessId: number): Promise<string> {
  const business = await this.prisma.business.findUnique({
    where: { id: businessId },
    include: { contacts: true }
  });

  // Generate personalized message using template
  return this.getMessageTemplate(business);
}

private getMessageTemplate(business: Business): string {
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
cd App/BackEnd/src
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
