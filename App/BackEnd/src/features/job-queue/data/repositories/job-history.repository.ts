import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { JobStatus } from '../../config/queue.config';
import { Job } from 'bullmq';

/**
 * Repository for persisting job history to database.
 *
 * Provides database operations for tracking job lifecycle, status, and results.
 * Integrates with BullMQ jobs for comprehensive audit trail.
 *
 * @example
 * // Record job creation
 * await jobHistoryRepository.createJobRecord(job);
 *
 * @example
 * // Update job progress
 * await jobHistoryRepository.updateProgress(jobId, 50, 'Processed 25 of 50 items');
 *
 * @example
 * // Mark job as completed
 * await jobHistoryRepository.markCompleted(jobId, { found: 50, saved: 48 });
 */
@Injectable()
export class JobHistoryRepository {
  private readonly logger = new Logger(JobHistoryRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new job history record.
   *
   * @param job - BullMQ job instance
   * @returns Created job history record
   */
  async createJobRecord(job: Job): Promise<any> {
    try {
      return await this.prisma.job_history.create({
        data: {
          jobId: job.id?.toString() || '',
          queueName: job.queueName,
          jobType: job.name,
          status: JobStatus.PENDING,
          data: job.data,
          progress: 0,
          attemptsMade: 0,
          maxAttempts: job.opts.attempts || 3,
          userId: job.data.userId || null,
          createdAt: new Date(job.timestamp),
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to create job record: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Update job status.
   *
   * @param jobId - BullMQ job ID
   * @param status - New job status
   */
  async updateStatus(jobId: string, status: JobStatus): Promise<void> {
    try {
      const updateData: any = { status };

      if (status === JobStatus.ACTIVE) {
        updateData.startedAt = new Date();
      } else if (status === JobStatus.COMPLETED) {
        updateData.completedAt = new Date();
      } else if (status === JobStatus.FAILED) {
        updateData.failedAt = new Date();
      }

      await this.prisma.job_history.updateMany({
        where: { jobId },
        data: updateData,
      });

      this.logger.debug(`Updated job ${jobId} status to ${status}`);
    } catch (error) {
      this.logger.error(
        `Failed to update job status: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Update job progress.
   *
   * @param jobId - BullMQ job ID
   * @param progress - Progress percentage (0-100)
   */
  async updateProgress(jobId: string, progress: number): Promise<void> {
    try {
      await this.prisma.job_history.updateMany({
        where: { jobId },
        data: { progress },
      });

      this.logger.debug(`Updated job ${jobId} progress to ${progress}%`);
    } catch (error) {
      this.logger.error(
        `Failed to update job progress: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Mark job as completed with result.
   *
   * @param jobId - BullMQ job ID
   * @param result - Job result data
   */
  async markCompleted(jobId: string, result: any): Promise<void> {
    try {
      await this.prisma.job_history.updateMany({
        where: { jobId },
        data: {
          status: JobStatus.COMPLETED,
          result: result,
          progress: 100,
          completedAt: new Date(),
        },
      });

      this.logger.log(`Marked job ${jobId} as completed`);
    } catch (error) {
      this.logger.error(
        `Failed to mark job as completed: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Mark job as failed with error.
   *
   * @param jobId - BullMQ job ID
   * @param error - Error object or message
   * @param attemptsMade - Number of retry attempts made
   */
  async markFailed(
    jobId: string,
    error: Error | string,
    attemptsMade: number,
  ): Promise<void> {
    try {
      const errorData =
        typeof error === 'string'
          ? { message: error }
          : { message: error.message, stack: error.stack };

      await this.prisma.job_history.updateMany({
        where: { jobId },
        data: {
          status: JobStatus.FAILED,
          error: errorData as any,
          attemptsMade,
          failedAt: new Date(),
        },
      });

      this.logger.warn(`Marked job ${jobId} as failed: ${errorData.message}`);
    } catch (error) {
      this.logger.error(
        `Failed to mark job as failed: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Get job by ID.
   *
   * @param jobId - BullMQ job ID
   * @returns Job history record or null if not found
   */
  async getJobById(jobId: string): Promise<any> {
    try {
      return await this.prisma.job_history.findUnique({
        where: { jobId },
      });
    } catch (error) {
      this.logger.error(
        `Failed to get job by ID: ${error.message}`,
        error.stack,
      );
      return null;
    }
  }

  /**
   * Get jobs by user ID with pagination.
   *
   * @param userId - User ID
   * @param page - Page number (1-indexed)
   * @param limit - Items per page
   * @returns Paginated job history records
   */
  async getJobsByUser(
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<{ jobs: any[]; total: number }> {
    try {
      const skip = (page - 1) * limit;

      const [jobs, total] = await Promise.all([
        this.prisma.job_history.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        this.prisma.job_history.count({
          where: { userId },
        }),
      ]);

      return { jobs, total };
    } catch (error) {
      this.logger.error(
        `Failed to get jobs by user: ${error.message}`,
        error.stack,
      );
      return { jobs: [], total: 0 };
    }
  }

  /**
   * Get jobs by queue and status.
   *
   * @param queueName - Queue name
   * @param status - Job status (optional)
   * @param page - Page number (1-indexed)
   * @param limit - Items per page
   * @returns Paginated job history records
   */
  async getJobsByQueue(
    queueName: string,
    status?: JobStatus,
    page = 1,
    limit = 20,
  ): Promise<{ jobs: any[]; total: number }> {
    try {
      const skip = (page - 1) * limit;
      const where: any = { queueName };

      if (status) {
        where.status = status;
      }

      const [jobs, total] = await Promise.all([
        this.prisma.job_history.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        this.prisma.job_history.count({ where }),
      ]);

      return { jobs, total };
    } catch (error) {
      this.logger.error(
        `Failed to get jobs by queue: ${error.message}`,
        error.stack,
      );
      return { jobs: [], total: 0 };
    }
  }

  /**
   * Get queue metrics (counts by status).
   *
   * @param queueName - Queue name
   * @returns Object with counts per status
   */
  async getQueueMetrics(queueName: string): Promise<Record<string, number>> {
    try {
      const results = await this.prisma.job_history.groupBy({
        by: ['status'],
        where: { queueName },
        _count: { status: true },
      });

      const metrics: Record<string, number> = {};
      results.forEach((result) => {
        metrics[result.status] = result._count.status;
      });

      return metrics;
    } catch (error) {
      this.logger.error(
        `Failed to get queue metrics: ${error.message}`,
        error.stack,
      );
      return {};
    }
  }

  /**
   * Get all queues metrics.
   *
   * @returns Object with metrics per queue
   */
  async getAllQueuesMetrics(): Promise<Record<string, Record<string, number>>> {
    try {
      const results = await this.prisma.job_history.groupBy({
        by: ['queueName', 'status'],
        _count: { status: true },
      });

      const metrics: Record<string, Record<string, number>> = {};

      results.forEach((result) => {
        if (!metrics[result.queueName]) {
          metrics[result.queueName] = {};
        }
        metrics[result.queueName][result.status] = result._count.status;
      });

      return metrics;
    } catch (error) {
      this.logger.error(
        `Failed to get all queues metrics: ${error.message}`,
        error.stack,
      );
      return {};
    }
  }

  /**
   * Delete old completed jobs (cleanup).
   *
   * @param daysOld - Delete jobs older than this many days
   * @returns Number of deleted records
   */
  async deleteOldJobs(daysOld = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await this.prisma.job_history.deleteMany({
        where: {
          status: JobStatus.COMPLETED,
          completedAt: {
            lt: cutoffDate,
          },
        },
      });

      this.logger.log(`Deleted ${result.count} old job records`);
      return result.count;
    } catch (error) {
      this.logger.error(
        `Failed to delete old jobs: ${error.message}`,
        error.stack,
      );
      return 0;
    }
  }
}
