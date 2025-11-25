import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

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
}
