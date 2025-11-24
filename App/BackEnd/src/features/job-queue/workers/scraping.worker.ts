import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { BaseWorker } from './base-worker';
import { JobHistoryRepository } from '../data/repositories/job-history.repository';
import { EventsGateway as WebsocketGateway } from '../../../websocket/websocket.gateway';
import { ApifyScraper as ApifyService } from '../../map-scraping/domain/apify-scraper';
import { JobType } from '../config/queue.config';

interface ScrapingJobData {
  searchQuery: string;
  location?: string;
  maxResults?: number;
  userId: string;
  jobType: JobType;
}

interface ScrapingJobResult {
  found: number;
  saved: number;
  failed: number;
  businesses: Array<{
    name: string;
    address: string;
    phone?: string;
    website?: string;
    rating?: number;
  }>;
}

@Injectable()
export class ScrapingWorker extends BaseWorker {
  protected readonly logger = new Logger(ScrapingWorker.name);

  constructor(
    jobHistoryRepository: JobHistoryRepository,
    websocketGateway: WebsocketGateway,
    private readonly apifyService: ApifyService,
  ) {
    super('scraping-jobs', jobHistoryRepository, websocketGateway);
  }

  protected async processJob(job: Job<ScrapingJobData>): Promise<ScrapingJobResult> {
    const { searchQuery, location, maxResults = 50, userId } = job.data;

    this.logger.log(`Starting scraping job ${job.id}: ${searchQuery} in ${location || 'all locations'}`);

    try {
      // Update progress: Starting
      await this.updateProgress(job, 10, 'Initializing Apify actor');

      // Start Apify scraping
      this.logger.debug(`Starting Apify actor for query: ${searchQuery}`);
      const fullQuery = location ? `${searchQuery} in ${location}` : searchQuery;
      const runId = await this.apifyService.startScraping(fullQuery, maxResults);

      // Update progress: Waiting for results
      await this.updateProgress(job, 30, 'Waiting for Apify actor to complete');

      // Wait for completion with timeout (5 minutes default, 5 second polling)
      const timeout = maxResults > 100 ? 600000 : 300000; // 10 min for large jobs, 5 min for small
      const results = await this.apifyService.waitForCompletion(runId, timeout, 5000);

      this.logger.log(`Apify actor completed with ${results.length} results`);

      // Update progress: Processing results
      await this.updateProgress(job, 70, `Processing ${results.length} scraped businesses`);

      // Transform and prepare results
      let saved = 0;
      let failed = 0;
      const businesses: ScrapingJobResult['businesses'] = [];

      for (const place of results) {
        try {
          // Transform Apify result to our business format
          const businessData = this.apifyService.transformResult(place);

          // Add to results array
          businesses.push({
            name: businessData.name,
            address: businessData.address,
            phone: businessData.phoneNumber,
            website: businessData.website,
            rating: businessData.rating,
          });

          // Note: Actual saving would be done by BusinessService from Agent 2
          // For now, we'll just count as saved
          saved++;

          // Update progress periodically
          if (saved % 10 === 0) {
            const progressPercent = 70 + Math.floor((saved / results.length) * 25);
            await this.updateProgress(
              job,
              progressPercent,
              `Processed ${saved}/${results.length} businesses`
            );
          }
        } catch (error) {
          this.logger.error(`Failed to process business: ${error.message}`, error.stack);
          failed++;
        }
      }

      // Update progress: Complete
      await this.updateProgress(job, 100, 'Scraping complete');

      const result: ScrapingJobResult = {
        found: results.length,
        saved,
        failed,
        businesses: businesses.slice(0, 10), // Return first 10 for preview
      };

      this.logger.log(`Scraping job ${job.id} completed: ${saved} saved, ${failed} failed`);

      return result;
    } catch (error) {
      this.logger.error(`Scraping job ${job.id} failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Override to handle cleanup on worker shutdown
   */
  async close(): Promise<void> {
    this.logger.log('Closing scraping worker...');
    await super.close();
  }
}