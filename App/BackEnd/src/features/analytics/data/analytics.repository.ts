import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { AnalyticsFilterDto } from '../api/dto/analytics-filter.dto';

/**
 * Analytics data access layer following repository pattern.
 *
 * Responsibilities:
 * - All direct Prisma database operations for analytics queries
 * - Aggregation queries (groupBy, count)
 * - Time series data generation
 *
 * Does NOT:
 * - Handle caching (could be added in domain layer)
 * - Emit WebSocket events
 * - Business logic or data transformation
 */
@Injectable()
export class AnalyticsRepository {
  private readonly logger = new Logger(AnalyticsRepository.name);

  constructor(private prisma: PrismaService) {}

  // ============================================
  // Filter Helper Methods
  // ============================================

  /**
   * Build Prisma where clause from analytics filter DTO.
   *
   * Converts multi-select filter arrays to Prisma `in` clauses.
   *
   * @param filters - Analytics filter parameters
   * @returns Prisma where input for business queries
   */
  buildFilterWhereClause(
    filters: AnalyticsFilterDto,
  ): Prisma.businessWhereInput {
    const where: Prisma.businessWhereInput = {};

    if (filters.cities?.length) {
      where.city = { in: filters.cities };
    }

    if (filters.industries?.length) {
      where.industry = { in: filters.industries };
    }

    if (filters.enrichmentStatus?.length) {
      where.enrichment_status = { in: filters.enrichmentStatus };
    }

    if (filters.sources?.length) {
      where.source = { in: filters.sources };
    }

    if (filters.startDate || filters.endDate) {
      where.created_at = {
        ...(filters.startDate && { gte: new Date(filters.startDate) }),
        ...(filters.endDate && { lt: new Date(filters.endDate) }),
      };
    }

    return where;
  }

  /**
   * Get all available filter options for frontend dropdowns.
   *
   * @returns Object containing all unique filter values
   */
  async getFilterOptions(): Promise<{
    cities: string[];
    industries: string[];
    enrichmentStatuses: string[];
    sources: string[];
    dateRange: { earliest: string; latest: string };
    totalRecords: number;
  }> {
    const [cities, industries, sources, dateRange, totalRecords] =
      await Promise.all([
        // Get unique cities
        this.prisma.business
          .findMany({
            where: { city: { not: null } },
            select: { city: true },
            distinct: ['city'],
            orderBy: { city: 'asc' },
          })
          .then((results) =>
            results.map((r) => r.city).filter((c): c is string => c !== null),
          ),

        // Get unique industries
        this.prisma.business
          .findMany({
            where: { industry: { not: null } },
            select: { industry: true },
            distinct: ['industry'],
            orderBy: { industry: 'asc' },
          })
          .then((results) =>
            results
              .map((r) => r.industry)
              .filter((i): i is string => i !== null),
          ),

        // Get unique sources
        this.prisma.business
          .findMany({
            select: { source: true },
            distinct: ['source'],
            orderBy: { source: 'asc' },
          })
          .then((results) => results.map((r) => r.source)),

        // Get date range
        this.prisma.business.aggregate({
          _min: { created_at: true },
          _max: { created_at: true },
        }),

        // Get total count
        this.prisma.business.count(),
      ]);

    return {
      cities,
      industries,
      enrichmentStatuses: ['pending', 'enriched', 'failed'],
      sources,
      dateRange: {
        earliest:
          dateRange._min.created_at?.toISOString().split('T')[0] || '',
        latest: dateRange._max.created_at?.toISOString().split('T')[0] || '',
      },
      totalRecords,
    };
  }

  /**
   * Get businesses grouped by city with optional filters.
   *
   * @param filters - Optional analytics filters
   * @returns Array of city counts ordered by count descending
   */
  async getFilteredLocationStats(
    filters?: AnalyticsFilterDto,
  ): Promise<Array<{ city: string | null; _count: { id: number } }>> {
    const where: Prisma.businessWhereInput = {
      city: { not: null },
      ...(filters ? this.buildFilterWhereClause(filters) : {}),
    };

    const results = await this.prisma.business.groupBy({
      by: ['city'],
      _count: { id: true },
      where,
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });

    this.logger.debug(
      `Filtered location stats: ${results.length} cities found`,
    );
    return results;
  }

