import { Worker, Job, UnrecoverableError } from 'bullmq';
import { Logger } from '@nestjs/common';
import { JobHistoryRepository } from '../data/repositories/job-history.repository';
import { JobStatus, QueueName, WORKER_CONFIGS, BULLMQ_REDIS_CONNECTION } from '../config/queue.config';
import { shouldRetry, getRetryDelay, categorizeError } from '../config/retry.config';

/**
 * Abstract base worker class for all BullMQ job processors.
 *
 * Provides common functionality:
 * - Job lifecycle event handling
 * - Database persistence
 * - Error handling and retry logic
 * - Progress tracking
 * - WebSocket event emission
 *
 * All queue workers should extend this class and implement processJob().
 *
 * @example
 * export class ScrapingWorker extends BaseWorker {
 *   constructor(jobHistoryRepo: JobHistoryRepository, websocketGateway: WebsocketGateway) {
 *     super('scraping-jobs', jobHistoryRepo, websocketGateway);
 *   }
 *
 *   protected async processJob(job: Job): Promise<any> {
 *     // Scraping logic here
 *     return { found: 50, saved: 48 };
 *   }
 * }
 */
export abstract class BaseWorker {
  protected readonly logger: Logger;
  protected readonly worker: Worker;

  constructor(
    protected readonly queueName: string,
    protected readonly jobHistoryRepository: JobHistoryRepository,
    protected readonly websocketGateway?: any, // WebsocketGateway injected if available
  ) {
    this.logger = new Logger(`${this.constructor.name}`);

    // Get worker configuration for this queue
    const defaultConfig = {
      connection: BULLMQ_REDIS_CONNECTION,
      autorun: true,
      concurrency: 1,
    };

    const workerConfig = {
      ...defaultConfig,
      ...(WORKER_CONFIGS[queueName as QueueName] || {}),
    };

    // Create BullMQ worker
    this.worker = new Worker(
      queueName,
      async (job: Job) => this.handleJob(job),
      workerConfig,
    );

    // Register event handlers
    this.registerEventHandlers();

    this.logger.log(`Worker initialized for queue: ${queueName}`);
  }

  /**
   * Abstract method to be implemented by subclasses.
   * Contains the actual job processing logic.
   *
   * @param job - BullMQ job to process
   * @returns Job result (stored in database and emitted via WebSocket)
   */
  protected abstract processJob(job: Job): Promise<any>;

  /**
   * Main job handler (called by BullMQ worker).
   * Wraps processJob with error handling and lifecycle management.
   *
   * @param job - BullMQ job to process
   * @returns Job result
   */
  private async handleJob(job: Job): Promise<any> {
    try {
      this.logger.log(`Processing job ${job.id} (${job.name})`);

      // Create job history record
      await this.jobHistoryRepository.createJobRecord(job);

      // Update status to active
      await this.jobHistoryRepository.updateStatus(job.id!, JobStatus.ACTIVE);

      // Process the job
      const result = await this.processJob(job);

      return result;
    } catch (error) {
      // Categorize error and determine retry strategy
      const errorCategory = categorizeError(error);
      const shouldRetryJob = shouldRetry(job, error);
      const retryDelay = getRetryDelay(job, error);

      this.logger.error(
        `Job ${job.id} failed: ${error.message} (category: ${errorCategory}, retry: ${shouldRetryJob})`,
        error.stack,
      );

      // Mark as failed in database
      await this.jobHistoryRepository.markFailed(job.id!, error, job.attemptsMade);

      // If shouldn't retry, throw unrecoverable error
      if (!shouldRetryJob) {
        throw new UnrecoverableError(error.message);
      }

      // Throw error to trigger BullMQ retry with calculated delay
      const errorWithDelay = new Error(error.message);
      (errorWithDelay as any).delay = retryDelay;
      throw errorWithDelay;
    }
  }

