
import { Module } from '@nestjs/common';
import { EnrichmentService } from './enrichment.service';
import { EnrichmentController } from './enrichment.controller';
import { BusinessesModule } from '../businesses/businesses.module';

@Module({
  imports: [BusinessesModule],
  controllers: [EnrichmentController],
  providers: [EnrichmentService],
  exports: [EnrichmentService],
})
export class EnrichmentModule {}
