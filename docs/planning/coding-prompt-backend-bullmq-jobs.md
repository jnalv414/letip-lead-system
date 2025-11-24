# Coding Prompt: BullMQ Background Jobs for Scraping & Enrichment

## Feature Description and Problem Solving

### Problem
The current implementation runs **long-running operations synchronously**, causing poor user experience, blocking behavior, and no resilience:

1. **Scraping Blocks the Request**
   ```typescript
   // Current: User waits 5-15 minutes for scrape to complete
   POST /api/scraper/scrape
   → Browser launched
   → Navigate to Google Maps
   → Scroll and extract data
   → Save 50-500 businesses to database
   → Return response (5-15 minutes later)
   ```
   **Problems:**
   - User can't close browser or refresh during scrape
   - No progress updates until completion
   - If request fails, entire scrape lost
   - Can't cancel or pause running scrapes

2. **Enrichment Runs Sequentially with Manual Delays**
   ```typescript
   // Current: Batch enrichment processes one at a time
   for (const business of businesses) {
     await enrichBusiness(business.id);  // 2-3 seconds per call
     await delay(1000);  // Manual rate limit delay
   }
   // 50 businesses × 3 seconds = 150 seconds (2.5 minutes)
   ```
   **Problems:**
   - No retry logic for API failures
   - Rate limiting is naive (fixed 1-second delay)
   - Can't track progress across multiple batches
   - If process crashes, loses all progress

3. **No Job Management**
   - Can't check status of long-running operations
   - No retry mechanism for failures
   - No job history or audit trail
   - Can't prioritize urgent jobs

### Solution
Implement **BullMQ background job queue** with Redis for reliable, asynchronous processing:

**BullMQ Benefits:**
- **Async Operations:** Return immediately with job ID, process in background
- **Progress Tracking:** Real-time updates via WebSocket (0%, 25%, 50%, 75%, 100%)
- **Retry Logic:** Automatic retries with exponential backoff
- **Job Persistence:** Jobs survive server restarts
- **Concurrency Control:** Process N jobs in parallel with worker pools
- **Priority Queues:** Urgent jobs processed first
- **Rate Limiting:** Built-in rate limiter (e.g., max 10 enrichments/minute)

**Architecture:**
```
┌─────────────────────────────────────────────────────────────┐
│                         Client (Dashboard)                   │
│  POST /api/scraper/scrape → returns { jobId: "abc123" }     │
│  WebSocket listener receives progress updates               │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      NestJS Backend                          │
│  ScraperController → adds job to "scraping" queue           │
│  EnrichmentController → adds jobs to "enrichment" queue     │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      Redis (BullMQ)                          │
│  Queue: "scraping" → stores scrape jobs                     │
│  Queue: "enrichment" → stores enrichment jobs               │
│  Job state: waiting → active → completed/failed             │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    Background Workers                         │
│  ScraperProcessor → pulls jobs from "scraping" queue        │
│  EnrichmentProcessor → pulls jobs from "enrichment" queue   │
│  Updates progress → emits WebSocket events                  │
└─────────────────────────────────────────────────────────────┘
```

**Job Flow Example - Scraping:**
```typescript
// 1. User submits scrape request
POST /api/scraper/scrape
{
  "location": "Freehold, NJ",
  "business_type": "plumbing",
  "max_results": 50
}

// 2. Controller adds job to queue
const job = await this.scraperQueue.add('scrape-google-maps', {
  location: 'Freehold, NJ',
  business_type: 'plumbing',
  max_results: 50
});

// 3. Return job ID immediately (200ms response time)
{
  "jobId": "abc123",
  "status": "waiting",
  "message": "Scraping job queued"
}

// 4. Background worker processes job
→ Status: waiting → active
→ Progress: 0% → 25% → 50% → 75% → 100%
→ WebSocket events: "scraping:progress" → "scraping:complete"

// 5. Frontend receives real-time updates
socket.on('scraping:progress', (data) => {
  console.log(`Progress: ${data.progress}%`);
  // Update UI progress bar
});
```

**Job Flow Example - Enrichment:**
```typescript
// 1. User triggers batch enrichment
POST /api/enrichment/batch
{ "count": 50 }

// 2. Controller adds 50 individual jobs to queue
const jobs = await Promise.all(
  businesses.map(b =>
    this.enrichmentQueue.add('enrich-business',
      { businessId: b.id },
      {
        priority: b.contacts.length === 0 ? 1 : 2,  // Prioritize businesses without contacts
        attempts: 3,  // Retry up to 3 times
        backoff: { type: 'exponential', delay: 2000 }  // 2s, 4s, 8s delays
      }
    )
  )
);

// 3. Return batch job ID
{
  "batchId": "batch-xyz789",
  "totalJobs": 50,
  "status": "processing"
}

// 4. Workers process jobs with rate limiting
→ Max 10 jobs/minute (Hunter.io rate limit)
→ Automatic retries on failures
→ Progress updates per job
→ WebSocket: "enrichment:progress" events
```

**Retry Logic:**
```typescript
// Automatic retry with exponential backoff
{
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000  // 2s → 4s → 8s
  }
}

// Job lifecycle on failure:
Attempt 1: Fail (Hunter.io timeout) → Wait 2s → Retry
Attempt 2: Fail (API rate limit) → Wait 4s → Retry
Attempt 3: Fail → Mark as failed → Move to failed queue
```

---

## User Story

**As a** Le Tip dashboard user
**I want** scraping and enrichment to run in the background
**So that** I can continue using the dashboard while operations complete, see real-time progress, and have jobs automatically retry on failure

**Acceptance:**
- Scraping returns job ID instantly (<200ms), processes in background
- Frontend shows real-time progress (0% → 100%) via WebSocket
- Failed jobs automatically retry up to 3 times
- Can view job history and status via API
- Enrichment respects Hunter.io rate limits (500/month)
- Jobs persist across server restarts (stored in Redis)
- Can cancel running jobs
- Can view failed jobs and error details

---

## Solution and Approach Rationale

### Why BullMQ Over Alternatives

| Solution | Pros | Cons | Verdict |
|----------|------|------|---------|
| **BullMQ** | Fastest, modern API, Redis-backed, retry logic, job priority, rate limiting | Requires Redis | ✅ **Best choice** |
| Bull (original) | Proven, stable | Deprecated, slower, less features | ❌ Use BullMQ instead |
| Agenda | MongoDB-backed | Slower, limited features | ❌ Not performant |
| bee-queue | Simple, fast | No retries, no priorities | ❌ Too basic |
| AWS SQS | Managed service | Vendor lock-in, extra cost | ❌ Overkill |

**Why BullMQ wins:**
- Already installed in project (`@nestjs/bullmq@11.0.4`, `bullmq@5.64.1`)
- Best-in-class retry logic with exponential backoff
- Built-in rate limiting for API quota management
- Job priority for urgent operations
- Redis persistence across restarts
- First-class NestJS integration

### Redis Requirement

BullMQ requires Redis for job storage. **Redis will be used for:**
1. **Job Queue Storage** (BullMQ requirement)
2. **Caching Layer** (from previous plan: coding-prompt-backend-redis-caching.md)
3. **Session Storage** (future: if JWT sessions implemented)

**Installation:**
```bash
# Install ioredis (Redis client for Node.js)
yarn add ioredis

# Redis connection shared across:
# - BullMQ (job queues)
# - RedisService (caching)
# - (Future) Session store
```

---

## Relevant Files and Context

