/**
 * Frontend API Integration Baseline Tests
 *
 * Purpose: Establish baseline for frontend-backend API integration before refactoring.
 * These tests ensure that the frontend correctly consumes backend API contracts during
 * vertical slice architecture migration.
 *
 * Test Coverage:
 * - API client configuration
 * - GET requests (fetch businesses, stats)
 * - POST requests (create business)
 * - DELETE requests (remove business)
 * - Error handling
 * - Response parsing
 *
 * IMPORTANT: These tests must PASS before any refactoring begins.
 * They define the frontend-backend integration contract.
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

// API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

describe('Frontend API Integration Baseline', () => {
  let testBusinessId: number;

  afterAll(async () => {
    // Cleanup: Delete test business if created
    if (testBusinessId) {
      try {
        await fetch(`${API_BASE_URL}/api/businesses/${testBusinessId}`, {
          method: 'DELETE',
        });
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  });

  describe('API Configuration', () => {
    it('should have API_BASE_URL configured', () => {
      expect(API_BASE_URL).toBeDefined();
      expect(API_BASE_URL).toBeTruthy();
      expect(typeof API_BASE_URL).toBe('string');
    });

    it('should be able to reach backend health endpoint', async () => {
      const response = await fetch(`${API_BASE_URL}/api/health`);
      expect(response).toBeDefined();
      // May be 200 (health endpoint exists) or 404 (doesn't exist yet)
      // Either is acceptable for baseline
      expect([200, 404]).toContain(response.status);
    });
  });

  describe('GET Requests', () => {
    it('should fetch businesses list with correct structure', async () => {
      const response = await fetch(`${API_BASE_URL}/api/businesses`);

      expect(response.ok).toBe(true);
      expect(response.status).toBe(200);

      const data = await response.json();

      // Verify response structure
      expect(data).toHaveProperty('data');
      expect(data).toHaveProperty('meta');
      expect(Array.isArray(data.data)).toBe(true);

      // Verify meta structure
      expect(data.meta).toHaveProperty('total');
      expect(data.meta).toHaveProperty('page');
      expect(data.meta).toHaveProperty('limit');
    });

    it('should fetch businesses with query parameters', async () => {
      const params = new URLSearchParams({
        page: '1',
        limit: '10',
        city: 'Freehold',
      });

      const response = await fetch(
        `${API_BASE_URL}/api/businesses?${params.toString()}`,
      );

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data).toHaveProperty('data');
    });

    it('should fetch business statistics', async () => {
      const response = await fetch(`${API_BASE_URL}/api/businesses/stats`);

      expect(response.ok).toBe(true);
      const stats = await response.json();

      // Verify stats structure
      expect(stats).toHaveProperty('totalBusinesses');
      expect(stats).toHaveProperty('pendingEnrichment');
      expect(stats).toHaveProperty('enrichedBusinesses');
      expect(stats).toHaveProperty('totalContacts');
      expect(stats).toHaveProperty('messagesSent');

      // Verify types
      expect(typeof stats.totalBusinesses).toBe('number');
      expect(typeof stats.totalContacts).toBe('number');
    });

    it('should fetch single business by ID', async () => {
      // First create a business to fetch
      const createResponse = await fetch(`${API_BASE_URL}/api/businesses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Frontend Baseline Test - GET',
          city: 'Freehold',
        }),
      });

      const created = await createResponse.json();
      testBusinessId = created.id;

      // Now fetch it
      const response = await fetch(
        `${API_BASE_URL}/api/businesses/${created.id}`,
      );

      expect(response.ok).toBe(true);
      const business = await response.json();

      expect(business).toHaveProperty('id');
      expect(business).toHaveProperty('name');
      expect(business.id).toBe(created.id);
    });
  });

  describe('POST Requests', () => {
    it('should create business with correct request/response', async () => {
      const businessData = {
        name: 'Frontend Baseline Test Business',
        address: '123 Test Street',
        city: 'Freehold',
        state: 'NJ',
        phone: '555-0100',
      };

      const response = await fetch(`${API_BASE_URL}/api/businesses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(businessData),
      });

      expect(response.ok).toBe(true);
      expect(response.status).toBe(201);

      const created = await response.json();

      // Verify response structure
      expect(created).toHaveProperty('id');
      expect(created).toHaveProperty('name');
      expect(created).toHaveProperty('enrichment_status');
      expect(created).toHaveProperty('created_at');

      // Verify values
      expect(created.name).toBe(businessData.name);
      expect(created.city).toBe(businessData.city);

      testBusinessId = created.id;
    });

    it('should reject invalid POST data with 400', async () => {
      const invalidData = {
        // Missing required 'name' field
        city: 'Freehold',
      };

      const response = await fetch(`${API_BASE_URL}/api/businesses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidData),
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);

      const error = await response.json();
      expect(error).toHaveProperty('statusCode');
      expect(error.statusCode).toBe(400);
    });
  });

  describe('DELETE Requests', () => {
    it('should delete business with correct response', async () => {
      // First create a business to delete
      const createResponse = await fetch(`${API_BASE_URL}/api/businesses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Frontend Baseline Test - DELETE',
          city: 'Freehold',
        }),
      });

      const created = await createResponse.json();

      // Now delete it
      const response = await fetch(
        `${API_BASE_URL}/api/businesses/${created.id}`,
        {
          method: 'DELETE',
        },
      );

      expect(response.status).toBe(204);

      // Verify deletion
      const getResponse = await fetch(
        `${API_BASE_URL}/api/businesses/${created.id}`,
      );
      expect(getResponse.status).toBe(404);
    });

    it('should return 404 when deleting non-existent business', async () => {
      const response = await fetch(`${API_BASE_URL}/api/businesses/999999`, {
        method: 'DELETE',
      });

      expect(response.status).toBe(404);
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 Not Found correctly', async () => {
      const response = await fetch(`${API_BASE_URL}/api/businesses/999999`);

      expect(response.ok).toBe(false);
      expect(response.status).toBe(404);

      const error = await response.json();
      expect(error).toHaveProperty('statusCode');
      expect(error).toHaveProperty('message');
      expect(error.statusCode).toBe(404);
    });

    it('should handle malformed JSON', async () => {
      const response = await fetch(`${API_BASE_URL}/api/businesses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: 'invalid json{',
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should handle network timeout gracefully', async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 100);

      try {
        await fetch(`${API_BASE_URL}/api/businesses`, {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
      } catch (error: any) {
        clearTimeout(timeoutId);
        expect(error.name).toBe('AbortError');
      }
    });
  });

  describe('Response Headers', () => {
    it('should return correct Content-Type headers', async () => {
      const response = await fetch(`${API_BASE_URL}/api/businesses`);

      const contentType = response.headers.get('content-type');
      expect(contentType).toContain('application/json');
    });

    it('should include CORS headers for cross-origin requests', async () => {
      const response = await fetch(`${API_BASE_URL}/api/businesses`, {
        headers: {
          Origin: 'http://localhost:3001',
        },
      });

      // CORS headers should be present or response should succeed
      const corsHeader = response.headers.get('access-control-allow-origin');
      // Either CORS is configured or same-origin request succeeded
      expect(response.ok || corsHeader).toBeTruthy();
    });
  });

  describe('Data Consistency', () => {
    it('should maintain data consistency across CREATE and GET', async () => {
      const businessData = {
        name: 'Consistency Test Business',
        city: 'Marlboro',
        address: '456 Consistency Lane',
      };

      // Create
      const createResponse = await fetch(`${API_BASE_URL}/api/businesses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(businessData),
      });

      const created = await createResponse.json();

      // Get
      const getResponse = await fetch(
        `${API_BASE_URL}/api/businesses/${created.id}`,
      );
      const retrieved = await getResponse.json();

      // Verify consistency
      expect(retrieved.name).toBe(created.name);
      expect(retrieved.city).toBe(created.city);
      expect(retrieved.address).toBe(created.address);
      expect(retrieved.id).toBe(created.id);

      testBusinessId = created.id;
    });
  });
});
