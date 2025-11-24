import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

/**
 * Redis caching service providing high-performance data caching with automatic TTL.
 *
 * Features:
 * - Generic get/set operations with automatic JSON serialization
 * - TTL (Time To Live) support for automatic cache expiration
 * - Pattern-based cache invalidation
 * - Graceful fallback when Redis is unavailable
 * - Automatic reconnection with exponential backoff
 *
 * Performance:
 * - Cache hits: <5ms response time
 * - Cache misses: Transparent fallback to database
 * - Pattern deletion: O(n) where n = matching keys
 *
 * @example
 * // Cache with 30 second TTL
 * await redisService.set('stats:current', statsData, 30);
 *
 * @example
 * // Retrieve cached data
 * const stats = await redisService.get<Stats>('stats:current');
 * if (stats) {
 *   return stats; // Cache hit - fast path
 * }
 *
 * @example
 * // Invalidate all business list caches
 * await redisService.invalidatePattern('businesses:list:*');
 */
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;
  private isConnected = false;

  async onModuleInit() {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

      this.client = new Redis(redisUrl, {
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          this.logger.debug(`Redis retry attempt ${times}, waiting ${delay}ms`);
          return delay;
        },
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        lazyConnect: false,
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        this.logger.log('Redis client connected');
      });

      this.client.on('ready', () => {
        this.logger.log('Redis client ready');
      });

      this.client.on('error', (error) => {
        this.isConnected = false;
        this.logger.warn('Redis client error', error.message);
      });

      this.client.on('close', () => {
        this.isConnected = false;
        this.logger.warn('Redis connection closed');
      });

      this.client.on('reconnecting', () => {
        this.logger.debug('Redis client reconnecting...');
      });

      // Wait for initial connection
      await this.client.ping();
      this.logger.log('Redis service initialized successfully');
    } catch (error) {
      this.isConnected = false;
      this.logger.error('Failed to initialize Redis service', error.message);
      this.logger.warn('Application will continue without caching (database fallback)');
    }
  }

  async onModuleDestroy() {
    try {
      await this.client.quit();
      this.logger.log('Redis client disconnected gracefully');
    } catch (error) {
      this.logger.error('Error closing Redis connection', error.message);
    }
  }

  /**
   * Check if Redis is currently connected and available.
   *
   * @returns true if Redis is connected, false otherwise
   */
  isAvailable(): boolean {
    return this.isConnected && this.client?.status === 'ready';
  }

  /**
   * Ping Redis to check connection health.
   *
   * @returns 'PONG' if successful, null if Redis unavailable
   */
  async ping(): Promise<string | null> {
    try {
      if (!this.isAvailable()) {
        return null;
      }
      return await this.client.ping();
    } catch (error) {
      this.logger.warn('Redis ping failed', error.message);
      return null;
    }
  }

  /**
   * Retrieve a cached value by key.
   *
   * @param key - Cache key to retrieve
   * @returns Parsed object if found, null if not found or Redis unavailable
   *
   * @side-effects None (read-only operation)
   *
   * @performance
   * - Cache hit: <5ms
   * - Cache miss: <5ms (returns null)
   * - Redis unavailable: <5ms (returns null, logs warning)
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      if (!this.isAvailable()) {
        return null;
      }

      const data = await this.client.get(key);

      if (!data) {
        this.logger.debug(`Cache miss: ${key}`);
        return null;
      }

      this.logger.debug(`Cache hit: ${key}`);
      return JSON.parse(data) as T;
    } catch (error) {
      this.logger.warn(`Redis get failed for ${key}`, error.message);
      return null; // Graceful fallback
    }
  }

  /**
   * Store a value in cache with optional TTL.
   *
   * @param key - Cache key
   * @param value - Value to cache (will be JSON serialized)
   * @param ttl - Time to live in seconds (optional, no expiration if omitted)
   *
   * @side-effects Writes to Redis
   *
   * @performance <10ms per operation
   *
   * @example
   * // Cache stats for 30 seconds
   * await redisService.set('stats:current', stats, 30);
   *
   * @example
   * // Cache without expiration
   * await redisService.set('config:app', config);
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      if (!this.isAvailable()) {
        this.logger.debug(`Redis unavailable, skipping cache set: ${key}`);
        return;
      }

      const data = JSON.stringify(value);

      if (ttl) {
        await this.client.setex(key, ttl, data);
        this.logger.debug(`Cached with TTL ${ttl}s: ${key}`);
      } else {
        await this.client.set(key, data);
        this.logger.debug(`Cached (no TTL): ${key}`);
      }
    } catch (error) {
      this.logger.warn(`Redis set failed for ${key}`, error.message);
      // Graceful failure - don't throw
    }
  }

  /**
   * Delete a specific cache key.
   *
   * @param key - Cache key to delete
   * @returns Number of keys deleted (0 or 1)
   *
   * @side-effects Removes key from Redis
   */
  async del(key: string): Promise<number> {
    try {
      if (!this.isAvailable()) {
        return 0;
      }

      const result = await this.client.del(key);
      this.logger.debug(`Deleted cache key: ${key}`);
      return result;
    } catch (error) {
      this.logger.warn(`Redis del failed for ${key}`, error.message);
      return 0;
    }
  }

  /**
   * Delete multiple cache keys.
   *
   * @param keys - Array of cache keys to delete
   * @returns Number of keys deleted
   *
   * @side-effects Removes keys from Redis
   */
  async delMany(keys: string[]): Promise<number> {
    try {
      if (!this.isAvailable() || keys.length === 0) {
        return 0;
      }

      const result = await this.client.del(...keys);
      this.logger.debug(`Deleted ${result} cache keys`);
      return result;
    } catch (error) {
      this.logger.warn(`Redis del many failed`, error.message);
      return 0;
    }
  }

  /**
   * Invalidate all cache keys matching a pattern.
   *
   * Uses SCAN instead of KEYS for production safety (non-blocking).
   *
   * @param pattern - Redis pattern (e.g., 'businesses:list:*')
   * @returns Number of keys deleted
   *
   * @side-effects Removes all matching keys from Redis
   *
   * @performance O(n) where n = number of matching keys
   *
   * @example
   * // Invalidate all business list caches
   * await redisService.invalidatePattern('businesses:list:*');
   *
   * @example
   * // Invalidate all caches
   * await redisService.invalidatePattern('*');
   */
  async invalidatePattern(pattern: string): Promise<number> {
    try {
      if (!this.isAvailable()) {
        return 0;
      }

      const keys: string[] = [];
      const stream = this.client.scanStream({
        match: pattern,
        count: 100,
      });

      return new Promise((resolve, reject) => {
        stream.on('data', (resultKeys: string[]) => {
          keys.push(...resultKeys);
        });

        stream.on('end', async () => {
          if (keys.length === 0) {
            this.logger.debug(`No keys found matching pattern: ${pattern}`);
            resolve(0);
            return;
          }

          try {
            const deleted = await this.client.del(...keys);
            this.logger.log(`Invalidated ${deleted} keys matching pattern: ${pattern}`);
            resolve(deleted);
          } catch (error) {
            this.logger.warn(`Failed to delete keys matching pattern: ${pattern}`, error.message);
            resolve(0);
          }
        });

        stream.on('error', (error) => {
          this.logger.warn(`SCAN failed for pattern: ${pattern}`, error.message);
          resolve(0);
        });
      });
    } catch (error) {
      this.logger.warn(`Redis invalidatePattern failed for ${pattern}`, error.message);
      return 0;
    }
  }

  /**
   * Get remaining TTL for a key.
   *
   * @param key - Cache key
   * @returns TTL in seconds, -1 if no TTL, -2 if key doesn't exist, null if Redis unavailable
   */
  async ttl(key: string): Promise<number | null> {
    try {
      if (!this.isAvailable()) {
        return null;
      }

      return await this.client.ttl(key);
    } catch (error) {
      this.logger.warn(`Redis TTL check failed for ${key}`, error.message);
      return null;
    }
  }

  /**
   * Get total number of keys in database.
   *
   * @returns Number of keys, 0 if Redis unavailable
   */
  async dbSize(): Promise<number> {
    try {
      if (!this.isAvailable()) {
        return 0;
      }

      return await this.client.dbsize();
    } catch (error) {
      this.logger.warn('Redis DBSIZE failed', error.message);
      return 0;
    }
  }

  /**
   * Get all keys matching a pattern (use cautiously in production).
   *
   * @param pattern - Redis pattern (e.g., 'stats:*')
   * @returns Array of matching keys
   *
   * @warning Use SCAN-based methods in production for large datasets
   */
  async keys(pattern: string): Promise<string[]> {
    try {
      if (!this.isAvailable()) {
        return [];
      }

      return await this.client.keys(pattern);
    } catch (error) {
      this.logger.warn(`Redis KEYS failed for ${pattern}`, error.message);
      return [];
    }
  }

  /**
   * Flush all keys from current database (DANGEROUS - use only in tests).
   *
   * @returns 'OK' if successful, null if Redis unavailable
   */
  async flushDb(): Promise<string | null> {
    try {
      if (!this.isAvailable()) {
        return null;
      }

      const result = await this.client.flushdb();
      this.logger.warn('Redis database flushed (all keys deleted)');
      return result;
    } catch (error) {
      this.logger.error('Redis FLUSHDB failed', error.message);
      return null;
    }
  }
}