### Files to Modify

1. **App/BackEnd/src/scraper/scraper.service.ts** (1-177)
   - **Current:** Runs scraping synchronously
   - **Change:** Move scraping logic to `ScraperProcessor`
   - **Reason:** Decouple controller from long-running operation

2. **App/BackEnd/src/scraper/scraper.controller.ts**
   - **Current:** Calls `scraperService.scrapeGoogleMaps()` and waits
   - **Change:** Add job to queue, return job ID immediately
   - **Reason:** Instant API response

3. **App/BackEnd/src/enrichment/enrichment.service.ts** (79-134)
   - **Current:** Sequential batch processing with manual delays
   - **Change:** Move enrichment logic to `EnrichmentProcessor`
   - **Reason:** Parallel processing with rate limiting

4. **App/BackEnd/src/enrichment/enrichment.controller.ts**
   - **Current:** Calls `enrichmentService.enrichBatch()` and waits
   - **Change:** Queue individual jobs, return batch ID
   - **Reason:** Async processing with progress tracking

5. **App/BackEnd/src/websocket/websocket.gateway.ts** (1-65)
   - **Current:** Emits business and stats events
   - **Change:** Add job progress events (`scraping:progress`, `enrichment:progress`)
   - **Reason:** Real-time progress updates for jobs

### Files to Create

1. **App/BackEnd/src/queue/queue.module.ts**
   - Global BullMQ module with queue registration
   - Imports: `BullModule.forRoot()` with Redis config
   - Exports: Queue instances for injection

2. **App/BackEnd/src/queue/redis.config.ts**
   - Redis connection configuration
   - Environment variables for Redis host/port/password
   - Shared config for BullMQ and caching

3. **App/BackEnd/src/scraper/scraper.processor.ts**
   - Worker that processes scraping jobs
   - Pulls jobs from "scraping" queue
   - Updates progress, emits WebSocket events

4. **App/BackEnd/src/enrichment/enrichment.processor.ts**
   - Worker that processes enrichment jobs
   - Pulls jobs from "enrichment" queue
   - Handles rate limiting and retries

5. **App/BackEnd/src/queue/dto/job-status.dto.ts**
   - Response DTOs for job status endpoints
   - Types: `JobStatusDto`, `JobProgressDto`, `BatchStatusDto`

6. **App/BackEnd/src/queue/jobs.controller.ts**
   - API endpoints for job management
   - `GET /api/jobs/:id` - Get job status
   - `GET /api/jobs/:id/logs` - Get job logs
   - `DELETE /api/jobs/:id` - Cancel job
   - `GET /api/jobs/failed` - List failed jobs

7. **App/BackEnd/src/queue/jobs.service.ts**
   - Service for job management operations
   - Query job status, cancel jobs, retry failed jobs

### Environment Variables

**Add to `App/BackEnd/.env`:**
```env
# Redis Configuration (for BullMQ + Caching)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# BullMQ Configuration
BULLMQ_DEFAULT_CONCURRENCY=5        # Max 5 jobs in parallel
BULLMQ_SCRAPER_CONCURRENCY=2        # Max 2 scrapes at once (Puppeteer memory)
BULLMQ_ENRICHMENT_CONCURRENCY=10    # Max 10 enrichments in parallel
BULLMQ_ENRICHMENT_RATE_LIMIT=10     # Max 10 enrichments per minute (Hunter.io)
```

### Docker Compose (Optional - for local Redis)

**Create `docker-compose.yml` in project root:**
```yaml
version: '3.8'
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes

volumes:
  redis_data:
```

---

## Implementation Plan

### Phase 1: Redis & BullMQ Setup (1-2 hours)

**Step 1.1: Install ioredis**
```bash
cd nodejs_space
yarn add ioredis
yarn add -D @types/ioredis
```

**Step 1.2: Create Redis configuration**

**File:** `App/BackEnd/src/queue/redis.config.ts`
```typescript
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

export const createRedisConnection = (configService: ConfigService): Redis => {
  return new Redis({
    host: configService.get('REDIS_HOST', 'localhost'),
    port: configService.get('REDIS_PORT', 6379),
    password: configService.get('REDIS_PASSWORD'),
    db: configService.get('REDIS_DB', 0),
    maxRetriesPerRequest: null,  // Required for BullMQ
    enableReadyCheck: false,     // Required for BullMQ
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
  });
};

export const getRedisConfig = (configService: ConfigService) => ({
  connection: createRedisConnection(configService),
});
```

**Step 1.3: Create Queue Module**

**File:** `App/BackEnd/src/queue/queue.module.ts`
```typescript
import { Module, Global } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getRedisConfig } from './redis.config';

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => getRedisConfig(configService),
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      {
        name: 'scraping',
        defaultJobOptions: {
          attempts: 2,  // Retry once on failure
          backoff: {
            type: 'exponential',
            delay: 5000,  // 5s → 10s
          },
          removeOnComplete: 100,  // Keep last 100 completed jobs
          removeOnFail: 500,      // Keep last 500 failed jobs
        },
      },
      {
        name: 'enrichment',
        defaultJobOptions: {
          attempts: 3,  // Retry twice on failure
          backoff: {
            type: 'exponential',
            delay: 2000,  // 2s → 4s → 8s
          },
          removeOnComplete: 100,
          removeOnFail: 500,
        },
      }
    ),
  ],
  exports: [BullModule],
})
export class QueueModule {}
```

**Step 1.4: Register Queue Module in AppModule**

**File:** `App/BackEnd/src/app.module.ts`
```typescript
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'dashboard', 'out'),
      serveRoot: '/dashboard',
    }),
    PrismaModule,
    QueueModule,  // ← Add here (before other modules)
    BusinessesModule,
    ScraperModule,
    EnrichmentModule,
    OutreachModule,
    TelegramModule,
    WebsocketModule,
  ],
})
export class AppModule {}
```

**Step 1.5: Add environment variables**

**File:** `App/BackEnd/.env`
```env
# ... existing vars ...

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# BullMQ Configuration
BULLMQ_DEFAULT_CONCURRENCY=5
BULLMQ_SCRAPER_CONCURRENCY=2
BULLMQ_ENRICHMENT_CONCURRENCY=10
BULLMQ_ENRICHMENT_RATE_LIMIT=10
```

**Step 1.6: Start Redis (local development)**

**Option A: Docker Compose**
```bash
# Create docker-compose.yml in project root
docker-compose up -d redis
```

**Option B: Install Redis locally**
```bash
# macOS
brew install redis
brew services start redis

# Ubuntu/Debian
sudo apt install redis-server
sudo systemctl start redis
```

**Step 1.7: Verify Redis connection**
```bash
redis-cli ping
# Should return: PONG
```

---

### Phase 2: Scraper Background Jobs (2-3 hours)

**Step 2.1: Create Scraper Processor**

