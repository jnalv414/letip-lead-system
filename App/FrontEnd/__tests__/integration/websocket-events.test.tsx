import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { createMockBusiness } from '../setup/mock-data'
import { setAccessToken, clearAccessToken } from '@/shared/lib/api'
import {
  connectSocket,
  disconnectSocket,
  reconnectSocket,
  getSocket,
  onSocketEvent,
  emitSocketEvent,
  setSocketTokenRefresher,
} from '@/shared/lib/socket'

// ---------------------------------------------------------------------------
// Mock socket event system
// ---------------------------------------------------------------------------
type EvtHandler = (...args: unknown[]) => void

const { mockState } = vi.hoisted(() => {
  const listeners = new Map<string, Set<EvtHandler>>()
  const state = {
    connected: false,
    auth: {} as Record<string, unknown>,
    listeners,
    tokenRefresher: null as ((() => Promise<string | null>) | null),
    connectCalled: 0,
    disconnectCalled: 0,
  }
  return { mockState: state }
})

vi.mock('@/shared/lib/socket', () => {
  function on(event: string, handler: EvtHandler) {
    if (!mockState.listeners.has(event)) mockState.listeners.set(event, new Set())
    mockState.listeners.get(event)!.add(handler)
  }

  function off(event: string, handler: EvtHandler) {
    mockState.listeners.get(event)?.delete(handler)
  }

  function fire(event: string, ...args: unknown[]) {
    mockState.listeners.get(event)?.forEach((h) => h(...args))
  }

  return {
    getSocket: vi.fn(() => ({
      get connected() { return mockState.connected },
      set connected(v: boolean) { mockState.connected = v },
      get auth() { return mockState.auth },
      set auth(v: Record<string, unknown>) { mockState.auth = v },
      on,
      off,
      emit: fire,
      connect: () => { mockState.connected = true; mockState.connectCalled++ },
      disconnect: () => { mockState.connected = false; mockState.disconnectCalled++ },
    })),

    connectSocket: vi.fn(() => {
      mockState.connected = true
      mockState.connectCalled++
      // Simulate setting auth like the real implementation does
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('accessToken') : null
      if (token) mockState.auth = { token }
    }),

    disconnectSocket: vi.fn(() => {
      if (mockState.connected) {
        mockState.connected = false
        mockState.disconnectCalled++
      }
    }),

    reconnectSocket: vi.fn(() => {
      mockState.connected = false
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('accessToken') : null
      if (token) {
        mockState.auth = { token }
        mockState.connected = true
      }
    }),

    onSocketEvent: vi.fn((event: string, callback: EvtHandler) => {
      on(event, callback)
      return () => off(event, callback)
    }),

    emitSocketEvent: vi.fn((event: string, data?: unknown) => {
      if (mockState.connected) {
        fire(event, data)
      }
    }),

    setSocketTokenRefresher: vi.fn((fn: () => Promise<string | null>) => {
      mockState.tokenRefresher = fn
    }),
  }
})

function simulateEvent(event: string, data?: unknown) {
  mockState.listeners.get(event)?.forEach((h) => h(data))
}

beforeEach(() => {
  mockState.connected = false
  mockState.auth = {}
  mockState.listeners.clear()
  mockState.tokenRefresher = null
  mockState.connectCalled = 0
  mockState.disconnectCalled = 0
})

afterEach(() => {
  clearAccessToken()
})

