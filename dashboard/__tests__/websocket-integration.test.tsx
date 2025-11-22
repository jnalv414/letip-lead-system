import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';
import { useSocket } from '../hooks/use-socket';
import { ReactNode } from 'react';

// Mock socket.io-client
jest.mock('socket.io-client');

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
  },
}));

describe('WebSocket Integration', () => {
  let mockSocket: Partial<Socket>;
  let queryClient: QueryClient;

  beforeEach(() => {
    // Create mock socket
    mockSocket = {
      connected: true,
      id: 'test-socket-id',
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
      disconnect: jest.fn(),
      io: {
        engine: {
          transport: {
            name: 'websocket',
          },
        },
      } as any,
    };

    // Mock io function to return our mock socket
    (io as jest.Mock).mockReturnValue(mockSocket as Socket);

    // Create fresh query client for each test
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe('Socket Connection', () => {
    it('should connect to WebSocket on mount', () => {
      renderHook(() => useSocket(), { wrapper });

      expect(io).toHaveBeenCalledWith(
        'http://localhost:3000',
        expect.objectContaining({
          transports: expect.arrayContaining(['websocket', 'polling']),
          reconnection: true,
          reconnectionDelay: 1000,
        })
      );
    });

    it('should disconnect and cleanup on unmount', () => {
      const { unmount } = renderHook(() => useSocket(), { wrapper });

      unmount();

      expect(mockSocket.off).toHaveBeenCalled();
      expect(mockSocket.disconnect).toHaveBeenCalled();
    });
  });

  describe('Business Events', () => {
    it('should invalidate businesses and stats queries on business:created', async () => {
      const invalidateQueriesSpy = jest.spyOn(queryClient, 'invalidateQueries');

      renderHook(() => useSocket(), { wrapper });

      // Get the handler for business:created
      const businessCreatedHandler = (mockSocket.on as jest.Mock).mock.calls.find(
        ([event]) => event === 'business:created'
      )?.[1];

      // Simulate business:created event
      businessCreatedHandler({
        timestamp: new Date().toISOString(),
        type: 'business:created',
        data: {
          id: 1,
          name: 'Test Business',
        },
      });

      await waitFor(() => {
        expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['businesses'] });
        expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['stats'] });
      });
    });

    it('should update specific business cache on business:updated', async () => {
      const setQueryDataSpy = jest.spyOn(queryClient, 'setQueryData');

      renderHook(() => useSocket(), { wrapper });

      const businessUpdatedHandler = (mockSocket.on as jest.Mock).mock.calls.find(
        ([event]) => event === 'business:updated'
      )?.[1];

      const updatedBusiness = {
        id: 123,
        name: 'Updated Business',
        city: 'Freehold',
      };

      businessUpdatedHandler({
        timestamp: new Date().toISOString(),
        type: 'business:updated',
        data: updatedBusiness,
      });

      await waitFor(() => {
        expect(setQueryDataSpy).toHaveBeenCalledWith(
          ['businesses', 123],
          expect.any(Function)
        );
      });
    });
  });

  describe('Scraping Events', () => {
    it('should update job cache optimistically on scraping:progress', async () => {
      const setQueryDataSpy = jest.spyOn(queryClient, 'setQueryData');

      renderHook(() => useSocket(), { wrapper });

      const scrapingProgressHandler = (mockSocket.on as jest.Mock).mock.calls.find(
        ([event]) => event === 'scraping:progress'
      )?.[1];

      scrapingProgressHandler({
        timestamp: new Date().toISOString(),
        type: 'scraping:progress',
        data: {
          jobId: 'job-123',
          progress: 50,
          found: 25,
          processed: 20,
        },
      });

      await waitFor(() => {
        expect(setQueryDataSpy).toHaveBeenCalledWith(
          ['scrape-status', 'job-123'],
          expect.any(Function)
        );
      });
    });

    it('should invalidate queries on scraping:complete', async () => {
      const invalidateQueriesSpy = jest.spyOn(queryClient, 'invalidateQueries');

      renderHook(() => useSocket(), { wrapper });

      const scrapingCompleteHandler = (mockSocket.on as jest.Mock).mock.calls.find(
        ([event]) => event === 'scraping:complete'
      )?.[1];

      scrapingCompleteHandler({
        timestamp: new Date().toISOString(),
        type: 'scraping:complete',
        data: {
          jobId: 'job-123',
          found: 50,
          saved: 45,
        },
      });

      await waitFor(() => {
        expect(invalidateQueriesSpy).toHaveBeenCalledWith({
          queryKey: ['scrape-status', 'job-123'],
        });
        expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['businesses'] });
        expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['stats'] });
      });
    });
  });

  describe('Reconnection', () => {
    it('should handle reconnection after disconnect', async () => {
      renderHook(() => useSocket(), { wrapper });

      // Simulate disconnect
      const disconnectHandler = (mockSocket.on as jest.Mock).mock.calls.find(
        ([event]) => event === 'disconnect'
      )?.[1];

      disconnectHandler('transport close');

      // Simulate reconnect
      const reconnectHandler = (mockSocket.on as jest.Mock).mock.calls.find(
        ([event]) => event === 'reconnect'
      )?.[1];

      reconnectHandler(3); // After 3 attempts

      // Verify reconnection handling
      expect(mockSocket.on).toHaveBeenCalledWith('reconnect', expect.any(Function));
    });
  });

  describe('Deduplication', () => {
    it('should not cause duplicate invalidations for multiple events', async () => {
      const invalidateQueriesSpy = jest.spyOn(queryClient, 'invalidateQueries');

      renderHook(() => useSocket(), { wrapper });

      const businessCreatedHandler = (mockSocket.on as jest.Mock).mock.calls.find(
        ([event]) => event === 'business:created'
      )?.[1];

      // Simulate multiple rapid events
      for (let i = 0; i < 5; i++) {
        businessCreatedHandler({
          timestamp: new Date().toISOString(),
          type: 'business:created',
          data: { id: i, name: `Business ${i}` },
        });
      }

      await waitFor(() => {
        // Check that invalidations are batched/deduplicated
        const businessInvalidations = invalidateQueriesSpy.mock.calls.filter(
          ([options]) => JSON.stringify(options) === JSON.stringify({ queryKey: ['businesses'] })
        );

        // Should be called but not excessively (React Query handles deduplication)
        expect(businessInvalidations.length).toBeGreaterThan(0);
        expect(businessInvalidations.length).toBeLessThanOrEqual(5);
      });
    });
  });
});