**File:** `App/BackEnd/src/scraper/scraper.processor.ts`
```typescript
import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { BusinessesService } from '../businesses/businesses.service';
import { WebsocketGateway } from '../websocket/websocket.gateway';
import * as puppeteer from 'puppeteer';

interface ScrapeJobData {
  location: string;
  radius?: number;
  business_type?: string;
  max_results?: number;
}

@Processor('scraping', {
  concurrency: 2,  // Max 2 scrapes at once (Puppeteer memory limit)
})
export class ScraperProcessor extends WorkerHost {
  private readonly logger = new Logger(ScraperProcessor.name);

  constructor(
    private prisma: PrismaService,
    private businessesService: BusinessesService,
    private websocketGateway: WebsocketGateway,
  ) {
    super();
  }

  async process(job: Job<ScrapeJobData>): Promise<any> {
    const { location, radius = 1, business_type, max_results = 50 } = job.data;

    this.logger.log(`[Job ${job.id}] Starting scrape: ${location}`);

    try {
      // Update progress: 0%
      await job.updateProgress(0);
      this.emitProgress(job.id, 0, 'Launching browser...');

      // Launch browser
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 800 });

      // Update progress: 25%
      await job.updateProgress(25);
      this.emitProgress(job.id, 25, 'Navigating to Google Maps...');

      // Build search query
      const searchQuery = business_type
        ? `${business_type} near ${location}`
        : `businesses near ${location}`;

      const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}`;
      await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 60000 });

      // Wait for results
      await page.waitForSelector('div[role="feed"]', { timeout: 30000 });
      await this.delay(3000);

      // Update progress: 50%
      await job.updateProgress(50);
      this.emitProgress(job.id, 50, 'Scrolling to load results...');

      // Scroll to load more results
      const scrollableDiv = await page.$('div[role="feed"]');
      if (scrollableDiv) {
        for (let i = 0; i < 5; i++) {
          await page.evaluate((div) => {
            div.scrollTop = div.scrollHeight;
          }, scrollableDiv);
          await this.delay(2000);
        }
      }

      // Update progress: 75%
      await job.updateProgress(75);
      this.emitProgress(job.id, 75, 'Extracting business data...');

      // Extract business data
      const businesses = await page.evaluate(() => {
        const results: Array<any> = [];
        const items = document.querySelectorAll('div[role="feed"] > div > div > a');

        items.forEach((item) => {
          try {
            const nameEl = item.querySelector('div.fontHeadlineSmall');
            const addressEl = item.querySelector('div.fontBodyMedium > div:nth-child(2) span');

            if (nameEl) {
              const href = item.getAttribute('href');
              const name = nameEl.textContent?.trim();
              const address = addressEl?.textContent?.trim();

              let latitude = null;
              let longitude = null;
              if (href && href.includes('@')) {
                const coordMatch = href.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
                if (coordMatch) {
                  latitude = parseFloat(coordMatch[1]);
                  longitude = parseFloat(coordMatch[2]);
                }
              }

              results.push({
                name,
                address: address || null,
                google_maps_url: href ? `https://www.google.com/maps${href}` : null,
                latitude,
                longitude,
              });
            }
          } catch (err) {
            console.error('Error parsing business:', err);
          }
        });

        return results;
      });

      await browser.close();

      this.logger.log(`[Job ${job.id}] Found ${businesses.length} businesses`);

      // Update progress: 90%
      await job.updateProgress(90);
      this.emitProgress(job.id, 90, `Saving ${businesses.length} businesses to database...`);

      // Save to database
      let savedCount = 0;
      let skippedCount = 0;
      const errors = [];

      for (const business of businesses.slice(0, max_results)) {
        try {
          let city = null;
          if (business.address) {
            const addressParts = business.address.split(',');
            if (addressParts.length >= 2) {
              city = addressParts[addressParts.length - 2]?.trim();
            }
          }

          const existing = await this.prisma.business.findFirst({
            where: {
              name: business.name,
              address: business.address,
            },
          });

          if (existing) {
            skippedCount++;
            continue;
          }

          await this.businessesService.create({
            name: business.name,
            address: business.address || undefined,
            city: city || undefined,
            state: 'NJ',
            google_maps_url: business.google_maps_url || undefined,
            latitude: business.latitude || undefined,
            longitude: business.longitude || undefined,
            business_type,
          });

          savedCount++;
        } catch (error) {
          this.logger.error(`[Job ${job.id}] Error saving business ${business.name}:`, error.message);
          errors.push({ business: business.name, error: error.message });
        }
      }

      // Update progress: 100%
      await job.updateProgress(100);
      this.emitProgress(job.id, 100, 'Scraping complete!');

      const result = {
        success: true,
        found: businesses.length,
        saved: savedCount,
        skipped: skippedCount,
        errors: errors.length > 0 ? errors : undefined,
      };

      this.logger.log(`[Job ${job.id}] Completed. Saved: ${savedCount}, Skipped: ${skippedCount}`);

      // Emit completion event
      this.websocketGateway.emitEvent('scraping:complete', {
        timestamp: new Date().toISOString(),
        type: 'scraping:complete',
        data: {
          jobId: job.id,
          ...result,
        },
      });

      return result;
    } catch (error) {
      this.logger.error(`[Job ${job.id}] Scraping failed:`, error);

      // Emit error event
      this.websocketGateway.emitEvent('scraping:failed', {
        timestamp: new Date().toISOString(),
        type: 'scraping:failed',
        data: {
          jobId: job.id,
          error: error.message,
        },
      });

      throw error;
    }
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`[Job ${job.id}] Failed after ${job.attemptsMade} attempts:`, error);
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`[Job ${job.id}] Completed successfully`);
  }

  private emitProgress(jobId: string, progress: number, message: string) {
    this.websocketGateway.emitEvent('scraping:progress', {
      timestamp: new Date().toISOString(),
      type: 'scraping:progress',
      data: {
        jobId,
        progress,
        message,
      },
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

**Step 2.2: Update Scraper Module**

**File:** `App/BackEnd/src/scraper/scraper.module.ts`
```typescript
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ScraperController } from './scraper.controller';
import { ScraperService } from './scraper.service';
import { ScraperProcessor } from './scraper.processor';
import { PrismaModule } from '../prisma/prisma.module';
import { BusinessesModule } from '../businesses/businesses.module';
import { WebsocketModule } from '../websocket/websocket.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'scraping' }),
    PrismaModule,
    BusinessesModule,
    WebsocketModule,
  ],
  controllers: [ScraperController],
  providers: [ScraperService, ScraperProcessor],
  exports: [ScraperService],
})
export class ScraperModule {}
```

**Step 2.3: Update Scraper Controller (async job dispatch)**

**File:** `App/BackEnd/src/scraper/scraper.controller.ts`
```typescript
import { Controller, Post, Get, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ScrapeRequestDto } from './dto/scrape-request.dto';

@Controller('api/scraper')
@ApiTags('Scraper')
export class ScraperController {
  constructor(
    @InjectQueue('scraping') private scraperQueue: Queue,
  ) {}

  @Post('scrape')
  @ApiOperation({
    summary: 'Start a background scraping job',
    description: 'Queues a scraping job and returns job ID immediately. Use GET /api/jobs/:id to check status.'
  })
  @ApiResponse({
    status: 202,
    description: 'Job queued successfully',
    schema: {
      example: {
        jobId: 'abc123',
        status: 'waiting',
        message: 'Scraping job queued'
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid request parameters' })
  async scrape(@Body() scrapeRequest: ScrapeRequestDto) {
    const job = await this.scraperQueue.add('scrape-google-maps', {
      location: scrapeRequest.location,
      radius: scrapeRequest.radius,
      business_type: scrapeRequest.business_type,
      max_results: scrapeRequest.max_results,
    });

    return {
      jobId: job.id,
      status: 'waiting',
      message: 'Scraping job queued. Listen for "scraping:progress" WebSocket events.',
    };
  }

  @Get('status/:jobId')
  @ApiOperation({ summary: 'Get scraping job status' })
  @ApiParam({ name: 'jobId', description: 'Job ID returned from POST /scrape' })
  @ApiResponse({
    status: 200,
    description: 'Job status',
    schema: {
      example: {
        jobId: 'abc123',
        status: 'active',
        progress: 75,
        data: {
          location: 'Freehold, NJ',
          business_type: 'plumbing'
        }
      }
    }
  })
  async getStatus(@Param('jobId') jobId: string) {
    const job = await this.scraperQueue.getJob(jobId);

    if (!job) {
      return {
        jobId,
        status: 'not_found',
        message: 'Job not found',
      };
    }

    const state = await job.getState();
    const progress = job.progress;

    return {
      jobId: job.id,
      status: state,
      progress,
      data: job.data,
      result: state === 'completed' ? job.returnvalue : null,
      failedReason: state === 'failed' ? job.failedReason : null,
    };
  }
}
```

**Step 2.4: Update Scraper Service (keep for direct calls if needed)**

**File:** `App/BackEnd/src/scraper/scraper.service.ts`
```typescript
// Keep existing scrapeGoogleMaps() method for direct calls (if needed)
// But now primarily use ScraperProcessor for async jobs

import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ScrapeRequestDto } from './dto/scrape-request.dto';

@Injectable()
export class ScraperService {
  private readonly logger = new Logger(ScraperService.name);

  constructor(
    @InjectQueue('scraping') private scraperQueue: Queue,
  ) {}

  /**
   * Queue a scraping job (async, recommended).
   *
   * @param scrapeRequest - Scrape parameters
   * @returns Job ID for status tracking
   */
  async queueScrape(scrapeRequest: ScrapeRequestDto): Promise<string> {
    const job = await this.scraperQueue.add('scrape-google-maps', scrapeRequest);
    this.logger.log(`Queued scraping job: ${job.id}`);
    return job.id;
  }

  // Keep existing scrapeGoogleMaps() for backwards compatibility (if needed)
  // ... existing code ...
}
```

---

### Phase 3: Enrichment Background Jobs (2-3 hours)

**Step 3.1: Create Enrichment Processor**

**File:** `App/BackEnd/src/enrichment/enrichment.processor.ts`
```typescript
import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { EnrichmentService } from './enrichment.service';
import { WebsocketGateway } from '../websocket/websocket.gateway';

interface EnrichJobData {
  businessId: number;
}

@Processor('enrichment', {
  concurrency: 10,  // Max 10 enrichments in parallel
  limiter: {
    max: 10,        // Max 10 jobs
    duration: 60000, // Per minute (60,000ms)
  },
})
export class EnrichmentProcessor extends WorkerHost {
  private readonly logger = new Logger(EnrichmentProcessor.name);

  constructor(
    private enrichmentService: EnrichmentService,
    private websocketGateway: WebsocketGateway,
  ) {
    super();
  }

  async process(job: Job<EnrichJobData>): Promise<any> {
    const { businessId } = job.data;

    this.logger.log(`[Job ${job.id}] Enriching business ${businessId}`);

    try {
      await job.updateProgress(0);
      this.emitProgress(job.id, businessId, 0, 'Starting enrichment...');

      // Call existing enrichment service
      const result = await this.enrichmentService.enrichBusiness(businessId);

      await job.updateProgress(100);
      this.emitProgress(job.id, businessId, 100, 'Enrichment complete');

      this.logger.log(`[Job ${job.id}] Enriched business ${businessId} successfully`);

      // Emit completion event
      this.websocketGateway.emitEvent('enrichment:complete', {
        timestamp: new Date().toISOString(),
        type: 'enrichment:complete',
        data: {
          jobId: job.id,
          businessId,
          ...result,
        },
      });

      return result;
    } catch (error) {
      this.logger.error(`[Job ${job.id}] Enrichment failed for business ${businessId}:`, error);

      // Emit error event
      this.websocketGateway.emitEvent('enrichment:failed', {
        timestamp: new Date().toISOString(),
        type: 'enrichment:failed',
        data: {
          jobId: job.id,
          businessId,
          error: error.message,
        },
      });

      throw error;
    }
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`[Job ${job.id}] Failed after ${job.attemptsMade} attempts:`, error);
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`[Job ${job.id}] Completed successfully`);
  }

  private emitProgress(jobId: string, businessId: number, progress: number, message: string) {
    this.websocketGateway.emitEvent('enrichment:progress', {
      timestamp: new Date().toISOString(),
      type: 'enrichment:progress',
      data: {
        jobId,
        businessId,
        progress,
        message,
      },
    });
  }
}
```

**Step 3.2: Update Enrichment Module**

**File:** `App/BackEnd/src/enrichment/enrichment.module.ts`
```typescript
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { EnrichmentController } from './enrichment.controller';
import { EnrichmentService } from './enrichment.service';
import { EnrichmentProcessor } from './enrichment.processor';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule } from '../config/config.module';
import { WebsocketModule } from '../websocket/websocket.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'enrichment' }),
    PrismaModule,
    ConfigModule,
    WebsocketModule,
  ],
  controllers: [EnrichmentController],
  providers: [EnrichmentService, EnrichmentProcessor],
  exports: [EnrichmentService],
})
export class EnrichmentModule {}
```

**Step 3.3: Update Enrichment Controller (batch job dispatch)**

**File:** `App/BackEnd/src/enrichment/enrichment.controller.ts`
```typescript
import { Controller, Post, Get, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Controller('api/enrichment')
@ApiTags('Enrichment')
export class EnrichmentController {
  constructor(
    @InjectQueue('enrichment') private enrichmentQueue: Queue,
    private prisma: PrismaService,
  ) {}

  @Post(':id')
  @ApiOperation({ summary: 'Enrich a single business (async)' })
  @ApiParam({ name: 'id', description: 'Business ID' })
  @ApiResponse({
    status: 202,
    description: 'Job queued',
    schema: {
      example: {
        jobId: 'xyz789',
        businessId: 123,
        status: 'waiting',
        message: 'Enrichment job queued'
      }
    }
  })
  async enrichOne(@Param('id') id: string) {
    const businessId = parseInt(id, 10);

    const job = await this.enrichmentQueue.add('enrich-business',
      { businessId },
      {
        priority: 1,  // High priority for individual requests
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
      }
    );

    return {
      jobId: job.id,
      businessId,
      status: 'waiting',
      message: 'Enrichment job queued. Listen for "enrichment:progress" WebSocket events.',
    };
  }

  @Post('batch')
  @ApiOperation({ summary: 'Enrich multiple businesses (async)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        count: { type: 'number', example: 50, description: 'Number of businesses to enrich' }
      }
    }
  })
  @ApiResponse({
    status: 202,
    description: 'Batch jobs queued',
    schema: {
      example: {
        batchId: 'batch-abc123',
        totalJobs: 50,
        status: 'processing',
        message: '50 enrichment jobs queued'
      }
    }
  })
  async enrichBatch(@Body() body: { count?: number }) {
    const count = body.count || 10;

    // Find pending businesses
    const pendingBusinesses = await this.prisma.business.findMany({
      where: { enrichment_status: 'pending' },
      take: count,
      orderBy: { created_at: 'asc' },
    });

    if (pendingBusinesses.length === 0) {
      return {
        message: 'No pending businesses to enrich',
        totalJobs: 0,
      };
    }

    // Create batch ID
    const batchId = `batch-${uuidv4()}`;

    // Queue individual jobs
    const jobs = await Promise.all(
      pendingBusinesses.map((business) =>
        this.enrichmentQueue.add('enrich-business',
          { businessId: business.id },
          {
            priority: business.contacts?.length === 0 ? 1 : 2,  // Prioritize businesses without contacts
            attempts: 3,
            backoff: { type: 'exponential', delay: 2000 },
            jobId: `${batchId}-${business.id}`,  // Track batch with prefix
          }
        )
      )
    );

    return {
      batchId,
      totalJobs: jobs.length,
      status: 'processing',
      message: `${jobs.length} enrichment jobs queued. Rate limited to 10/minute.`,
    };
  }

  @Get('batch/:batchId/status')
  @ApiOperation({ summary: 'Get batch enrichment status' })
  @ApiParam({ name: 'batchId', description: 'Batch ID returned from POST /batch' })
  @ApiResponse({
    status: 200,
    description: 'Batch status',
    schema: {
      example: {
        batchId: 'batch-abc123',
        total: 50,
        completed: 30,
        failed: 2,
        active: 10,
        waiting: 8,
        progress: 60
      }
    }
  })
  async getBatchStatus(@Param('batchId') batchId: string) {
    const jobs = await this.enrichmentQueue.getJobs(['waiting', 'active', 'completed', 'failed']);
    const batchJobs = jobs.filter(job => job.id?.startsWith(batchId));

    const total = batchJobs.length;
    const completed = batchJobs.filter(j => j.finishedOn).length;
    const failed = batchJobs.filter(j => j.failedReason).length;
    const active = batchJobs.filter(j => j.isActive()).length;
    const waiting = batchJobs.filter(j => j.isWaiting()).length;

    return {
      batchId,
      total,
      completed,
      failed,
      active,
      waiting,
      progress: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }
}
```

---

### Phase 4: Job Management API (1-2 hours)

**Step 4.1: Create Job Status DTOs**

**File:** `App/BackEnd/src/queue/dto/job-status.dto.ts`
```typescript
import { ApiProperty } from '@nestjs/swagger';

export class JobStatusDto {
  @ApiProperty({ example: 'abc123' })
  jobId: string;

  @ApiProperty({ example: 'active', enum: ['waiting', 'active', 'completed', 'failed'] })
  status: string;

  @ApiProperty({ example: 75, minimum: 0, maximum: 100 })
  progress: number;

  @ApiProperty({ example: { location: 'Freehold, NJ' } })
  data: any;

  @ApiProperty({ example: { found: 50, saved: 48 }, required: false })
  result?: any;

  @ApiProperty({ example: 'Timeout error', required: false })
  failedReason?: string;

  @ApiProperty({ example: 2, description: 'Number of attempts made' })
  attemptsMade: number;

  @ApiProperty({ example: '2025-01-21T15:30:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: '2025-01-21T15:35:00.000Z', required: false })
  finishedAt?: string;
}

export class JobListDto {
  @ApiProperty({ type: [JobStatusDto] })
  jobs: JobStatusDto[];

  @ApiProperty({ example: 100 })
  total: number;
}
```

**Step 4.2: Create Jobs Service**

**File:** `App/BackEnd/src/queue/jobs.service.ts`
```typescript
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { JobStatusDto, JobListDto } from './dto/job-status.dto';

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(
    @InjectQueue('scraping') private scraperQueue: Queue,
    @InjectQueue('enrichment') private enrichmentQueue: Queue,
  ) {}

  /**
   * Get job status by ID.
   * Searches across all queues.
   */
  async getJobStatus(jobId: string): Promise<JobStatusDto> {
    // Try scraping queue first
    let job = await this.scraperQueue.getJob(jobId);

    // Try enrichment queue if not found
    if (!job) {
      job = await this.enrichmentQueue.getJob(jobId);
    }

    if (!job) {
      throw new NotFoundException(`Job ${jobId} not found`);
    }

    const state = await job.getState();

    return {
      jobId: job.id!,
      status: state,
      progress: (job.progress as number) || 0,
      data: job.data,
      result: state === 'completed' ? job.returnvalue : undefined,
      failedReason: state === 'failed' ? job.failedReason : undefined,
      attemptsMade: job.attemptsMade,
      createdAt: new Date(job.timestamp).toISOString(),
      finishedAt: job.finishedOn ? new Date(job.finishedOn).toISOString() : undefined,
    };
  }

  /**
   * Get failed jobs from all queues.
   */
  async getFailedJobs(limit: number = 50): Promise<JobListDto> {
    const scraperFailed = await this.scraperQueue.getFailed(0, limit);
    const enrichmentFailed = await this.enrichmentQueue.getFailed(0, limit);

    const allFailed = [...scraperFailed, ...enrichmentFailed]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);

    const jobs = await Promise.all(
      allFailed.map(async (job) => {
        const state = await job.getState();
        return {
          jobId: job.id!,
          status: state,
          progress: (job.progress as number) || 0,
          data: job.data,
          failedReason: job.failedReason,
          attemptsMade: job.attemptsMade,
          createdAt: new Date(job.timestamp).toISOString(),
          finishedAt: job.finishedOn ? new Date(job.finishedOn).toISOString() : undefined,
        };
      })
    );

    return {
      jobs,
      total: jobs.length,
    };
  }

  /**
   * Retry a failed job.
   */
  async retryJob(jobId: string): Promise<void> {
    let job = await this.scraperQueue.getJob(jobId);

    if (!job) {
      job = await this.enrichmentQueue.getJob(jobId);
    }

    if (!job) {
      throw new NotFoundException(`Job ${jobId} not found`);
    }

    await job.retry();
    this.logger.log(`Retrying job ${jobId}`);
  }

  /**
   * Cancel a job (remove from queue).
   */
  async cancelJob(jobId: string): Promise<void> {
    let job = await this.scraperQueue.getJob(jobId);

    if (!job) {
      job = await this.enrichmentQueue.getJob(jobId);
    }

    if (!job) {
      throw new NotFoundException(`Job ${jobId} not found`);
    }

    await job.remove();
    this.logger.log(`Cancelled job ${jobId}`);
  }
}
```

**Step 4.3: Create Jobs Controller**

**File:** `App/BackEnd/src/queue/jobs.controller.ts`
```typescript
import { Controller, Get, Delete, Post, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JobsService } from './jobs.service';
import { JobStatusDto, JobListDto } from './dto/job-status.dto';

@Controller('api/jobs')
@ApiTags('Jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get job status by ID' })
  @ApiParam({ name: 'id', description: 'Job ID' })
  @ApiResponse({ status: 200, description: 'Job status', type: JobStatusDto })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async getStatus(@Param('id') id: string): Promise<JobStatusDto> {
    return this.jobsService.getJobStatus(id);
  }

  @Get('failed')
  @ApiOperation({ summary: 'List failed jobs' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 50 })
  @ApiResponse({ status: 200, description: 'Failed jobs list', type: JobListDto })
  async getFailedJobs(@Query('limit') limit?: string): Promise<JobListDto> {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.jobsService.getFailedJobs(limitNum);
  }

  @Post(':id/retry')
  @ApiOperation({ summary: 'Retry a failed job' })
  @ApiParam({ name: 'id', description: 'Job ID' })
  @ApiResponse({ status: 200, description: 'Job retry queued' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async retryJob(@Param('id') id: string) {
    await this.jobsService.retryJob(id);
    return { message: `Job ${id} retry queued` };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel a job' })
  @ApiParam({ name: 'id', description: 'Job ID' })
  @ApiResponse({ status: 200, description: 'Job cancelled' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async cancelJob(@Param('id') id: string) {
    await this.jobsService.cancelJob(id);
    return { message: `Job ${id} cancelled` };
  }
}
```

**Step 4.4: Create Jobs Module**

**File:** `App/BackEnd/src/queue/jobs.module.ts`
```typescript
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'scraping' }),
    BullModule.registerQueue({ name: 'enrichment' }),
  ],
  controllers: [JobsController],
  providers: [JobsService],
  exports: [JobsService],
})
export class JobsModule {}
```

**Step 4.5: Register Jobs Module in AppModule**

**File:** `App/BackEnd/src/app.module.ts`
```typescript
@Module({
  imports: [
    // ... existing imports ...
    QueueModule,
    JobsModule,  // ← Add here
    // ... other modules ...
  ],
})
export class AppModule {}
```

---

### Phase 5: Testing & Validation (1-2 hours)

**Step 5.1: Unit Tests for Scraper Processor**

**File:** `App/BackEnd/test/scraper/scraper.processor.spec.ts`
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { ScraperProcessor } from '../../src/scraper/scraper.processor';
import { PrismaService } from '../../src/prisma/prisma.service';
import { BusinessesService } from '../../src/businesses/businesses.service';
import { WebsocketGateway } from '../../src/websocket/websocket.gateway';
import { Job } from 'bullmq';

describe('ScraperProcessor', () => {
  let processor: ScraperProcessor;
  let prisma: PrismaService;
  let websocket: WebsocketGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScraperProcessor,
        {
          provide: PrismaService,
          useValue: {
            business: {
              findFirst: jest.fn(),
              create: jest.fn(),
            },
          },
        },
        {
          provide: BusinessesService,
          useValue: {
            create: jest.fn(),
          },
        },
        {
          provide: WebsocketGateway,
          useValue: {
            emitEvent: jest.fn(),
          },
        },
      ],
    }).compile();

    processor = module.get<ScraperProcessor>(ScraperProcessor);
    prisma = module.get<PrismaService>(PrismaService);
    websocket = module.get<WebsocketGateway>(WebsocketGateway);
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  it('should emit progress events', async () => {
    const mockJob = {
      id: 'test-job-123',
      data: {
        location: 'Freehold, NJ',
        business_type: 'plumbing',
        max_results: 50,
      },
      updateProgress: jest.fn(),
    } as unknown as Job;

    // Mock Puppeteer scraping (not testing browser automation here)
    // Just verify progress events are emitted

    // ... test implementation ...
  });
});
```

**Step 5.2: Integration Tests**

**File:** `App/BackEnd/test/queue/jobs.e2e-spec.ts`
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Jobs API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('POST /api/scraper/scrape should return job ID', () => {
    return request(app.getHttpServer())
      .post('/api/scraper/scrape')
      .send({
        location: 'Freehold, NJ',
        business_type: 'test',
        max_results: 5,
      })
      .expect(202)
      .expect((res) => {
        expect(res.body).toHaveProperty('jobId');
        expect(res.body.status).toBe('waiting');
      });
  });

  it('GET /api/jobs/:id should return job status', async () => {
    // First create a job
    const scrapeRes = await request(app.getHttpServer())
      .post('/api/scraper/scrape')
      .send({ location: 'Test', max_results: 1 });

    const jobId = scrapeRes.body.jobId;

    // Then get its status
    return request(app.getHttpServer())
      .get(`/api/jobs/${jobId}`)
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('jobId', jobId);
        expect(res.body).toHaveProperty('status');
        expect(res.body).toHaveProperty('progress');
      });
  });

  afterAll(async () => {
    await app.close();
  });
});
```

