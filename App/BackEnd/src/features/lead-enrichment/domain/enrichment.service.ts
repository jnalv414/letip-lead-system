import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../../prisma/prisma.service';
import { HunterApiClientService } from './hunter-api-client.service';
import { AbstractApiClientService } from './abstract-api-client.service';
import { RateLimiterService } from './rate-limiter.service';
import { EnrichmentLogRepository } from '../data/repositories/enrichment-log.repository';

@Injectable()
export class EnrichmentService {
  private readonly logger = new Logger(EnrichmentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly hunterApiClient: HunterApiClientService,
    private readonly abstractApiClient: AbstractApiClientService,
    private readonly rateLimiter: RateLimiterService,
    private readonly enrichmentLogRepository: EnrichmentLogRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Enrich a single business with contact and company data.
   *
   * Makes sequential calls to:
   * 1. AbstractAPI - Company firmographics (industry, employees, year founded)
   * 2. Hunter.io - Email discovery and verification
   *
   * @param businessId - Database ID of business to enrich
   * @returns Object with enrichment results
   *
   * @side-effects
   * - Updates business.enrichment_status to 'enriched' or 'failed'
   * - Creates contact records for discovered emails
   * - Logs all attempts to enrichment_log table
   * - Emits 'business:enriched' WebSocket event
   *
   * @throws {NotFoundException} If business ID doesn't exist
   * @throws {BadRequestException} If business has no website
   */
  async enrichBusiness(businessId: number) {
    this.logger.log(`Starting enrichment for business ID: ${businessId}`);

    // Fetch business
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      throw new NotFoundException(`Business with ID ${businessId} not found`);
    }

    const results: {
      businessId: number;
      businessName: string;
      abstract: any;
      hunter: any;
      errors: Array<{ service: string; error: string }>;
    } = {
      businessId,
      businessName: business.name,
      abstract: null,
      hunter: null,
      errors: [],
    };

    if (!business.website) {
      results.errors.push({ service: 'abstract', error: 'No website available' });
      results.errors.push({ service: 'hunter', error: 'No website available' });

      await this.prisma.business.update({
        where: { id: businessId },
        data: { enrichment_status: 'failed' },
      });

      return results;
    }

    const domain = this.extractDomain(business.website);

    // AbstractAPI enrichment
    if (this.abstractApiClient.isConfigured() && this.rateLimiter.canMakeCall('abstractapi')) {
      try {
        const companyData = await this.abstractApiClient.enrichCompany(domain);
        this.rateLimiter.recordCall('abstractapi');

        // Update business with company data
        const updateData: any = {};
        if (companyData.name) updateData.name = companyData.name;
        if (companyData.industry) updateData.industry = companyData.industry;
        if (companyData.employees_count) updateData.employee_count = parseInt(companyData.employees_count);
        if (companyData.year_founded) updateData.year_founded = companyData.year_founded;

        if (Object.keys(updateData).length > 0) {
          await this.prisma.business.update({
            where: { id: businessId },
            data: updateData,
          });
        }

        await this.enrichmentLogRepository.create({
          business_id: businessId,
          service: 'abstract',
          status: 'success',
          request_data: JSON.stringify({ domain }),
          response_data: JSON.stringify(companyData),
        });

        results.abstract = companyData;
        this.logger.log(`AbstractAPI enrichment successful for ${business.name}`);
      } catch (error) {
        this.logger.error(`AbstractAPI failed for ${businessId}:`, error.message);
        results.errors.push({ service: 'abstract', error: error.message });

        await this.enrichmentLogRepository.create({
          business_id: businessId,
          service: 'abstract',
          status: 'failed',
          request_data: JSON.stringify({ domain }),
          error_message: error.message,
        });
      }
    } else if (!this.abstractApiClient.isConfigured()) {
      results.errors.push({ service: 'abstract', error: 'API not configured' });
    } else {
      results.errors.push({ service: 'abstract', error: 'Rate limit exceeded' });
    }

    // Hunter.io enrichment
    if (this.hunterApiClient.isConfigured() && this.rateLimiter.canMakeCall('hunter.io')) {
      try {
        const emailData = await this.hunterApiClient.searchDomain(domain, 5);
        this.rateLimiter.recordCall('hunter.io');

        // Create contacts
        let contactsCreated = 0;
        if (emailData.emails && emailData.emails.length > 0) {
          for (const email of emailData.emails) {
            try {
              // Check if contact already exists
              const existingContact = await this.prisma.contact.findFirst({
                where: {
                  business_id: businessId,
                  email: email.value,
                },
              });

              if (!existingContact) {
                await this.prisma.contact.create({
                  data: {
                    business_id: businessId,
                    name: email.first_name && email.last_name
                      ? `${email.first_name} ${email.last_name}`.trim()
                      : null,
                    email: email.value,
                    email_verified: email.verification?.status === 'valid',
                    title: email.position || null,
                    is_primary: email.type === 'personal' || email.seniority === 'senior',
                  },
                });
                contactsCreated++;
              }
            } catch (error) {
              this.logger.error(`Error saving contact ${email.value}:`, error.message);
            }
          }
        }

        await this.enrichmentLogRepository.create({
          business_id: businessId,
          service: 'hunter',
          status: 'success',
          request_data: JSON.stringify({ domain }),
          response_data: JSON.stringify({
            emailsFound: emailData.emails.length,
            contactsCreated,
          }),
        });

        results.hunter = emailData;
        this.logger.log(`Hunter.io enrichment successful for ${business.name}. Found ${emailData.emails?.length || 0} contacts`);
      } catch (error) {
        this.logger.error(`Hunter.io failed for ${businessId}:`, error.message);
        results.errors.push({ service: 'hunter', error: error.message });

        await this.enrichmentLogRepository.create({
          business_id: businessId,
          service: 'hunter',
          status: 'failed',
          request_data: JSON.stringify({ domain }),
          error_message: error.message,
        });
      }
    } else if (!this.hunterApiClient.isConfigured()) {
      results.errors.push({ service: 'hunter', error: 'API not configured' });
    } else {
      results.errors.push({ service: 'hunter', error: 'Rate limit exceeded' });
    }

    // Update enrichment status
    const status = results.errors.length === 0 ? 'enriched' :
                   (results.abstract || results.hunter) ? 'enriched' : 'failed';

    await this.prisma.business.update({
      where: { id: businessId },
      data: {
        enrichment_status: status,
        updated_at: new Date(),
      },
    });

    // Emit event
    this.eventEmitter.emit('business:enriched', {
      timestamp: new Date().toISOString(),
      type: 'business:enriched',
      data: {
        id: businessId,
        name: business.name,
        enrichment_status: status,
        abstract: !!results.abstract,
        hunter: !!results.hunter,
        errors: results.errors.length,
      },
    });

    this.logger.log(`Enrichment completed for business ID: ${businessId} with status: ${status}`);

    return results;
  }

