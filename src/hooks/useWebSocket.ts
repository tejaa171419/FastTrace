import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

interface WebSocketConfig {
  autoConnect?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
}

interface WebSocketHook {
  socket: Socket | null;
  isConnected: boolean;
  connectionError: string | null;
  connect: () => void;
  disconnect: () => void;
  emit: (event: string, data?: any) => void;
  on: (event: string, handler: (...args: any[]) => void) => void;
  off: (event: string, handler?: (...args: any[]) => void) => void;
}

export const useWebSocket = (config: WebSocketConfig = {}): WebSocketHook => {
  const {
    autoConnect = true,
    reconnectionAttempts = 5,
    reconnectionDelay = 1000
  } = config;

  const auth = useAuth();
  const { user, isAuthenticated } = auth;
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const reconnectAttemptsRef = useRef(0);

  const connect = useCallback(() => {
    if (!isAuthenticated || !user) {
      setConnectionError('Authentication required');
      return;
    }

    if (socketRef.current?.connected) {
      return;
    }

    try {
      // IMPORTANT: Connect directly to backend, NOT through Vite proxy
      // Vite proxy causes ECONNABORTED errors with WebSocket connections
      const wsUrl = import.meta.env.VITE_WS_URL || 'http://localhost:5001';
      
      console.log('🔌 Connecting WebSocket to:', wsUrl);
        
      const socket = io(wsUrl, {
        auth: {
          userId: user._id,
          token: localStorage.getItem('authToken') // Include auth token
        },
        transports: ['websocket', 'polling'], // Prefer websocket for lower latency
        upgrade: true,
        rememberUpgrade: true,
        timeout: 20000,
        forceNew: false,
        reconnection: true,
        reconnectionAttempts,
        reconnectionDelay,
        reconnectionDelayMax: 5000
      });

      socket.on('connect', () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setConnectionError(null);
        reconnectAttemptsRef.current = 0;
        
        // Send authentication event after connection
        socket.emit('authenticate', {
          userId: user._id,
          token: localStorage.getItem('authToken')
        });
      });

      socket.on('disconnect', (reason) => {
        console.log('WebSocket disconnected:', reason);
        setIsConnected(false);
        
        if (reason === 'io server disconnect') {
          // Server disconnected the socket, manual reconnection needed
          socket.connect();
        }
      });

      socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        setConnectionError(error.message);
        setIsConnected(false);
        
        reconnectAttemptsRef.current++;
        if (reconnectAttemptsRef.current >= reconnectionAttempts) {
          toast.error('Failed to connect to real-time updates');
        }
      });

      socket.on('auth_error', (error) => {
        console.error('WebSocket authentication error:', error);
        setConnectionError('Authentication failed');
        toast.error('Authentication failed for real-time updates');
      });

      socket.on('reconnect', (attemptNumber) => {
        console.log('WebSocket reconnected after', attemptNumber, 'attempts');
        toast.success('Real-time connection restored');
      });

      socket.on('reconnect_failed', () => {
        console.error('WebSocket reconnection failed');
        toast.error('Failed to restore real-time connection');
      });

      socketRef.current = socket;
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setConnectionError('Failed to create connection');
    }
  }, [auth, user, reconnectionAttempts, reconnectionDelay]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      setConnectionError(null);
    }
  }, []);

  const emit = useCallback((event: string, data?: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    } else {
      console.warn('WebSocket not connected, cannot emit event:', event);
    }
  }, []);

  const on = useCallback((event: string, handler: (...args: any[]) => void) => {
    if (socketRef.current) {
      socketRef.current.on(event, handler);
    }
  }, []);

  const off = useCallback((event: string, handler?: (...args: any[]) => void) => {
    if (socketRef.current) {
      if (handler) {
        socketRef.current.off(event, handler);
      } else {
        socketRef.current.off(event);
      }
    }
  }, []);

  // Auto-connect when token and user are available
  useEffect(() => {
    if (autoConnect && isAuthenticated && user && !socketRef.current) {
      connect();
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [autoConnect, isAuthenticated, user, connect]);

  // Reconnect when token changes (user login/logout)
  useEffect(() => {
    if (isAuthenticated && user && socketRef.current && !socketRef.current.connected) {
      connect();
    } else if (!isAuthenticated && socketRef.current) {
      disconnect();
    }
  }, [isAuthenticated, user, connect, disconnect]);

  return {
    socket: socketRef.current,
    isConnected,
    connectionError,
    connect,
    disconnect,
    emit,
    on,
    off
  };
};

export default useWebSocket;