**Step 5.3: Manual Testing Checklist**

1. **Redis Running:**
   ```bash
   redis-cli ping  # Should return PONG
   ```

2. **Start Backend:**
   ```bash
   cd nodejs_space
   yarn start:dev
   ```

3. **Test Scraping Job:**
   ```bash
   curl -X POST http://localhost:3000/api/scraper/scrape \
     -H "Content-Type: application/json" \
     -d '{"location": "Freehold, NJ", "business_type": "plumbing", "max_results": 10}'

   # Response: { "jobId": "abc123", "status": "waiting" }
   ```

4. **Check Job Status:**
   ```bash
   curl http://localhost:3000/api/jobs/abc123

   # Response: { "jobId": "abc123", "status": "active", "progress": 50 }
   ```

5. **Test Batch Enrichment:**
   ```bash
   curl -X POST http://localhost:3000/api/enrichment/batch \
     -H "Content-Type: application/json" \
     -d '{"count": 10}'

   # Response: { "batchId": "batch-xyz", "totalJobs": 10 }
   ```

6. **Monitor WebSocket Events:**
   ```bash
   # Install wscat
   npm install -g wscat

   # Connect to WebSocket
   wscat -c "ws://localhost:3000/socket.io/?EIO=4&transport=websocket"

   # Listen for events (you'll see progress updates)
   ```

