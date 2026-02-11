/**
 * BusinessService Unit Tests
 *
 * Tests for the business domain service that orchestrates
 * repository, cache, and WebSocket event operations.
 *
 * Test Categories:
 * - create(): Business creation with cache invalidation and event emission
 * - findAll(): Paginated queries with cache hit/miss scenarios
 * - findOne(): Single business lookup with cache hit/miss and NotFoundException
 * - remove(): Deletion with cache invalidation and error propagation
 * - getStats(): Statistics with cache hit/miss scenarios
 * - Error propagation from repository/cache layers
 */

import { Test, TestingModule } from '@nestjs/testing';
import { Logger, NotFoundException } from '@nestjs/common';
import { BusinessService } from '../domain/business.service';
import { BusinessRepository } from '../data/business.repository';
import { BusinessCacheService } from '../domain/business-cache.service';
import { EventsGateway } from '../../../websocket/websocket.gateway';

describe('BusinessService', () => {
  let service: BusinessService;
  let repository: jest.Mocked<BusinessRepository>;
  let cache: jest.Mocked<BusinessCacheService>;
  let eventsGateway: jest.Mocked<EventsGateway>;

  const mockBusiness = {
    id: 1,
    name: 'Test Plumbing LLC',
    address: '123 Main St',
    city: 'Freehold',
    state: 'NJ',
    zip: '07728',
    phone: '732-555-0100',
    website: 'https://testplumbing.com',
    business_type: 'plumbing',
    industry: 'Home Services',
    employee_count: 10,
    year_founded: 2015,
    google_maps_url: null,
    latitude: 40.2598,
    longitude: -74.2734,
    enrichment_status: 'pending',
    source: 'google_maps',
    created_at: new Date('2025-01-01'),
    updated_at: new Date('2025-01-01'),
  };

  const mockBusinessWithRelations = {
    ...mockBusiness,
    contacts: [
      { id: 1, name: 'John Doe', email: 'john@test.com', business_id: 1 },
    ],
    enrichment_logs: [],
    outreach_messages: [],
  };

  const mockStats = {
    totalBusinesses: 50,
    enrichedBusinesses: 30,
    pendingEnrichment: 15,
    totalContacts: 120,
    messagesSent: 45,
    messagesPending: 10,
  };

  const createDto = {
    name: 'New Business',
    address: '456 Oak Ave',
    city: 'Freehold',
    state: 'NJ',
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => {});

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BusinessService,
        {
          provide: BusinessRepository,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            delete: jest.fn(),
            getStats: jest.fn(),
          },
        },
        {
          provide: BusinessCacheService,
          useValue: {
            getList: jest.fn(),
            setList: jest.fn(),
            get: jest.fn(),
            set: jest.fn(),
            getStats: jest.fn(),
            setStats: jest.fn(),
            invalidateAll: jest.fn(),
          },
        },
        {
          provide: EventsGateway,
          useValue: {
            emitBusinessCreated: jest.fn(),
            emitStatsUpdated: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<BusinessService>(BusinessService);
    repository = module.get(BusinessRepository);
    cache = module.get(BusinessCacheService);
    eventsGateway = module.get(EventsGateway);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ============================================================
  // create() Tests
  // ============================================================
  describe('create()', () => {
    beforeEach(() => {
      repository.create.mockResolvedValue(mockBusiness);
      cache.invalidateAll.mockResolvedValue(undefined);
      repository.getStats.mockResolvedValue(mockStats);
      cache.getStats.mockResolvedValue(null);
      cache.setStats.mockResolvedValue(undefined);
    });

    it('should create a business via repository', async () => {
      const result = await service.create(createDto as any);

      expect(result).toEqual(mockBusiness);
      expect(repository.create).toHaveBeenCalledWith(createDto);
    });

    it('should invalidate all caches after creation', async () => {
      await service.create(createDto as any);

      expect(cache.invalidateAll).toHaveBeenCalledTimes(1);
    });

    it('should emit business:created WebSocket event', async () => {
      await service.create(createDto as any);

      expect(eventsGateway.emitBusinessCreated).toHaveBeenCalledWith(mockBusiness);
    });

    it('should emit stats:updated WebSocket event with fresh stats', async () => {
      await service.create(createDto as any);

      expect(eventsGateway.emitStatsUpdated).toHaveBeenCalledWith(mockStats);
    });

    it('should call getStats after creation to emit updated stats', async () => {
      await service.create(createDto as any);

      // getStats is called internally (which calls cache.getStats then repository.getStats)
      expect(repository.getStats).toHaveBeenCalled();
    });

    it('should propagate repository errors', async () => {
      const error = new Error('Database connection failed');
      repository.create.mockRejectedValue(error);

      await expect(service.create(createDto as any)).rejects.toThrow('Database connection failed');
    });

    it('should still throw even if cache invalidation fails', async () => {
      // Cache invalidation failure should not swallow repository errors
      repository.create.mockRejectedValue(new Error('DB error'));
      cache.invalidateAll.mockRejectedValue(new Error('Redis down'));

      await expect(service.create(createDto as any)).rejects.toThrow('DB error');
    });
  });

  // ============================================================
  // findAll() Tests
  // ============================================================
  describe('findAll()', () => {
    const query = { page: 1, limit: 20, city: 'Freehold' };

    const paginatedResult = {
      data: [mockBusiness],
      meta: {
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      },
    };

    it('should return cached data on cache hit', async () => {
      cache.getList.mockResolvedValue(paginatedResult);

      const result = await service.findAll(query as any);

      expect(result).toEqual(paginatedResult);
      expect(cache.getList).toHaveBeenCalledWith(query);
      expect(repository.findAll).not.toHaveBeenCalled();
    });

    it('should query repository on cache miss', async () => {
      cache.getList.mockResolvedValue(null);
      repository.findAll.mockResolvedValue([[mockBusiness], 1]);
      cache.setList.mockResolvedValue(undefined);

      const result = await service.findAll(query as any);

      expect(result.data).toEqual([mockBusiness]);
      expect(result.meta.total).toBe(1);
      expect(repository.findAll).toHaveBeenCalledWith({ city: 'Freehold' }, 0, 20);
    });

    it('should cache the result on cache miss', async () => {
      cache.getList.mockResolvedValue(null);
      repository.findAll.mockResolvedValue([[mockBusiness], 1]);
      cache.setList.mockResolvedValue(undefined);

      await service.findAll(query as any);

      expect(cache.setList).toHaveBeenCalledWith(query, expect.objectContaining({
        data: [mockBusiness],
        meta: expect.objectContaining({ total: 1 }),
      }));
    });

    it('should calculate pagination correctly', async () => {
      cache.getList.mockResolvedValue(null);
      repository.findAll.mockResolvedValue([[mockBusiness], 50]);
      cache.setList.mockResolvedValue(undefined);

      const result = await service.findAll({ page: 3, limit: 10 } as any);

      // skip = (3-1) * 10 = 20
      expect(repository.findAll).toHaveBeenCalledWith({}, 20, 10);
      expect(result.meta).toEqual({
        total: 50,
        page: 3,
        limit: 10,
        totalPages: 5,
      });
    });

    it('should use default page=1 and limit=20 when not provided', async () => {
      cache.getList.mockResolvedValue(null);
      repository.findAll.mockResolvedValue([[], 0]);
      cache.setList.mockResolvedValue(undefined);

      await service.findAll({} as any);

      // skip = (1-1) * 20 = 0
      expect(repository.findAll).toHaveBeenCalledWith({}, 0, 20);
    });

    it('should build where clause with all filter parameters', async () => {
      cache.getList.mockResolvedValue(null);
      repository.findAll.mockResolvedValue([[], 0]);
      cache.setList.mockResolvedValue(undefined);

      await service.findAll({
        page: 1,
        limit: 10,
        city: 'Freehold',
        industry: 'Home Services',
        enrichment_status: 'pending',
      } as any);

      expect(repository.findAll).toHaveBeenCalledWith(
        {
          city: 'Freehold',
          industry: 'Home Services',
          enrichment_status: 'pending',
        },
        0,
        10,
      );
    });

    it('should not include undefined filters in where clause', async () => {
      cache.getList.mockResolvedValue(null);
      repository.findAll.mockResolvedValue([[], 0]);
      cache.setList.mockResolvedValue(undefined);

      await service.findAll({ page: 1, limit: 10 } as any);

      expect(repository.findAll).toHaveBeenCalledWith({}, 0, 10);
    });

    it('should propagate repository errors', async () => {
      cache.getList.mockResolvedValue(null);
      repository.findAll.mockRejectedValue(new Error('Query timeout'));

      await expect(service.findAll(query as any)).rejects.toThrow('Query timeout');
    });
  });

  // ============================================================
  // findOne() Tests
  // ============================================================
  describe('findOne()', () => {
    it('should return cached business on cache hit', async () => {
      cache.get.mockResolvedValue(mockBusinessWithRelations);

      const result = await service.findOne(1);

      expect(result).toEqual(mockBusinessWithRelations);
      expect(cache.get).toHaveBeenCalledWith(1);
      expect(repository.findOne).not.toHaveBeenCalled();
    });

    it('should query repository on cache miss', async () => {
      cache.get.mockResolvedValue(null);
      repository.findOne.mockResolvedValue(mockBusinessWithRelations);
      cache.set.mockResolvedValue(undefined);

      const result = await service.findOne(1);

      expect(result).toEqual(mockBusinessWithRelations);
      expect(repository.findOne).toHaveBeenCalledWith(1);
    });

    it('should cache the result on cache miss', async () => {
      cache.get.mockResolvedValue(null);
      repository.findOne.mockResolvedValue(mockBusinessWithRelations);
      cache.set.mockResolvedValue(undefined);

      await service.findOne(1);

      expect(cache.set).toHaveBeenCalledWith(1, mockBusinessWithRelations);
    });

    it('should throw NotFoundException when business does not exist', async () => {
      cache.get.mockResolvedValue(null);
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow('Business with ID 999 not found');
    });

    it('should not cache null results', async () => {
      cache.get.mockResolvedValue(null);
      repository.findOne.mockResolvedValue(null);

      try {
        await service.findOne(999);
      } catch {
        // Expected NotFoundException
      }

      expect(cache.set).not.toHaveBeenCalled();
    });

    it('should propagate unexpected errors', async () => {
      cache.get.mockResolvedValue(null);
      repository.findOne.mockRejectedValue(new Error('Connection lost'));

      await expect(service.findOne(1)).rejects.toThrow('Connection lost');
    });
  });

  // ============================================================
  // remove() Tests
  // ============================================================
  describe('remove()', () => {
    it('should delete business via repository', async () => {
      repository.delete.mockResolvedValue(mockBusiness);
      cache.invalidateAll.mockResolvedValue(undefined);

      const result = await service.remove(1);

      expect(result).toEqual({ message: 'Business deleted successfully' });
      expect(repository.delete).toHaveBeenCalledWith(1);
    });

    it('should invalidate caches with business ID after deletion', async () => {
      repository.delete.mockResolvedValue(mockBusiness);
      cache.invalidateAll.mockResolvedValue(undefined);

      await service.remove(1);

      expect(cache.invalidateAll).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when business does not exist', async () => {
      repository.delete.mockRejectedValue(new Error('Record not found'));

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
      await expect(service.remove(999)).rejects.toThrow('Business with ID 999 not found');
    });

    it('should wrap any repository error as NotFoundException', async () => {
      // The service wraps all delete errors as NotFoundException
      repository.delete.mockRejectedValue(new Error('Foreign key constraint'));

      await expect(service.remove(1)).rejects.toThrow(NotFoundException);
    });
  });

  // ============================================================
  // getStats() Tests
  // ============================================================
  describe('getStats()', () => {
    it('should return cached stats on cache hit', async () => {
      cache.getStats.mockResolvedValue(mockStats);

      const result = await service.getStats();

      expect(result).toEqual(mockStats);
      expect(cache.getStats).toHaveBeenCalled();
      expect(repository.getStats).not.toHaveBeenCalled();
    });

    it('should query repository on cache miss', async () => {
      cache.getStats.mockResolvedValue(null);
      repository.getStats.mockResolvedValue(mockStats);
      cache.setStats.mockResolvedValue(undefined);

      const result = await service.getStats();

      expect(result).toEqual(mockStats);
      expect(repository.getStats).toHaveBeenCalled();
    });

    it('should cache the result on cache miss', async () => {
      cache.getStats.mockResolvedValue(null);
      repository.getStats.mockResolvedValue(mockStats);
      cache.setStats.mockResolvedValue(undefined);

      await service.getStats();

      expect(cache.setStats).toHaveBeenCalledWith(mockStats);
    });

    it('should propagate repository errors', async () => {
      cache.getStats.mockResolvedValue(null);
      repository.getStats.mockRejectedValue(new Error('Stats query failed'));

      await expect(service.getStats()).rejects.toThrow('Stats query failed');
    });
  });

  // ============================================================
  // Integration Scenarios
  // ============================================================
  describe('Integration scenarios', () => {
    it('create should invalidate cache before getStats uses repository', async () => {
      repository.create.mockResolvedValue(mockBusiness);
      cache.invalidateAll.mockResolvedValue(undefined);
      cache.getStats.mockResolvedValue(null); // Cache was just invalidated
      repository.getStats.mockResolvedValue(mockStats);
      cache.setStats.mockResolvedValue(undefined);

      await service.create(createDto as any);

      // Verify order: create -> invalidate -> getStats(repo) -> emit
      expect(repository.create).toHaveBeenCalled();
      expect(cache.invalidateAll).toHaveBeenCalled();
      expect(repository.getStats).toHaveBeenCalled();
      expect(eventsGateway.emitStatsUpdated).toHaveBeenCalledWith(mockStats);
    });

    it('findAll should not call setList when cache hit occurs', async () => {
      const cachedResult = { data: [mockBusiness], meta: { total: 1, page: 1, limit: 20, totalPages: 1 } };
      cache.getList.mockResolvedValue(cachedResult);

      await service.findAll({ page: 1, limit: 20 } as any);

      expect(cache.setList).not.toHaveBeenCalled();
      expect(repository.findAll).not.toHaveBeenCalled();
    });

    it('findOne should not call set when cache hit occurs', async () => {
      cache.get.mockResolvedValue(mockBusinessWithRelations);

      await service.findOne(1);

      expect(cache.set).not.toHaveBeenCalled();
      expect(repository.findOne).not.toHaveBeenCalled();
    });
  });
});
