import { io, Socket } from 'socket.io-client'
import type { Business } from '@/shared/types'

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3030'

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

  // Ping/pong
  ping: void
  pong: string
}

let socket: Socket | null = null

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: false,
    })
  }
  return socket
}

export function connectSocket(): void {
  const s = getSocket()
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