7. **View Failed Jobs:**
   ```bash
   curl http://localhost:3000/api/jobs/failed
   ```

8. **Retry Failed Job:**
   ```bash
   curl -X POST http://localhost:3000/api/jobs/failed-job-id/retry
   ```

---

## Testing Strategy

### Unit Tests (6 tests)

1. **ScraperProcessor.process()** - Verify job processing logic
   - Mock Puppeteer, verify progress updates
   - Assert WebSocket events emitted

2. **EnrichmentProcessor.process()** - Verify enrichment job
   - Mock enrichmentService.enrichBusiness()
   - Verify progress events

3. **JobsService.getJobStatus()** - Get job by ID
   - Mock BullMQ queue
   - Return correct status

4. **JobsService.getFailedJobs()** - List failed jobs
   - Mock queue.getFailed()
   - Return sorted list

5. **JobsService.retryJob()** - Retry failed job
   - Mock job.retry()
   - Verify logger called

6. **JobsService.cancelJob()** - Cancel job
   - Mock job.remove()
   - Verify deletion

### Integration Tests (2 tests)

1. **POST /api/scraper/scrape → GET /api/jobs/:id**
   - Submit scrape request
   - Verify job queued
   - Check status endpoint returns correct data

2. **POST /api/enrichment/batch → GET /api/enrichment/batch/:batchId/status**
   - Submit batch enrichment
   - Verify jobs queued
   - Check batch progress

