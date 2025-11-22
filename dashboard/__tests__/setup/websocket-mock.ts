/**
 * WebSocket mock implementation for testing real-time features
 */

import { EventEmitter } from 'events';

export class MockSocket extends EventEmitter {
  public connected: boolean = true;
  public id: string = 'mock-socket-id';
  private serverEmitter: EventEmitter = new EventEmitter();

  constructor() {
    super();
    this.setMaxListeners(20); // Prevent memory leak warnings in tests
  }

  /**
   * Override the on method to register both client and server listeners
   */
  on(event: string, handler: (...args: any[]) => void): this {
    super.on(event, handler);
    return this;
  }

  /**
   * Override emit to simulate client-to-server communication
   */
  emit(event: string, ...args: any[]): boolean {
    // Simulate server acknowledgment for certain events
    if (event === 'ping') {
      setTimeout(() => this.simulateServerEvent('pong', { timestamp: Date.now() }), 10);
    }
    return super.emit(event, ...args);
  }

  /**
   * Simulate a server-initiated event
   */
  simulateServerEvent(event: string, data: any): void {
    // Wrap in setTimeout to simulate network delay
    setTimeout(() => {
      super.emit(event, data);
    }, 0);
  }

  /**
   * Simulate connection loss
   */
  simulateDisconnect(): void {
    this.connected = false;
    this.simulateServerEvent('disconnect', { reason: 'transport close' });
  }

  /**
   * Simulate reconnection
   */
  simulateReconnect(): void {
    this.connected = true;
    this.simulateServerEvent('connect', {});
  }

  /**
   * Disconnect and cleanup
   */
  disconnect(): void {
    this.connected = false;
    this.removeAllListeners();
    this.serverEmitter.removeAllListeners();
  }

  /**
   * Mock implementation of socket.io's volatile
   */
  get volatile() {
    return this;
  }
}

/**
 * Creates a mock socket context with helper methods for testing
 */
export function createMockSocketContext() {
  const socket = new MockSocket();

  return {
    socket,

    // Business events
    simulateBusinessCreated: (business: any) => {
      socket.simulateServerEvent('business:created', {
        timestamp: new Date().toISOString(),
        type: 'business:created',
        data: business,
      });
    },

    simulateBusinessUpdated: (business: any) => {
      socket.simulateServerEvent('business:updated', {
        timestamp: new Date().toISOString(),
        type: 'business:updated',
        data: business,
      });
    },

    simulateBusinessDeleted: (id: number) => {
      socket.simulateServerEvent('business:deleted', {
        timestamp: new Date().toISOString(),
        type: 'business:deleted',
        data: { id },
      });
    },

    simulateBusinessEnriched: (business: any) => {
      socket.simulateServerEvent('business:enriched', {
        timestamp: new Date().toISOString(),
        type: 'business:enriched',
        data: business,
      });
    },

    // Stats events
    simulateStatsUpdated: (stats: any) => {
      socket.simulateServerEvent('stats:updated', {
        timestamp: new Date().toISOString(),
        type: 'stats:updated',
        data: stats,
      });
    },

    // Scraping events
    simulateScrapingStarted: (location: string, totalExpected: number) => {
      socket.simulateServerEvent('scraping:started', {
        timestamp: new Date().toISOString(),
        type: 'scraping:started',
        data: { location, totalExpected },
      });
    },

    simulateScrapingProgress: (current: number, total: number) => {
      socket.simulateServerEvent('scraping:progress', {
        timestamp: new Date().toISOString(),
        type: 'scraping:progress',
        data: { current, total, percentage: (current / total) * 100 },
      });
    },

    simulateScrapingCompleted: (results: any) => {
      socket.simulateServerEvent('scraping:completed', {
        timestamp: new Date().toISOString(),
        type: 'scraping:completed',
        data: results,
      });
    },

    simulateScrapingError: (error: string) => {
      socket.simulateServerEvent('scraping:error', {
        timestamp: new Date().toISOString(),
        type: 'scraping:error',
        data: { error },
      });
    },

    // Enrichment events
    simulateEnrichmentProgress: (current: number, total: number) => {
      socket.simulateServerEvent('enrichment:progress', {
        timestamp: new Date().toISOString(),
        type: 'enrichment:progress',
        data: { current, total, percentage: (current / total) * 100 },
      });
    },

    // Connection events
    simulateConnectionLost: () => {
      socket.simulateDisconnect();
    },

    simulateConnectionRestored: () => {
      socket.simulateReconnect();
    },

    // Helper to wait for event
    waitForEvent: (eventName: string, timeout: number = 5000): Promise<any> => {
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          reject(new Error(`Timeout waiting for event: ${eventName}`));
        }, timeout);

        socket.once(eventName, (data) => {
          clearTimeout(timer);
          resolve(data);
        });
      });
    },

    // Verify event was emitted by client
    expectClientEmission: (eventName: string, data?: any) => {
      return new Promise<boolean>((resolve) => {
        const handler = jest.fn();
        socket.on(eventName, handler);

        setTimeout(() => {
          if (data !== undefined) {
            resolve(handler.mock.calls.some(call =>
              JSON.stringify(call[0]) === JSON.stringify(data)
            ));
          } else {
            resolve(handler.mock.calls.length > 0);
          }
        }, 100);
      });
    },

    // Clear all listeners
    cleanup: () => {
      socket.disconnect();
    },
  };
}

/**
 * Mock implementation for socket.io-client
 * Use this in jest.setup.js or individual tests
 */
export const mockSocketIO = {
  connect: jest.fn(() => new MockSocket()),
  Socket: MockSocket,
};

// Helper type for TypeScript
export type MockSocketContext = ReturnType<typeof createMockSocketContext>;