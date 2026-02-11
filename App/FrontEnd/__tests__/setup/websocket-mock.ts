import { vi } from 'vitest'
import type { WebSocketEvents } from '@/shared/lib/socket'

type EventHandler = (...args: unknown[]) => void

export class MockSocket {
  connected = false
  auth: Record<string, unknown> = {}

  private listeners = new Map<string, Set<EventHandler>>()

  connect() {
    this.connected = true
    this.emit('connect')
  }

  disconnect() {
    this.connected = false
    this.emit('disconnect')
  }

  on(event: string, handler: EventHandler) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(handler)
    return this
  }

  off(event: string, handler?: EventHandler) {
    if (!handler) {
      this.listeners.delete(event)
    } else {
      this.listeners.get(event)?.delete(handler)
    }
    return this
  }

  emit(event: string, ...args: unknown[]) {
    this.listeners.get(event)?.forEach((handler) => handler(...args))
    return this
  }

  removeAllListeners() {
    this.listeners.clear()
    return this
  }
}

let mockSocket: MockSocket | null = null

export function getMockSocket(): MockSocket {
  if (!mockSocket) {
    mockSocket = new MockSocket()
  }
  return mockSocket
}

export function resetMockSocket() {
  if (mockSocket) {
    mockSocket.removeAllListeners()
    mockSocket.connected = false
  }
  mockSocket = null
}

/**
 * Simulate a server-side WebSocket event arriving at the client.
 */
export function simulateSocketEvent<K extends keyof WebSocketEvents>(
  event: K,
  data: WebSocketEvents[K]
) {
  getMockSocket().emit(event as string, data)
}

/**
 * Install socket mocks - call in beforeEach or setupFiles.
 * Mocks the shared/lib/socket module so getSocket() returns the MockSocket.
 */
export function installSocketMock() {
  const socket = getMockSocket()

  vi.mock('@/shared/lib/socket', () => ({
    getSocket: () => socket,
    connectSocket: vi.fn(() => {
      socket.connect()
    }),
    disconnectSocket: vi.fn(() => {
      socket.disconnect()
    }),
    reconnectSocket: vi.fn(),
    onSocketEvent: vi.fn(
      (event: string, callback: EventHandler) => {
        socket.on(event, callback)
        return () => socket.off(event, callback)
      }
    ),
    emitSocketEvent: vi.fn((event: string, data?: unknown) => {
      if (socket.connected) {
        socket.emit(event, data)
      }
    }),
    setSocketTokenRefresher: vi.fn(),
  }))

  return socket
}
