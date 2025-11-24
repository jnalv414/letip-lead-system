/**
 * Cache key generation utilities for consistent cache key naming.
 *
 * Naming convention:
 * - Resource-based: `{resource}:{id}` (e.g., 'business:123')
 * - List-based: `{resource}:list:{filters}` (e.g., 'businesses:list:city=Freehold')
 * - Stats-based: `stats:{type}` (e.g., 'stats:current')
 *
 * Benefits:
 * - Consistent naming across codebase
 * - Easy pattern-based invalidation
 * - Type-safe key generation
 */

/**
 * Generate cache key for business stats.
 *
 * @returns 'stats:current'
 */
export function getStatsCacheKey(): string {
  return 'stats:current';
}

/**
 * Generate cache key for a single business.
 *
 * @param businessId - Business ID
 * @returns 'business:{id}'
 *
 * @example
 * getBusinessCacheKey(123) // 'business:123'
 */
export function getBusinessCacheKey(businessId: number): string {
  return `business:${businessId}`;
}

/**
 * Generate cache key for business list with filters.
 *
 * Normalizes query parameters to ensure consistent cache keys:
 * - Sorts keys alphabetically
 * - Filters out undefined/null values
 * - Converts to lowercase
 *
 * @param query - Query parameters object
 * @returns 'businesses:list:{normalized-query}'
 *
 * @example
 * getBusinessListCacheKey({ city: 'Freehold', page: 1 })
 * // 'businesses:list:city=freehold&page=1'
 *
 * @example
 * getBusinessListCacheKey({})
 * // 'businesses:list:all'
 */
export function getBusinessListCacheKey(query: Record<string, any>): string {
  const normalizedQuery = Object.keys(query || {})
    .filter((key) => query[key] !== undefined && query[key] !== null)
    .sort()
    .map((key) => `${key}=${String(query[key]).toLowerCase()}`)
    .join('&');

  const queryPart = normalizedQuery || 'all';
  return `businesses:list:${queryPart}`;
}

/**
 * Generate cache key for a single contact.
 *
 * @param contactId - Contact ID
 * @returns 'contact:{id}'
 */
export function getContactCacheKey(contactId: number): string {
  return `contact:${contactId}`;
}

/**
 * Generate cache key for enrichment status.
 *
 * @param businessId - Business ID
 * @returns 'enrichment:status:{id}'
 */
export function getEnrichmentStatusCacheKey(businessId: number): string {
  return `enrichment:status:${businessId}`;
}

/**
 * Cache key patterns for invalidation.
 *
 * Use with RedisService.invalidatePattern()
 */
export const CachePatterns = {
  /** All business-related caches */
  ALL_BUSINESSES: 'business:*',

  /** All business list caches (paginated/filtered) */
  BUSINESS_LISTS: 'businesses:list:*',

  /** All stats caches */
  ALL_STATS: 'stats:*',

  /** All contact caches */
  ALL_CONTACTS: 'contact:*',

  /** All enrichment caches */
  ALL_ENRICHMENT: 'enrichment:*',

  /** Everything (use with caution) */
  ALL: '*',
} as const;

/**
 * Cache TTL (Time To Live) constants in seconds.
 */
export const CacheTTL = {
  /** Stats cache - 30 seconds (frequently updated) */
  STATS: 30,

  /** Business list - 5 minutes (less volatile) */
  BUSINESS_LIST: 300,

  /** Single business - 10 minutes (rarely changes) */
  BUSINESS: 600,

  /** Contact - 10 minutes */
  CONTACT: 600,

  /** Enrichment status - 5 minutes */
  ENRICHMENT: 300,

  /** Short-lived cache - 10 seconds */
  SHORT: 10,

  /** Long-lived cache - 1 hour */
  LONG: 3600,
} as const;
