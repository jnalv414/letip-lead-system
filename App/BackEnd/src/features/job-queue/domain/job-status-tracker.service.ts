import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { JobHistoryRepository } from '../data/repositories/job-history.repository';
import { QueueManagerService } from './queue-manager.service';
import { QueueName, JobStatus } from '../config/queue.config';
import { JobStatusResponseDto, JobListResponseDto } from '../api/dto/job-status-response.dto';

/**
 * Job Status Tracker Service
 *
 * Provides job status querying and monitoring capabilities:
 * - Get job status by ID
 * - List jobs by user
 * - Queue metrics and statistics
 * - Job lifecycle tracking
 *
 * Combines data from BullMQ queues (live jobs) and database (historical jobs).
 *
 * @example
 * // Get job status
 * const status = await jobStatusTracker.getJobStatus('123');
 *
 * @example
 * // List user's jobs
 * const jobs = await jobStatusTracker.getJobsByUser('user123', 1, 20);
 *
 * @example
 * // Get queue metrics
 * const metrics = await jobStatusTracker.getQueueMetrics(QueueName.SCRAPING);
 */
@Injectable()
export class JobStatusTrackerService {
  private readonly logger = new Logger(JobStatusTrackerService.name);

  constructor(
    private readonly jobHistoryRepository: JobHistoryRepository,
    private readonly queueManager: QueueManagerService,
  ) {}

