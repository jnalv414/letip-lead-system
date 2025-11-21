
import { Module } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { BusinessesModule } from '../businesses/businesses.module';
import { ScraperModule } from '../scraper/scraper.module';
import { EnrichmentModule } from '../enrichment/enrichment.module';
import { OutreachModule } from '../outreach/outreach.module';

@Module({
  imports: [BusinessesModule, ScraperModule, EnrichmentModule, OutreachModule],
  providers: [TelegramService],
  exports: [TelegramService],
})
export class TelegramModule {}
