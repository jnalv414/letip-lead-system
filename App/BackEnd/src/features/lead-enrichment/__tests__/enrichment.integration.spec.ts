/**
 * Lead Enrichment Integration Tests
 *
 * Tests the EnrichmentService with mocked external API clients
 * (Hunter.io, AbstractAPI) and mocked database layer.
 *
 * Only PrismaService and external HTTP calls are mocked.
 * RateLimiterService uses a real instance to test actual rate limiting behavior.
 *
 * Test Scenarios:
 * - Enrich business with mocked Hunter/Abstract APIs
 * - Batch enrich multiple businesses
 * - Handle API errors gracefully
 * - Rate limiting prevents over-quota calls
 */

import { Test, TestingModule } from '@nestjs/testing';
import { Logger, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EnrichmentService } from '../domain/enrichment.service';
import { HunterApiClientService } from '../domain/hunter-api-client.service';
import { AbstractApiClientService } from '../domain/abstract-api-client.service';
import { RateLimiterService } from '../domain/rate-limiter.service';
import { EnrichmentLogRepository } from '../data/repositories/enrichment-log.repository';
import { PrismaService } from '../../../prisma/prisma.service';

describe('Lead Enrichment Integration Tests', () => {
  let module: TestingModule;
  let enrichmentService: EnrichmentService;
  let hunterClient: jest.Mocked<HunterApiClientService>;
  let abstractClient: jest.Mocked<AbstractApiClientService>;
  let rateLimiter: RateLimiterService;
  let enrichmentLogRepo: jest.Mocked<EnrichmentLogRepository>;
  let prismaService: any;
  let eventEmitter: jest.Mocked<EventEmitter2>;

  // In-memory stores
  let businessStore: Map<number, any>;
  let contactStore: Map<number, any[]>;
  let enrichmentLogStore: any[];
  let apiCostLogStore: any[];

  const createMockBusiness = (overrides: Partial<any> = {}): any => ({
    id: overrides.id || 1,
    name: overrides.name || 'Test Business',
    website: overrides.website !== undefined ? overrides.website : 'https://testbusiness.com',
    city: overrides.city || 'Freehold',
    enrichment_status: overrides.enrichment_status || 'pending',
    created_at: new Date(),
    updated_at: new Date(),
  });

  const mockHunterResponse = {
    emails: [
      {
        value: 'john@testbusiness.com',
        type: 'personal',
        confidence: 95,
        first_name: 'John',
        last_name: 'Doe',
        position: 'Owner',
        seniority: 'senior',
        verification: { status: 'valid' },
      },
      {
        value: 'info@testbusiness.com',
        type: 'generic',
        confidence: 80,
        first_name: null,
        last_name: null,
        position: null,
        seniority: null,
        verification: { status: 'valid' },
      },
    ],
    domain: 'testbusiness.com',
    organization: 'Test Business',
  };

  const mockAbstractResponse = {
    name: 'Test Business Inc.',
    domain: 'testbusiness.com',
    country: 'US',
    locality: 'Freehold, NJ',
    employees_count: '50',
    industry: 'Home Services',
    year_founded: 2010,
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => {});

    businessStore = new Map();
    contactStore = new Map();
    enrichmentLogStore = [];
    apiCostLogStore = [];

    // Mock PrismaService with in-memory stores
    const mockPrisma = {
      business: {
        findUnique: jest.fn().mockImplementation(({ where }) => {
          return Promise.resolve(businessStore.get(where.id) || null);
        }),
        findMany: jest.fn().mockImplementation(({ where, take, orderBy }) => {
          let businesses = Array.from(businessStore.values());
          if (where?.enrichment_status) {
            businesses = businesses.filter(
              (b) => b.enrichment_status === where.enrichment_status,
            );
          }
          if (where?.website?.not !== undefined) {
            businesses = businesses.filter((b) => b.website !== null);
          }
          if (take) businesses = businesses.slice(0, take);
          return Promise.resolve(businesses);
        }),
        update: jest.fn().mockImplementation(({ where, data }) => {
          const business = businessStore.get(where.id);
          if (business) {
            const updated = { ...business, ...data };
            businessStore.set(where.id, updated);
            return Promise.resolve(updated);
          }
          return Promise.resolve(null);
        }),
      },
      contact: {
        findFirst: jest.fn().mockImplementation(({ where }) => {
          const contacts = contactStore.get(where.business_id) || [];
          return Promise.resolve(
            contacts.find((c) => c.email === where.email) || null,
          );
        }),
        create: jest.fn().mockImplementation(({ data }) => {
          const contacts = contactStore.get(data.business_id) || [];
          contacts.push(data);
          contactStore.set(data.business_id, contacts);
          return Promise.resolve(data);
        }),
      },
      api_cost_log: {
        create: jest.fn().mockImplementation(({ data }) => {
          apiCostLogStore.push(data);
          return Promise.resolve(data);
        }),
      },
    };

    const mockEnrichmentLogRepo = {
      create: jest.fn().mockImplementation((data) => {
        enrichmentLogStore.push(data);
        return Promise.resolve(data);
      }),
      findByBusinessId: jest.fn(),
      findByService: jest.fn(),
      getSuccessRate: jest.fn(),
    };

    const mockHunterClient = {
      searchDomain: jest.fn(),
      isConfigured: jest.fn().mockReturnValue(true),
    };

    const mockAbstractClient = {
      enrichCompany: jest.fn(),
      isConfigured: jest.fn().mockReturnValue(true),
    };

    const mockEventEmitter = {
      emit: jest.fn(),
    };

    module = await Test.createTestingModule({
      providers: [
        EnrichmentService,
        RateLimiterService, // Use real rate limiter
        { provide: PrismaService, useValue: mockPrisma },
        { provide: HunterApiClientService, useValue: mockHunterClient },
        { provide: AbstractApiClientService, useValue: mockAbstractClient },
        { provide: EnrichmentLogRepository, useValue: mockEnrichmentLogRepo },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    enrichmentService = module.get<EnrichmentService>(EnrichmentService);
    hunterClient = module.get(HunterApiClientService);
    abstractClient = module.get(AbstractApiClientService);
    rateLimiter = module.get<RateLimiterService>(RateLimiterService);
    enrichmentLogRepo = module.get(EnrichmentLogRepository);
    prismaService = module.get(PrismaService);
    eventEmitter = module.get(EventEmitter2);
  });

  afterEach(async () => {
    await module.close();
  });

  // ============================================================
  // Enrich Business with Mocked Hunter/Abstract APIs
  // ============================================================
  describe('Enrich business with mocked Hunter/Abstract APIs', () => {
    /**
     * TC-ENR-INT-001: Successfully enrich business with both APIs
     *
     * Priority: Critical
     * Category: Integration
     */
    it('should enrich business with both Hunter and Abstract APIs', async () => {
      const business = createMockBusiness({ id: 1 });
      businessStore.set(1, business);

      abstractClient.enrichCompany.mockResolvedValue(mockAbstractResponse);
      hunterClient.searchDomain.mockResolvedValue(mockHunterResponse);

      const result = await enrichmentService.enrichBusiness(1);

      expect(result.abstract).toEqual(mockAbstractResponse);
      expect(result.hunter).toEqual(mockHunterResponse);
      expect(result.errors).toHaveLength(0);
      expect(result.businessId).toBe(1);
      expect(result.businessName).toBe('Test Business');
    });

    /**
     * TC-ENR-INT-002: Business gets updated with Abstract API data
     *
     * Priority: Critical
     * Category: Integration
     */
    it('should update business record with Abstract API data', async () => {
      const business = createMockBusiness({ id: 1 });
      businessStore.set(1, business);

      abstractClient.enrichCompany.mockResolvedValue(mockAbstractResponse);
      hunterClient.searchDomain.mockResolvedValue(mockHunterResponse);

      await enrichmentService.enrichBusiness(1);

      // Verify business was updated with AbstractAPI data
      expect(prismaService.business.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: expect.objectContaining({
            industry: 'Home Services',
            employee_count: 50,
            year_founded: 2010,
          }),
        }),
      );
    });

    /**
     * TC-ENR-INT-003: Contacts created from Hunter API results
     *
     * Priority: Critical
     * Category: Integration
     */
    it('should create contacts from Hunter API email results', async () => {
      const business = createMockBusiness({ id: 1 });
      businessStore.set(1, business);

      abstractClient.enrichCompany.mockResolvedValue(mockAbstractResponse);
      hunterClient.searchDomain.mockResolvedValue(mockHunterResponse);

      await enrichmentService.enrichBusiness(1);

      // Verify contacts were created
      const contacts = contactStore.get(1) || [];
      expect(contacts).toHaveLength(2);
      expect(contacts[0].email).toBe('john@testbusiness.com');
      expect(contacts[0].name).toBe('John Doe');
      expect(contacts[0].email_verified).toBe(true);
      expect(contacts[0].is_primary).toBe(true); // personal + senior
    });

    /**
     * TC-ENR-INT-004: Enrichment status set to 'enriched' on success
     *
     * Priority: Critical
     * Category: Integration
     */
    it('should set enrichment_status to enriched on success', async () => {
      const business = createMockBusiness({ id: 1 });
      businessStore.set(1, business);

      abstractClient.enrichCompany.mockResolvedValue(mockAbstractResponse);
      hunterClient.searchDomain.mockResolvedValue(mockHunterResponse);

      await enrichmentService.enrichBusiness(1);

      const updated = businessStore.get(1);
      expect(updated.enrichment_status).toBe('enriched');
    });

    /**
     * TC-ENR-INT-005: Events emitted after enrichment
     *
     * Priority: High
     * Category: Integration
     */
    it('should emit business:enriched event', async () => {
      const business = createMockBusiness({ id: 1 });
      businessStore.set(1, business);

      abstractClient.enrichCompany.mockResolvedValue(mockAbstractResponse);
      hunterClient.searchDomain.mockResolvedValue(mockHunterResponse);

      await enrichmentService.enrichBusiness(1);

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'business:enriched',
        expect.objectContaining({
          type: 'business:enriched',
          data: expect.objectContaining({
            id: 1,
            enrichment_status: 'enriched',
            abstract: true,
            hunter: true,
          }),
        }),
      );
    });

    /**
     * TC-ENR-INT-006: Enrichment logs created for each service
     *
     * Priority: High
     * Category: Integration
     */
    it('should create enrichment log entries for both services', async () => {
      const business = createMockBusiness({ id: 1 });
      businessStore.set(1, business);

      abstractClient.enrichCompany.mockResolvedValue(mockAbstractResponse);
      hunterClient.searchDomain.mockResolvedValue(mockHunterResponse);

      await enrichmentService.enrichBusiness(1);

      expect(enrichmentLogRepo.create).toHaveBeenCalledTimes(2);

      const abstractLog = enrichmentLogStore.find((l) => l.service === 'abstract');
      const hunterLog = enrichmentLogStore.find((l) => l.service === 'hunter');

      expect(abstractLog).toBeDefined();
      expect(abstractLog.status).toBe('success');
      expect(hunterLog).toBeDefined();
      expect(hunterLog.status).toBe('success');
    });

    /**
     * TC-ENR-INT-007: Business with no website sets failed status
     *
     * Priority: High
     * Category: Edge Case
     */
    it('should return errors and set failed status when business has no website', async () => {
      const business = createMockBusiness({ id: 2, website: null });
      businessStore.set(2, business);

      const result = await enrichmentService.enrichBusiness(2);

      expect(result.errors).toHaveLength(2);
      expect(result.abstract).toBeNull();
      expect(result.hunter).toBeNull();

      const updated = businessStore.get(2);
      expect(updated.enrichment_status).toBe('failed');
    });

    /**
     * TC-ENR-INT-008: NotFoundException for non-existent business
     *
     * Priority: High
     * Category: Negative
     */
    it('should throw NotFoundException for non-existent business', async () => {
      await expect(enrichmentService.enrichBusiness(9999)).rejects.toThrow(
        NotFoundException,
      );
    });

    /**
     * TC-ENR-INT-009: Duplicate contacts not created
     *
     * Priority: High
     * Category: Integration
     */
    it('should not create duplicate contacts', async () => {
      const business = createMockBusiness({ id: 1 });
      businessStore.set(1, business);

      // Pre-existing contact
      contactStore.set(1, [
        { business_id: 1, email: 'john@testbusiness.com', name: 'John Doe' },
      ]);

      abstractClient.enrichCompany.mockResolvedValue(mockAbstractResponse);
      hunterClient.searchDomain.mockResolvedValue(mockHunterResponse);

      await enrichmentService.enrichBusiness(1);

      // Should only create the second contact (info@), not duplicate john@
      const contacts = contactStore.get(1) || [];
      const johnContacts = contacts.filter((c) => c.email === 'john@testbusiness.com');
      expect(johnContacts).toHaveLength(1);
    });

    /**
     * TC-ENR-INT-010: API cost logs created for each service call
     *
     * Priority: Medium
     * Category: Integration
     */
    it('should create API cost logs for each successful API call', async () => {
      const business = createMockBusiness({ id: 1 });
      businessStore.set(1, business);

      abstractClient.enrichCompany.mockResolvedValue(mockAbstractResponse);
      hunterClient.searchDomain.mockResolvedValue(mockHunterResponse);

      await enrichmentService.enrichBusiness(1);

      expect(apiCostLogStore).toHaveLength(2);

      const abstractCost = apiCostLogStore.find(
        (l) => l.operation_type === 'enrich_abstract',
      );
      const hunterCost = apiCostLogStore.find(
        (l) => l.operation_type === 'enrich_hunter',
      );

      expect(abstractCost).toBeDefined();
      expect(abstractCost.cost_usd).toBe(0.10);
      expect(hunterCost).toBeDefined();
      expect(hunterCost.cost_usd).toBe(0.50);
    });
  });

  // ============================================================
  // Batch Enrich Multiple Businesses
  // ============================================================
  describe('Batch enrich multiple businesses', () => {
    beforeEach(() => {
      // Replace delay to speed up tests
      (enrichmentService as any).delay = jest.fn().mockResolvedValue(undefined);
    });

    /**
     * TC-ENR-INT-011: Batch enrich processes pending businesses
     *
     * Priority: Critical
     * Category: Integration
     */
    it('should batch enrich pending businesses', async () => {
      // Seed pending businesses
      for (let i = 1; i <= 3; i++) {
        businessStore.set(
          i,
          createMockBusiness({
            id: i,
            name: `Business ${i}`,
            website: `https://business${i}.com`,
            enrichment_status: 'pending',
          }),
        );
      }

      abstractClient.enrichCompany.mockResolvedValue(mockAbstractResponse);
      hunterClient.searchDomain.mockResolvedValue(mockHunterResponse);

      const result = await enrichmentService.enrichBatch(3);

      expect(result.total).toBe(3);
      expect(result.enriched).toBe(3);
      expect(result.failed).toBe(0);
      expect(result.results).toHaveLength(3);
    });

    /**
     * TC-ENR-INT-012: Batch enrich returns empty when no pending businesses
     *
     * Priority: High
     * Category: Edge Case
     */
    it('should return empty result when no pending businesses exist', async () => {
      // Only enriched businesses
      businessStore.set(
        1,
        createMockBusiness({ id: 1, enrichment_status: 'enriched' }),
      );

      const result = await enrichmentService.enrichBatch(10);

      expect(result.message).toBe('No pending businesses to enrich');
      expect(result.enriched).toBe(0);
      expect(result.total).toBe(0);
    });

    /**
     * TC-ENR-INT-013: Batch handles partial failures (API errors)
     *
     * Priority: Critical
     * Category: Integration
     */
    it('should handle partial failures in batch enrichment', async () => {
      // Both businesses have websites but one API call will fail
      businessStore.set(
        1,
        createMockBusiness({
          id: 1,
          website: 'https://business1.com',
          enrichment_status: 'pending',
        }),
      );
      businessStore.set(
        2,
        createMockBusiness({
          id: 2,
          website: 'https://business2.com',
          enrichment_status: 'pending',
        }),
      );

      // First business succeeds, second business both APIs fail
      abstractClient.enrichCompany
        .mockResolvedValueOnce(mockAbstractResponse)
        .mockRejectedValueOnce(new Error('API error'));
      hunterClient.searchDomain
        .mockResolvedValueOnce(mockHunterResponse)
        .mockRejectedValueOnce(new Error('API error'));

      const result = await enrichmentService.enrichBatch(2);

      expect(result.total).toBe(2);
      expect(result.enriched).toBe(1);
      expect(result.failed).toBe(1);
    });

    /**
     * TC-ENR-INT-014: Batch respects count parameter
     *
     * Priority: High
     * Category: Functional
     */
    it('should only enrich up to the specified count', async () => {
      for (let i = 1; i <= 10; i++) {
        businessStore.set(
          i,
          createMockBusiness({
            id: i,
            enrichment_status: 'pending',
          }),
        );
      }

      abstractClient.enrichCompany.mockResolvedValue(mockAbstractResponse);
      hunterClient.searchDomain.mockResolvedValue(mockHunterResponse);

      const result = await enrichmentService.enrichBatch(3);

      expect(result.total).toBe(3);
      expect(result.results).toHaveLength(3);
    });
  });

  // ============================================================
  // Handle API Errors Gracefully
  // ============================================================
  describe('Handle API errors gracefully', () => {
    /**
     * TC-ENR-INT-015: AbstractAPI failure logs error and continues with Hunter
     *
     * Priority: Critical
     * Category: Error Handling
     */
    it('should continue with Hunter when AbstractAPI fails', async () => {
      const business = createMockBusiness({ id: 1 });
      businessStore.set(1, business);

      abstractClient.enrichCompany.mockRejectedValue(
        new Error('AbstractAPI failed: timeout'),
      );
      hunterClient.searchDomain.mockResolvedValue(mockHunterResponse);

      const result = await enrichmentService.enrichBusiness(1);

      expect(result.abstract).toBeNull();
      expect(result.hunter).toEqual(mockHunterResponse);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].service).toBe('abstract');

      // Should still be marked as enriched (hunter succeeded)
      const updated = businessStore.get(1);
      expect(updated.enrichment_status).toBe('enriched');
    });

    /**
     * TC-ENR-INT-016: Hunter failure logs error and keeps Abstract results
     *
     * Priority: Critical
     * Category: Error Handling
     */
    it('should keep Abstract results when Hunter fails', async () => {
      const business = createMockBusiness({ id: 1 });
      businessStore.set(1, business);

      abstractClient.enrichCompany.mockResolvedValue(mockAbstractResponse);
      hunterClient.searchDomain.mockRejectedValue(
        new Error('Hunter.io API failed: 429'),
      );

      const result = await enrichmentService.enrichBusiness(1);

      expect(result.abstract).toEqual(mockAbstractResponse);
      expect(result.hunter).toBeNull();
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].service).toBe('hunter');

      // Should still be enriched (abstract succeeded)
      const updated = businessStore.get(1);
      expect(updated.enrichment_status).toBe('enriched');
    });

    /**
     * TC-ENR-INT-017: Both APIs failing sets status to 'failed'
     *
     * Priority: Critical
     * Category: Error Handling
     */
    it('should set status to failed when both APIs fail', async () => {
      const business = createMockBusiness({ id: 1 });
      businessStore.set(1, business);

      abstractClient.enrichCompany.mockRejectedValue(
        new Error('AbstractAPI failed: 500'),
      );
      hunterClient.searchDomain.mockRejectedValue(
        new Error('Hunter.io API failed: 500'),
      );

      const result = await enrichmentService.enrichBusiness(1);

      expect(result.abstract).toBeNull();
      expect(result.hunter).toBeNull();
      expect(result.errors).toHaveLength(2);

      const updated = businessStore.get(1);
      expect(updated.enrichment_status).toBe('failed');
    });

    /**
     * TC-ENR-INT-018: Failed enrichment logs errors to enrichment_log
     *
     * Priority: High
     * Category: Error Handling
     */
    it('should log failed API calls to enrichment log', async () => {
      const business = createMockBusiness({ id: 1 });
      businessStore.set(1, business);

      abstractClient.enrichCompany.mockRejectedValue(
        new Error('Connection timeout'),
      );
      hunterClient.searchDomain.mockRejectedValue(
        new Error('Rate limited'),
      );

      await enrichmentService.enrichBusiness(1);

      const abstractLog = enrichmentLogStore.find(
        (l) => l.service === 'abstract',
      );
      const hunterLog = enrichmentLogStore.find(
        (l) => l.service === 'hunter',
      );

      expect(abstractLog).toBeDefined();
      expect(abstractLog.status).toBe('failed');
      expect(abstractLog.error_message).toBe('Connection timeout');
      expect(hunterLog).toBeDefined();
      expect(hunterLog.status).toBe('failed');
      expect(hunterLog.error_message).toBe('Rate limited');
    });

    /**
     * TC-ENR-INT-019: Unconfigured API skips with error message
     *
     * Priority: High
     * Category: Edge Case
     */
    it('should skip unconfigured APIs and add error', async () => {
      const business = createMockBusiness({ id: 1 });
      businessStore.set(1, business);

      abstractClient.isConfigured.mockReturnValue(false);
      hunterClient.isConfigured.mockReturnValue(false);

      const result = await enrichmentService.enrichBusiness(1);

      expect(result.errors).toHaveLength(2);
      expect(result.errors[0].error).toBe('API not configured');
      expect(result.errors[1].error).toBe('API not configured');
    });
  });

  // ============================================================
  // Rate Limiting Prevents Over-Quota Calls
  // ============================================================
  describe('Rate limiting prevents over-quota calls', () => {
    /**
     * TC-ENR-INT-020: Rate limiter allows calls within quota
     *
     * Priority: Critical
     * Category: Integration
     */
    it('should allow API calls within rate limit', async () => {
      expect(rateLimiter.canMakeCall('hunter.io')).toBe(true);
      expect(rateLimiter.canMakeCall('abstractapi')).toBe(true);
    });

    /**
     * TC-ENR-INT-021: Rate limiter tracks calls correctly
     *
     * Priority: High
     * Category: Integration
     */
    it('should track API calls and decrease remaining count', async () => {
      const initialRemaining = rateLimiter.getRemainingCalls('hunter.io');

      rateLimiter.recordCall('hunter.io');
      rateLimiter.recordCall('hunter.io');

      const afterRemaining = rateLimiter.getRemainingCalls('hunter.io');
      expect(afterRemaining).toBe(initialRemaining - 2);
    });

    /**
     * TC-ENR-INT-022: Rate limiter blocks when over quota
     *
     * Priority: Critical
     * Category: Integration
     */
    it('should block API calls when rate limit is exceeded', async () => {
      // Exhaust the hunter rate limit (500 calls)
      for (let i = 0; i < 500; i++) {
        rateLimiter.recordCall('hunter.io');
      }

      expect(rateLimiter.canMakeCall('hunter.io')).toBe(false);
      expect(rateLimiter.getRemainingCalls('hunter.io')).toBe(0);
    });

    /**
     * TC-ENR-INT-023: Over-quota enrichment adds rate limit error
     *
     * Priority: Critical
     * Category: Integration
     */
    it('should add rate limit error when API quota exceeded', async () => {
      const business = createMockBusiness({ id: 1 });
      businessStore.set(1, business);

      // Exhaust hunter rate limit
      for (let i = 0; i < 500; i++) {
        rateLimiter.recordCall('hunter.io');
      }

      abstractClient.enrichCompany.mockResolvedValue(mockAbstractResponse);

      const result = await enrichmentService.enrichBusiness(1);

      // Hunter should have rate limit error
      const hunterError = result.errors.find((e: any) => e.service === 'hunter');
      expect(hunterError).toBeDefined();
      expect(hunterError!.error).toBe('Rate limit exceeded');

      // Abstract should still work
      expect(result.abstract).toEqual(mockAbstractResponse);
    });

    /**
     * TC-ENR-INT-024: Services without configured limits allow unlimited calls
     *
     * Priority: Medium
     * Category: Edge Case
     */
    it('should allow unlimited calls for unconfigured services', async () => {
      expect(rateLimiter.canMakeCall('unknown-service')).toBe(true);
      expect(rateLimiter.getRemainingCalls('unknown-service')).toBe(Infinity);
    });
  });

  // ============================================================
  // Domain Extraction
  // ============================================================
  describe('Domain extraction from website URL', () => {
    /**
     * TC-ENR-INT-025: Extracts domain correctly from various URL formats
     *
     * Priority: High
     * Category: Functional
     */
    it('should extract domain and call APIs with correct domain', async () => {
      const business = createMockBusiness({
        id: 1,
        website: 'https://www.example.com/about',
      });
      businessStore.set(1, business);

      abstractClient.enrichCompany.mockResolvedValue(mockAbstractResponse);
      hunterClient.searchDomain.mockResolvedValue(mockHunterResponse);

      await enrichmentService.enrichBusiness(1);

      // Both APIs should be called with extracted domain
      expect(abstractClient.enrichCompany).toHaveBeenCalledWith('example.com');
      expect(hunterClient.searchDomain).toHaveBeenCalledWith('example.com', 5);
    });
  });
});