  /**
   * Register BullMQ event handlers for job lifecycle.
   */
  private registerEventHandlers(): void {
    // Job completed successfully
    this.worker.on('completed', async (job: Job, result: any) => {
      this.logger.log(`Job ${job.id} completed successfully`);

      try {
        // Update database
        await this.jobHistoryRepository.markCompleted(job.id!, result);

        // Emit WebSocket event
        if (this.websocketGateway) {
          this.websocketGateway.emitEvent('job:completed', {
            type: 'job:completed',
            jobId: job.id,
            queueName: this.queueName,
            result,
            timestamp: new Date().toISOString(),
            userId: job.data.userId,
          });
        }
      } catch (error) {
        this.logger.error(`Error in completed handler: ${error.message}`, error.stack);
      }
    });

    // Job failed permanently
    this.worker.on('failed', async (job: Job | undefined, error: Error) => {
      if (!job) return;

      this.logger.error(`Job ${job.id} failed permanently: ${error.message}`);

      try {
        // Update database
        await this.jobHistoryRepository.markFailed(job.id!, error, job.attemptsMade);

        // Emit WebSocket event
        if (this.websocketGateway) {
          this.websocketGateway.emitEvent('job:failed', {
            type: 'job:failed',
            jobId: job.id,
            queueName: this.queueName,
            error: error.message,
            attemptsMade: job.attemptsMade,
            timestamp: new Date().toISOString(),
            userId: job.data.userId,
          });
        }
      } catch (err) {
        this.logger.error(`Error in failed handler: ${err.message}`, err.stack);
      }
    });

    // Job is active (started processing)
    this.worker.on('active', async (job: Job) => {
      this.logger.debug(`Job ${job.id} is now active`);

      try {
        await this.jobHistoryRepository.updateStatus(job.id!, JobStatus.ACTIVE);
      } catch (error) {
        this.logger.error(`Error in active handler: ${error.message}`, error.stack);
      }
    });

    // Job progress updated
    this.worker.on('progress', async (job: Job, progress: number | object) => {
      const progressValue = typeof progress === 'number' ? progress : 0;
      this.logger.debug(`Job ${job.id} progress: ${progressValue}%`);

      try {
        // Update database
        await this.jobHistoryRepository.updateProgress(job.id!, progressValue);

        // Emit WebSocket event
        if (this.websocketGateway) {
          this.websocketGateway.emitEvent('job:progress', {
            type: 'job:progress',
            jobId: job.id,
            queueName: this.queueName,
            progress: progressValue,
            timestamp: new Date().toISOString(),
            userId: job.data.userId,
          });
        }
      } catch (error) {
        this.logger.error(`Error in progress handler: ${error.message}`, error.stack);
      }
    });

    // Worker error (not job-specific)
    this.worker.on('error', (error: Error) => {
      this.logger.error(`Worker error: ${error.message}`, error.stack);
    });

    // Worker stalled (job took too long to acknowledge)
    this.worker.on('stalled', (jobId: string) => {
      this.logger.warn(`Job ${jobId} stalled (worker unresponsive)`);
    });
  }

  /**
   * Update job progress manually (call from processJob implementation).
   *
   * @param job - BullMQ job
   * @param progress - Progress percentage (0-100)
   * @param message - Optional progress message
   */
  protected async updateProgress(job: Job, progress: number, message?: string): Promise<void> {
    try {
      // Update BullMQ job progress (triggers 'progress' event)
      await job.updateProgress(progress);

      this.logger.debug(`Job ${job.id} progress: ${progress}% ${message || ''}`);
    } catch (error) {
      this.logger.error(`Failed to update progress: ${error.message}`, error.stack);
    }
  }

  /**
   * Gracefully close worker (stop accepting new jobs, wait for active jobs).
   */
  async close(): Promise<void> {
    this.logger.log(`Closing worker for queue: ${this.queueName}`);
    await this.worker.close();
    this.logger.log(`Worker closed for queue: ${this.queueName}`);
  }

  /**
   * Pause worker (stop processing jobs).
   */
  async pause(): Promise<void> {
    this.logger.log(`Pausing worker for queue: ${this.queueName}`);
    await this.worker.pause();
  }

  /**
   * Resume worker (start processing jobs).
   */
  async resume(): Promise<void> {
    this.logger.log(`Resuming worker for queue: ${this.queueName}`);
    await this.worker.resume();
  }

  /**
   * Get worker instance (for advanced operations).
   */
  getWorker(): Worker {
    return this.worker;
  }
}
