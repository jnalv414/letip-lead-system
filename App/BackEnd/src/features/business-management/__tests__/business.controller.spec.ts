/**
 * TDD RED Tests: Business Controller - Role-Based Access Control
 *
 * These tests verify that write operations on the business controller
 * properly enforce role-based access control for go-live.
 *
 * STATUS: RED/GREEN mix - Some tests verify existing behavior,
 * others define go-live restrictions that need implementation.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { Logger, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { BusinessController } from '../api/business.controller';
import { BusinessService } from '../domain/business.service';

describe('BusinessController - Role-Based Access', () => {
  let controller: BusinessController;
  let businessService: jest.Mocked<BusinessService>;

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
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockStats = {
    totalBusinesses: 50,
    enriched: 30,
    pending: 15,
    failed: 5,
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BusinessController],
      providers: [
        {
          provide: BusinessService,
          useValue: {
            create: jest.fn().mockResolvedValue(mockBusiness),
            findAll: jest.fn().mockResolvedValue({
              data: [mockBusiness],
              meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
            }),
            findOne: jest.fn().mockResolvedValue(mockBusiness),
            remove: jest.fn().mockResolvedValue({ message: 'Business deleted successfully' }),
            getStats: jest.fn().mockResolvedValue(mockStats),
          },
        },
      ],
    }).compile();

    controller = module.get<BusinessController>(BusinessController);
    businessService = module.get(BusinessService);
  });

  // ============================================================
  // Controller Method Existence
  // ============================================================
  describe('Controller Methods', () => {
    it('should have create method', () => {
      expect(controller.create).toBeDefined();
    });

    it('should have findAll method', () => {
      expect(controller.findAll).toBeDefined();
    });

    it('should have findOne method', () => {
      expect(controller.findOne).toBeDefined();
    });

    it('should have remove method', () => {
      expect(controller.remove).toBeDefined();
    });

    it('should have getStats method', () => {
      expect(controller.getStats).toBeDefined();
    });
  });

  // ============================================================
  // Create Business (POST)
  // ============================================================
  describe('create() - POST /api/businesses', () => {
    const createDto = {
      name: 'New Business',
      address: '456 Oak Ave',
      city: 'Freehold',
      state: 'NJ',
    };

    it('should create business and return the result', async () => {
      const result = await controller.create(createDto as any);

      expect(result).toEqual(mockBusiness);
      expect(businessService.create).toHaveBeenCalledWith(createDto);
    });

    it('should delegate to business service', async () => {
      await controller.create(createDto as any);

      expect(businessService.create).toHaveBeenCalledTimes(1);
    });
  });

  // ============================================================
  // Read Businesses (GET)
  // ============================================================
  describe('findAll() - GET /api/businesses', () => {
    it('should return paginated business list', async () => {
      const result = await controller.findAll({} as any);

      expect(result.data).toHaveLength(1);
      expect(result.meta).toBeDefined();
      expect(result.meta.total).toBe(1);
    });

    it('should pass query parameters to service', async () => {
      const query = { city: 'Freehold', page: 1, limit: 10 };
      await controller.findAll(query as any);

      expect(businessService.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('findOne() - GET /api/businesses/:id', () => {
    it('should return single business', async () => {
      const result = await controller.findOne(1);

      expect(result).toEqual(mockBusiness);
      expect(businessService.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('getStats() - GET /api/businesses/stats', () => {
    it('should return statistics', async () => {
      const result = await controller.getStats();

      expect(result).toEqual(mockStats);
    });
  });

  // ============================================================
  // Delete Business (DELETE) - Admin Only
  // ============================================================
  describe('remove() - DELETE /api/businesses/:id', () => {
    it('should delete business and return success message', async () => {
      const result = await controller.remove(1);

      expect(result).toEqual({ message: 'Business deleted successfully' });
      expect(businessService.remove).toHaveBeenCalledWith(1);
    });

    it('should propagate NotFoundException from service', async () => {
      businessService.remove.mockRejectedValue(
        new NotFoundException('Business with ID 999 not found'),
      );

      await expect(controller.remove(999)).rejects.toThrow(NotFoundException);
    });
  });

  // ============================================================
  // Role Decorator Verification (Metadata Tests)
  // ============================================================
  describe('Role Decorator Metadata', () => {
    it('should have @Roles(ADMIN) on remove method', () => {
      const { Reflector } = require('@nestjs/core');
      const reflector = new Reflector();
      const roles = reflector.get('roles', BusinessController.prototype.remove);

      expect(roles).toBeDefined();
      expect(roles).toContain(Role.ADMIN);
      expect(roles).not.toContain(Role.VIEWER);
      expect(roles).not.toContain(Role.MEMBER);
    });

    it('should have @Roles with VIEWER on findAll method', () => {
      const { Reflector } = require('@nestjs/core');
      const reflector = new Reflector();
      const roles = reflector.get('roles', BusinessController.prototype.findAll);

      expect(roles).toBeDefined();
      expect(roles).toContain(Role.VIEWER);
      expect(roles).toContain(Role.MEMBER);
      expect(roles).toContain(Role.ADMIN);
    });

    it('should have @Roles with VIEWER on getStats method', () => {
      const { Reflector } = require('@nestjs/core');
      const reflector = new Reflector();
      const roles = reflector.get('roles', BusinessController.prototype.getStats);

      expect(roles).toBeDefined();
      expect(roles).toContain(Role.VIEWER);
    });

    it('should have @Roles with VIEWER on findOne method', () => {
      const { Reflector } = require('@nestjs/core');
      const reflector = new Reflector();
      const roles = reflector.get('roles', BusinessController.prototype.findOne);

      expect(roles).toBeDefined();
      expect(roles).toContain(Role.VIEWER);
    });
  });
});
