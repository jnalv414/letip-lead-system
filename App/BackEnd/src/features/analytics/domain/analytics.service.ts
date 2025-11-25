import { Injectable, Logger } from '@nestjs/common';
import { AnalyticsRepository } from '../data/analytics.repository';
import {
  LocationStatsDto,
  LocationItemDto,
} from '../api/dto/location-stats.dto';
import { SourceStatsDto, SourceItemDto } from '../api/dto/source-stats.dto';
import {
  PipelineStatsDto,
  PipelineStageDto,
} from '../api/dto/pipeline-stats.dto';
import {
  GrowthStatsDto,
  GrowthDataPointDto,
} from '../api/dto/growth-stats.dto';

/**
 * Analytics domain service - orchestrates analytics operations.
 *
 * Responsibilities:
 * - Orchestrate repository queries
 * - Transform raw data into formatted responses
 * - Calculate percentages and aggregations
 * - Map internal status codes to user-friendly labels
 *
 * Architecture:
 * - Repository: Direct database access (raw Prisma queries)
 * - Service: Data transformation and business logic
 *
 * @example
 * // Get location breakdown
 * const stats = await analyticsService.getLocationStats();
 * // { locations: [{ city: 'Freehold', count: 42, percentage: 15.5 }, ...], total: 271 }
 */
