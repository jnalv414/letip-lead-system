
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';
import { PrismaModule } from './prisma/prisma.module';
import { BusinessesModule } from './businesses/businesses.module';
import { ScraperModule } from './scraper/scraper.module';
import { EnrichmentModule } from './enrichment/enrichment.module';
import { OutreachModule } from './outreach/outreach.module';
import { TelegramModule } from './telegram/telegram.module';
import { WebsocketModule } from './websocket/websocket.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    BusinessesModule,
    ScraperModule,
    EnrichmentModule,
    OutreachModule,
    TelegramModule,
    WebsocketModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
