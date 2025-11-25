import { Module } from '@nestjs/common';
import { AnalyticsController } from './api/analytics.controller';
import { AnalyticsService } from './domain/analytics.service';
import { AnalyticsRepository } from './data/analytics.repository';
import { PrismaModule } from '../../prisma/prisma.module';

/**
 * Analytics feature module.
 *
 * Vertical slice architecture:
 * - api/ - Controllers and DTOs (HTTP interface)
 * - domain/ - Services and business logic
 * - data/ - Repository pattern (database access)
 *
 * Dependencies:
 * - PrismaModule: Database access via repository
 *
 * Endpoints:
 * - GET /api/analytics/locations - Business distribution by city
 * - GET /api/analytics/sources - Business distribution by lead source
 * - GET /api/analytics/pipeline - Business distribution by enrichment stage
 * - GET /api/analytics/growth - Time series growth data
 *
 * Note: This module does not emit WebSocket events as analytics
 * data is read-only and does not trigger real-time updates.
 */
@Module({
  imports: [PrismaModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, AnalyticsRepository],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
