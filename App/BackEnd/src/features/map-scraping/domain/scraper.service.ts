import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ApifyScraper } from './apify-scraper';
import { ScrapeResultRepository } from '../data/scrape-result.repository';
import { ScrapeRequestDto } from '../api/dto/scrape-request.dto';
import { ScrapeStatusDto } from '../api/dto/scrape-status.dto';

export interface ScrapeResult {
  success: boolean;
  runId?: string;
  found: number;
  saved: number;
  skipped: number;
  errors?: Array<{ business: string; error: string }>;
}

@Injectable()
export class ScraperService {
  private readonly logger = new Logger(ScraperService.name);
  private activeRuns: Map<string, { startTime: Date; location: string }> = new Map();

  constructor(
    private apifyScraper: ApifyScraper,
    private scrapeResultRepository: ScrapeResultRepository,
    private eventEmitter: EventEmitter2,
  ) {}

  /**
   * Start a new scraping job using Apify
   * Emits 'scraping:started' event via EventEmitter instead of direct WebSocket
   */
  async startScraping(scrapeRequest: ScrapeRequestDto): Promise<ScrapeResult> {
    const { location, radius = 1, business_type, max_results = 50 } = scrapeRequest;

    this.logger.log(`Starting Google Maps scrape for ${location}`);
    this.logger.log(`Parameters: radius=${radius}mi, business_type=${business_type || 'all'}, max_results=${max_results}`);

    try {
      // Build search query
      const searchQuery = business_type
        ? `${business_type} within ${radius} miles of ${location}`
        : `businesses within ${radius} miles of ${location}`;

      // Start Apify actor run
      const runId = await this.apifyScraper.startScraping(searchQuery, max_results);

      // Track active run
      this.activeRuns.set(runId, {
        startTime: new Date(),
        location,
      });

      // Emit event instead of direct WebSocket
      this.eventEmitter.emit('scraping:started', {
        runId,
        location,
        business_type,
        max_results,
        timestamp: new Date().toISOString(),
      });

      // Process results asynchronously
      this.processScrapingResults(runId, scrapeRequest).catch(error => {
        this.logger.error(`Error processing run ${runId}:`, error);
        this.eventEmitter.emit('scraping:failed', {
          runId,
          error: error.message,
          timestamp: new Date().toISOString(),
        });
      });

      return {
        success: true,
        runId,
        found: 0,
        saved: 0,
        skipped: 0,
        errors: [],
      };
    } catch (error) {
      this.logger.error('Error during scraping:', error);
      throw error;
    }
  }

  /**
   * Get the status of a scraping job
   */
  async getScrapingStatus(runId: string): Promise<ScrapeStatusDto> {
    try {
      const { status, itemCount } = await this.apifyScraper.getRunStatus(runId);

      // Calculate progress estimate
      const runInfo = this.activeRuns.get(runId);
      let progress = 0;

      if (status === 'SUCCEEDED') {
        progress = 100;
      } else if (status === 'RUNNING' && runInfo) {
        const elapsedSeconds = (Date.now() - runInfo.startTime.getTime()) / 1000;
        progress = Math.min(90, Math.floor((elapsedSeconds / 60) * 30)); // Estimate based on time
      }

      return {
        runId,
        status,
        itemCount,
        progress,
      };
    } catch (error) {
      this.logger.error(`Error getting status for run ${runId}:`, error);
      throw error;
    }
  }

  /**
   * Process scraping results asynchronously
   * This runs in the background after starting a scrape
   */
  private async processScrapingResults(
    runId: string,
    scrapeRequest: ScrapeRequestDto
  ): Promise<void> {
    try {
      this.logger.log(`Waiting for Apify run ${runId} to complete...`);

      // Wait for completion and get results
      const results = await this.apifyScraper.waitForCompletion(runId);

      this.logger.log(`Found ${results.length} businesses from Apify`);

      // Save to database using repository pattern
      let savedCount = 0;
      let skippedCount = 0;
      const errors = [];

      for (const place of results.slice(0, scrapeRequest.max_results)) {
        try {
          const businessData = this.apifyScraper.transformResult(place);

          // Check for duplicates using repository
          const existing = await this.scrapeResultRepository.findDuplicate(
            businessData.name,
            businessData.address
          );

          if (existing) {
            skippedCount++;
            continue;
          }

          // Save using repository
          const saved = await this.scrapeResultRepository.createBusiness(businessData);

          // Emit business created event
          this.eventEmitter.emit('business:created', {
            business: saved,
            source: 'scraper',
            runId,
            timestamp: new Date().toISOString(),
          });

          savedCount++;
        } catch (error) {
          this.logger.error(`Error saving business ${place.title}:`, error.message);
          errors.push({ business: place.title, error: error.message });
        }
      }

      // Emit scraping completed event
      this.eventEmitter.emit('scraping:completed', {
        runId,
        found: results.length,
        saved: savedCount,
        skipped: skippedCount,
        errors,
        timestamp: new Date().toISOString(),
      });

      // Clean up tracking
      this.activeRuns.delete(runId);

      this.logger.log(
        `Scraping complete for run ${runId}. Saved: ${savedCount}, Skipped: ${skippedCount}`
      );
    } catch (error) {
      this.logger.error(`Failed to process results for run ${runId}:`, error);

      // Emit failure event
      this.eventEmitter.emit('scraping:failed', {
        runId,
        error: error.message,
        timestamp: new Date().toISOString(),
      });

      // Clean up tracking
      this.activeRuns.delete(runId);

      throw error;
    }
  }
}