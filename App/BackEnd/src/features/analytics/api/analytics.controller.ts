import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { AnalyticsService } from '../domain/analytics.service';
import { LocationStatsDto } from './dto/location-stats.dto';
import { SourceStatsDto } from './dto/source-stats.dto';
import { PipelineStatsDto } from './dto/pipeline-stats.dto';
import { GrowthStatsDto, GrowthQueryDto } from './dto/growth-stats.dto';

/**
 * Analytics API controller.
 *
 * Provides REST endpoints for business analytics:
 * - GET /api/analytics/locations - Businesses by city
 * - GET /api/analytics/sources - Businesses by lead source
 * - GET /api/analytics/pipeline - Businesses by enrichment stage
 * - GET /api/analytics/growth - Time series growth data
 *
 * All endpoints return aggregated statistics for dashboard visualization.
 */
@ApiTags('Analytics')
@Controller('api/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * Get businesses grouped by city.
   */
  @Get('locations')
  @ApiOperation({
    summary: 'Get business distribution by location',
    description:
      'Returns businesses grouped by city with counts and percentages. Limited to top 10 cities.',
  })
  @ApiResponse({
    status: 200,
    description: 'Location statistics retrieved successfully',
    type: LocationStatsDto,
  })
  async getLocationStats(): Promise<LocationStatsDto> {
    return this.analyticsService.getLocationStats();
  }

  /**
   * Get businesses grouped by source.
   */
  @Get('sources')
  @ApiOperation({
    summary: 'Get business distribution by lead source',
    description:
      'Returns businesses grouped by source (e.g., google_maps, manual) with counts and percentages.',
  })
  @ApiResponse({
    status: 200,
    description: 'Source statistics retrieved successfully',
    type: SourceStatsDto,
  })
  async getSourceStats(): Promise<SourceStatsDto> {
    return this.analyticsService.getSourceStats();
  }

  /**
   * Get businesses grouped by enrichment pipeline stage.
   */
  @Get('pipeline')
  @ApiOperation({
    summary: 'Get business distribution by enrichment pipeline stage',
    description:
      'Returns businesses grouped by enrichment status mapped to pipeline stages: New Leads (pending), Qualified (enriched), Needs Review (failed).',
  })
  @ApiResponse({
    status: 200,
    description: 'Pipeline statistics retrieved successfully',
    type: PipelineStatsDto,
  })
  async getPipelineStats(): Promise<PipelineStatsDto> {
    return this.analyticsService.getPipelineStats();
  }

  /**
   * Get time series growth data.
   */
  @Get('growth')
  @ApiOperation({
    summary: 'Get business growth over time',
    description:
      'Returns time series data showing business acquisition and enrichment rate over the specified period.',
  })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: ['week', 'month', 'quarter'],
    description: 'Time period for growth data',
    example: 'month',
  })
  @ApiResponse({
    status: 200,
    description: 'Growth statistics retrieved successfully',
    type: GrowthStatsDto,
  })
  async getGrowthStats(@Query() query: GrowthQueryDto): Promise<GrowthStatsDto> {
    return this.analyticsService.getGrowthStats(query.period);
  }
}
