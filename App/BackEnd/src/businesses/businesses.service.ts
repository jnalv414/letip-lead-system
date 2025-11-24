
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { QueryBusinessesDto } from './dto/query-businesses.dto';
import { EventsGateway } from '../websocket/websocket.gateway';
import { RedisService } from '../caching/redis.service';
import {
  getStatsCacheKey,
  getBusinessCacheKey,
  getBusinessListCacheKey,
  CachePatterns,
  CacheTTL,
} from '../caching/cache-keys.helper';

@Injectable()
export class BusinessesService {
  private readonly logger = new Logger(BusinessesService.name);

  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
    private redisService: RedisService,
  ) {}

  async create(createBusinessDto: CreateBusinessDto) {
    try {
      const business = await this.prisma.business.create({
        data: createBusinessDto,
      });
      this.logger.log(`Created business: ${business.name} (ID: ${business.id})`);

      // Invalidate caches
      await this.invalidateCaches();

      // Emit WebSocket event
      this.eventsGateway.emitBusinessCreated(business);

      // Emit updated stats
      const stats = await this.getStats();
      this.eventsGateway.emitStatsUpdated(stats);

      return business;
    } catch (error) {
      this.logger.error('Error creating business:', error);
      throw error;
    }
  }

  async findAll(query: QueryBusinessesDto) {
    const { city, industry, enrichment_status } = query;
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    // Try cache first
    const cacheKey = getBusinessListCacheKey(query);
    const cached = await this.redisService.get(cacheKey);
    if (cached) {
      this.logger.debug(`Business list cache hit: ${cacheKey}`);
      return cached;
    }

    const where: any = {};
    if (city) where.city = city;
    if (industry) where.industry = industry;
    if (enrichment_status) where.enrichment_status = enrichment_status;

    try {
      const [businesses, total] = await Promise.all([
        this.prisma.business.findMany({
          where,
          skip,
          take: limit,
          include: {
            contacts: true,
          },
          orderBy: { created_at: 'desc' },
        }),
        this.prisma.business.count({ where }),
      ]);

      const result = {
        data: businesses,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };

      // Cache for 5 minutes
      await this.redisService.set(cacheKey, result, CacheTTL.BUSINESS_LIST);
      this.logger.debug(`Business list cached: ${cacheKey}`);

      return result;
    } catch (error) {
      this.logger.error('Error fetching businesses:', error);
      throw error;
    }
  }

  async findOne(id: number) {
    // Try cache first
    const cacheKey = getBusinessCacheKey(id);
    const cached = await this.redisService.get(cacheKey);
    if (cached) {
      this.logger.debug(`Business cache hit: ${cacheKey}`);
      return cached;
    }

    try {
      const business = await this.prisma.business.findUnique({
        where: { id },
        include: {
          contacts: true,
          enrichment_logs: {
            orderBy: { created_at: 'desc' },
            take: 10,
          },
          outreach_messages: {
            orderBy: { generated_at: 'desc' },
            take: 5,
          },
        },
      });

      if (!business) {
        throw new NotFoundException(`Business with ID ${id} not found`);
      }

      // Cache for 10 minutes
      await this.redisService.set(cacheKey, business, CacheTTL.BUSINESS);
      this.logger.debug(`Business cached: ${cacheKey}`);

      return business;
    } catch (error) {
      this.logger.error(`Error fetching business ${id}:`, error);
      throw error;
    }
  }

  async remove(id: number) {
    try {
      const business = await this.prisma.business.delete({
        where: { id },
      });
      this.logger.log(`Deleted business: ${business.name} (ID: ${id})`);

      // Invalidate caches
      await this.invalidateCaches(id);

      return { message: 'Business deleted successfully' };
    } catch (error) {
      this.logger.error(`Error deleting business ${id}:`, error);
      throw new NotFoundException(`Business with ID ${id} not found`);
    }
  }

  async getStats() {
    // Try cache first
    const cacheKey = getStatsCacheKey();
    const cached = await this.redisService.get(cacheKey);
    if (cached) {
      this.logger.debug(`Stats cache hit: ${cacheKey}`);
      return cached;
    }

    try {
      const [
        total,
        enriched,
        pending,
        totalContacts,
        messagesSent,
        messagesPending,
      ] = await Promise.all([
        this.prisma.business.count(),
        this.prisma.business.count({ where: { enrichment_status: 'enriched' } }),
        this.prisma.business.count({ where: { enrichment_status: 'pending' } }),
        this.prisma.contact.count(),
        this.prisma.outreach_message.count({ where: { status: 'sent' } }),
        this.prisma.outreach_message.count({ where: { status: 'draft' } }),
      ]);

      const stats = {
        totalBusinesses: total,
        enrichedBusinesses: enriched,
        pendingEnrichment: pending,
        totalContacts: totalContacts,
        messagesSent: messagesSent,
        messagesPending: messagesPending,
      };

      // Cache for 30 seconds
      await this.redisService.set(cacheKey, stats, CacheTTL.STATS);
      this.logger.debug(`Stats cached: ${cacheKey}`);

      return stats;
    } catch (error) {
      this.logger.error('Error fetching stats:', error);
      throw error;
    }
  }

  /**
   * Invalidate all business-related caches.
   *
   * Called when:
   * - Business created
   * - Business updated
   * - Business deleted
   * - Business enriched
   *
   * @param businessId - Optional specific business ID to invalidate
   *
   * @side-effects Clears Redis cache keys
   */
  private async invalidateCaches(businessId?: number): Promise<void> {
    try {
      const promises: Promise<any>[] = [
        // Always invalidate stats
        this.redisService.del(getStatsCacheKey()),

        // Always invalidate all business list caches
        this.redisService.invalidatePattern(CachePatterns.BUSINESS_LISTS),
      ];

      // If specific business ID provided, invalidate that cache
      if (businessId) {
        promises.push(this.redisService.del(getBusinessCacheKey(businessId)));
      }

      await Promise.all(promises);

      this.logger.debug(
        `Cache invalidated${businessId ? ` for business ${businessId}` : ''}`,
      );
    } catch (error) {
      this.logger.warn('Error invalidating caches', error.message);
      // Don't throw - cache invalidation failures shouldn't break the app
    }
  }
}
