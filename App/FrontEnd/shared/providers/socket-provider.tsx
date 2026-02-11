'use client'

import { useEffect } from 'react'
import { getAccessToken, onTokenRefresh, refreshAccessToken } from '@/shared/lib/api'
import {
  connectSocket,
  disconnectSocket,
  reconnectSocket,
  setSocketTokenRefresher,
} from '@/shared/lib/socket'

interface SocketProviderProps {
  children: React.ReactNode
}

/**
 * Manages WebSocket lifecycle with auth integration.
 * - Connects with JWT on mount (if authenticated)
 * - Reconnects automatically after token refresh
 * - Sets up the token refresher so socket auth:error events trigger refresh
 */
export function SocketProvider({ children }: SocketProviderProps) {
  useEffect(() => {
    // Wire the token refresher so socket can request new tokens on auth:error
    setSocketTokenRefresher(refreshAccessToken)

    // Connect if we have a token
    if (getAccessToken()) {
      connectSocket()
    }

    // When the API layer refreshes a token, reconnect the socket with it
    const unsubscribe = onTokenRefresh(() => {
      reconnectSocket()
    })

    return () => {
      unsubscribe()
      disconnectSocket()
    }
  }, [])

  return <>{children}</>
}
