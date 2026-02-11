import { io, Socket } from 'socket.io-client'
import type { Business } from '@/shared/types'
import { getAccessToken } from './api'

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3031'

// WebSocket event types matching backend
export type WebSocketEvents = {
  // Business events
  'business:created': Business
  'business:enriched': Business

  // Stats events
  'stats:updated': Record<string, unknown>
  'analytics:updated': Record<string, unknown>

  // Scraping events
  'scraping:started': {
    runId: string
    query: string
    location: string
  }
  'scraping:progress': {
    runId: string
    progress: number
    found: number
    status: string
    message?: string
  }
  'scraping:completed': {
    runId: string
    totalFound: number
    datasetId: string
  }
  'scraping:failed': {
    runId: string
    error: string
  }

  // Enrichment events
  'enrichment:progress': {
    businessId: string
    status: 'pending' | 'enriched' | 'failed'
    progress: number
    message?: string
  }

  // CSV import events
  'csv:progress': {
    processed: number
    total: number
    percentage: number
  }
  'csv:completed': {
    imported: number
    duplicates: number
    errors: number
  }
  'csv:failed': {
    error: string
  }

  // Auth events
  'auth:error': { message: string }

  // Ping/pong
  ping: void
  pong: string
}

let socket: Socket | null = null
let authErrorHandlerAttached = false

/**
 * Token refresh callback used by the socket to get a fresh token
 * after an auth:error event. Set via setSocketTokenRefresher.
 */
let tokenRefresher: (() => Promise<string | null>) | null = null

export function setSocketTokenRefresher(fn: () => Promise<string | null>) {
  tokenRefresher = fn
}

function createSocket(): Socket {
  const token = getAccessToken()

  return io(SOCKET_URL, {
    transports: ['websocket'],
    autoConnect: false,
    auth: token ? { token } : undefined,
  })
}

export function getSocket(): Socket {
  if (!socket) {
    socket = createSocket()
    attachAuthErrorHandler(socket)
  }
  return socket
}

function attachAuthErrorHandler(s: Socket) {
  if (authErrorHandlerAttached) return
  authErrorHandlerAttached = true

  s.on('auth:error', async () => {
    if (!tokenRefresher) return

    // Disconnect, refresh token, reconnect with new token
    s.disconnect()

    const newToken = await tokenRefresher()
    if (newToken) {
      s.auth = { token: newToken }
      s.connect()
    }
  })
}

export function connectSocket(): void {
  const s = getSocket()
  // Update auth token before each connect
  const token = getAccessToken()
  if (token) {
    s.auth = { token }
  }
  if (!s.connected) {
    s.connect()
  }
}

export function disconnectSocket(): void {
  if (socket?.connected) {
    socket.disconnect()
  }
}

/**
 * Reconnect the socket with a fresh access token.
 * Useful after a token refresh to re-establish an authenticated connection.
 */
export function reconnectSocket(): void {
  if (!socket) return
  const token = getAccessToken()
  if (!token) return

  socket.disconnect()
  socket.auth = { token }
  socket.connect()
}

/**
 * Subscribe to a specific WebSocket event with proper typing
 */
export function onSocketEvent<K extends keyof WebSocketEvents>(
  event: K,
  callback: (data: WebSocketEvents[K]) => void
): () => void {
  const s = getSocket()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  s.on(event as string, callback as any)

  // Return unsubscribe function
  return () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    s.off(event as string, callback as any)
  }
}

/**
 * Emit a socket event
 */
export function emitSocketEvent<K extends keyof WebSocketEvents>(
  event: K,
  data?: WebSocketEvents[K]
): void {
  const s = getSocket()
  if (s.connected) {
    s.emit(event as string, data)
  }
}
