'use client'

import { useEffect, useCallback, useState } from 'react'
import { getSocket, connectSocket, disconnectSocket } from '@/shared/lib/socket'
import type { WebSocketEvent } from '@/shared/types'

interface UseSocketOptions {
  autoConnect?: boolean
}

/**
 * Hook to manage WebSocket connection and events
 */
export function useSocket(options: UseSocketOptions = {}) {
  const { autoConnect = true } = options
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const socket = getSocket()

    const onConnect = () => setIsConnected(true)
    const onDisconnect = () => setIsConnected(false)

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)

    // Set initial state
    setIsConnected(socket.connected)

    // Auto-connect if enabled
    if (autoConnect) {
      connectSocket()
    }

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
    }
  }, [autoConnect])

  const subscribe = useCallback(<T>(event: WebSocketEvent, callback: (data: T) => void) => {
    const socket = getSocket()
    socket.on(event, callback)
    return () => {
      socket.off(event, callback)
    }
  }, [])

  const emit = useCallback(<T>(event: string, data: T) => {
    const socket = getSocket()
    socket.emit(event, data)
  }, [])

  return {
    isConnected,
    subscribe,
    emit,
    connect: connectSocket,
    disconnect: disconnectSocket,
  }
}
