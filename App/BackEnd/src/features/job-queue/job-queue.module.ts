import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

// Config
import { QueueName, QUEUE_CONFIGS, BULLMQ_REDIS_CONNECTION } from './config/queue.config';

// Controllers
import { JobQueueController } from './api/job-queue.controller';

// Domain Services
import { JobQueueService } from './domain/job-queue.service';
import { QueueManagerService } from './domain/queue-manager.service';
import { JobStatusTrackerService } from './domain/job-status-tracker.service';

// Data Layer
import { JobHistoryRepository } from './data/repositories/job-history.repository';

// Workers
import { WorkerManagerService } from './workers/worker-manager.service';
import { ScrapingWorker } from './workers/scraping.worker';
import { EnrichmentWorker } from './workers/enrichment.worker';
import { OutreachWorker } from './workers/outreach.worker';
import { CsvImportWorker } from './workers/csv-import.worker';

// External Dependencies
import { PrismaModule } from '../../prisma/prisma.module';
import { WebsocketModule } from '../../websocket/websocket.module';

// Feature modules for worker dependencies
import { MapScrapingModule } from '../map-scraping/map-scraping.module';
import { OutreachCampaignsModule } from '../outreach-campaigns/outreach-campaigns.module';
import { EmailModule } from '../email/email.module';

/**
 * Job Queue Module
 *
 * Provides BullMQ-based job queue infrastructure for asynchronous task processing.
 *
 * Features:
 * - Multiple queues (scraping, enrichment, outreach)
 * - Job lifecycle management (create, monitor, cancel)
 * - Retry strategies with exponential backoff
 * - Dead letter queue for permanently failed jobs
 * - Database persistence for job history
 * - WebSocket events for real-time updates
 * - Redis DB 1 (separate from caching DB 0)
 *
 * Architecture:
 * - Controllers: REST API endpoints
 * - Domain Services: Business logic and orchestration
 * - Workers: Job processors (implemented in Agent 5)
 * - Data Layer: Database persistence
 * - Config: Queue and retry configurations
 *
 * Usage:
 * ```typescript
 * // Inject JobQueueService in any module
 * constructor(private jobQueueService: JobQueueService) {}
 *
 * // Create a scraping job
 * const job = await this.jobQueueService.createScrapingJob({
 *   searchQuery: 'plumbers',
 *   location: 'Freehold, NJ',
 *   maxResults: 50
 * });
 * ```
 */
@Module({
  imports: [
    // BullMQ root configuration (Redis DB 1)
    BullModule.forRoot({
      connection: BULLMQ_REDIS_CONNECTION,
    }),

    // Register all queues
    BullModule.registerQueue(
      { name: QueueName.SCRAPING, ...QUEUE_CONFIGS[QueueName.SCRAPING] },
      { name: QueueName.ENRICHMENT, ...QUEUE_CONFIGS[QueueName.ENRICHMENT] },
      { name: QueueName.OUTREACH, ...QUEUE_CONFIGS[QueueName.OUTREACH] },
      { name: QueueName.CSV_IMPORT, ...QUEUE_CONFIGS[QueueName.CSV_IMPORT] },
      { name: QueueName.DEAD_LETTER, ...QUEUE_CONFIGS[QueueName.DEAD_LETTER] },
    ),

    // External dependencies
    PrismaModule,
    WebsocketModule,

    // Feature modules for workers
    MapScrapingModule,       // For ApifyScraper
    OutreachCampaignsModule, // For OutreachService
    EmailModule,             // For EmailService (SendGrid integration)
  ],
  controllers: [JobQueueController],
  providers: [
    // Domain services
    JobQueueService,
    QueueManagerService,
    JobStatusTrackerService,

    // Data layer
    JobHistoryRepository,

    // Worker management
    WorkerManagerService,

    // Job processors (workers)
    ScrapingWorker,
    EnrichmentWorker,
    OutreachWorker,
    CsvImportWorker,
  ],
  exports: [
    // Export services for use in other modules
    JobQueueService,
    QueueManagerService,
    JobStatusTrackerService,
    JobHistoryRepository,
    WorkerManagerService,

    // Export workers if needed by other modules
    ScrapingWorker,
    EnrichmentWorker,
    OutreachWorker,
    CsvImportWorker,
  ],
})
export class JobQueueModule {}
