import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
  Type,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { RedisService } from './redis.service';

/**
 * HTTP cache interceptor for automatic response caching.
 *
 * Implements cache-aside pattern:
 * 1. Check cache before controller execution
 * 2. Return cached response if found (cache hit)
 * 3. Execute controller if not found (cache miss)
 * 4. Cache the response with configured TTL
 *
 * Usage:
 * Apply to specific routes or controllers with @UseInterceptors()
 *
 * @example
 * // Cache stats endpoint for 30 seconds
 * @Get('stats')
 * @UseInterceptors(new CacheInterceptor(30))
 * async getStats() {
 *   return this.businessesService.getStats();
 * }
 *
 * @example
 * // Cache entire controller with 60 second TTL
 * @Controller('api/businesses')
 * @UseInterceptors(new CacheInterceptor(60))
 * export class BusinessesController {
 *   // All routes cached for 60 seconds
 * }
 */
@Injectable()
export class CacheInterceptor implements NestInterceptor {
  protected readonly logger = new Logger(CacheInterceptor.name);

  constructor(
    protected readonly redisService: RedisService,
    protected readonly ttl: number = 60, // Default 60 seconds
  ) {}

  /**
   * Intercepts HTTP requests to provide caching layer.
   *
   * Cache key format: `cache:${method}:${url}:${queryHash}`
   * - Includes HTTP method (GET, POST, etc.)
   * - Includes full URL path
   * - Includes query parameter hash for uniqueness
   *
   * @param context - Execution context with request info
   * @param next - Next handler in chain
   * @returns Observable with cached or computed response
   *
   * @performance
   * - Cache hit: <10ms (returns immediately)
   * - Cache miss: Normal request time + <10ms cache write
   */
  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const { method, url, query } = request;

    // Only cache GET requests
    if (method !== 'GET') {
      return next.handle();
    }

    // Generate cache key based on URL and query params
    const cacheKey = this.generateCacheKey(method, url, query);

    // Try to get cached response
    try {
      const cachedResponse = await this.redisService.get<any>(cacheKey);

      if (cachedResponse) {
        this.logger.debug(`Cache hit: ${cacheKey}`);
        return of(cachedResponse);
      }

      this.logger.debug(`Cache miss: ${cacheKey}`);
    } catch (error) {
      this.logger.warn(`Error reading cache for ${cacheKey}`, error.message);
      // Continue to controller on cache errors
    }

    // Cache miss - execute controller and cache response
    return next.handle().pipe(
      tap(async (response) => {
        try {
          await this.redisService.set(cacheKey, response, this.ttl);
          this.logger.debug(`Cached response for ${this.ttl}s: ${cacheKey}`);
        } catch (error) {
          this.logger.warn(`Error caching response for ${cacheKey}`, error.message);
          // Don't throw - response still succeeds
        }
      }),
    );
  }

  /**
   * Generates a unique cache key for a request.
   *
   * Format: `cache:{method}:{path}:{queryHash}`
   *
   * @param method - HTTP method (GET, POST, etc.)
   * @param url - Request URL path
   * @param query - Query parameters object
   * @returns Cache key string
   *
   * @example
   * generateCacheKey('GET', '/api/businesses', { city: 'Freehold', page: 1 })
   * // Returns: 'cache:GET:/api/businesses:city=Freehold&page=1'
   */
  protected generateCacheKey(
    method: string,
    url: string,
    query: Record<string, any>,
  ): string {
    // Remove leading slash if present
    const path = url.startsWith('/') ? url.slice(1) : url;

    // Sort query params for consistent cache keys
    const sortedQuery = Object.keys(query || {})
      .sort()
      .map((key) => `${key}=${query[key]}`)
      .join('&');

    const queryPart = sortedQuery ? `:${sortedQuery}` : '';

    return `cache:${method}:${path}${queryPart}`;
  }
}

/**
 * Factory function to create cache interceptor with custom TTL.
 *
 * @param ttl - Time to live in seconds
 * @returns CacheInterceptor class
 *
 * @example
 * @UseInterceptors(CacheInterceptorFactory(30))
 * @Get('stats')
 * async getStats() {
 *   return this.businessesService.getStats();
 * }
 */
@Injectable()
export class CacheInterceptorFactory {
  static create(ttl: number): Type<NestInterceptor> {
    class DynamicCacheInterceptor extends CacheInterceptor {
      constructor(redisService: RedisService) {
        super(redisService, ttl);
      }
    }
    return DynamicCacheInterceptor;
  }
}
