/**
 * WebSocket Contract Baseline Tests
 *
 * Purpose: Establish baseline contract for all WebSocket events before refactoring.
 * These tests ensure that WebSocket event structures and behavior remain consistent
 * during vertical slice architecture migration.
 *
 * Test Coverage:
 * - Connection/disconnection handling
 * - Event emission structure
 * - Event types and payloads
 * - Client-server communication
 *
 * IMPORTANT: These tests must PASS before any refactoring begins.
 * They define the real-time contract that must be maintained.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { io, Socket } from 'socket.io-client';
import { AppModule } from '../../src/app.module';
import { EventsGateway } from '../../src/websocket/websocket.gateway';
import { RedisService } from '../../src/caching/redis.service';

// Mock RedisService for testing
const mockRedisService = {
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue('OK'),
  del: jest.fn().mockResolvedValue(1),
  deletePattern: jest.fn().mockResolvedValue(0),
  isConnected: jest.fn().mockReturnValue(true),
};

describe('WebSocket Contract Baseline (e2e)', () => {
  let app: INestApplication;
  let gateway: EventsGateway;
  let clientSocket: Socket;
  let serverUrl: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(RedisService)
      .useValue(mockRedisService)
      .compile();

    app = moduleFixture.createNestApplication();
    gateway = app.get<EventsGateway>(EventsGateway);

    await app.listen(0); // Random available port

    const address = app.getHttpServer().address();
    const port = address.port;
    serverUrl = `http://localhost:${port}`;
  });

  afterAll(async () => {
    if (clientSocket && clientSocket.connected) {
      clientSocket.disconnect();
    }
    await app.close();
  });

  beforeEach((done) => {
    // Create fresh client connection for each test
    clientSocket = io(serverUrl, {
      transports: ['websocket'],
      reconnection: false,
    });

    clientSocket.on('connect', () => {
      done();
    });
  });

  afterEach(() => {
    if (clientSocket && clientSocket.connected) {
      clientSocket.disconnect();
    }
  });

  describe('Connection Contract', () => {
    it('should successfully connect to WebSocket server', (done) => {
      expect(clientSocket.connected).toBe(true);
      expect(clientSocket.id).toBeDefined();
      done();
    });

    it('should handle disconnection gracefully', (done) => {
      clientSocket.on('disconnect', () => {
        expect(clientSocket.connected).toBe(false);
        done();
      });

      clientSocket.disconnect();
    });

    it('should allow multiple client connections', (done) => {
      const client2 = io(serverUrl, {
        transports: ['websocket'],
        reconnection: false,
      });

      client2.on('connect', () => {
        expect(client2.connected).toBe(true);
        expect(client2.id).not.toBe(clientSocket.id);
        client2.disconnect();
        done();
      });
    });
  });

  describe('Ping/Pong Contract', () => {
    it('should respond to ping with pong', (done) => {
      clientSocket.emit('ping', 'test', (response: string) => {
        expect(response).toBe('pong');
        done();
      });
    });
  });

  describe('Business Events Contract', () => {
    describe('business:created event', () => {
      it('should emit business:created with correct structure', (done) => {
        const testBusiness = {
          id: 1,
          name: 'Test Business',
          city: 'Freehold',
          enrichment_status: 'pending',
          created_at: new Date().toISOString(),
        };

        clientSocket.on('business:created', (payload: any) => {
          // Verify payload structure
          expect(payload).toBeDefined();
          expect(payload).toHaveProperty('id');
          expect(payload).toHaveProperty('name');
          expect(payload).toHaveProperty('enrichment_status');

          // Verify values
          expect(payload.id).toBe(testBusiness.id);
          expect(payload.name).toBe(testBusiness.name);

          done();
        });

        // Trigger event from gateway
        gateway.emitBusinessCreated(testBusiness);
      });

      it('should broadcast to all connected clients', (done) => {
        const client2 = io(serverUrl, {
          transports: ['websocket'],
          reconnection: false,
        });

        let receivedCount = 0;
        const testBusiness = {
          id: 2,
          name: 'Broadcast Test',
          city: 'Freehold',
          enrichment_status: 'pending',
        };

        const checkCompletion = () => {
          receivedCount++;
          if (receivedCount === 2) {
            client2.disconnect();
            done();
          }
        };

        clientSocket.on('business:created', (payload: any) => {
          expect(payload.name).toBe('Broadcast Test');
          checkCompletion();
        });

        client2.on('connect', () => {
          client2.on('business:created', (payload: any) => {
            expect(payload.name).toBe('Broadcast Test');
            checkCompletion();
          });

          // Emit after both clients are listening
          gateway.emitBusinessCreated(testBusiness);
        });
      });
    });

    describe('business:enriched event', () => {
      it('should emit business:enriched with correct structure', (done) => {
        const enrichedBusiness = {
          id: 3,
          name: 'Enriched Business',
          enrichment_status: 'enriched',
          contacts: [
            {
              id: 1,
              email: 'test@example.com',
              name: 'John Doe',
            },
          ],
        };

        clientSocket.on('business:enriched', (payload: any) => {
          expect(payload).toBeDefined();
          expect(payload).toHaveProperty('id');
          expect(payload).toHaveProperty('enrichment_status');
          expect(payload.enrichment_status).toBe('enriched');

          done();
        });

        gateway.emitBusinessEnriched(enrichedBusiness);
      });
    });
  });

  describe('Stats Events Contract', () => {
    it('should emit stats:updated with correct structure', (done) => {
      const stats = {
        total: 100,
        pending: 50,
        enriched: 40,
        failed: 10,
        by_city: {
          Freehold: 60,
          Marlboro: 40,
        },
      };

      clientSocket.on('stats:updated', (payload: any) => {
        expect(payload).toBeDefined();
        expect(payload).toHaveProperty('total');
        expect(payload).toHaveProperty('pending');
        expect(payload).toHaveProperty('enriched');
        expect(payload).toHaveProperty('failed');
        expect(payload).toHaveProperty('by_city');

        expect(payload.total).toBe(100);
        expect(typeof payload.by_city).toBe('object');

        done();
      });

      gateway.emitStatsUpdated(stats);
    });
  });

  describe('Progress Events Contract', () => {
    describe('scraping:progress event', () => {
      it('should emit scraping progress with correct structure', (done) => {
        const progress = {
          status: 'in_progress',
          current: 15,
          total: 50,
          percentage: 30,
          message: 'Scraping businesses from Google Maps',
        };

        clientSocket.on('scraping:progress', (payload: any) => {
          expect(payload).toBeDefined();
          expect(payload).toHaveProperty('status');
          expect(payload).toHaveProperty('current');
          expect(payload).toHaveProperty('total');
          expect(payload).toHaveProperty('percentage');

          expect(payload.status).toBe('in_progress');
          expect(typeof payload.current).toBe('number');
          expect(typeof payload.total).toBe('number');

          done();
        });

        gateway.emitScrapingProgress(progress);
      });
    });

    describe('enrichment:progress event', () => {
      it('should emit enrichment progress with correct structure', (done) => {
        const progress = {
          status: 'in_progress',
          current: 8,
          total: 20,
          percentage: 40,
          message: 'Enriching business data',
        };

        clientSocket.on('enrichment:progress', (payload: any) => {
          expect(payload).toBeDefined();
          expect(payload).toHaveProperty('status');
          expect(payload).toHaveProperty('current');
          expect(payload).toHaveProperty('total');

          expect(payload.current).toBe(8);
          expect(payload.total).toBe(20);

          done();
        });

        gateway.emitEnrichmentProgress(progress);
      });
    });
  });

  describe('Error Handling Contract', () => {
    it('should handle invalid event names gracefully', (done) => {
      // Emit an event that doesn't exist
      clientSocket.emit('nonexistent:event', { data: 'test' });

      // Socket should remain connected
      setTimeout(() => {
        expect(clientSocket.connected).toBe(true);
        done();
      }, 100);
    });

    it('should handle malformed event data', (done) => {
      clientSocket.emit('ping', null);

      // Socket should remain connected
      setTimeout(() => {
        expect(clientSocket.connected).toBe(true);
        done();
      }, 100);
    });
  });

  describe('Connection Stability Contract', () => {
    it('should maintain connection during rapid event emission', (done) => {
      let receivedCount = 0;
      const expectedCount = 10;

      clientSocket.on('business:created', () => {
        receivedCount++;
        if (receivedCount === expectedCount) {
          expect(clientSocket.connected).toBe(true);
          done();
        }
      });

      // Emit multiple events rapidly
      for (let i = 0; i < expectedCount; i++) {
        gateway.emitBusinessCreated({
          id: i,
          name: `Business ${i}`,
          enrichment_status: 'pending',
        });
      }
    });

    it('should not lose events during concurrent emissions', (done) => {
      const events = {
        businessCreated: false,
        businessEnriched: false,
        statsUpdated: false,
      };

      clientSocket.on('business:created', () => {
        events.businessCreated = true;
        checkAllReceived();
      });

      clientSocket.on('business:enriched', () => {
        events.businessEnriched = true;
        checkAllReceived();
      });

      clientSocket.on('stats:updated', () => {
        events.statsUpdated = true;
        checkAllReceived();
      });

      const checkAllReceived = () => {
        if (
          events.businessCreated &&
          events.businessEnriched &&
          events.statsUpdated
        ) {
          done();
        }
      };

      // Emit all events concurrently
      gateway.emitBusinessCreated({ id: 1, name: 'Test' });
      gateway.emitBusinessEnriched({ id: 1, enrichment_status: 'enriched' });
      gateway.emitStatsUpdated({ total: 100 });
    });
  });
});
