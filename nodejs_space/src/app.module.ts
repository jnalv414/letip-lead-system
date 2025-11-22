
import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { existsSync } from 'fs';
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

// Determine the correct path for dashboard files
function getDashboardPath(): string {
  // Try multiple possible paths for development and production
  const possiblePaths = [
    join(__dirname, '..', '..', 'dashboard', 'out'),           // Development: dist/../dashboard/out
    join(__dirname, '..', '..', '..', 'dashboard', 'out'),     // Production: app/dist/../../dashboard/out
    join(process.cwd(), 'dashboard', 'out'),                   // From project root
    join(__dirname, '..', 'dashboard', 'out'),                 // One level up
  ];

  for (const path of possiblePaths) {
    if (existsSync(path)) {
      console.log(`Dashboard path found: ${path}`);
      return path;
    }
  }

  // Fallback to default path
  const defaultPath = join(__dirname, '..', '..', 'dashboard', 'out');
  console.log(`Dashboard path not found, using default: ${defaultPath}`);
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
