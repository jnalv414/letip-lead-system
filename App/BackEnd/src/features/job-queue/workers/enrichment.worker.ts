import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { BaseWorker } from './base-worker';
import { JobHistoryRepository } from '../data/repositories/job-history.repository';
import { EventsGateway as WebsocketGateway } from '../../../websocket/websocket.gateway';
import { EnrichmentService } from '../../lead-enrichment/domain/enrichment.service';
import { JobType } from '../config/queue.config';

interface EnrichmentJobData {
  businessId: number;
  userId: string;
  type: 'single' | 'batch';
  jobType: JobType;
  enrichmentSources?: Array<'hunter' | 'abstract' | 'all'>;
}

interface EnrichmentJobResult {
  businessId: number;
  hunterSuccess: boolean;
  abstractSuccess: boolean;
  contactsFound: number;
  errors: Array<{ service: string; error: string }>;
}

@Injectable()
export class EnrichmentWorker extends BaseWorker {
  protected readonly logger = new Logger(EnrichmentWorker.name);

  constructor(
    jobHistoryRepository: JobHistoryRepository,
    websocketGateway: WebsocketGateway,
    private readonly enrichmentService: EnrichmentService,
  ) {
    super('enrichment-jobs', jobHistoryRepository, websocketGateway);
  }

  protected async processJob(job: Job<EnrichmentJobData>): Promise<EnrichmentJobResult> {
    const { businessId, type } = job.data;

    this.logger.log(`Starting enrichment job ${job.id} for business ${businessId} (${type})`);

    try {
      // Update progress: Starting
      await this.updateProgress(job, 10, 'Fetching business data');

      // Update progress: Running enrichment
      await this.updateProgress(job, 30, 'Running enrichment via Hunter.io and AbstractAPI');

      // Delegate to the real EnrichmentService which handles
      // AbstractAPI + Hunter.io calls, saves contacts, logs results, and updates DB
      const result = await this.enrichmentService.enrichBusiness(businessId);

      const hunterSuccess = !!result.hunter;
      const abstractSuccess = !!result.abstract;
      const contactsFound = result.hunter?.emails?.length || 0;

      // Update progress: Complete
      await this.updateProgress(job, 100, 'Enrichment complete');

      const jobResult: EnrichmentJobResult = {
        businessId,
        hunterSuccess,
        abstractSuccess,
        contactsFound,
        errors: result.errors,
      };

      this.logger.log(
        `Enrichment job ${job.id} completed for business ${businessId}: ` +
        `${contactsFound} contacts found, Hunter: ${hunterSuccess}, Abstract: ${abstractSuccess}`
      );

      return jobResult;
    } catch (error) {
      this.logger.error(`Enrichment job ${job.id} failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Override to handle cleanup on worker shutdown
   */
  async close(): Promise<void> {
    this.logger.log('Closing enrichment worker...');
    await super.close();
  }
}
