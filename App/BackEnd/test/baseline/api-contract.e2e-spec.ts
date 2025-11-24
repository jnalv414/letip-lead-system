/**
 * API Contract Baseline Tests
 *
 * Purpose: Establish baseline contract for all API endpoints before refactoring.
 * These tests ensure that API response structures remain consistent during
 * vertical slice architecture migration.
 *
 * Test Coverage:
 * - Business CRUD endpoints
 * - Scraper endpoints
 * - Stats endpoints
 * - Error responses
 *
 * IMPORTANT: These tests must PASS before any refactoring begins.
 * They define the contract that must be maintained.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { RedisService } from '../../src/caching/redis.service';

// Mock RedisService for testing
const mockRedisService = {
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue('OK'),
  del: jest.fn().mockResolvedValue(1),
  deletePattern: jest.fn().mockResolvedValue(0),
  isConnected: jest.fn().mockReturnValue(true),
};

describe('API Contract Baseline (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let testBusinessId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(RedisService)
      .useValue(mockRedisService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));

    prisma = app.get<PrismaService>(PrismaService);

    await app.init();
  });

  afterAll(async () => {
    // Cleanup test data
    if (testBusinessId) {
      await prisma.business.deleteMany({
        where: { name: { contains: 'Baseline Test' } },
      });
    }

    await app.close();
  });

  describe('Business Endpoints Contract', () => {
    describe('POST /api/businesses', () => {
      it('should create business with correct response structure', async () => {
        const createDto = {
          name: 'Baseline Test Business',
          address: '123 Test St',
          city: 'Freehold',
          state: 'NJ',
          phone: '555-0100',
        };

        const response = await request(app.getHttpServer())
          .post('/api/businesses')
          .send(createDto)
          .expect(201);

        // Verify response structure
        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('name');
        expect(response.body).toHaveProperty('address');
        expect(response.body).toHaveProperty('city');
        expect(response.body).toHaveProperty('state');
        expect(response.body).toHaveProperty('enrichment_status');
        expect(response.body).toHaveProperty('created_at');
        expect(response.body).toHaveProperty('updated_at');

        // Verify values
        expect(response.body.name).toBe(createDto.name);
        expect(response.body.enrichment_status).toBe('pending');

        testBusinessId = response.body.id;
      });

      it('should reject invalid business data with 400', async () => {
        const invalidDto = {
          // Missing required 'name' field
          city: 'Freehold',
        };

        await request(app.getHttpServer())
          .post('/api/businesses')
          .send(invalidDto)
          .expect(400);
      });
    });

    describe('GET /api/businesses', () => {
      it('should return paginated list with correct structure', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/businesses')
          .query({ page: 1, limit: 20 })
          .expect(200);

        // Verify pagination structure
        expect(response.body).toHaveProperty('data');
        expect(response.body).toHaveProperty('meta');
        expect(Array.isArray(response.body.data)).toBe(true);

        // Verify meta structure
        expect(response.body.meta).toHaveProperty('total');
        expect(response.body.meta).toHaveProperty('page');
        expect(response.body.meta).toHaveProperty('limit');

        // If data exists, verify business structure
        if (response.body.data.length > 0) {
          const business = response.body.data[0];
          expect(business).toHaveProperty('id');
          expect(business).toHaveProperty('name');
          expect(business).toHaveProperty('enrichment_status');
        }
      });

      it('should filter by city', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/businesses')
          .query({ city: 'Freehold' })
          .expect(200);

        expect(response.body).toHaveProperty('data');
        expect(Array.isArray(response.body.data)).toBe(true);
      });

      it('should filter by enrichment_status', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/businesses')
          .query({ enrichment_status: 'pending' })
          .expect(200);

        expect(response.body).toHaveProperty('data');

        // All returned businesses should have pending status
        if (response.body.data.length > 0) {
          response.body.data.forEach((business: any) => {
            expect(business.enrichment_status).toBe('pending');
          });
        }
      });
    });

    describe('GET /api/businesses/stats', () => {
      it('should return statistics with correct structure', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/businesses/stats')
          .expect(200);

        // Verify stats structure
        expect(response.body).toHaveProperty('total');
        expect(response.body).toHaveProperty('pending');
        expect(response.body).toHaveProperty('enriched');
        expect(response.body).toHaveProperty('failed');
        expect(response.body).toHaveProperty('by_city');

        // Verify types
        expect(typeof response.body.total).toBe('number');
        expect(typeof response.body.pending).toBe('number');
        expect(typeof response.body.enriched).toBe('number');
        expect(typeof response.body.failed).toBe('number');
        expect(typeof response.body.by_city).toBe('object');
      });
    });

    describe('GET /api/businesses/:id', () => {
      it('should return single business with correct structure', async () => {
        // First create a business to retrieve
        if (!testBusinessId) {
          const createResponse = await request(app.getHttpServer())
            .post('/api/businesses')
            .send({ name: 'Baseline Test Get Business', city: 'Freehold' });
          testBusinessId = createResponse.body.id;
        }

        const response = await request(app.getHttpServer())
          .get(`/api/businesses/${testBusinessId}`)
          .expect(200);

        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('name');
        expect(response.body).toHaveProperty('enrichment_status');
        expect(response.body.id).toBe(testBusinessId);
      });

      it('should return 404 for non-existent business', async () => {
        await request(app.getHttpServer())
          .get('/api/businesses/999999')
          .expect(404);
      });
    });

    describe('DELETE /api/businesses/:id', () => {
      it('should delete business and return 204', async () => {
        // Create a business to delete
        const createResponse = await request(app.getHttpServer())
          .post('/api/businesses')
          .send({ name: 'Baseline Test Delete Business', city: 'Freehold' });

        const businessId = createResponse.body.id;

        await request(app.getHttpServer())
          .delete(`/api/businesses/${businessId}`)
          .expect(204);

        // Verify deletion
        await request(app.getHttpServer())
          .get(`/api/businesses/${businessId}`)
          .expect(404);
      });

      it('should return 404 when deleting non-existent business', async () => {
        await request(app.getHttpServer())
          .delete('/api/businesses/999999')
          .expect(404);
      });
    });
  });

  describe('Scraper Endpoints Contract', () => {
    describe('POST /api/scrape', () => {
      it('should accept valid scrape request and return correct structure', async () => {
        const scrapeDto = {
          location: 'Freehold, NJ',
          radius: 1,
          business_type: 'restaurant',
          max_results: 10,
        };

        const response = await request(app.getHttpServer())
          .post('/api/scrape')
          .send(scrapeDto)
          .expect(200);

        // Verify response structure
        expect(response.body).toHaveProperty('found');
        expect(response.body).toHaveProperty('saved');
        expect(typeof response.body.found).toBe('number');
        expect(typeof response.body.saved).toBe('number');
      });

      it('should reject invalid scrape request with 400', async () => {
        const invalidDto = {
          // Missing required 'location' field
          radius: 1,
        };

        await request(app.getHttpServer())
          .post('/api/scrape')
          .send(invalidDto)
          .expect(400);
      });

      it('should reject invalid radius values', async () => {
        const invalidDto = {
          location: 'Freehold, NJ',
          radius: 100, // Exceeds max of 5
        };

        await request(app.getHttpServer())
          .post('/api/scrape')
          .send(invalidDto)
          .expect(400);
      });
    });
  });

  describe('Error Response Contract', () => {
    it('should return consistent error structure for validation errors', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/businesses')
        .send({})
        .expect(400);

      // NestJS validation error structure
      expect(response.body).toHaveProperty('statusCode');
      expect(response.body).toHaveProperty('message');
      expect(response.body.statusCode).toBe(400);
    });

    it('should return consistent error structure for not found errors', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/businesses/999999')
        .expect(404);

      expect(response.body).toHaveProperty('statusCode');
      expect(response.body).toHaveProperty('message');
      expect(response.body.statusCode).toBe(404);
    });

    it('should return 404 for non-existent routes', async () => {
      await request(app.getHttpServer())
        .get('/api/nonexistent')
        .expect(404);
    });
  });
});