### E2E Tests (3 tests)

1. **Complete Scraping Flow**
   - POST /api/scraper/scrape
   - Wait for WebSocket "scraping:progress" events
   - Verify "scraping:complete" event
   - Confirm businesses saved to database

2. **Complete Enrichment Flow**
   - Create test business without enrichment
   - POST /api/enrichment/{id}
   - Wait for WebSocket "enrichment:complete" event
   - Verify business.enrichment_status = 'enriched'

3. **Batch Enrichment with Rate Limiting**
   - POST /api/enrichment/batch with count=50
   - Monitor job queue
   - Verify max 10 jobs/minute processed
   - Confirm rate limiter working

### Edge Cases (10 scenarios)

1. **Redis Connection Failure**
   - Stop Redis: `redis-cli shutdown`
   - Attempt to queue job
   - Verify graceful error message

2. **Job Retry on Failure**
   - Mock Hunter.io to fail 2 times, succeed on 3rd
   - Verify automatic retries with backoff

3. **Concurrent Scraping Jobs**
   - Queue 5 scraping jobs simultaneously
   - Verify max 2 active at once (concurrency limit)

4. **Enrichment Rate Limiting**
   - Queue 30 enrichment jobs
   - Verify exactly 10 processed per minute

5. **Job Cancellation Mid-Processing**
   - Start scraping job
   - Cancel via DELETE /api/jobs/:id
   - Verify browser closed, job removed

