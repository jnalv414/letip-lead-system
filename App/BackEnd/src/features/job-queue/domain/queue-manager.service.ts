import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Queue } from 'bullmq';
import { QueueName, QUEUE_CONFIGS } from '../config/queue.config';

/**
 * Queue Manager Service
 *
 * Manages BullMQ queue instances:
 * - Queue initialization
 * - Job addition with priority and options
 * - Queue health checks
 * - Dead letter queue management
 *
 * Provides centralized access to all queues used throughout the application.
 *
 * @example
 * // Add a scraping job
 * const job = await queueManager.addJob(QueueName.SCRAPING, {
 *   searchQuery: 'plumbers',
 *   location: 'Freehold, NJ'
 * });
 *
 * @example
 * // Get queue metrics
 * const metrics = await queueManager.getQueueCounts(QueueName.SCRAPING);
 */
@Injectable()
export class QueueManagerService implements OnModuleInit {
  private readonly logger = new Logger(QueueManagerService.name);
  private readonly queues: Map<QueueName, Queue> = new Map();

  /**
   * Module initialization - create all queue instances.
   */
  async onModuleInit(): Promise<void> {
    this.logger.log('Initializing BullMQ queues...');

    // Initialize all queues
    Object.values(QueueName).forEach((queueName) => {
      const config = QUEUE_CONFIGS[queueName];
      const queue = new Queue(queueName, config);

      this.queues.set(queueName, queue);
      this.logger.log(`Initialized queue: ${queueName}`);
    });

    // Verify Redis connectivity
    const isHealthy = await this.checkHealth();
    if (isHealthy) {
      this.logger.log('All queues initialized successfully and Redis is accessible');
    } else {
      this.logger.error('Queue initialization completed but Redis connection issues detected');
    }
  }

  /**
   * Add a job to a queue.
   *
   * @param queueName - Queue to add job to
   * @param jobType - Job type/name
   * @param data - Job data payload
   * @param options - Optional job options (priority, delay, etc.)
   * @returns Created job instance
   */
  async addJob(
    queueName: QueueName,
    jobType: string,
    data: any,
    options?: {
      priority?: number;
      delay?: number;
      attempts?: number;
      timeout?: number;
    },
  ): Promise<any> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    try {
      const job = await queue.add(jobType, data, options);
      this.logger.log(`Added job ${job.id} to queue ${queueName} (type: ${jobType})`);
      return job;
    } catch (error) {
      this.logger.error(`Failed to add job to queue ${queueName}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Add multiple jobs to a queue in bulk.
   *
   * @param queueName - Queue to add jobs to
   * @param jobs - Array of job configurations
   * @returns Array of created job instances
   */
  async addBulk(
    queueName: QueueName,
    jobs: Array<{ name: string; data: any; opts?: any }>,
  ): Promise<any[]> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    try {
      const createdJobs = await queue.addBulk(jobs);
      this.logger.log(`Added ${createdJobs.length} jobs to queue ${queueName}`);
      return createdJobs;
    } catch (error) {
      this.logger.error(`Failed to add bulk jobs to queue ${queueName}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get a job by ID from a queue.
   *
   * @param queueName - Queue name
   * @param jobId - Job ID
   * @returns Job instance or null if not found
   */
  async getJob(queueName: QueueName, jobId: string): Promise<any> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    try {
      return await queue.getJob(jobId);
    } catch (error) {
      this.logger.error(`Failed to get job ${jobId} from queue ${queueName}: ${error.message}`);
      return null;
    }
  }

  /**
   * Remove a job from a queue.
   *
   * @param queueName - Queue name
   * @param jobId - Job ID to remove
   * @returns true if removed, false if not found
   */
  async removeJob(queueName: QueueName, jobId: string): Promise<boolean> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    try {
      const job = await queue.getJob(jobId);
      if (!job) {
        this.logger.warn(`Job ${jobId} not found in queue ${queueName}`);
        return false;
      }

      await job.remove();
      this.logger.log(`Removed job ${jobId} from queue ${queueName}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to remove job ${jobId} from queue ${queueName}: ${error.message}`);
      return false;
    }
  }

