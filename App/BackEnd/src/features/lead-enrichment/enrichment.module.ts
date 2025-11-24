import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { EnrichmentController } from './api/enrichment.controller';
import { EnrichmentService } from './domain/enrichment.service';
import { HunterApiClientService } from './domain/hunter-api-client.service';
import { AbstractApiClientService } from './domain/abstract-api-client.service';
import { RateLimiterService } from './domain/rate-limiter.service';
import { EnrichmentLogRepository } from './data/repositories/enrichment-log.repository';
import { PrismaModule } from '../../prisma/prisma.module';
import { ConfigModule } from '../../config/config.module';

@Module({
  imports: [PrismaModule, ConfigModule, EventEmitterModule],
  controllers: [EnrichmentController],
  providers: [
    EnrichmentService,
    HunterApiClientService,
    AbstractApiClientService,
    RateLimiterService,
    EnrichmentLogRepository,
  ],
  exports: [EnrichmentService],
})
export class LeadEnrichmentModule {}