  /**
   * Get job status by ID.
   *
   * Retrieves job information from BullMQ queue (if active) or database (if completed/failed).
   *
   * @param jobId - BullMQ job ID
   * @returns Job status response DTO
   * @throws NotFoundException if job not found
   */
  async getJobStatus(jobId: string): Promise<JobStatusResponseDto> {
    try {
      // First, try to get from database
      const dbJob = await this.jobHistoryRepository.getJobById(jobId);

      if (!dbJob) {
        throw new NotFoundException(`Job ${jobId} not found`);
      }

      // Try to get live job from queue for additional details
      let liveJob: any = null;
      const queue = this.queueManager.getQueue(dbJob.queueName as QueueName);

      if (queue) {
        try {
          liveJob = await queue.getJob(jobId);
        } catch (error) {
          this.logger.debug(`Could not find live job ${jobId} in queue`);
        }
      }

      // Build response
      const response: JobStatusResponseDto = {
        jobId: dbJob.jobId,
        queueName: dbJob.queueName,
        status: dbJob.status as JobStatus,
        progress: dbJob.progress || 0,
        data: dbJob.data as any,
        result: dbJob.result as any,
        error: dbJob.error ? (dbJob.error as any).message : undefined,
        attemptsMade: dbJob.attemptsMade || 0,
        maxAttempts: dbJob.maxAttempts || 3,
        createdAt: dbJob.createdAt.toISOString(),
        startedAt: dbJob.startedAt?.toISOString(),
        completedAt: dbJob.completedAt?.toISOString(),
        userId: dbJob.userId || undefined,
      };

      // If live job exists, update with latest info
      if (liveJob) {
        response.progress = (await liveJob.progress()) || response.progress;
        response.attemptsMade = liveJob.attemptsMade || response.attemptsMade;

        const state = await liveJob.getState();
        if (state === 'active' || state === 'waiting' || state === 'delayed') {
          response.status = state as JobStatus;
        }
      }

      return response;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to get job status for ${jobId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get jobs by user ID with pagination.
   *
   * @param userId - User ID
   * @param page - Page number (1-indexed)
   * @param limit - Items per page
   * @returns Paginated job list response DTO
   */
  async getJobsByUser(userId: string, page = 1, limit = 20): Promise<JobListResponseDto> {
    try {
      const { jobs, total } = await this.jobHistoryRepository.getJobsByUser(userId, page, limit);

      const jobDtos: JobStatusResponseDto[] = jobs.map((job) => ({
        jobId: job.jobId,
        queueName: job.queueName,
        status: job.status as JobStatus,
        progress: job.progress || 0,
        data: job.data as any,
        result: job.result as any,
        error: job.error ? (job.error as any).message : undefined,
        attemptsMade: job.attemptsMade || 0,
        maxAttempts: job.maxAttempts || 3,
        createdAt: job.createdAt.toISOString(),
        startedAt: job.startedAt?.toISOString(),
        completedAt: job.completedAt?.toISOString(),
        userId: job.userId || undefined,
      }));

      return {
        jobs: jobDtos,
        total,
        page,
        limit,
      };
    } catch (error) {
      this.logger.error(`Failed to get jobs for user ${userId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get jobs by queue and optional status filter.
   *
   * @param queueName - Queue name
   * @param status - Optional status filter
   * @param page - Page number (1-indexed)
   * @param limit - Items per page
   * @returns Paginated job list response DTO
   */
  async getJobsByQueue(
    queueName: QueueName,
    status?: JobStatus,
    page = 1,
    limit = 20,
  ): Promise<JobListResponseDto> {
    try {
      const { jobs, total } = await this.jobHistoryRepository.getJobsByQueue(
        queueName,
        status,
        page,
        limit,
      );

      const jobDtos: JobStatusResponseDto[] = jobs.map((job) => ({
        jobId: job.jobId,
        queueName: job.queueName,
        status: job.status as JobStatus,
        progress: job.progress || 0,
        data: job.data as any,
        result: job.result as any,
        error: job.error ? (job.error as any).message : undefined,
        attemptsMade: job.attemptsMade || 0,
        maxAttempts: job.maxAttempts || 3,
        createdAt: job.createdAt.toISOString(),
        startedAt: job.startedAt?.toISOString(),
        completedAt: job.completedAt?.toISOString(),
        userId: job.userId || undefined,
      }));

      return {
        jobs: jobDtos,
        total,
        page,
        limit,
      };
    } catch (error) {
      this.logger.error(`Failed to get jobs for queue ${queueName}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get queue metrics (counts by status).
   *
   * Combines live queue counts from BullMQ with historical database counts.
   *
   * @param queueName - Queue name
   * @returns Object with counts per status
   */
  async getQueueMetrics(queueName: QueueName): Promise<Record<string, number>> {
    try {
      // Get live counts from BullMQ
      const liveCounts = await this.queueManager.getQueueCounts(queueName);

      // Get historical counts from database
      const dbCounts = await this.jobHistoryRepository.getQueueMetrics(queueName);

      // Merge counts (prefer live counts for active/waiting/delayed)
      const metrics: Record<string, number> = {
        waiting: liveCounts.waiting || 0,
        active: liveCounts.active || 0,
        delayed: liveCounts.delayed || 0,
        completed: dbCounts[JobStatus.COMPLETED] || 0,
        failed: dbCounts[JobStatus.FAILED] || 0,
        total: 0,
      };

      metrics.total =
        metrics.waiting +
        metrics.active +
        metrics.delayed +
        metrics.completed +
        metrics.failed;

      return metrics;
    } catch (error) {
      this.logger.error(`Failed to get metrics for queue ${queueName}: ${error.message}`, error.stack);
      return {};
    }
  }

  /**
   * Get metrics for all queues.
   *
   * @returns Object with metrics per queue
   */
  async getAllQueuesMetrics(): Promise<Record<string, Record<string, number>>> {
    try {
      const allMetrics: Record<string, Record<string, number>> = {};

      // Get metrics for each queue
      for (const queueName of Object.values(QueueName)) {
        allMetrics[queueName] = await this.getQueueMetrics(queueName);
      }

      return allMetrics;
    } catch (error) {
      this.logger.error(`Failed to get all queue metrics: ${error.message}`, error.stack);
      return {};
    }
  }

  /**
   * Get health status of job queue system.
   *
   * @returns Health status object
   */
  async getHealthStatus(): Promise<{
    healthy: boolean;
    redis: boolean;
    queues: Record<string, boolean>;
  }> {
    try {
      // Check Redis connection
      const redisHealthy = await this.queueManager.checkHealth();

      // Check each queue
      const queueHealth: Record<string, boolean> = {};
      for (const queueName of Object.values(QueueName)) {
        const queue = this.queueManager.getQueue(queueName);
        if (queue) {
          try {
            const client = await queue.client;
            await client.ping();
            queueHealth[queueName] = true;
          } catch (error) {
            queueHealth[queueName] = false;
          }
        } else {
          queueHealth[queueName] = false;
        }
      }

      const allQueuesHealthy = Object.values(queueHealth).every((health) => health);

      return {
        healthy: redisHealthy && allQueuesHealthy,
        redis: redisHealthy,
        queues: queueHealth,
      };
    } catch (error) {
      this.logger.error(`Failed to check health status: ${error.message}`, error.stack);
      return {
        healthy: false,
        redis: false,
        queues: {},
      };
    }
  }

  /**
   * Cancel a job by ID.
   *
   * @param jobId - BullMQ job ID
   * @returns true if cancelled, false if not found or already completed
   */
  async cancelJob(jobId: string): Promise<boolean> {
    try {
      // Get job from database to find queue
      const dbJob = await this.jobHistoryRepository.getJobById(jobId);
      if (!dbJob) {
        throw new NotFoundException(`Job ${jobId} not found`);
      }

      // Can't cancel completed or failed jobs
      if (dbJob.status === JobStatus.COMPLETED || dbJob.status === JobStatus.FAILED) {
        this.logger.warn(`Cannot cancel job ${jobId} with status ${dbJob.status}`);
        return false;
      }

      // Remove job from queue
      const removed = await this.queueManager.removeJob(dbJob.queueName as QueueName, jobId);

      if (removed) {
        // Update database
        await this.jobHistoryRepository.markFailed(jobId, 'Job cancelled by user', 0);
        this.logger.log(`Cancelled job ${jobId}`);
      }

      return removed;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to cancel job ${jobId}: ${error.message}`, error.stack);
      return false;
    }
  }
}