  /**
   * Get queue counts (waiting, active, completed, failed, delayed).
   *
   * @param queueName - Queue name
   * @returns Object with counts per state
   */
  async getQueueCounts(queueName: QueueName): Promise<Record<string, number>> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    try {
      const counts = await queue.getJobCounts();
      return counts;
    } catch (error) {
      this.logger.error(`Failed to get counts for queue ${queueName}: ${error.message}`);
      return {};
    }
  }

  /**
   * Get metrics for all queues.
   *
   * @returns Object with metrics per queue
   */
  async getAllQueueMetrics(): Promise<Record<string, Record<string, number>>> {
    const metrics: Record<string, Record<string, number>> = {};

    for (const [queueName, queue] of this.queues.entries()) {
      try {
        metrics[queueName] = await queue.getJobCounts();
      } catch (error) {
        this.logger.error(`Failed to get metrics for queue ${queueName}: ${error.message}`);
        metrics[queueName] = {};
      }
    }

    return metrics;
  }

  /**
   * Pause a queue (stop processing jobs).
   *
   * @param queueName - Queue to pause
   */
  async pauseQueue(queueName: QueueName): Promise<void> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    try {
      await queue.pause();
      this.logger.log(`Paused queue: ${queueName}`);
    } catch (error) {
      this.logger.error(`Failed to pause queue ${queueName}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Resume a queue (start processing jobs).
   *
   * @param queueName - Queue to resume
   */
  async resumeQueue(queueName: QueueName): Promise<void> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    try {
      await queue.resume();
      this.logger.log(`Resumed queue: ${queueName}`);
    } catch (error) {
      this.logger.error(`Failed to resume queue ${queueName}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Clean old jobs from a queue.
   *
   * @param queueName - Queue to clean
   * @param grace - Grace period in milliseconds
   * @param status - Job status to clean ('completed', 'failed', 'delayed', etc.)
   * @param limit - Maximum number of jobs to clean
   * @returns Number of jobs cleaned
   */
  async cleanQueue(
    queueName: QueueName,
    grace: number = 86400000, // 24 hours
    status: 'completed' | 'failed' | 'delayed' = 'completed',
    limit: number = 1000,
  ): Promise<number> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    try {
      const jobs = await queue.clean(grace, limit, status);
      this.logger.log(`Cleaned ${jobs.length} ${status} jobs from queue ${queueName}`);
      return jobs.length;
    } catch (error) {
      this.logger.error(`Failed to clean queue ${queueName}: ${error.message}`);
      return 0;
    }
  }

  /**
   * Obliterate a queue (remove all jobs and queue data).
   * DANGEROUS - use only in development/testing.
   *
   * @param queueName - Queue to obliterate
   */
  async obliterateQueue(queueName: QueueName): Promise<void> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    try {
      await queue.obliterate();
      this.logger.warn(`Obliterated queue: ${queueName} (all data removed)`);
    } catch (error) {
      this.logger.error(`Failed to obliterate queue ${queueName}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check health of all queues.
   *
   * @returns true if all queues are healthy, false otherwise
   */
  async checkHealth(): Promise<boolean> {
    try {
      const healthChecks = Array.from(this.queues.values()).map(async (queue) => {
        try {
          const client = await queue.client;
          await client.ping();
          return true;
        } catch {
          return false;
        }
      });

      const results = await Promise.all(healthChecks);
      return results.every((result: boolean) => result === true);
    } catch (error) {
      this.logger.error(`Health check failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Get a queue instance (for advanced operations).
   *
   * @param queueName - Queue name
   * @returns Queue instance
   */
  getQueue(queueName: QueueName): Queue | undefined {
    return this.queues.get(queueName);
  }

  /**
   * Get all queue instances.
   *
   * @returns Map of queue names to queue instances
   */
  getQueues(): Map<QueueName, Queue> {
    return this.queues;
  }

  /**
   * Close all queues (cleanup).
   */
  async closeAll(): Promise<void> {
    this.logger.log('Closing all queues...');

    const closePromises = Array.from(this.queues.values()).map((queue) =>
      queue.close().catch((error) => {
        this.logger.error(`Failed to close queue: ${error.message}`);
      }),
    );

    await Promise.all(closePromises);
    this.logger.log('All queues closed');
  }
}
