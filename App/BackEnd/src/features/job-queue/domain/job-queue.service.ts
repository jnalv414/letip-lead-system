import { Injectable, Logger } from '@nestjs/common';
import { QueueManagerService } from './queue-manager.service';
import { QueueName, JobType, JobPriority } from '../config/queue.config';
import { CreateScrapingJobDto } from '../api/dto/create-scraping-job.dto';
import { CreateEnrichmentJobDto } from '../api/dto/create-enrichment-job.dto';

/**
 * Job Queue Service
 *
 * High-level service for creating and managing jobs across all queues.
 * Provides typed methods for each job type with validation and defaults.
 *
 * @example
 * // Create a scraping job
 * const job = await jobQueueService.createScrapingJob({
 *   searchQuery: 'plumbers',
 *   location: 'Freehold, NJ',
 *   maxResults: 50
 * });
 *
 * @example
 * // Create an enrichment job
 * const job = await jobQueueService.createEnrichmentJob({
 *   businessIds: [123, 456, 789],
 *   services: ['hunter', 'abstract']
 * });
 */
@Injectable()
export class JobQueueService {
  private readonly logger = new Logger(JobQueueService.name);

  constructor(private readonly queueManager: QueueManagerService) {}

  /**
   * Create a Google Maps scraping job.
   *
   * @param dto - Scraping job parameters
   * @returns Created job instance
   */
  async createScrapingJob(dto: CreateScrapingJobDto): Promise<any> {
    try {
      this.logger.log(`Creating scraping job: ${dto.searchQuery} in ${dto.location}`);

      const job = await this.queueManager.addJob(
        QueueName.SCRAPING,
        JobType.SCRAPE_GOOGLE_MAPS,
        {
          searchQuery: dto.searchQuery,
          location: dto.location,
          maxResults: dto.maxResults || 50,
          radius: dto.radius || 5,
          userId: dto.userId,
        },
        {
          priority: dto.priority || JobPriority.NORMAL,
          timeout: 300000, // 5 minutes
        },
      );

      this.logger.log(`Created scraping job ${job.id}`);
      return job;
    } catch (error) {
      this.logger.error(`Failed to create scraping job: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Create a business enrichment job.
   *
   * For batch enrichment, creates individual jobs for each business ID.
   *
   * @param dto - Enrichment job parameters
   * @returns Created job instance(s)
   */
  async createEnrichmentJob(dto: CreateEnrichmentJobDto): Promise<any[]> {
    try {
      this.logger.log(`Creating enrichment job for ${dto.businessIds.length} businesses`);

      // Create individual jobs for each business (allows parallel processing)
      const jobs = dto.businessIds.map((businessId) => ({
        name: JobType.ENRICH_BUSINESS,
        data: {
          businessId,
          services: dto.services || ['all'],
          userId: dto.userId,
        },
        opts: {
          priority: dto.priority || JobPriority.NORMAL,
          timeout: 60000, // 1 minute per business
        },
      }));

      const createdJobs = await this.queueManager.addBulk(QueueName.ENRICHMENT, jobs);

      this.logger.log(`Created ${createdJobs.length} enrichment jobs`);
      return createdJobs;
    } catch (error) {
      this.logger.error(`Failed to create enrichment job: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Create an outreach message generation job.
   *
   * @param businessId - Business ID to generate message for
   * @param contactId - Contact ID (optional)
   * @param userId - User ID
   * @param priority - Job priority
   * @returns Created job instance
   */
  async createOutreachJob(
    businessId: number,
    contactId?: number,
    userId?: string,
    priority?: JobPriority,
  ): Promise<any> {
    try {
      this.logger.log(`Creating outreach job for business ${businessId}`);

      const job = await this.queueManager.addJob(
        QueueName.OUTREACH,
        JobType.GENERATE_MESSAGE,
        {
          businessId,
          contactId,
          userId,
        },
        {
          priority: priority || JobPriority.NORMAL,
          timeout: 30000, // 30 seconds
        },
      );

      this.logger.log(`Created outreach job ${job.id}`);
      return job;
    } catch (error) {
      this.logger.error(`Failed to create outreach job: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Create batch outreach jobs for multiple businesses.
   *
   * @param businessIds - Array of business IDs
   * @param userId - User ID
   * @param priority - Job priority
   * @returns Created job instances
   */
  async createBatchOutreachJobs(
    businessIds: number[],
    userId?: string,
    priority?: JobPriority,
  ): Promise<any[]> {
    try {
      this.logger.log(`Creating batch outreach jobs for ${businessIds.length} businesses`);

      const jobs = businessIds.map((businessId) => ({
        name: JobType.GENERATE_MESSAGE,
        data: {
          businessId,
          userId,
        },
        opts: {
          priority: priority || JobPriority.NORMAL,
          timeout: 30000,
        },
      }));

      const createdJobs = await this.queueManager.addBulk(QueueName.OUTREACH, jobs);

      this.logger.log(`Created ${createdJobs.length} outreach jobs`);
      return createdJobs;
    } catch (error) {
      this.logger.error(`Failed to create batch outreach jobs: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Schedule a delayed job.
   *
   * @param queueName - Queue to add job to
   * @param jobType - Job type
   * @param data - Job data
   * @param delayMs - Delay in milliseconds
   * @returns Created job instance
   */
  async scheduleJob(
    queueName: QueueName,
    jobType: string,
    data: any,
    delayMs: number,
  ): Promise<any> {
    try {
      this.logger.log(`Scheduling job ${jobType} in queue ${queueName} with delay ${delayMs}ms`);

      const job = await this.queueManager.addJob(queueName, jobType, data, {
        delay: delayMs,
      });

      this.logger.log(`Scheduled job ${job.id}`);
      return job;
    } catch (error) {
      this.logger.error(`Failed to schedule job: ${error.message}`, error.stack);
      throw error;
    }
  }
}