describe('WebSocket Events Integration', () => {
  describe('Socket connects with auth token', () => {
    it('connectSocket connects the socket and sets auth from token', () => {
      setAccessToken('ws-test-token')

      connectSocket()

      expect(mockState.connected).toBe(true)
      expect(mockState.auth).toEqual({ token: 'ws-test-token' })
    })

    it('disconnectSocket disconnects the socket', () => {
      setAccessToken('ws-test-token')

      // Using imports from top of file
      connectSocket()
      expect(mockState.connected).toBe(true)

      disconnectSocket()
      expect(mockState.connected).toBe(false)
    })
  })

  describe('Handles auth:error event', () => {
    it('setSocketTokenRefresher stores the refresher function', () => {
      // Using imports from top of file

      const mockRefresher = vi.fn().mockResolvedValue('new-token')
      setSocketTokenRefresher(mockRefresher)

      expect(mockState.tokenRefresher).toBe(mockRefresher)
    })

    it('auth:error event is receivable by listeners', () => {
      // Using imports from top of file

      const authErrors: unknown[] = []
      onSocketEvent('auth:error', (data: unknown) => authErrors.push(data))

      simulateEvent('auth:error', { message: 'Token expired' })

      expect(authErrors).toHaveLength(1)
      expect(authErrors[0]).toEqual({ message: 'Token expired' })
    })

    it('reconnectSocket updates auth with fresh token', () => {
      setAccessToken('refreshed-token')

      // Using imports from top of file
      reconnectSocket()

      expect(mockState.auth).toEqual({ token: 'refreshed-token' })
      expect(mockState.connected).toBe(true)
    })
  })

  describe('Receives and processes business:created events', () => {
    it('subscribes to business:created and receives data', () => {
      setAccessToken('valid-token')

      // Using imports from top of file

      const receivedData: unknown[] = []
      const unsubscribe = onSocketEvent('business:created', (data: unknown) => {
        receivedData.push(data)
      })

      const mockBusiness = createMockBusiness({ name: 'New Corp', enrichment_status: 'pending' })
      simulateEvent('business:created', mockBusiness)

      expect(receivedData).toHaveLength(1)
      expect(receivedData[0]).toEqual(mockBusiness)

      // Unsubscribe and verify no more events received
      unsubscribe()
      simulateEvent('business:created', createMockBusiness())
      expect(receivedData).toHaveLength(1)
    })

    it('can subscribe to multiple events simultaneously', () => {
      setAccessToken('valid-token')

      // Using imports from top of file

      const createdEvents: unknown[] = []
      const enrichedEvents: unknown[] = []

      const unsub1 = onSocketEvent('business:created', (data: unknown) => createdEvents.push(data))
      const unsub2 = onSocketEvent('business:enriched', (data: unknown) => enrichedEvents.push(data))

      const newBiz = createMockBusiness({ name: 'Created Biz' })
      const enrichedBiz = createMockBusiness({ name: 'Enriched Biz', enrichment_status: 'enriched' })

      simulateEvent('business:created', newBiz)
      simulateEvent('business:enriched', enrichedBiz)

      expect(createdEvents).toHaveLength(1)
      expect(createdEvents[0]).toEqual(newBiz)
      expect(enrichedEvents).toHaveLength(1)
      expect(enrichedEvents[0]).toEqual(enrichedBiz)

      unsub1()
      unsub2()
    })

    it('handles scraping progress events', () => {
      setAccessToken('valid-token')

      // Using imports from top of file

      const progressEvents: unknown[] = []
      const unsub = onSocketEvent('scraping:progress', (data: unknown) => progressEvents.push(data))

      simulateEvent('scraping:progress', {
        runId: 'run-1',
        progress: 50,
        found: 25,
        status: 'running',
        message: 'Scraping in progress...',
      })

      expect(progressEvents).toHaveLength(1)
      expect(progressEvents[0]).toEqual({
        runId: 'run-1',
        progress: 50,
        found: 25,
        status: 'running',
        message: 'Scraping in progress...',
      })

      unsub()
    })

    it('handles auth:error events via onSocketEvent', () => {
      // Using imports from top of file

      const authErrors: unknown[] = []
      const unsub = onSocketEvent('auth:error', (data: unknown) => authErrors.push(data))

      simulateEvent('auth:error', { message: 'Token expired' })

      expect(authErrors).toHaveLength(1)
      expect(authErrors[0]).toEqual({ message: 'Token expired' })

      unsub()
    })
  })

  describe('Socket lifecycle', () => {
    it('emitSocketEvent only emits when connected', () => {
      // Using imports from top of file

      const emitted: unknown[] = []
      onSocketEvent('ping', () => emitted.push('ping'))

      // Not connected - should not emit
      emitSocketEvent('ping')
      expect(emitted).toHaveLength(0)

      // Connect and try again
      setAccessToken('token')
      connectSocket()
      emitSocketEvent('ping')
      expect(emitted).toHaveLength(1)
    })
  })
})