  /**
   * Get businesses grouped by source with optional filters.
   *
   * @param filters - Optional analytics filters
   * @returns Array of source counts ordered by count descending
   */
  async getFilteredSourceStats(
    filters?: AnalyticsFilterDto,
  ): Promise<Array<{ source: string; _count: { id: number } }>> {
    const where: Prisma.businessWhereInput = filters
      ? this.buildFilterWhereClause(filters)
      : {};

    const results = await this.prisma.business.groupBy({
      by: ['source'],
      _count: { id: true },
      where,
      orderBy: { _count: { id: 'desc' } },
    });

    this.logger.debug(`Filtered source stats: ${results.length} sources found`);
    return results;
  }

  /**
   * Get businesses grouped by enrichment status with optional filters.
   *
   * @param filters - Optional analytics filters
   * @returns Array of enrichment status counts
   */
  async getFilteredPipelineStats(
    filters?: AnalyticsFilterDto,
  ): Promise<Array<{ enrichment_status: string; _count: { id: number } }>> {
    const where: Prisma.businessWhereInput = filters
      ? this.buildFilterWhereClause(filters)
      : {};

    const results = await this.prisma.business.groupBy({
      by: ['enrichment_status'],
      _count: { id: true },
      where,
      orderBy: { _count: { id: 'desc' } },
    });

    this.logger.debug(
      `Filtered pipeline stats: ${results.length} stages found`,
    );
    return results;
  }

  /**
   * Get total count of businesses with optional filters.
   *
   * @param filters - Optional analytics filters
   * @returns Total count
   */
  async getFilteredTotalBusinesses(
    filters?: AnalyticsFilterDto,
  ): Promise<number> {
    const where: Prisma.businessWhereInput = filters
      ? this.buildFilterWhereClause(filters)
      : {};

    return this.prisma.business.count({ where });
  }

  /**
   * Get enriched count with optional filters.
   *
   * @param filters - Optional analytics filters
   * @returns Count of enriched businesses
   */
  async getFilteredEnrichedCount(
    filters?: AnalyticsFilterDto,
  ): Promise<number> {
    const baseWhere: Prisma.businessWhereInput = filters
      ? this.buildFilterWhereClause(filters)
      : {};

    return this.prisma.business.count({
      where: {
        ...baseWhere,
        enrichment_status: 'enriched',
      },
    });
  }

  /**
   * Get total count of businesses with city data (filtered).
   *
   * @param filters - Optional analytics filters
   * @returns Total count
   */
  async getFilteredTotalWithCity(
    filters?: AnalyticsFilterDto,
  ): Promise<number> {
    const baseWhere: Prisma.businessWhereInput = filters
      ? this.buildFilterWhereClause(filters)
      : {};

    return this.prisma.business.count({
      where: {
        ...baseWhere,
        city: { not: null },
      },
    });
  }

  // ============================================
  // Original Methods (kept for backward compatibility)
  // ============================================

  /**
   * Get businesses grouped by city.
   *
   * @returns Array of city counts ordered by count descending
   */
  async getLocationStats(): Promise<
    Array<{ city: string | null; _count: { id: number } }>
  > {
    const results = await this.prisma.business.groupBy({
      by: ['city'],
      _count: {
        id: true,
      },
      where: {
        city: {
          not: null,
        },
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 10,
    });

    this.logger.debug(`Location stats: ${results.length} cities found`);
    return results;
  }

  /**
   * Get total count of businesses with city data.
   *
   * @returns Total count
   */
  async getTotalWithCity(): Promise<number> {
    return this.prisma.business.count({
      where: {
        city: {
          not: null,
        },
      },
    });
  }

  /**
   * Get businesses grouped by source.
   *
   * @returns Array of source counts ordered by count descending
   */
  async getSourceStats(): Promise<
    Array<{ source: string; _count: { id: number } }>
  > {
    const results = await this.prisma.business.groupBy({
      by: ['source'],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
    });

    this.logger.debug(`Source stats: ${results.length} sources found`);
    return results;
  }

  /**
   * Get total count of all businesses.
   *
   * @returns Total count
   */
  async getTotalBusinesses(): Promise<number> {
    return this.prisma.business.count();
  }

  /**
   * Get businesses grouped by enrichment status.
   *
   * @returns Array of enrichment status counts
   */
  async getPipelineStats(): Promise<
    Array<{ enrichment_status: string; _count: { id: number } }>
  > {
    const results = await this.prisma.business.groupBy({
      by: ['enrichment_status'],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
    });

    this.logger.debug(`Pipeline stats: ${results.length} stages found`);
    return results;
  }

  /**
   * Get businesses created within a date range.
   *
   * @param startDate - Start of range
   * @param endDate - End of range
   * @returns Count of businesses created in range
   */
  async getBusinessCountInRange(
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    return this.prisma.business.count({
      where: {
        created_at: {
          gte: startDate,
          lt: endDate,
        },
      },
    });
  }

  /**
   * Get enriched businesses within a date range.
   *
   * @param startDate - Start of range
   * @param endDate - End of range
   * @returns Count of enriched businesses in range
   */
  async getEnrichedCountInRange(
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    return this.prisma.business.count({
      where: {
        created_at: {
          gte: startDate,
          lt: endDate,
        },
        enrichment_status: 'enriched',
      },
    });
  }

  /**
   * Get businesses created within a period.
   *
   * @param period - 'week', 'month', or 'quarter'
   * @returns Array of businesses with created_at dates
   */
  async getBusinessesInPeriod(
    period: 'week' | 'month' | 'quarter',
  ): Promise<Array<{ created_at: Date; enrichment_status: string }>> {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
    }

    return this.prisma.business.findMany({
      where: {
        created_at: {
          gte: startDate,
        },
      },
      select: {
        created_at: true,
        enrichment_status: true,
      },
      orderBy: {
        created_at: 'asc',
      },
    });
  }