6. **Failed Job Cleanup**
   - Create 600 failed jobs
   - Verify only last 500 retained (removeOnFail: 500)

7. **WebSocket Disconnect During Job**
   - Start scraping job
   - Disconnect WebSocket
   - Reconnect - job should still complete

8. **Invalid Job ID Lookup**
   - GET /api/jobs/invalid-id
   - Verify 404 Not Found

9. **Batch Enrichment - No Pending Businesses**
   - All businesses enriched
   - POST /api/enrichment/batch
   - Verify response: "No pending businesses"

10. **Server Restart Mid-Job**
    - Start scraping job
    - Kill server (Ctrl+C)
    - Restart server
    - Verify job resumes from Redis

---

## Acceptance Criteria

### Functional Requirements (20 criteria)

1. ✅ POST /api/scraper/scrape returns job ID in <200ms
2. ✅ Scraping job processes in background without blocking
3. ✅ WebSocket emits "scraping:progress" events (0%, 25%, 50%, 75%, 100%)
4. ✅ WebSocket emits "scraping:complete" event on success
5. ✅ WebSocket emits "scraping:failed" event on error
6. ✅ GET /api/jobs/:id returns job status (waiting, active, completed, failed)
7. ✅ POST /api/enrichment/batch queues individual jobs per business
8. ✅ Enrichment respects rate limit: max 10 jobs/minute
9. ✅ Failed jobs automatically retry up to 3 times with exponential backoff
10. ✅ GET /api/jobs/failed returns list of failed jobs
11. ✅ POST /api/jobs/:id/retry re-queues failed job
12. ✅ DELETE /api/jobs/:id cancels active or waiting job
13. ✅ Jobs persist in Redis across server restarts
14. ✅ Scraping concurrency limited to 2 (Puppeteer memory)
15. ✅ Enrichment concurrency limited to 10 (API quota)
16. ✅ Batch enrichment tracks overall progress (30/50 completed)
17. ✅ Job history retained: last 100 completed, 500 failed
18. ✅ Redis connection errors handled gracefully (error message, no crash)
19. ✅ All job events logged with job ID for debugging
20. ✅ Swagger documentation updated for all new endpoints

### Performance Requirements

1. ✅ API response time: <200ms for job queueing
2. ✅ Scraping throughput: 2 jobs in parallel
3. ✅ Enrichment throughput: 10 jobs/minute (rate limited)
4. ✅ WebSocket latency: <100ms for progress events
5. ✅ Redis memory usage: <100MB for 1,000 jobs

### Code Quality

1. ✅ All services have JSDoc comments
2. ✅ All controllers have Swagger annotations
3. ✅ All DTOs use class-validator decorators
4. ✅ Unit tests: >80% coverage
5. ✅ Integration tests pass
6. ✅ E2E tests pass
7. ✅ ESLint passes with no errors
8. ✅ Prettier formatting applied

---

## Validation Commands

### 1. Verify Redis Running
```bash
redis-cli ping
# Expected: PONG
```

### 2. Install Dependencies
```bash
cd nodejs_space
yarn add ioredis
yarn add -D @types/ioredis
# Expected: ioredis@^5.x installed
```

### 3. Start Development Server
```bash
yarn start:dev
# Expected:
# [QueueModule] BullMQ initialized with Redis
# [Nest] LOG [ScraperProcessor] Processor started
# [Nest] LOG [EnrichmentProcessor] Processor started
```

### 4. Test Scraping Job Queueing
```bash
curl -X POST http://localhost:3000/api/scraper/scrape \
  -H "Content-Type: application/json" \
  -d '{"location": "Freehold, NJ", "business_type": "plumbing", "max_results": 10}'

# Expected:
# {
#   "jobId": "1",
#   "status": "waiting",
#   "message": "Scraping job queued. Listen for \"scraping:progress\" WebSocket events."
# }
```

### 5. Check Job Status
```bash
curl http://localhost:3000/api/jobs/1

# Expected (while running):
# {
#   "jobId": "1",
#   "status": "active",
#   "progress": 50,
#   "data": { "location": "Freehold, NJ" },
#   "attemptsMade": 1,
#   "createdAt": "2025-01-21T15:30:00.000Z"
# }

# Expected (when complete):
# {
#   "jobId": "1",
#   "status": "completed",
#   "progress": 100,
#   "result": { "found": 25, "saved": 23, "skipped": 2 },
#   "attemptsMade": 1,
#   "finishedAt": "2025-01-21T15:35:00.000Z"
# }
```

### 6. Test Batch Enrichment
```bash
curl -X POST http://localhost:3000/api/enrichment/batch \
  -H "Content-Type: application/json" \
  -d '{"count": 10}'

# Expected:
# {
#   "batchId": "batch-abc-123",
#   "totalJobs": 10,
#   "status": "processing",
#   "message": "10 enrichment jobs queued. Rate limited to 10/minute."
# }
```

### 7. Check Batch Status
```bash
curl http://localhost:3000/api/enrichment/batch/batch-abc-123/status

# Expected:
# {
#   "batchId": "batch-abc-123",
#   "total": 10,
#   "completed": 6,
#   "failed": 1,
#   "active": 2,
#   "waiting": 1,
#   "progress": 60
# }
```

### 8. Monitor WebSocket Events
```bash
# Install wscat if not already installed
npm install -g wscat

# Connect to WebSocket
wscat -c "ws://localhost:3000/socket.io/?EIO=4&transport=websocket"

# Expected: Connection established, then see events like:
# {
#   "timestamp": "2025-01-21T15:30:00.000Z",
#   "type": "scraping:progress",
#   "data": {
#     "jobId": "1",
#     "progress": 25,
#     "message": "Navigating to Google Maps..."
#   }
# }
```

### 9. List Failed Jobs
```bash
curl http://localhost:3000/api/jobs/failed

# Expected:
# {
#   "jobs": [
#     {
#       "jobId": "5",
#       "status": "failed",
#       "failedReason": "Timeout error",
#       "attemptsMade": 3,
#       "createdAt": "2025-01-21T14:00:00.000Z"
#     }
#   ],
#   "total": 1
# }
```

### 10. Retry Failed Job
```bash
curl -X POST http://localhost:3000/api/jobs/5/retry

# Expected:
# {
#   "message": "Job 5 retry queued"
# }
```

### 11. Cancel Active Job
```bash
curl -X DELETE http://localhost:3000/api/jobs/2

# Expected:
# {
#   "message": "Job 2 cancelled"
# }
```

### 12. Verify Rate Limiting (Enrichment)
```bash
# Queue 30 enrichment jobs
for i in {1..30}; do
  curl -X POST http://localhost:3000/api/enrichment/batch \
    -H "Content-Type: application/json" \
    -d '{"count": 1}' &
done

# Wait 1 minute, then check logs
# Expected: Exactly 10 jobs completed per minute (rate limit working)
```

