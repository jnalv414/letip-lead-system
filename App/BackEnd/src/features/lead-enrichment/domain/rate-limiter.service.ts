import { Injectable, Logger } from '@nestjs/common';

interface RateLimitConfig {
  maxCalls: number;
  periodMs: number;
}

interface CallRecord {
  count: number;
  resetAt: Date;
}

@Injectable()
export class RateLimiterService {
  private readonly logger = new Logger(RateLimiterService.name);
  private readonly limits: Map<string, RateLimitConfig> = new Map([
    ['hunter.io', { maxCalls: 500, periodMs: 30 * 24 * 60 * 60 * 1000 }], // 500/month
    ['abstractapi', { maxCalls: 3000, periodMs: 30 * 24 * 60 * 60 * 1000 }], // 3000/month
  ]);
  private readonly callRecords: Map<string, CallRecord> = new Map();

  /**
   * Check if service has remaining API calls within rate limit.
   *
   * @param service - Service name ('hunter.io', 'abstractapi')
   * @returns True if can make call, false if limit exceeded
   */
  canMakeCall(service: string): boolean {
    const config = this.limits.get(service);
    if (!config) return true; // No limit configured

    const record = this.getOrCreateRecord(service, config);

    // Check if reset period passed
    if (new Date() > record.resetAt) {
      record.count = 0;
      record.resetAt = new Date(Date.now() + config.periodMs);
    }

    const canCall = record.count < config.maxCalls;

    if (!canCall) {
      this.logger.warn(`Rate limit exceeded for ${service}: ${record.count}/${config.maxCalls}`);
    } else if (record.count > config.maxCalls * 0.8) {
      this.logger.warn(`Rate limit warning for ${service}: ${record.count}/${config.maxCalls} (80%)`);
    }

    return canCall;
  }

  /**
   * Record an API call for rate limiting.
   *
   * @param service - Service name
   */
  recordCall(service: string): void {
    const config = this.limits.get(service);
    if (!config) return;

    const record = this.getOrCreateRecord(service, config);
    record.count++;

    this.logger.debug(`Recorded call for ${service}: ${record.count}/${config.maxCalls}`);
  }

  /**
   * Get remaining calls for a service.
   *
   * @param service - Service name
   * @returns Number of remaining calls
   */
  getRemainingCalls(service: string): number {
    const config = this.limits.get(service);
    if (!config) return Infinity;

    const record = this.getOrCreateRecord(service, config);

    if (new Date() > record.resetAt) {
      return config.maxCalls;
    }

    return Math.max(0, config.maxCalls - record.count);
  }

  private getOrCreateRecord(service: string, config: RateLimitConfig): CallRecord {
    if (!this.callRecords.has(service)) {
      this.callRecords.set(service, {
        count: 0,
        resetAt: new Date(Date.now() + config.periodMs),
      });
    }
    return this.callRecords.get(service)!;
  }
}