  // ============================================
  // Dashboard Analytics Methods (Performance Metrics)
  // ============================================

  /**
   * Get total count of scraping jobs within date range.
   *
   * @param startDate - Start of range
   * @param endDate - End of range
   * @returns Total count of scraping jobs
   */
  async getTotalScrapingJobs(
    startDate?: Date,
    endDate?: Date,
  ): Promise<number> {
    return this.prisma.scraping_job.count({
      where: {
        created_at: {
          ...(startDate && { gte: startDate }),
          ...(endDate && { lt: endDate }),
        },
      },
    });
  }

  /**
   * Get total businesses found across all scraping jobs in date range.
   *
   * @param startDate - Start of range
   * @param endDate - End of range
   * @returns Sum of businesses_found
   */
  async getTotalBusinessesFound(
    startDate?: Date,
    endDate?: Date,
  ): Promise<number> {
    const result = await this.prisma.scraping_job.aggregate({
      _sum: {
        businesses_found: true,
      },
      where: {
        created_at: {
          ...(startDate && { gte: startDate }),
          ...(endDate && { lt: endDate }),
        },
      },
    });

    return result._sum.businesses_found || 0;
  }

  /**
   * Get total API cost across all services in date range.
   *
   * @param startDate - Start of range
   * @param endDate - End of range
   * @returns Sum of cost_usd
   */
  async getTotalApiCost(startDate?: Date, endDate?: Date): Promise<number> {
    const result = await this.prisma.api_cost_log.aggregate({
      _sum: {
        cost_usd: true,
      },
      where: {
        created_at: {
          ...(startDate && { gte: startDate }),
          ...(endDate && { lt: endDate }),
        },
      },
    });

    return result._sum.cost_usd || 0;
  }

  /**
   * Get API cost breakdown by service.
   *
   * @param startDate - Start of range
   * @param endDate - End of range
   * @returns Array of service costs
   */
  async getApiCostByService(startDate?: Date, endDate?: Date) {
    return this.prisma.api_cost_log.groupBy({
      by: ['service'],
      _sum: {
        cost_usd: true,
      },
      where: {
        created_at: {
          ...(startDate && { gte: startDate }),
          ...(endDate && { lt: endDate }),
        },
      },
    });
  }

  /**
   * Get API cost breakdown by operation type.
   *
   * @param startDate - Start of range
   * @param endDate - End of range
   * @returns Array of operation costs with counts
   */
  async getApiCostByOperation(startDate?: Date, endDate?: Date) {
    return this.prisma.api_cost_log.groupBy({
      by: ['operation_type', 'service'],
      _sum: {
        cost_usd: true,
      },
      _count: {
        id: true,
      },
      where: {
        created_at: {
          ...(startDate && { gte: startDate }),
          ...(endDate && { lt: endDate }),
        },
      },
    });
  }

