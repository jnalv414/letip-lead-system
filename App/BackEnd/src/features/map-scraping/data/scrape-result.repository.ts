import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ScrapeResultRepository {
  private readonly logger = new Logger(ScrapeResultRepository.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Check if a business already exists with the same name and address
   */
  async findDuplicate(name: string, address: string | null) {
    return this.prisma.business.findFirst({
      where: {
        name,
        address: address || undefined,
      },
    });
  }

  /**
   * Create a new business record from scraped data
   */
  async createBusiness(data: {
    name: string;
    address?: string;
    city?: string;
    state?: string;
    phone?: string;
    website?: string;
    email?: string;
    google_maps_url?: string;
    google_place_id?: string;
    latitude?: number;
    longitude?: number;
    business_type?: string;
    rating?: number;
    review_count?: number;
    raw_data?: string;
  }) {
    // Prepare the data with proper typing
    const createData: Prisma.businessCreateInput = {
      name: data.name,
      address: data.address,
      city: data.city,
      state: data.state || 'NJ',
      phone: data.phone,
      website: data.website,
      google_maps_url: data.google_maps_url,
      latitude: data.latitude,
      longitude: data.longitude,
      industry: data.business_type,
      enrichment_status: 'pending',
    };

    const business = await this.prisma.business.create({
      data: createData,
      include: {
        contacts: true,
        enrichment_logs: {
          take: 1,
          orderBy: { created_at: 'desc' },
        },
      },
    });

    this.logger.debug(`Created business: ${business.id} - ${business.name}`);
    return business;
  }

  /**
   * Batch create businesses for better performance
   */
  async createManyBusinesses(businesses: Array<{
    name: string;
    address?: string;
    city?: string;
    state?: string;
    phone?: string;
    website?: string;
    google_maps_url?: string;
    latitude?: number;
    longitude?: number;
    business_type?: string;
  }>) {
    const data: Prisma.businessCreateManyInput[] = businesses.map(b => ({
      name: b.name,
      address: b.address,
      city: b.city,
      state: b.state || 'NJ',
      phone: b.phone,
      website: b.website,
      google_maps_url: b.google_maps_url,
      latitude: b.latitude,
      longitude: b.longitude,
      industry: b.business_type,
      enrichment_status: 'pending',
    }));

    const result = await this.prisma.business.createMany({
      data,
      skipDuplicates: true,
    });

    this.logger.log(`Batch created ${result.count} businesses`);
    return result;
  }

  /**
   * Get businesses by scraping run (would require adding run_id to schema)
   * For now, we'll get recent businesses
   */
  async getRecentBusinesses(limit: number = 10) {
    return this.prisma.business.findMany({
      take: limit,
      orderBy: { created_at: 'desc' },
      include: {
        _count: {
          select: {
            contacts: true,
            enrichment_logs: true,
          },
        },
      },
    });
  }

  /**
   * Get scraping statistics
   */
  async getScrapingStats() {
    const [total, enriched, pending, failed] = await Promise.all([
      this.prisma.business.count(),
      this.prisma.business.count({ where: { enrichment_status: 'enriched' } }),
      this.prisma.business.count({ where: { enrichment_status: 'pending' } }),
      this.prisma.business.count({ where: { enrichment_status: 'failed' } }),
    ]);

    return {
      total,
      enriched,
      pending,
      failed,
      enrichment_rate: total > 0 ? (enriched / total) * 100 : 0,
    };
  }
}