### 13. Test Job Persistence (Server Restart)
```bash
# 1. Queue a scraping job
curl -X POST http://localhost:3000/api/scraper/scrape \
  -d '{"location": "Test", "max_results": 50}'
# Note the jobId

# 2. Kill server
# Ctrl+C in server terminal

# 3. Restart server
yarn start:dev

# 4. Check job status (should still exist in Redis)
curl http://localhost:3000/api/jobs/{jobId}

# Expected: Job status returned (job persisted)
```

### 14. Run Unit Tests
```bash
yarn test scraper.processor.spec.ts
yarn test enrichment.processor.spec.ts
yarn test jobs.service.spec.ts

# Expected: All tests pass
```

### 15. Run E2E Tests
```bash
yarn test:e2e jobs.e2e-spec.ts

# Expected: All integration tests pass
```

---

## Performance Benchmarks

### Current (Synchronous) Performance

**Scraping:**
- Request → Response: 5-15 minutes (blocking)
- User must wait for entire operation
- No progress updates

**Enrichment:**
- 50 businesses × 3 seconds = 150 seconds
- Sequential processing
- Manual delays

### Expected (BullMQ) Performance

**Scraping:**
- Request → Response: <200ms (job queued)
- Processing: 5-15 minutes (background)
- Progress updates: Every 25% via WebSocket

**Enrichment:**
- 50 businesses: ~5 minutes (10 jobs/minute rate limit)
- Parallel processing (10 concurrent workers)
- Automatic retry on failures

### Performance Gains

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| API Response Time | 5-15 min | <200ms | **450x faster** |
| User Blocking | Yes | No | ✅ Non-blocking |
| Progress Tracking | None | Real-time | ✅ Live updates |
| Retry Logic | None | Automatic | ✅ 3 attempts |
| Concurrency | 1 | 10 | **10x throughput** |
| Job Persistence | None | Redis | ✅ Survives restarts |

---

## Migration Notes

### Backwards Compatibility

**Old endpoints still work (if you keep existing methods):**
- `POST /api/scraper/scrape` (sync) → Add new async endpoint or replace
- `POST /api/enrichment/batch` (sync) → Replace with async version

**Recommended migration:**
1. Deploy new BullMQ endpoints alongside old ones
2. Update frontend to use new async API
3. Deprecate old sync endpoints after 1 week
4. Remove old sync code after 2 weeks

### Environment Variables Migration

**Add to .env:**
```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
BULLMQ_DEFAULT_CONCURRENCY=5
BULLMQ_SCRAPER_CONCURRENCY=2
BULLMQ_ENRICHMENT_CONCURRENCY=10
BULLMQ_ENRICHMENT_RATE_LIMIT=10
```

### Redis Deployment

**Development:**
- Use Docker Compose or local Redis install
- No authentication needed

**Production:**
- Use managed Redis (AWS ElastiCache, Redis Cloud, etc.)
- Enable authentication (REDIS_PASSWORD)
- Use TLS/SSL for encryption
- Set maxmemory policy: `volatile-lru` (evict old jobs first)

---

## Troubleshooting

### Issue: Jobs Not Processing

**Symptoms:** Jobs stuck in "waiting" state

**Checks:**
```bash
# 1. Redis running?
redis-cli ping

# 2. Workers started?
# Check logs for:
# [ScraperProcessor] Processor started
# [EnrichmentProcessor] Processor started

# 3. Check queue
redis-cli KEYS "bull:*"
redis-cli LLEN "bull:scraping:wait"
```

**Fix:** Restart server, verify Redis connection

---

### Issue: Rate Limiting Not Working

**Symptoms:** More than 10 enrichments/minute

**Check:**
```typescript
// Verify limiter config in EnrichmentProcessor
@Processor('enrichment', {
  limiter: {
    max: 10,        // Max 10 jobs
    duration: 60000, // Per minute
  },
})
```

**Fix:** Update processor decorator with correct limiter settings

---

### Issue: WebSocket Events Not Received

**Symptoms:** Frontend doesn't show progress

**Checks:**
```bash
# 1. WebSocket connected?
wscat -c "ws://localhost:3000/socket.io/?EIO=4&transport=websocket"

# 2. Events being emitted?
# Check logs for:
# [WebsocketGateway] Emitted scraping:progress event
```

**Fix:** Verify `websocketGateway.emitEvent()` calls in processors

---

### Issue: Jobs Failing Immediately

**Symptoms:** All jobs go to "failed" state

**Check:**
```bash
# Get failed job details
curl http://localhost:3000/api/jobs/failed

# Look at failedReason
```

**Common causes:**
- Puppeteer not installed: `yarn add puppeteer`
- Missing environment variables (API keys)
- Database connection error

---

## Security Considerations

### Redis Authentication

**Production setup:**
```env
REDIS_HOST=redis.production.com
REDIS_PASSWORD=strong-redis-password
REDIS_TLS=true
```

**Update redis.config.ts:**
```typescript
export const createRedisConnection = (configService: ConfigService): Redis => {
  return new Redis({
    host: configService.get('REDIS_HOST'),
    port: configService.get('REDIS_PORT', 6379),
    password: configService.get('REDIS_PASSWORD'),
    tls: configService.get('REDIS_TLS') ? {} : undefined,
    // ... other options
  });
};
```

### Job Data Privacy

**Never store sensitive data in job payload:**
```typescript
// ❌ BAD
await queue.add('enrich', {
  businessId: 123,
  apiKey: 'sensitive-key-here'  // Don't do this!
});

// ✅ GOOD
await queue.add('enrich', {
  businessId: 123  // Only non-sensitive data
});
// Load API key from ConfigService inside processor
```

### Rate Limiting

**Prevent abuse with job rate limits:**
```typescript
// Add global rate limit in QueueModule
defaultJobOptions: {
  limiter: {
    max: 100,      // Max 100 jobs
    duration: 60000, // Per minute
  }
}
```

---

## Next Steps

After implementing BullMQ:

1. **Frontend Integration** (coding-prompt-frontend-tanstack-query.md)
   - Update dashboard to use async job API
   - Display real-time progress bars
   - Handle WebSocket events

2. **Monitoring Dashboard**
   - Add Bull Board for job queue UI
   - Install: `yarn add @bull-board/nestjs @bull-board/express`
   - Access at: http://localhost:3000/admin/queues

3. **Metrics & Alerting**
   - Track job success/failure rates
   - Monitor queue length
   - Alert on high failure rate (>10%)

4. **Apify Migration** (coding-prompt-backend-apify-migration.md)
   - Replace Puppeteer with Apify actors
   - Reduce scraping complexity
   - Improve reliability

---

## References

- **BullMQ Docs:** https://docs.bullmq.io/
- **NestJS BullMQ:** https://docs.nestjs.com/techniques/queues
- **ioredis:** https://github.com/redis/ioredis
- **Bull Board:** https://github.com/felixmosh/bull-board

---

## Summary

This implementation transforms the Le Tip Lead System from **synchronous, blocking operations** to **asynchronous, background jobs** with:

✅ **Instant API Responses** (<200ms)
✅ **Real-Time Progress** (WebSocket events)
✅ **Automatic Retries** (3 attempts with backoff)
✅ **Rate Limiting** (10 enrichments/minute)
✅ **Job Persistence** (survives restarts)
✅ **Concurrency Control** (2 scrapes, 10 enrichments in parallel)
✅ **Job Management API** (status, retry, cancel)
✅ **Production-Ready** (Redis-backed, scalable)

**Estimated Implementation Time:** 6-10 hours
**Performance Improvement:** 450x faster API responses
**Reliability Improvement:** Automatic retries + job persistence