  /**
   * Enrich multiple businesses in batch.
   *
   * @param count - Number of businesses to enrich (default 10, max 50)
   * @returns Batch enrichment results
   */
  async enrichBatch(count: number = 10) {
    this.logger.log(`Starting batch enrichment for ${count} businesses`);

    const pendingBusinesses = await this.prisma.business.findMany({
      where: {
        enrichment_status: 'pending',
        website: { not: null },
      },
      take: count,
      orderBy: { created_at: 'asc' },
    });

    if (pendingBusinesses.length === 0) {
      return {
        message: 'No pending businesses to enrich',
        enriched: 0,
        failed: 0,
        total: 0,
        results: [],
      };
    }

    const results = [];
    let enrichedCount = 0;
    let failedCount = 0;

    for (const business of pendingBusinesses) {
      try {
        const result = await this.enrichBusiness(business.id);
        results.push(result);

        if (result.errors.length === 0 || result.abstract || result.hunter) {
          enrichedCount++;
        } else {
          failedCount++;
        }

        // Add delay to respect rate limits
        await this.delay(1000);
      } catch (error) {
        this.logger.error(`Failed to enrich business ${business.id}:`, error);
        failedCount++;
        results.push({
          businessId: business.id,
          businessName: business.name,
          error: error.message,
        });
      }
    }

    this.logger.log(`Batch enrichment completed. Enriched: ${enrichedCount}, Failed: ${failedCount}`);

    return {
      message: `Batch enrichment completed`,
      enriched: enrichedCount,
      failed: failedCount,
      total: pendingBusinesses.length,
      results,
    };
  }

  /**
   * Extract domain from URL.
   */
  private extractDomain(url: string): string {
    if (!url) return '';

    try {
      // Remove protocol
      let domain = url.replace(/^https?:\/\//, '');
      // Remove www.
      domain = domain.replace(/^www\./, '');
      // Remove path
      domain = domain.split('/')[0];
      return domain;
    } catch {
      return url;
    }
  }

  /**
   * Delay utility for rate limiting.
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}