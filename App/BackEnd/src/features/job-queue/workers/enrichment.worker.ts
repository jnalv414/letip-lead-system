import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { BaseWorker } from './base-worker';
import { JobHistoryRepository } from '../data/repositories/job-history.repository';
import { EventsGateway as WebsocketGateway } from '../../../websocket/websocket.gateway';
import { JobType } from '../config/queue.config';

// Placeholder interface until Agent 3's EnrichmentService is available
interface EnrichmentService {
  enrichBusiness(businessId: number): Promise<{
    hunter: boolean;
    abstract: boolean;
    contactsFound: number;
    errors: string[];
    contacts?: Array<{
      firstName: string;
      lastName: string;
      email: string;
      position?: string;
      confidence?: number;
    }>;
    companyData?: {
      industry?: string;
      size?: string;
      revenue?: string;
      founded?: number;
      description?: string;
    };
  }>;
}

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
  errors: string[];
  enrichedData?: {
    contacts?: Array<{
      firstName: string;
      lastName: string;
      email: string;
      position?: string;
    }>;
    companyInfo?: {
      industry?: string;
      size?: string;
      revenue?: string;
    };
  };
}

@Injectable()
export class EnrichmentWorker extends BaseWorker {
  protected readonly logger = new Logger(EnrichmentWorker.name);
  private enrichmentService: EnrichmentService | null = null;

  constructor(
    jobHistoryRepository: JobHistoryRepository,
    websocketGateway: WebsocketGateway,
    // Note: This will be injected when Agent 3's module is available
    // private readonly enrichmentService: EnrichmentService,
  ) {
    super('enrichment-jobs', jobHistoryRepository, websocketGateway);
  }

  protected async processJob(job: Job<EnrichmentJobData>): Promise<EnrichmentJobResult> {
    const { businessId, type, enrichmentSources = ['all'] } = job.data;

    this.logger.log(`Starting enrichment job ${job.id} for business ${businessId} (${type})`);

    try {
      // Update progress: Starting
      await this.updateProgress(job, 10, 'Fetching business data');

      // Simulate fetching business data
      await this.delay(500);

      const shouldEnrichHunter = enrichmentSources.includes('all') || enrichmentSources.includes('hunter');
      const shouldEnrichAbstract = enrichmentSources.includes('all') || enrichmentSources.includes('abstract');

      let hunterSuccess = false;
      let abstractSuccess = false;
      let contactsFound = 0;
      const errors: string[] = [];
      const enrichedData: EnrichmentJobResult['enrichedData'] = {};

      if (shouldEnrichAbstract) {
        // Update progress: AbstractAPI
        await this.updateProgress(job, 30, 'Querying AbstractAPI for company data');

        try {
          // Simulate AbstractAPI call
          await this.delay(1000);

          // Mock response for now
          abstractSuccess = true;
          enrichedData.companyInfo = {
            industry: 'Technology',
            size: '51-200',
            revenue: '$10M-$50M',
          };

          this.logger.debug(`AbstractAPI enrichment successful for business ${businessId}`);
        } catch (error) {
          errors.push(`AbstractAPI error: ${error.message}`);
          this.logger.error(`AbstractAPI failed for business ${businessId}: ${error.message}`);
        }
      }

      if (shouldEnrichHunter) {
        // Update progress: Hunter.io
        await this.updateProgress(job, 60, 'Querying Hunter.io for contacts');

        try {
          // Simulate Hunter.io call
          await this.delay(1500);

          // Mock response for now
          hunterSuccess = true;
          contactsFound = 3;
          enrichedData.contacts = [
            {
              firstName: 'John',
              lastName: 'Doe',
              email: 'john.doe@example.com',
              position: 'CEO',
            },
            {
              firstName: 'Jane',
              lastName: 'Smith',
              email: 'jane.smith@example.com',
              position: 'CTO',
            },
            {
              firstName: 'Bob',
              lastName: 'Johnson',
              email: 'bob.johnson@example.com',
              position: 'Sales Director',
            },
          ];

          this.logger.debug(`Hunter.io enrichment found ${contactsFound} contacts for business ${businessId}`);
        } catch (error) {
          errors.push(`Hunter.io error: ${error.message}`);
          this.logger.error(`Hunter.io failed for business ${businessId}: ${error.message}`);
        }
      }

      // If EnrichmentService from Agent 3 is available, use it instead
      if (this.enrichmentService) {
        const result = await this.enrichmentService.enrichBusiness(businessId);
        hunterSuccess = result.hunter;
        abstractSuccess = result.abstract;
        contactsFound = result.contactsFound || 0;
        errors.push(...(result.errors || []));

        if (result.contacts) {
          enrichedData.contacts = result.contacts.map(c => ({
            firstName: c.firstName,
            lastName: c.lastName,
            email: c.email,
            position: c.position,
          }));
        }

        if (result.companyData) {
          enrichedData.companyInfo = {
            industry: result.companyData.industry,
            size: result.companyData.size,
            revenue: result.companyData.revenue,
          };
        }
      }

      // Update progress: Saving enrichment data
      await this.updateProgress(job, 90, 'Saving enrichment data');
      await this.delay(500);

      // Update progress: Complete
      await this.updateProgress(job, 100, 'Enrichment complete');

      const result: EnrichmentJobResult = {
        businessId,
        hunterSuccess,
        abstractSuccess,
        contactsFound,
        errors,
        enrichedData,
      };

      this.logger.log(
        `Enrichment job ${job.id} completed for business ${businessId}: ` +
        `${contactsFound} contacts found, Hunter: ${hunterSuccess}, Abstract: ${abstractSuccess}`
      );

      return result;
    } catch (error) {
      this.logger.error(`Enrichment job ${job.id} failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Helper method to simulate async delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Override to handle cleanup on worker shutdown
   */
  async close(): Promise<void> {
    this.logger.log('Closing enrichment worker...');
    await super.close();
  }
}