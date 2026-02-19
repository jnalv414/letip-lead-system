
import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    // Retry DB connection up to 5 times with exponential backoff.
    // This handles Render cold-start timing where the managed Postgres
    // instance may not yet be accepting connections.
    const maxRetries = 5;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.$connect();
        this.logger.log('Connected to database');
        return;
      } catch (error) {
        this.logger.warn(
          `Database connection attempt ${attempt}/${maxRetries} failed: ${error.message}`,
        );
        if (attempt === maxRetries) {
          this.logger.error(
            'All database connection attempts failed. The app will continue but DB queries will fail.',
          );
          // Do not throw — allow the app to start so it can be inspected.
          // Queries will fail gracefully at the HTTP handler level.
          return;
        }
        const delayMs = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Disconnected from database');
  }
}
