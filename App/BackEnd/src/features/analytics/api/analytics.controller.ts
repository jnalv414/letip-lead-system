import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Public } from '../../auth/decorators/public.decorator';
import { AnalyticsService } from '../domain/analytics.service';
import { LocationStatsDto } from './dto/location-stats.dto';
import { SourceStatsDto } from './dto/source-stats.dto';
import { PipelineStatsDto } from './dto/pipeline-stats.dto';
import { GrowthStatsDto, GrowthQueryDto } from './dto/growth-stats.dto';
import { DashboardOverviewDto } from './dto/dashboard-overview.dto';
import { SourceBreakdownDto } from './dto/source-breakdown.dto';
import { TimelineDto } from './dto/timeline.dto';
import { AnalyticsFilterDto } from './dto/analytics-filter.dto';
import { FilterOptionsDto } from './dto/filter-options.dto';
import { FunnelStatsDto } from './dto/funnel-stats.dto';
import { HeatmapStatsDto, HeatmapQueryDto } from './dto/heatmap-stats.dto';
import { ComparisonStatsDto, ComparisonQueryDto } from './dto/comparison-stats.dto';
import { TopPerformersDto, TopPerformersQueryDto } from './dto/top-performers.dto';
import { CostAnalysisDto, CostAnalysisQueryDto } from './dto/cost-analysis.dto';

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

  // ============================================
  // Filter Options Endpoint
  // ============================================

  /**
   * Get available filter options for frontend dropdowns.
   */
  @Public()
  @Get('filter-options')
  @ApiOperation({
    summary: 'Get available filter options',
    description:
      'Returns all unique filter values for populating frontend dropdowns: cities, industries, enrichment statuses, sources, date range boundaries, and total record count.',
  })
  @ApiResponse({
    status: 200,
    description: 'Filter options retrieved successfully',
    type: FilterOptionsDto,
  })
  async getFilterOptions(): Promise<FilterOptionsDto> {
    return this.analyticsService.getFilterOptions();
  }

  // ============================================
  // Filtered Analytics Endpoints
  // ============================================

  /**
   * Get businesses grouped by city with optional filters.
   */
  @Get('locations')
  @Roles(Role.ADMIN, Role.MEMBER, Role.VIEWER)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get business distribution by location',
    description:
      'Returns businesses grouped by city with counts and percentages. Limited to top 10 cities. Supports multi-select filtering.',
  })
  @ApiQuery({
    name: 'cities',
    required: false,
    type: [String],
    description: 'Filter by cities (multi-select)',
    example: ['Freehold', 'Manalapan'],
  })
  @ApiQuery({
    name: 'industries',
    required: false,
    type: [String],
    description: 'Filter by industries (multi-select)',
  })
  @ApiQuery({
    name: 'enrichmentStatus',
    required: false,
    type: [String],
    description: 'Filter by enrichment status',
    enum: ['pending', 'enriched', 'failed'],
  })
  @ApiQuery({
    name: 'sources',
    required: false,
    type: [String],
    description: 'Filter by sources (multi-select)',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Start date (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'End date (YYYY-MM-DD)',
  })
  @ApiResponse({
    status: 200,
    description: 'Location statistics retrieved successfully',
    type: LocationStatsDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getLocationStats(
    @Query() filters: AnalyticsFilterDto,
  ): Promise<LocationStatsDto> {
    return this.analyticsService.getFilteredLocationStats(filters);
  }

  /**
   * Get businesses grouped by source with optional filters.
   */
  @Get('sources')
  @Roles(Role.ADMIN, Role.MEMBER, Role.VIEWER)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get business distribution by lead source',
    description:
      'Returns businesses grouped by source (e.g., google_maps, manual) with counts and percentages. Supports multi-select filtering.',
  })
  @ApiQuery({
    name: 'cities',
    required: false,
    type: [String],
    description: 'Filter by cities (multi-select)',
  })
  @ApiQuery({
    name: 'industries',
    required: false,
    type: [String],
    description: 'Filter by industries (multi-select)',
  })
  @ApiQuery({
    name: 'enrichmentStatus',
    required: false,
    type: [String],
    description: 'Filter by enrichment status',
    enum: ['pending', 'enriched', 'failed'],
  })
  @ApiQuery({
    name: 'sources',
    required: false,
    type: [String],
    description: 'Filter by sources (multi-select)',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Start date (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'End date (YYYY-MM-DD)',
  })
  @ApiResponse({
    status: 200,
    description: 'Source statistics retrieved successfully',
    type: SourceStatsDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getSourceStats(
    @Query() filters: AnalyticsFilterDto,
  ): Promise<SourceStatsDto> {
    return this.analyticsService.getFilteredSourceStats(filters);
  }

  /**
   * Get businesses grouped by enrichment pipeline stage with optional filters.
   */
  @Get('pipeline')
  @Roles(Role.ADMIN, Role.MEMBER, Role.VIEWER)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get business distribution by enrichment pipeline stage',
    description:
      'Returns businesses grouped by enrichment status mapped to pipeline stages: New Leads (pending), Qualified (enriched), Needs Review (failed). Supports multi-select filtering.',
  })
  @ApiQuery({
    name: 'cities',
    required: false,
    type: [String],
    description: 'Filter by cities (multi-select)',
  })
  @ApiQuery({
    name: 'industries',
    required: false,
    type: [String],
    description: 'Filter by industries (multi-select)',
  })
  @ApiQuery({
    name: 'enrichmentStatus',
    required: false,
    type: [String],
    description: 'Filter by enrichment status',
    enum: ['pending', 'enriched', 'failed'],
  })
  @ApiQuery({
    name: 'sources',
    required: false,
    type: [String],
    description: 'Filter by sources (multi-select)',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Start date (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'End date (YYYY-MM-DD)',
  })
  @ApiResponse({
    status: 200,
    description: 'Pipeline statistics retrieved successfully',
    type: PipelineStatsDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getPipelineStats(
    @Query() filters: AnalyticsFilterDto,
  ): Promise<PipelineStatsDto> {
    return this.analyticsService.getFilteredPipelineStats(filters);
  }

  /**
   * Get time series growth data.
   */
  @Get('growth')
  @Roles(Role.ADMIN, Role.MEMBER, Role.VIEWER)
  @ApiBearerAuth()
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
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getGrowthStats(@Query() query: GrowthQueryDto): Promise<GrowthStatsDto> {
    return this.analyticsService.getGrowthStats(query.period);
  }

  // ============================================
  // Performance Dashboard Endpoints
  // ============================================

  /**
   * Get dashboard overview with 6 key metrics.
   *
   * Returns high-level performance metrics for lead generation dashboard:
   * 1. Total Searches (scraping jobs)
   * 2. Businesses Found (total leads discovered)
   * 3. Cost Per Lead (total cost / businesses)
   * 4. Enriched Leads (enrichment completed)
   * 5. Total Cost (Apify + Hunter + Abstract)
   * 6. Enrichment Rate (enriched / total * 100)
   *
   * Each metric includes sparkline (last 7 days) and percentage change.
   * Supports multi-select filtering by city, industry, enrichment status, and source.
   */
  @Public()
  @Get('dashboard')
  @Roles(Role.ADMIN, Role.MEMBER, Role.VIEWER)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get dashboard overview metrics',
    description:
      'Returns 6 key performance metrics with sparklines and percentage changes for lead generation dashboard. Defaults to last 30 days if no date range provided. Supports multi-select filtering.',
  })
  @ApiQuery({
    name: 'cities',
    required: false,
    type: [String],
    description: 'Filter by cities (multi-select)',
  })
  @ApiQuery({
    name: 'industries',
    required: false,
    type: [String],
    description: 'Filter by industries (multi-select)',
  })
  @ApiQuery({
    name: 'enrichmentStatus',
    required: false,
    type: [String],
    description: 'Filter by enrichment status',
    enum: ['pending', 'enriched', 'failed'],
  })
  @ApiQuery({
    name: 'sources',
    required: false,
    type: [String],
    description: 'Filter by sources (multi-select)',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Start date (ISO 8601)',
    example: '2025-01-01T00:00:00.000Z',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'End date (ISO 8601)',
    example: '2025-01-31T23:59:59.999Z',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard overview retrieved successfully',
    type: DashboardOverviewDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getDashboardOverview(@Query() filters: AnalyticsFilterDto): Promise<DashboardOverviewDto> {
    return this.analyticsService.getDashboardOverview(filters);
  }

  /**
   * Get performance breakdown by data source.
   *
   * Returns statistics for each platform:
   * - Google Maps: Scraping jobs, businesses found, Apify cost
   * - Hunter.io: Email searches, contacts discovered, API cost
   * - AbstractAPI: Company lookups, enriched records, API cost
   * - Manual: Manually entered businesses, $0 cost
   *
   * Supports multi-select filtering by city, industry, enrichment status, and source.
   */
  @Public()
  @Get('source-breakdown')
  @Roles(Role.ADMIN, Role.MEMBER, Role.VIEWER)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get performance breakdown by data source',
    description:
      'Returns per-source statistics showing searches, results, costs, and success rates for Google Maps, Hunter.io, AbstractAPI, and Manual entry. Defaults to last 30 days if no date range provided. Supports multi-select filtering.',
  })
  @ApiQuery({
    name: 'cities',
    required: false,
    type: [String],
    description: 'Filter by cities (multi-select)',
  })
  @ApiQuery({
    name: 'industries',
    required: false,
    type: [String],
    description: 'Filter by industries (multi-select)',
  })
  @ApiQuery({
    name: 'enrichmentStatus',
    required: false,
    type: [String],
    description: 'Filter by enrichment status',
    enum: ['pending', 'enriched', 'failed'],
  })
  @ApiQuery({
    name: 'sources',
    required: false,
    type: [String],
    description: 'Filter by sources (multi-select)',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Start date (ISO 8601)',
    example: '2025-01-01T00:00:00.000Z',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'End date (ISO 8601)',
    example: '2025-01-31T23:59:59.999Z',
  })
  @ApiResponse({
    status: 200,
    description: 'Source breakdown retrieved successfully',
    type: SourceBreakdownDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getSourceBreakdown(@Query() filters: AnalyticsFilterDto): Promise<SourceBreakdownDto> {
    return this.analyticsService.getSourceBreakdown(filters);
  }

  /**
   * Get timeline metrics for chart visualization.
   *
   * Returns daily time series data for:
   * - Searches (scraping jobs initiated)
   * - Businesses Found (leads discovered)
   * - Enriched (leads enriched successfully)
   * - Cost (total API costs: Apify + Hunter + Abstract)
   *
   * Used for AreaChart showing trends over time.
   * Supports multi-select filtering by city, industry, enrichment status, and source.
   */
  @Public()
  @Get('timeline')
  @Roles(Role.ADMIN, Role.MEMBER, Role.VIEWER)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get timeline metrics for chart visualization',
    description:
      'Returns daily time series data for searches, businesses found, enriched leads, and costs. Used for dashboard AreaChart visualization. Defaults to last 30 days if no date range provided. Supports multi-select filtering.',
  })
  @ApiQuery({
    name: 'cities',
    required: false,
    type: [String],
    description: 'Filter by cities (multi-select)',
  })
  @ApiQuery({
    name: 'industries',
    required: false,
    type: [String],
    description: 'Filter by industries (multi-select)',
  })
  @ApiQuery({
    name: 'enrichmentStatus',
    required: false,
    type: [String],
    description: 'Filter by enrichment status',
    enum: ['pending', 'enriched', 'failed'],
  })
  @ApiQuery({
    name: 'sources',
    required: false,
    type: [String],
    description: 'Filter by sources (multi-select)',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Start date (ISO 8601)',
    example: '2025-01-01T00:00:00.000Z',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'End date (ISO 8601)',
    example: '2025-01-31T23:59:59.999Z',
  })
  @ApiResponse({
    status: 200,
    description: 'Timeline metrics retrieved successfully',
    type: TimelineDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getMetricsTimeline(@Query() filters: AnalyticsFilterDto): Promise<TimelineDto> {
    return this.analyticsService.getMetricsTimeline(filters);
  }

  // ============================================
  // Advanced Analytics Endpoints (Tableau-Like)
  // ============================================

  /**
   * Get conversion funnel metrics.
   *
   * Returns funnel data showing how businesses progress through stages:
   * Scraped → Enriched → Contacted → Responded
   */
  @Get('funnel')
  @Roles(Role.ADMIN, Role.MEMBER, Role.VIEWER)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get conversion funnel metrics',
    description:
      'Returns funnel data showing conversion rates through lead lifecycle stages. Supports multi-select filtering.',
  })
  @ApiQuery({
    name: 'cities',
    required: false,
    type: [String],
    description: 'Filter by cities (multi-select)',
  })
  @ApiQuery({
    name: 'industries',
    required: false,
    type: [String],
    description: 'Filter by industries (multi-select)',
  })
  @ApiQuery({
    name: 'sources',
    required: false,
    type: [String],
    description: 'Filter by sources (multi-select)',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Start date (ISO 8601)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'End date (ISO 8601)',
  })
  @ApiResponse({
    status: 200,
    description: 'Funnel statistics retrieved successfully',
    type: FunnelStatsDto,
  })
  async getFunnelStats(@Query() filters: AnalyticsFilterDto): Promise<FunnelStatsDto> {
    return this.analyticsService.getFunnelStats(filters);
  }

  /**
   * Get activity heatmap data.
   *
   * Returns heatmap data showing when activity occurs during the week.
   */
  @Get('heatmap')
  @Roles(Role.ADMIN, Role.MEMBER, Role.VIEWER)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get activity heatmap data',
    description:
      'Returns heatmap data showing when business activities occur during the week. Useful for understanding optimal timing.',
  })
  @ApiQuery({
    name: 'activityType',
    required: false,
    enum: ['scraping_jobs', 'enrichments', 'business_created'],
    description: 'Type of activity to visualize',
  })
  @ApiQuery({
    name: 'cities',
    required: false,
    type: [String],
    description: 'Filter by cities (multi-select)',
  })
  @ApiQuery({
    name: 'industries',
    required: false,
    type: [String],
    description: 'Filter by industries (multi-select)',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Start date (ISO 8601)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'End date (ISO 8601)',
  })
  @ApiResponse({
    status: 200,
    description: 'Heatmap data retrieved successfully',
    type: HeatmapStatsDto,
  })
  async getHeatmapStats(
    @Query() filters: AnalyticsFilterDto,
    @Query() heatmapQuery: HeatmapQueryDto,
  ): Promise<HeatmapStatsDto> {
    return this.analyticsService.getHeatmapStats(filters, heatmapQuery.activityType);
  }

  /**
   * Get segment comparison data.
   *
   * Compare performance across different dimensions (city, industry, source).
   */
  @Get('comparison')
  @Roles(Role.ADMIN, Role.MEMBER, Role.VIEWER)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get segment comparison data',
    description:
      'Compare performance metrics across segments (cities, industries, or sources). Returns enrichment rates, costs, and totals for each segment.',
  })
  @ApiQuery({
    name: 'dimension',
    required: false,
    enum: ['city', 'industry', 'source'],
    description: 'Dimension to compare',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Start date (ISO 8601)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'End date (ISO 8601)',
  })
  @ApiResponse({
    status: 200,
    description: 'Comparison data retrieved successfully',
    type: ComparisonStatsDto,
  })
  async getComparisonStats(
    @Query() filters: AnalyticsFilterDto,
    @Query() comparisonQuery: ComparisonQueryDto,
  ): Promise<ComparisonStatsDto> {
    return this.analyticsService.getComparisonStats(filters, comparisonQuery.dimension);
  }

  /**
   * Get top performers by dimension.
   *
   * Returns ranked list of top performing cities, industries, or sources.
   */
  @Get('top-performers')
  @Roles(Role.ADMIN, Role.MEMBER, Role.VIEWER)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get top performers by dimension',
    description:
      'Returns ranked list of top performing segments with trends. Useful for identifying high-value areas.',
  })
  @ApiQuery({
    name: 'metric',
    required: false,
    enum: ['businesses', 'enriched', 'cost_efficiency'],
    description: 'Metric to rank by',
  })
  @ApiQuery({
    name: 'dimension',
    required: false,
    enum: ['city', 'industry', 'source'],
    description: 'Dimension to rank',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of top performers to return (1-20)',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Start date (ISO 8601)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'End date (ISO 8601)',
  })
  @ApiResponse({
    status: 200,
    description: 'Top performers retrieved successfully',
    type: TopPerformersDto,
  })
  async getTopPerformers(
    @Query() filters: AnalyticsFilterDto,
    @Query() performersQuery: TopPerformersQueryDto,
  ): Promise<TopPerformersDto> {
    return this.analyticsService.getTopPerformers(
      filters,
      performersQuery.metric,
      performersQuery.dimension,
      performersQuery.limit,
    );
  }

  /**
   * Get comprehensive cost analysis.
   *
   * Returns cost breakdown by service/operation with budget tracking.
   */
  @Get('cost-analysis')
  @Roles(Role.ADMIN, Role.MEMBER)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get comprehensive cost analysis',
    description:
      'Returns cost breakdown by service, operation, or time period with budget status and projections. Admin and Member only.',
  })
  @ApiQuery({
    name: 'groupBy',
    required: false,
    enum: ['service', 'operation', 'daily', 'weekly', 'monthly'],
    description: 'Grouping for cost breakdown',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Start date (ISO 8601)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'End date (ISO 8601)',
  })
  @ApiResponse({
    status: 200,
    description: 'Cost analysis retrieved successfully',
    type: CostAnalysisDto,
  })
  async getCostAnalysis(
    @Query() filters: AnalyticsFilterDto,
    @Query() costQuery: CostAnalysisQueryDto,
  ): Promise<CostAnalysisDto> {
    return this.analyticsService.getCostAnalysis(filters, costQuery.groupBy);
  }
}