  /**
   * Get scraping job statistics for date range.
   *
   * @param startDate - Start of range
   * @param endDate - End of range
   * @returns Scraping job aggregations
   */
  async getScrapingJobStats(
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    totalJobs: number;
    totalBusinessesFound: number;
    totalBusinessesSaved: number;
    totalApifyCost: number;
    completedJobs: number;
  }> {
    const [totalResult, completedCount, apifyCostResult] = await Promise.all([
      this.prisma.scraping_job.aggregate({
        _count: { id: true },
        _sum: {
          businesses_found: true,
          businesses_saved: true,
        },
        where: {
          created_at: {
            ...(startDate && { gte: startDate }),
            ...(endDate && { lt: endDate }),
          },
        },
      }),
      this.prisma.scraping_job.count({
        where: {
          status: 'completed',
          created_at: {
            ...(startDate && { gte: startDate }),
            ...(endDate && { lt: endDate }),
          },
        },
      }),
      this.prisma.scraping_job.aggregate({
        _sum: {
          apify_cost: true,
        },
        where: {
          created_at: {
            ...(startDate && { gte: startDate }),
            ...(endDate && { lt: endDate }),
          },
        },
      }),
    ]);

    return {
      totalJobs: totalResult._count.id,
      totalBusinessesFound: totalResult._sum.businesses_found || 0,
      totalBusinessesSaved: totalResult._sum.businesses_saved || 0,
      totalApifyCost: apifyCostResult._sum.apify_cost || 0,
      completedJobs: completedCount,
    };
  }

  /**
   * Get daily metrics for timeline chart.
   * Groups data by date with aggregations for searches, businesses, enrichments, and costs.
   *
   * @param startDate - Start of range
   * @param endDate - End of range
   * @returns Array of daily metrics
   */
  async getDailyMetrics(
    startDate: Date,
    endDate: Date,
  ): Promise<
    Array<{
      date: string;
      searches: number;
      businessesFound: number;
      enriched: number;
      cost: number;
    }>
  > {
    // Get scraping jobs grouped by date
    const scrapingJobs = await this.prisma.scraping_job.findMany({
      where: {
        created_at: {
          gte: startDate,
          lt: endDate,
        },
      },
      select: {
        created_at: true,
        businesses_found: true,
        apify_cost: true,
      },
    });

    // Get API costs grouped by date
    const apiCosts = await this.prisma.api_cost_log.findMany({
      where: {
        created_at: {
          gte: startDate,
          lt: endDate,
        },
      },
      select: {
        created_at: true,
        cost_usd: true,
      },
    });

    // Get enriched businesses grouped by date
    const enrichedBusinesses = await this.prisma.business.findMany({
      where: {
        updated_at: {
          gte: startDate,
          lt: endDate,
        },
        enrichment_status: 'enriched',
      },
      select: {
        updated_at: true,
      },
    });

    // Aggregate by date
    const dateMap = new Map<
      string,
      {
        searches: number;
        businessesFound: number;
        enriched: number;
        cost: number;
      }
    >();

    // Process scraping jobs
    scrapingJobs.forEach((job) => {
      const dateKey = job.created_at.toISOString().split('T')[0];
      const existing = dateMap.get(dateKey) || {
        searches: 0,
        businessesFound: 0,
        enriched: 0,
        cost: 0,
      };
      existing.searches += 1;
      existing.businessesFound += job.businesses_found;
      existing.cost += job.apify_cost;
      dateMap.set(dateKey, existing);
    });

    // Process API costs
    apiCosts.forEach((cost) => {
      const dateKey = cost.created_at.toISOString().split('T')[0];
      const existing = dateMap.get(dateKey) || {
        searches: 0,
        businessesFound: 0,
        enriched: 0,
        cost: 0,
      };
      existing.cost += cost.cost_usd;
      dateMap.set(dateKey, existing);
    });

    // Process enriched businesses
    enrichedBusinesses.forEach((business) => {
      const dateKey = business.updated_at.toISOString().split('T')[0];
      const existing = dateMap.get(dateKey) || {
        searches: 0,
        businessesFound: 0,
        enriched: 0,
        cost: 0,
      };
      existing.enriched += 1;
      dateMap.set(dateKey, existing);
    });

    // Convert to array and sort by date
    const result = Array.from(dateMap.entries())
      .map(([date, metrics]) => ({
        date,
        ...metrics,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    this.logger.debug(
      `Daily metrics: ${result.length} days from ${startDate.toISOString()} to ${endDate.toISOString()}`,
    );

    return result;
  }
}
