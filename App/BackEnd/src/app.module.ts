import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { existsSync } from 'fs';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';
import { PrismaModule } from './prisma/prisma.module';
import { CachingModule } from './caching/caching.module';
import { BusinessManagementModule } from './features/business-management';
import { MapScrapingModule } from './features/map-scraping';
import { EnrichmentModule } from './enrichment/enrichment.module';
import { OutreachCampaignsModule } from './features/outreach-campaigns';
import { JobQueueModule } from './features/job-queue';
import { WebsocketModule } from './websocket/websocket.module';

// Determine the correct path for FrontEnd files
function getDashboardPath(): string {
  // Try multiple possible paths for development and production
  const possiblePaths = [
    join(__dirname, '..', '..', 'FrontEnd', 'out'), // Development: dist/../FrontEnd/out
    join(__dirname, '..', '..', '..', 'FrontEnd', 'out'), // Production: app/dist/../../FrontEnd/out
    join(process.cwd(), 'App', 'FrontEnd', 'out'), // From project root
    join(__dirname, '..', 'FrontEnd', 'out'), // One level up
  ];

  for (const path of possiblePaths) {
    if (existsSync(path)) {
      console.log(`FrontEnd path found: ${path}`);
      return path;
    }
  }

  // Fallback to default path
  const defaultPath = join(__dirname, '..', '..', 'FrontEnd', 'out');
  console.log(`FrontEnd path not found, using default: ${defaultPath}`);
  return defaultPath;
}

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: getDashboardPath(),
      serveRoot: '/dashboard',
      exclude: ['/api(.*)'],
    }),
    ConfigModule,
    PrismaModule,
    CachingModule, // Global Redis caching (DB 0)
    JobQueueModule, // BullMQ job queues (DB 1)
    BusinessManagementModule,
    MapScrapingModule,
    EnrichmentModule,
    OutreachCampaignsModule,
    WebsocketModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
