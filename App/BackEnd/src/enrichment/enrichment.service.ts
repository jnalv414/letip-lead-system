
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '../config/config.service';
import axios from 'axios';

@Injectable()
export class EnrichmentService {
  private readonly logger = new Logger(EnrichmentService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async enrichBusiness(businessId: number) {
    this.logger.log(`Starting enrichment for business ID: ${businessId}`);

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

    // Enrich with AbstractAPI
    if (business.website) {
      try {
        results.abstract = await this.enrichWithAbstractAPI(business);
      } catch (error) {
        this.logger.error(`AbstractAPI enrichment failed for ${business.name}:`, error.message);
        results.errors.push({ service: 'abstract', error: error.message });
      }
    } else {
      results.errors.push({ service: 'abstract', error: 'No website available' });
    }

    // Enrich with Hunter.io
    if (business.website) {
      try {
        results.hunter = await this.enrichWithHunter(business);
      } catch (error) {
        this.logger.error(`Hunter.io enrichment failed for ${business.name}:`, error.message);
        results.errors.push({ service: 'hunter', error: error.message });
      }
    } else {
      results.errors.push({ service: 'hunter', error: 'No website available' });
    }

    // Update enrichment status
    const status = results.errors.length === 0 ? 'enriched' : 
                   (results.abstract || results.hunter) ? 'enriched' : 'failed';

    await this.prisma.business.update({
      where: { id: businessId },
      data: { enrichment_status: status },
    });

    this.logger.log(`Enrichment completed for business ID: ${businessId} with status: ${status}`);

    return results;
  }

  async enrichBatch(count: number = 10) {
    this.logger.log(`Starting batch enrichment for ${count} businesses`);

    const pendingBusinesses = await this.prisma.business.findMany({
      where: { enrichment_status: 'pending' },
      take: count,
      orderBy: { created_at: 'asc' },
    });

    if (pendingBusinesses.length === 0) {
      return {
        message: 'No pending businesses to enrich',
        enriched: 0,
        failed: 0,
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

  private async enrichWithAbstractAPI(business: any) {
    const apiKey = this.configService.getAbstractApiKey();
    if (!apiKey) {
      throw new Error('AbstractAPI key not configured');
    }

    const domain = this.extractDomain(business.website);
    const url = `https://companyenrichment.abstractapi.com/v1/?api_key=${apiKey}&domain=${domain}`;

    try {
      const response = await axios.get(url, { timeout: 10000 });
      const data = response.data;

      // Log enrichment attempt
      await this.prisma.enrichment_log.create({
        data: {
          business_id: business.id,
          service: 'abstract',
          status: 'success',
          request_data: JSON.stringify({ domain }),
          response_data: JSON.stringify(data),
        },
      });

      // Update business with enriched data
      const updateData: any = {};
      if (data.name) updateData.name = data.name;
      if (data.industry) updateData.industry = data.industry;
      if (data.employees_count) updateData.employee_count = parseInt(data.employees_count);
      if (data.year_founded) updateData.year_founded = parseInt(data.year_founded);

      if (Object.keys(updateData).length > 0) {
        await this.prisma.business.update({
          where: { id: business.id },
          data: updateData,
        });
      }

      this.logger.log(`AbstractAPI enrichment successful for ${business.name}`);
      return data;
    } catch (error) {
      await this.prisma.enrichment_log.create({
        data: {
          business_id: business.id,
          service: 'abstract',
          status: 'failed',
          request_data: JSON.stringify({ domain }),
          error_message: error.message,
        },
      });
      throw error;
    }
  }

  private async enrichWithHunter(business: any) {
    const apiKey = this.configService.getHunterApiKey();
    if (!apiKey) {
      throw new Error('Hunter.io API key not configured');
    }

    const domain = this.extractDomain(business.website);
    const url = `https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${apiKey}&limit=5`;

    try {
      const response = await axios.get(url, { timeout: 10000 });
      const data = response.data.data;

      // Log enrichment attempt
      await this.prisma.enrichment_log.create({
        data: {
          business_id: business.id,
          service: 'hunter',
          status: 'success',
          request_data: JSON.stringify({ domain }),
          response_data: JSON.stringify(data),
        },
      });

      // Save contacts
      if (data.emails && data.emails.length > 0) {
        for (const email of data.emails) {
          try {
            // Check if contact already exists
            const existingContact = await this.prisma.contact.findFirst({
              where: {
                business_id: business.id,
                email: email.value,
              },
            });

            if (!existingContact) {
              await this.prisma.contact.create({
                data: {
                  business_id: business.id,
                  name: `${email.first_name || ''} ${email.last_name || ''}`.trim() || null,
                  email: email.value,
                  email_verified: email.verification?.status === 'valid',
                  title: email.position || null,
                  is_primary: email.type === 'personal' || email.seniority === 'senior',
                },
              });
            }
          } catch (error) {
            this.logger.error(`Error saving contact ${email.value}:`, error.message);
          }
        }
      }

      this.logger.log(`Hunter.io enrichment successful for ${business.name}. Found ${data.emails?.length || 0} contacts`);
      return data;
    } catch (error) {
      await this.prisma.enrichment_log.create({
        data: {
          business_id: business.id,
          service: 'hunter',
          status: 'failed',
          request_data: JSON.stringify({ domain }),
          error_message: error.message,
        },
      });
      throw error;
    }
  }

  private extractDomain(website: string): string {
    if (!website) return '';
    
    try {
      // Remove protocol
      let domain = website.replace(/^https?:\/\//, '');
      // Remove www.
      domain = domain.replace(/^www\./, '');
      // Remove path
      domain = domain.split('/')[0];
      return domain;
    } catch {
      return website;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
