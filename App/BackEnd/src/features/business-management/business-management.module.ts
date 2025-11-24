import { Module } from '@nestjs/common';
import { BusinessController } from './api/business.controller';
import { BusinessService } from './domain/business.service';
import { BusinessCacheService } from './domain/business-cache.service';
import { BusinessRepository } from './data/business.repository';
import { PrismaModule } from '../../prisma/prisma.module';
import { WebsocketModule } from '../../websocket/websocket.module';
import { CachingModule } from '../../caching/caching.module';

/**
 * Business Management feature module.
 *
 * Vertical slice architecture:
 * - api/ - Controllers and DTOs (HTTP interface)
 * - domain/ - Services and business logic
 * - data/ - Repository pattern (database access)
 *
 * Dependencies:
 * - PrismaModule: Database access via repository
 * - WebsocketModule: Real-time event emission
 * - CachingModule: Redis caching for performance
 *
 * Exports:
 * - BusinessService: For use by enrichment and other features
 *
 * CRITICAL: EnrichmentModule depends on BusinessService export.
 * DO NOT remove the export or change the service name without
 * updating App/BackEnd/src/enrichment/enrichment.module.ts
 */
@Module({
  imports: [PrismaModule, WebsocketModule, CachingModule],
  controllers: [BusinessController],
  providers: [BusinessService, BusinessCacheService, BusinessRepository],
  exports: [BusinessService],
})
export class BusinessManagementModule {}
