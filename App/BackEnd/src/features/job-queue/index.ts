/**
 * Job Queue Feature Module
 *
 * BullMQ-based job queue infrastructure for asynchronous task processing.
 *
 * @module JobQueue
 */

// Main module
export { JobQueueModule } from './job-queue.module';

// Configuration
export * from './config/queue.config';
export * from './config/retry.config';

// API Layer
export { JobQueueController } from './api/job-queue.controller';
export * from './api/dto/create-scraping-job.dto';
export * from './api/dto/create-enrichment-job.dto';
export * from './api/dto/job-status-response.dto';
export * from './api/dto/job-progress-event.dto';

// Domain Services
export { JobQueueService } from './domain/job-queue.service';
export { QueueManagerService } from './domain/queue-manager.service';
export { JobStatusTrackerService } from './domain/job-status-tracker.service';

// Data Layer
export { JobHistoryRepository } from './data/repositories/job-history.repository';

// Workers
export { BaseWorker } from './workers/base-worker';
export { WorkerManagerService } from './workers/worker-manager.service';
