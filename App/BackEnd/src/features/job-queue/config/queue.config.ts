/**
 * BullMQ Queue Configuration
 *
 * Centralized configuration for all job queues including:
 * - Redis connection settings (DB 1 - separate from cache)
 * - Queue-specific settings (concurrency, rate limiting)
 * - Job lifecycle settings (TTL, removal policies)
 * - Dead letter queue configuration
 */

import { QueueOptions, WorkerOptions } from 'bullmq';

/**
 * Redis connection configuration for BullMQ.
 * Uses DB 1 to separate from caching layer (DB 0).
 */
export const BULLMQ_REDIS_CONNECTION = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  db: 1, // Separate database from caching (DB 0)
  maxRetriesPerRequest: null, // Required for BullMQ
  enableReadyCheck: false, // BullMQ handles this internally
};

/**
 * Default queue options applied to all queues.
 */
export const DEFAULT_QUEUE_OPTIONS: QueueOptions = {
  connection: BULLMQ_REDIS_CONNECTION,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000, // 1s, 2s, 4s
    },
    removeOnComplete: {
      age: 86400, // Keep completed jobs for 24 hours
      count: 100, // Keep last 100 completed jobs
    },
    removeOnFail: {
      age: 604800, // Keep failed jobs for 7 days
      count: 500, // Keep last 500 failed jobs
    },
  },
};

/**
 * Default worker options applied to all workers.
 */
export const DEFAULT_WORKER_OPTIONS: Partial<WorkerOptions> = {
  connection: BULLMQ_REDIS_CONNECTION,
  autorun: true,
  concurrency: 1, // Process one job at a time by default
};

/**
 * Queue names used throughout the application.
 */
export enum QueueName {
  SCRAPING = 'scraping-jobs',
  ENRICHMENT = 'enrichment-jobs',
  OUTREACH = 'outreach-jobs',
  CSV_IMPORT = 'csv-import-jobs',
  DEAD_LETTER = 'dead-letter-queue',
}

/**
 * Job types for each queue.
 */
export enum JobType {
  // Scraping jobs
  SCRAPE_GOOGLE_MAPS = 'scrape:google-maps',
  SCRAPE_BUSINESS_DETAILS = 'scrape:business-details',

  // Enrichment jobs
  ENRICH_BUSINESS = 'enrich:business',
  ENRICH_BATCH = 'enrich:batch',
  FIND_CONTACTS = 'enrich:contacts',
  GET_COMPANY_DATA = 'enrich:company-data',

  // Outreach jobs
  GENERATE_MESSAGE = 'outreach:generate-message',
  SEND_MESSAGE = 'outreach:send-message',
  SCHEDULE_CAMPAIGN = 'outreach:schedule-campaign',

  // CSV Import jobs
  CSV_IMPORT = 'csv:import',
  CSV_VALIDATE = 'csv:validate',
}

/**
 * Queue-specific configurations with custom settings per queue type.
 */
export const QUEUE_CONFIGS: Record<QueueName, QueueOptions> = {
  [QueueName.SCRAPING]: {
    ...DEFAULT_QUEUE_OPTIONS,
    defaultJobOptions: {
      ...DEFAULT_QUEUE_OPTIONS.defaultJobOptions,
      attempts: 2, // Scraping failures are often permanent
      backoff: {
        type: 'fixed',
        delay: 5000, // 5 seconds between retries
      },
    },
  },

  [QueueName.ENRICHMENT]: {
    ...DEFAULT_QUEUE_OPTIONS,
    defaultJobOptions: {
      ...DEFAULT_QUEUE_OPTIONS.defaultJobOptions,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000, // 2s, 4s, 8s (API rate limiting)
      },
    },
  },

  [QueueName.OUTREACH]: {
    ...DEFAULT_QUEUE_OPTIONS,
    defaultJobOptions: {
      ...DEFAULT_QUEUE_OPTIONS.defaultJobOptions,
      attempts: 5, // Retry message generation/sending more aggressively
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    },
  },

  [QueueName.CSV_IMPORT]: {
    ...DEFAULT_QUEUE_OPTIONS,
    defaultJobOptions: {
      ...DEFAULT_QUEUE_OPTIONS.defaultJobOptions,
      attempts: 1, // CSV imports don't retry - user can re-upload
      removeOnComplete: {
        age: 86400, // Keep completed imports for 24 hours
        count: 50,
      },
    },
  },

  [QueueName.DEAD_LETTER]: {
    ...DEFAULT_QUEUE_OPTIONS,
    defaultJobOptions: {
      ...DEFAULT_QUEUE_OPTIONS.defaultJobOptions,
      attempts: 1, // Don't retry dead letter jobs
      removeOnComplete: {
        age: 2592000, // Keep dead letters for 30 days
        count: 1000,
      },
      removeOnFail: false, // Never remove failed dead letter jobs
    },
  },
};

/**
 * Worker-specific configurations with custom concurrency per queue.
 */
export const WORKER_CONFIGS: Record<QueueName, Partial<WorkerOptions>> = {
  [QueueName.SCRAPING]: {
    ...DEFAULT_WORKER_OPTIONS,
    concurrency: 2, // Run 2 scraping jobs simultaneously
    limiter: {
      max: 10, // Max 10 jobs per interval
      duration: 60000, // Per 1 minute
    },
  },

  [QueueName.ENRICHMENT]: {
    ...DEFAULT_WORKER_OPTIONS,
    concurrency: 3, // Run 3 enrichment jobs simultaneously
    limiter: {
      max: 50, // Max 50 API calls per interval (respect rate limits)
      duration: 60000, // Per 1 minute
    },
  },

  [QueueName.OUTREACH]: {
    ...DEFAULT_WORKER_OPTIONS,
    concurrency: 5, // Run 5 outreach jobs simultaneously
    limiter: {
      max: 100,
      duration: 60000,
    },
  },

  [QueueName.CSV_IMPORT]: {
    ...DEFAULT_WORKER_OPTIONS,
    concurrency: 1, // Process CSV imports sequentially to prevent conflicts
    limiter: {
      max: 5, // Max 5 imports per interval
      duration: 60000, // Per 1 minute
    },
  },

  [QueueName.DEAD_LETTER]: {
    ...DEFAULT_WORKER_OPTIONS,
    concurrency: 1, // Process dead letters sequentially
  },
};

/**
 * Job priority levels for queue ordering.
 */
export enum JobPriority {
  LOW = 10,
  NORMAL = 5,
  HIGH = 1,
  URGENT = 0,
}

/**
 * Job status tracking for database persistence.
 */
export enum JobStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  FAILED = 'failed',
  DELAYED = 'delayed',
  PAUSED = 'paused',
}
