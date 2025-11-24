import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScraperController } from './api/scraper.controller';
import { ScraperService } from './domain/scraper.service';
import { ApifyScraper } from './domain/apify-scraper';
import { ScrapeResultRepository } from './data/scrape-result.repository';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: ':',
      newListener: false,
      removeListener: false,
      maxListeners: 10,
      verboseMemoryLeak: false,
      ignoreErrors: false,
    }),
  ],
  controllers: [ScraperController],
  providers: [
    ScraperService,
    ApifyScraper,
    ScrapeResultRepository,
  ],
  exports: [ScraperService],
})
export class MapScrapingModule {}