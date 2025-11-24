/**
 * WebSocket Provider
 *
 * Provides Socket.io client to the entire application.
 * Manages connection lifecycle and provides event subscription hooks.
 *
 * Hooks available:
 * - useWebSocket(): Returns { socket, isConnected, connectionError }
 * - useSocketStatus(): Returns { isConnected, connectionError }
 * - useSocketListener(event, handler): Subscribes to a single event
 * - useSocketEvents(handlers): Subscribes to multiple events
 * - useSocketEmit(): Returns emit function
 */

'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface WebSocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
  connectionError: Error | null;
}

const WebSocketContext = createContext<WebSocketContextValue>({
  socket: null,
  isConnected: false,
  connectionError: null,
});

/**
 * Hook to access the WebSocket context
 */
export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within WebSocketProvider');
  }
  return context;
}

/**
 * Hook to check connection status (compatibility with legacy provider)
 */
export function useSocketStatus() {
  const { isConnected, connectionError } = useWebSocket();
  return { isConnected, connectionError };
}

/**
 * Hook to listen to a single socket event
 */
export function useSocketListener(event: string, handler: (data: any) => void) {
  const { socket } = useWebSocket();

  useEffect(() => {
    if (!socket) return;

    socket.on(event, handler);

    return () => {
      socket.off(event, handler);
    };
  }, [socket, event, handler]);
}

/**
 * Hook to listen to multiple socket events
 */
export function useSocketEvents(events: Record<string, (data: any) => void>) {
  const { socket } = useWebSocket();

  useEffect(() => {
    if (!socket) return;

    // Attach all event listeners
    Object.entries(events).forEach(([event, handler]) => {
      socket.on(event, handler);
    });

    // Clean up all listeners
    return () => {
      Object.entries(events).forEach(([event, handler]) => {
        socket.off(event, handler);
      });
    };
  }, [socket, events]);
}

/**
 * Hook to emit socket events
 */
export function useSocketEmit() {
  const { socket } = useWebSocket();

  const emit = useCallback(
    (event: string, data?: any) => {
      if (!socket || !socket.connected) {
        console.warn(`[useSocketEmit] Cannot emit "${event}" - socket not connected`);
        return false;
      }

      socket.emit(event, data);
      return true;
    },
    [socket]
  );

  return emit;
}

interface WebSocketProviderProps {
  children: ReactNode;
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<Error | null>(null);

  useEffect(() => {
    const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000';

    // Initialize Socket.io client
    const socketInstance = io(WS_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    // Connection event handlers
    socketInstance.on('connect', () => {
      console.log('[WebSocket] Connected:', socketInstance.id);
      setIsConnected(true);
      setConnectionError(null);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('[WebSocket] Disconnected:', reason);
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('[WebSocket] Connection error:', error.message);
      setIsConnected(false);
      setConnectionError(error);
    });

    socketInstance.on('reconnect', (attemptNumber) => {
      console.log('[WebSocket] Reconnected after', attemptNumber, 'attempts');
      setIsConnected(true);
      setConnectionError(null);
    });

    socketInstance.on('reconnect_error', (error) => {
      console.error('[WebSocket] Reconnection error:', error.message);
    });

    socketInstance.on('reconnect_failed', () => {
      console.error('[WebSocket] Reconnection failed - max attempts reached');
    });

    setSocket(socketInstance);

    // Cleanup on unmount
    return () => {
      console.log('[WebSocket] Cleaning up connection');
      socketInstance.disconnect();
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{ socket, isConnected, connectionError }}>
      {children}
    </WebSocketContext.Provider>
  );
}
