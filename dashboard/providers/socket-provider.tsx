'use client';

import { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { useSocket } from '@/hooks/use-socket';
import { Socket } from 'socket.io-client';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  connectionError: Error | null;
}

export const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  connectionError: null,
});

interface SocketProviderProps {
  children: ReactNode;
}

export function SocketProvider({ children }: SocketProviderProps) {
  const socket = useSocket();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<Error | null>(null);

  useEffect(() => {
    if (!socket) return;

    // Track connection state
    const handleConnect = () => {
      console.log('[SocketProvider] Socket connected');
      setIsConnected(true);
      setConnectionError(null);
    };

    const handleDisconnect = () => {
      console.log('[SocketProvider] Socket disconnected');
      setIsConnected(false);
    };

    const handleError = (error: Error) => {
      setConnectionError(error);
      console.error('[SocketProvider] Connection error:', error);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleError);

    // Set initial state - check if already connected
    // This handles the case where socket connected before listeners were attached
    if (socket.connected) {
      console.log('[SocketProvider] Socket already connected on mount');
      setIsConnected(true);
      setConnectionError(null);
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleError);
    };
  }, [socket]);

  return (
    <SocketContext.Provider value={{ socket, isConnected, connectionError }}>
      {children}
    </SocketContext.Provider>
  );
}

// Hook to access socket context
export function useSocketContext() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocketContext must be used within a SocketProvider');
  }
  return context;
}

// Hook to check connection status
export function useSocketStatus() {
  const { isConnected, connectionError } = useSocketContext();
  return { isConnected, connectionError };
}

// Hook to emit socket events
export function useSocketEmit() {
  const { socket } = useSocketContext();

  const emit = (event: string, data?: any) => {
    if (!socket || !socket.connected) {
      console.warn(`[useSocketEmit] Cannot emit "${event}" - socket not connected`);
      return false;
    }

    socket.emit(event, data);
    return true;
  };

  return emit;
}

// Hook to listen to socket events
export function useSocketListener(event: string, handler: (data: any) => void) {
  const { socket } = useSocketContext();

  useEffect(() => {
    if (!socket) return;

    socket.on(event, handler);

    return () => {
      socket.off(event, handler);
    };
  }, [socket, event, handler]);
}

// Hook to listen to multiple socket events
export function useSocketEvents(events: Record<string, (data: any) => void>) {
  const { socket } = useSocketContext();

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