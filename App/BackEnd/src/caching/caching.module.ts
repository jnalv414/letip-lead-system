import { Module, Global } from '@nestjs/common';
import { RedisService } from './redis.service';

/**
 * Caching module providing Redis-based caching across the application.
 *
 * Features:
 * - Redis connection management
 * - Generic key-value caching with TTL
 * - Pattern-based cache invalidation
 * - Graceful fallback when Redis unavailable
 * - Health check integration
 *
 * This module is marked as @Global() so RedisService can be injected
 * anywhere without importing CachingModule.
 *
 * Usage:
 * Import once in AppModule, then inject RedisService anywhere:
 *
 * @example
 * // In any service
 * constructor(private redisService: RedisService) {}
 *
 * async getStats() {
 *   const cached = await this.redisService.get('stats:current');
 *   if (cached) return cached;
 *
 *   const stats = await this.computeStats();
 *   await this.redisService.set('stats:current', stats, 30);
 *   return stats;
 * }
 */
@Global()
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class CachingModule {}
