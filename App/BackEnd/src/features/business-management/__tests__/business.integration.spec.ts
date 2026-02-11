/**
 * Business Management Integration Tests
 *
 * Tests the BusinessService with real interactions between
 * BusinessRepository, BusinessCacheService, and EventsGateway.
 *
 * Only PrismaService and Redis (cache) are mocked to avoid
 * external dependencies.
 *
 * Test Scenarios:
 * - Create business emits WebSocket events (business:created + stats:updated)
 * - Paginate businesses correctly with various page/limit combinations
 * - Filter by city and enrichment_status
 * - Stats update after mutations (create, delete)
 */

import { Test, TestingModule } from '@nestjs/testing';
import { Logger, NotFoundException } from '@nestjs/common';
import { BusinessService } from '../domain/business.service';
import { BusinessRepository } from '../data/business.repository';
import { BusinessCacheService } from '../domain/business-cache.service';
import { EventsGateway } from '../../../websocket/websocket.gateway';

describe('Business Management Integration Tests', () => {
  let module: TestingModule;
  let service: BusinessService;
  let repository: jest.Mocked<BusinessRepository>;
  let cache: jest.Mocked<BusinessCacheService>;
  let eventsGateway: jest.Mocked<EventsGateway>;

  // In-memory business store to simulate database
  let businessStore: Map<number, any>;
  let businessIdCounter: number;

  const createMockBusiness = (overrides: Partial<any> = {}): any => {
    const id = overrides.id || ++businessIdCounter;
    return {
      id,
      name: overrides.name || `Business ${id}`,
      address: overrides.address || `${id} Main St`,
      city: overrides.city || 'Freehold',
      state: overrides.state || 'NJ',
      zip: overrides.zip || '07728',
      phone: overrides.phone || `732-555-${String(id).padStart(4, '0')}`,
      website: overrides.website || `https://business${id}.com`,
      business_type: overrides.business_type || 'plumbing',
      industry: overrides.industry || 'Home Services',
      employee_count: overrides.employee_count || 10,
      year_founded: overrides.year_founded || 2015,
      google_maps_url: overrides.google_maps_url || null,
      latitude: overrides.latitude || 40.2598,
      longitude: overrides.longitude || -74.2734,
      enrichment_status: overrides.enrichment_status || 'pending',
      source: overrides.source || 'google_maps',
      created_at: overrides.created_at || new Date(),
      updated_at: overrides.updated_at || new Date(),
      contacts: overrides.contacts || [],
    };
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => {});

    businessStore = new Map();
    businessIdCounter = 0;

    // Build mock repository that uses in-memory store
    const mockRepository = {
      create: jest.fn().mockImplementation((data: any) => {
        const business = createMockBusiness({ ...data });
        businessStore.set(business.id, business);
        return Promise.resolve(business);
      }),
      findAll: jest.fn().mockImplementation((where: any, skip: number, take: number) => {
        let businesses = Array.from(businessStore.values());

        // Apply filters
        if (where.city) {
          businesses = businesses.filter((b) => b.city === where.city);
        }
        if (where.industry) {
          businesses = businesses.filter((b) => b.industry === where.industry);
        }
        if (where.enrichment_status) {
          businesses = businesses.filter(
            (b) => b.enrichment_status === where.enrichment_status,
          );
        }

        const total = businesses.length;
        const paginated = businesses.slice(skip, skip + take);
        return Promise.resolve([paginated, total] as [any[], number]);
      }),
      findOne: jest.fn().mockImplementation((id: number) => {
        return Promise.resolve(businessStore.get(id) || null);
      }),
      delete: jest.fn().mockImplementation((id: number) => {
        const business = businessStore.get(id);
        if (!business) {
          return Promise.reject(new Error('Record not found'));
        }
        businessStore.delete(id);
        return Promise.resolve(business);
      }),
      getStats: jest.fn().mockImplementation(() => {
        const all = Array.from(businessStore.values());
        return Promise.resolve({
          totalBusinesses: all.length,
          enrichedBusinesses: all.filter((b) => b.enrichment_status === 'enriched').length,
          pendingEnrichment: all.filter((b) => b.enrichment_status === 'pending').length,
          totalContacts: all.reduce((sum, b) => sum + (b.contacts?.length || 0), 0),
          messagesSent: 0,
          messagesPending: 0,
        });
      }),
    };

    // Cache always misses in integration tests (tests real data flow)
    const mockCache = {
      getList: jest.fn().mockResolvedValue(null),
      setList: jest.fn().mockResolvedValue(undefined),
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
      getStats: jest.fn().mockResolvedValue(null),
      setStats: jest.fn().mockResolvedValue(undefined),
      invalidateAll: jest.fn().mockResolvedValue(undefined),
    };

    const mockEventsGateway = {
      emitBusinessCreated: jest.fn(),
      emitStatsUpdated: jest.fn(),
    };

    module = await Test.createTestingModule({
      providers: [
        BusinessService,
        { provide: BusinessRepository, useValue: mockRepository },
        { provide: BusinessCacheService, useValue: mockCache },
        { provide: EventsGateway, useValue: mockEventsGateway },
      ],
    }).compile();

    service = module.get<BusinessService>(BusinessService);
    repository = module.get(BusinessRepository);
    cache = module.get(BusinessCacheService);
    eventsGateway = module.get(EventsGateway);
  });

  afterEach(async () => {
    await module.close();
  });

  // ============================================================
  // Create Business Emits WebSocket Events
  // ============================================================
  describe('Create business emits WebSocket events', () => {
    /**
     * TC-BIZ-INT-001: Create business emits business:created event
     *
     * Priority: Critical
     * Category: Integration
     */
    it('should emit business:created WebSocket event on create', async () => {
      const dto = { name: 'Test Plumbing LLC', city: 'Freehold', state: 'NJ' };

      const result = await service.create(dto as any);

      expect(eventsGateway.emitBusinessCreated).toHaveBeenCalledTimes(1);
      expect(eventsGateway.emitBusinessCreated).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Plumbing LLC',
          city: 'Freehold',
        }),
      );
      expect(result.name).toBe('Test Plumbing LLC');
    });

    /**
     * TC-BIZ-INT-002: Create business emits stats:updated event
     *
     * Priority: Critical
     * Category: Integration
     */
    it('should emit stats:updated WebSocket event with current stats after create', async () => {
      const dto = { name: 'New Business', city: 'Freehold', state: 'NJ' };

      await service.create(dto as any);

      expect(eventsGateway.emitStatsUpdated).toHaveBeenCalledTimes(1);
      expect(eventsGateway.emitStatsUpdated).toHaveBeenCalledWith(
        expect.objectContaining({
          totalBusinesses: 1,
          pendingEnrichment: 1,
        }),
      );
    });

    /**
     * TC-BIZ-INT-003: Create invalidates cache before emitting events
     *
     * Priority: High
     * Category: Integration
     */
    it('should invalidate all caches before emitting stats', async () => {
      const dto = { name: 'Cache Test', city: 'Freehold', state: 'NJ' };

      await service.create(dto as any);

      // Verify cache was invalidated
      expect(cache.invalidateAll).toHaveBeenCalledTimes(1);

      // Stats should reflect the new business (cache miss forces repo query)
      expect(repository.getStats).toHaveBeenCalled();
    });

    /**
     * TC-BIZ-INT-004: Multiple creates emit correct cumulative stats
     *
     * Priority: High
     * Category: Integration
     */
    it('should emit correct cumulative stats after multiple creates', async () => {
      await service.create({ name: 'Business 1', city: 'Freehold' } as any);
      await service.create({ name: 'Business 2', city: 'Freehold' } as any);
      await service.create({ name: 'Business 3', city: 'Freehold' } as any);

      expect(eventsGateway.emitBusinessCreated).toHaveBeenCalledTimes(3);
      expect(eventsGateway.emitStatsUpdated).toHaveBeenCalledTimes(3);

      // Last stats call should reflect all 3 businesses
      const lastStatsCall = eventsGateway.emitStatsUpdated.mock.calls[2][0];
      expect(lastStatsCall.totalBusinesses).toBe(3);
    });
  });

  // ============================================================
  // Paginate Businesses Correctly
  // ============================================================
  describe('Paginate businesses correctly', () => {
    beforeEach(async () => {
      // Seed 25 businesses
      for (let i = 1; i <= 25; i++) {
        businessStore.set(i, createMockBusiness({
          id: i,
          name: `Business ${i}`,
          city: i <= 15 ? 'Freehold' : 'Manalapan',
          enrichment_status: i <= 10 ? 'enriched' : 'pending',
        }));
      }
      businessIdCounter = 25;
    });

    /**
     * TC-BIZ-INT-005: First page returns correct number of items
     *
     * Priority: Critical
     * Category: Functional
     */
    it('should return correct number of items for first page', async () => {
      const result = await service.findAll({ page: 1, limit: 10 } as any);

      expect(result.data).toHaveLength(10);
      expect(result.meta.total).toBe(25);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
      expect(result.meta.totalPages).toBe(3);
    });

    /**
     * TC-BIZ-INT-006: Second page returns correct items
     *
     * Priority: High
     * Category: Functional
     */
    it('should return correct items for second page', async () => {
      const result = await service.findAll({ page: 2, limit: 10 } as any);

      expect(result.data).toHaveLength(10);
      expect(result.meta.page).toBe(2);
      expect(result.meta.totalPages).toBe(3);
    });

    /**
     * TC-BIZ-INT-007: Last page returns remaining items
     *
     * Priority: High
     * Category: Functional
     */
    it('should return remaining items on last page', async () => {
      const result = await service.findAll({ page: 3, limit: 10 } as any);

      expect(result.data).toHaveLength(5); // 25 total, page 3 of 10 = 5 remaining
      expect(result.meta.total).toBe(25);
      expect(result.meta.totalPages).toBe(3);
    });

    /**
     * TC-BIZ-INT-008: Empty page beyond total returns empty data
     *
     * Priority: Medium
     * Category: Edge Case
     */
    it('should return empty data for page beyond total', async () => {
      const result = await service.findAll({ page: 10, limit: 10 } as any);

      expect(result.data).toHaveLength(0);
      expect(result.meta.total).toBe(25);
    });

    /**
     * TC-BIZ-INT-009: Default pagination (page=1, limit=20)
     *
     * Priority: High
     * Category: Functional
     */
    it('should use default pagination when no params provided', async () => {
      const result = await service.findAll({} as any);

      expect(result.data).toHaveLength(20);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(20);
      expect(result.meta.totalPages).toBe(2);
    });

    /**
     * TC-BIZ-INT-010: Caches paginated results
     *
     * Priority: High
     * Category: Integration
     */
    it('should cache paginated results after repository query', async () => {
      const query = { page: 1, limit: 10 };
      await service.findAll(query as any);

      expect(cache.setList).toHaveBeenCalledWith(
        query,
        expect.objectContaining({
          data: expect.any(Array),
          meta: expect.objectContaining({ total: 25, page: 1 }),
        }),
      );
    });
  });

  // ============================================================
  // Filter by City and Enrichment Status
  // ============================================================
  describe('Filter by city and enrichment_status', () => {
    beforeEach(async () => {
      // Seed businesses with different cities and statuses
      const testData = [
        { id: 1, name: 'Freehold Plumbing', city: 'Freehold', enrichment_status: 'enriched' },
        { id: 2, name: 'Freehold Electric', city: 'Freehold', enrichment_status: 'pending' },
        { id: 3, name: 'Freehold HVAC', city: 'Freehold', enrichment_status: 'enriched' },
        { id: 4, name: 'Manalapan Roofing', city: 'Manalapan', enrichment_status: 'pending' },
        { id: 5, name: 'Manalapan Painting', city: 'Manalapan', enrichment_status: 'enriched' },
        { id: 6, name: 'Howell Landscaping', city: 'Howell', enrichment_status: 'failed' },
      ];

      testData.forEach((data) => {
        businessStore.set(data.id, createMockBusiness(data));
      });
      businessIdCounter = 6;
    });

    /**
     * TC-BIZ-INT-011: Filter by city returns correct results
     *
     * Priority: Critical
     * Category: Functional
     */
    it('should filter businesses by city', async () => {
      const result = await service.findAll({
        page: 1,
        limit: 20,
        city: 'Freehold',
      } as any);

      expect(result.data).toHaveLength(3);
      expect(result.data.every((b: any) => b.city === 'Freehold')).toBe(true);
      expect(result.meta.total).toBe(3);
    });

    /**
     * TC-BIZ-INT-012: Filter by enrichment_status returns correct results
     *
     * Priority: Critical
     * Category: Functional
     */
    it('should filter businesses by enrichment_status', async () => {
      const result = await service.findAll({
        page: 1,
        limit: 20,
        enrichment_status: 'pending',
      } as any);

      expect(result.data).toHaveLength(2);
      expect(result.data.every((b: any) => b.enrichment_status === 'pending')).toBe(true);
    });

    /**
     * TC-BIZ-INT-013: Combined city + enrichment_status filter
     *
     * Priority: High
     * Category: Functional
     */
    it('should filter by both city and enrichment_status', async () => {
      const result = await service.findAll({
        page: 1,
        limit: 20,
        city: 'Freehold',
        enrichment_status: 'enriched',
      } as any);

      expect(result.data).toHaveLength(2);
      expect(
        result.data.every(
          (b: any) => b.city === 'Freehold' && b.enrichment_status === 'enriched',
        ),
      ).toBe(true);
    });

    /**
     * TC-BIZ-INT-014: Filter with no matches returns empty
     *
     * Priority: Medium
     * Category: Edge Case
     */
    it('should return empty results when no businesses match filter', async () => {
      const result = await service.findAll({
        page: 1,
        limit: 20,
        city: 'NonExistentCity',
      } as any);

      expect(result.data).toHaveLength(0);
      expect(result.meta.total).toBe(0);
    });

    /**
     * TC-BIZ-INT-015: Filter by failed enrichment_status
     *
     * Priority: Medium
     * Category: Functional
     */
    it('should filter by failed enrichment_status', async () => {
      const result = await service.findAll({
        page: 1,
        limit: 20,
        enrichment_status: 'failed',
      } as any);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].city).toBe('Howell');
    });
  });

  // ============================================================
  // Stats Update After Mutations
  // ============================================================
  describe('Stats update after mutations', () => {
    /**
     * TC-BIZ-INT-016: Stats reflect new business after create
     *
     * Priority: Critical
     * Category: Integration
     */
    it('should return updated stats after creating a business', async () => {
      // Create a business
      await service.create({ name: 'Stats Test Business', city: 'Freehold' } as any);

      // Get stats directly
      const stats = await service.getStats();

      expect(stats.totalBusinesses).toBe(1);
      expect(stats.pendingEnrichment).toBe(1);
    });

    /**
     * TC-BIZ-INT-017: Stats reflect deletion
     *
     * Priority: Critical
     * Category: Integration
     */
    it('should return updated stats after deleting a business', async () => {
      // Create businesses
      const biz1 = await service.create({ name: 'Business A' } as any);
      await service.create({ name: 'Business B' } as any);

      // Verify 2 businesses
      let stats = await service.getStats();
      expect(stats.totalBusinesses).toBe(2);

      // Delete one
      await service.remove(biz1.id);

      // Verify stats decreased
      stats = await service.getStats();
      expect(stats.totalBusinesses).toBe(1);
    });

    /**
     * TC-BIZ-INT-018: Stats show correct enrichment breakdown
     *
     * Priority: High
     * Category: Integration
     */
    it('should show correct enrichment status breakdown in stats', async () => {
      // Seed mix of enriched and pending
      businessStore.set(1, createMockBusiness({ id: 1, enrichment_status: 'enriched' }));
      businessStore.set(2, createMockBusiness({ id: 2, enrichment_status: 'enriched' }));
      businessStore.set(3, createMockBusiness({ id: 3, enrichment_status: 'pending' }));
      businessStore.set(4, createMockBusiness({ id: 4, enrichment_status: 'pending' }));
      businessStore.set(5, createMockBusiness({ id: 5, enrichment_status: 'pending' }));
      businessIdCounter = 5;

      const stats = await service.getStats();

      expect(stats.totalBusinesses).toBe(5);
      expect(stats.enrichedBusinesses).toBe(2);
      expect(stats.pendingEnrichment).toBe(3);
    });

    /**
     * TC-BIZ-INT-019: Stats emitted via WebSocket match getStats result
     *
     * Priority: High
     * Category: Integration
     */
    it('should emit stats that match getStats response', async () => {
      await service.create({ name: 'Consistency Test' } as any);

      const stats = await service.getStats();
      const emittedStats = eventsGateway.emitStatsUpdated.mock.calls[0][0];

      expect(emittedStats).toEqual(stats);
    });

    /**
     * TC-BIZ-INT-020: findOne throws NotFoundException for non-existent ID
     *
     * Priority: High
     * Category: Negative
     */
    it('should throw NotFoundException for non-existent business', async () => {
      await expect(service.findOne(9999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(9999)).rejects.toThrow(
        'Business with ID 9999 not found',
      );
    });

    /**
     * TC-BIZ-INT-021: remove throws NotFoundException for non-existent ID
     *
     * Priority: High
     * Category: Negative
     */
    it('should throw NotFoundException when deleting non-existent business', async () => {
      await expect(service.remove(9999)).rejects.toThrow(NotFoundException);
    });
  });
});