@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  /**
   * Maps enrichment_status values to user-friendly stage names.
   */
  private readonly stageMapping: Record<string, string> = {
    pending: 'New Leads',
    enriched: 'Qualified',
    failed: 'Needs Review',
  };

  constructor(private repository: AnalyticsRepository) {}

  /**
   * Get businesses grouped by city with counts and percentages.
   *
   * @returns LocationStatsDto with top 10 cities
   *
   * @performance
   * - Uses indexed city column
   * - Limited to top 10 results
   * - Expected: ~50-100ms
   */
  async getLocationStats(): Promise<LocationStatsDto> {
    try {
      const [rawStats, total] = await Promise.all([
        this.repository.getLocationStats(),
        this.repository.getTotalWithCity(),
      ]);

      const locations: LocationItemDto[] = rawStats.map((stat) => ({
        city: stat.city || 'Unknown',
        count: stat._count.id,
        percentage: total > 0 ? Number(((stat._count.id / total) * 100).toFixed(1)) : 0,
      }));

      this.logger.log(`Location stats: ${locations.length} cities, ${total} total businesses`);

      return {
        locations,
        total,
      };
    } catch (error) {
      this.logger.error('Error fetching location stats:', error);
      throw error;
    }
  }

  /**
   * Get businesses grouped by source with counts and percentages.
   *
   * @returns SourceStatsDto with all sources
   *
   * @performance
   * - Uses indexed source column
   * - Expected: ~30-50ms
   */
  async getSourceStats(): Promise<SourceStatsDto> {
    try {
      const [rawStats, total] = await Promise.all([
        this.repository.getSourceStats(),
        this.repository.getTotalBusinesses(),
      ]);

      const sources: SourceItemDto[] = rawStats.map((stat) => ({
        source: stat.source || 'unknown',
        count: stat._count.id,
        percentage: total > 0 ? Number(((stat._count.id / total) * 100).toFixed(1)) : 0,
      }));

      this.logger.log(`Source stats: ${sources.length} sources, ${total} total businesses`);

      return {
        sources,
        total,
      };
    } catch (error) {
      this.logger.error('Error fetching source stats:', error);
      throw error;
    }
  }

  /**
   * Get businesses grouped by enrichment pipeline stage.
   *
   * Maps internal enrichment_status values to user-friendly labels:
   * - 'pending' -> 'New Leads'
   * - 'enriched' -> 'Qualified'
   * - 'failed' -> 'Needs Review'
   *
   * @returns PipelineStatsDto with stage breakdown
   *
   * @performance
   * - Uses indexed enrichment_status column
   * - Expected: ~30-50ms
   */
  async getPipelineStats(): Promise<PipelineStatsDto> {
    try {
      const [rawStats, total] = await Promise.all([
        this.repository.getPipelineStats(),
        this.repository.getTotalBusinesses(),
      ]);

      const stages: PipelineStageDto[] = rawStats.map((stat) => ({
        stage: this.stageMapping[stat.enrichment_status] || stat.enrichment_status,
        count: stat._count.id,
        percentage: total > 0 ? Number(((stat._count.id / total) * 100).toFixed(1)) : 0,
      }));

      this.logger.log(`Pipeline stats: ${stages.length} stages, ${total} total businesses`);

      return {
        stages,
        total,
      };
    } catch (error) {
      this.logger.error('Error fetching pipeline stats:', error);
      throw error;
    }
  }

  /**
   * Get time series growth data for the specified period.
   *
   * Generates data points based on period:
   * - 'week': 7 daily data points
   * - 'month': ~4 weekly data points
   * - 'quarter': ~3 monthly data points
   *
   * @param period - Time period ('week', 'month', 'quarter')
   * @returns GrowthStatsDto with time series data
   *
   * @performance
   * - Fetches all businesses in range, then aggregates in memory
   * - Expected: ~100-200ms for large datasets
   */
  async getGrowthStats(
    period: 'week' | 'month' | 'quarter' = 'month',
  ): Promise<GrowthStatsDto> {
    try {
      const businesses = await this.repository.getBusinessesInPeriod(period);

      // Group businesses by time bucket
      const buckets = this.groupByTimeBucket(businesses, period);

      // Transform to data points
      const data: GrowthDataPointDto[] = buckets.map((bucket) => ({
        period: bucket.label,
        businesses: bucket.total,
        enriched: bucket.enriched,
      }));

      // Calculate totals
      const total = businesses.length;
      const enrichedCount = businesses.filter(
        (b) => b.enrichment_status === 'enriched',
      ).length;
      const enrichmentRate =
        total > 0 ? Number(((enrichedCount / total) * 100).toFixed(1)) : 0;

      this.logger.log(
        `Growth stats (${period}): ${total} businesses, ${enrichmentRate}% enrichment rate`,
      );

      return {
        data,
        total,
        enrichmentRate,
      };
    } catch (error) {
      this.logger.error(`Error fetching growth stats (${period}):`, error);
      throw error;
    }
  }

  /**
   * Groups businesses into time buckets based on period.
   *
   * @param businesses - Array of businesses with created_at dates
   * @param period - Time period for bucket size
   * @returns Array of buckets with labels and counts
   */
  private groupByTimeBucket(
    businesses: Array<{ created_at: Date; enrichment_status: string }>,
    period: 'week' | 'month' | 'quarter',
  ): Array<{ label: string; total: number; enriched: number }> {
    const now = new Date();
    const buckets: Map<string, { total: number; enriched: number }> = new Map();

    // Determine bucket configuration
    let bucketCount: number;
    let bucketSize: number; // in milliseconds

    switch (period) {
      case 'week':
        bucketCount = 7;
        bucketSize = 24 * 60 * 60 * 1000; // 1 day
        break;
      case 'month':
        bucketCount = 4;
        bucketSize = 7 * 24 * 60 * 60 * 1000; // 1 week
        break;
      case 'quarter':
        bucketCount = 3;
        bucketSize = 30 * 24 * 60 * 60 * 1000; // ~1 month
        break;
    }

    // Initialize buckets
    for (let i = bucketCount - 1; i >= 0; i--) {
      const bucketStart = new Date(now.getTime() - (i + 1) * bucketSize);
      const label = this.formatBucketLabel(bucketStart, period);
      buckets.set(label, { total: 0, enriched: 0 });
    }

    // Assign businesses to buckets
    for (const business of businesses) {
      const businessTime = new Date(business.created_at).getTime();
      const nowTime = now.getTime();

      for (let i = bucketCount - 1; i >= 0; i--) {
        const bucketEnd = nowTime - i * bucketSize;
        const bucketStart = bucketEnd - bucketSize;

        if (businessTime >= bucketStart && businessTime < bucketEnd) {
          const label = this.formatBucketLabel(new Date(bucketStart), period);
          const bucket = buckets.get(label);
          if (bucket) {
            bucket.total++;
            if (business.enrichment_status === 'enriched') {
              bucket.enriched++;
            }
          }
          break;
        }
      }
    }

    // Convert to array
    return Array.from(buckets.entries()).map(([label, counts]) => ({
      label,
      total: counts.total,
      enriched: counts.enriched,
    }));
  }

  /**
   * Formats a date as a bucket label based on period.
   *
   * @param date - Bucket start date
   * @param period - Time period
   * @returns Formatted label string
   */
  private formatBucketLabel(
    date: Date,
    period: 'week' | 'month' | 'quarter',
  ): string {
    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'America/New_York',
    };

    switch (period) {
      case 'week':
        // Format as MM/DD
        return date.toLocaleDateString('en-US', {
          ...options,
          month: 'numeric',
          day: 'numeric',
        });
      case 'month':
        // Format as "Week of MM/DD"
        return `Week of ${date.toLocaleDateString('en-US', {
          ...options,
          month: 'numeric',
          day: 'numeric',
        })}`;
      case 'quarter':
        // Format as month name
        return date.toLocaleDateString('en-US', {
          ...options,
          month: 'long',
        });
    }
  }
}
