import { useEffect, useRef, useState } from 'react';
import type { WalletUpdate } from '@/types/wallet';

// Real-time wallet updates hook using polling and future WebSocket support
export const useWalletUpdates = (
  walletId: string,
  onUpdate: (update: WalletUpdate) => void,
  enabled: boolean = true
) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // WebSocket connection (for future implementation)
  const connectWebSocket = () => {
    try {
      const wsUrl = `${import.meta.env.VITE_WS_URL || 'ws://localhost:5000'}/ws/wallet/${walletId}`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('✅ Wallet WebSocket connected');
        setIsConnected(true);
        
        // Send authentication
        const token = localStorage.getItem('authToken');
        if (token) {
          ws.send(JSON.stringify({
            type: 'auth',
            token
          }));
        }
      };

      ws.onmessage = (event) => {
        try {
          const update: WalletUpdate = JSON.parse(event.data);
          setLastUpdate(new Date());
          onUpdate(update);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        console.log('🔌 Wallet WebSocket disconnected');
        setIsConnected(false);
        
        // Attempt to reconnect after 5 seconds
        if (enabled) {
          setTimeout(() => {
            if (enabled && !wsRef.current) {
              connectWebSocket();
            }
          }, 5000);
        }
      };

      ws.onerror = (error) => {
        console.error('❌ Wallet WebSocket error:', error);
        setIsConnected(false);
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Failed to establish WebSocket connection:', error);
      // Fall back to polling if WebSocket fails
      startPolling();
    }
  };

  // Polling fallback for real-time updates
  const startPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(async () => {
      try {
        // Simple polling - in a real app, this would check for updates since last poll
        const response = await fetch(`/api/wallet/${walletId}/updates`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        });

        if (response.ok) {
          const updates = await response.json();
          if (updates.data && updates.data.length > 0) {
            updates.data.forEach((update: WalletUpdate) => {
              setLastUpdate(new Date());
              onUpdate(update);
            });
          }
        }
      } catch (error) {
        console.error('Polling update failed:', error);
      }
    }, 10000); // Poll every 10 seconds
  };

  // Start connection when enabled
  useEffect(() => {
    if (enabled && walletId) {
      // Try WebSocket first, fall back to polling
      connectWebSocket();
      
      // Start polling as backup
      const pollingTimeout = setTimeout(() => {
        if (!isConnected) {
          startPolling();
        }
      }, 3000);

      return () => {
        clearTimeout(pollingTimeout);
      };
    }

    return () => {
      // Cleanup
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, walletId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  // Send message through WebSocket
  const sendMessage = (message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  };

  return {
    isConnected,
    lastUpdate,
    sendMessage
  };
};

// Hook for balance updates specifically
export const useBalanceUpdates = (
  walletId: string,
  onBalanceUpdate: (newBalance: number) => void,
  enabled: boolean = true
) => {
  return useWalletUpdates(
    walletId,
    (update) => {
      if (update.type === 'balance_update' && update.data.newBalance !== undefined) {
        onBalanceUpdate(update.data.newBalance);
      }
    },
    enabled
  );
};

// Hook for transaction updates
export const useTransactionUpdates = (
  walletId: string,
  onTransactionUpdate: (transaction: any) => void,
  enabled: boolean = true
) => {
  return useWalletUpdates(
    walletId,
    (update) => {
      if (update.type === 'transaction_added' && update.data.transaction) {
        onTransactionUpdate(update.data.transaction);
      }
    },
    enabled
  );
};

// Mock real-time update generator for testing
export const mockRealTimeUpdates = (
  walletId: string,
  onUpdate: (update: WalletUpdate) => void
) => {
  const updates: WalletUpdate[] = [
    {
      type: 'balance_update',
      data: {
        newBalance: Math.random() * 10000,
        timestamp: new Date().toISOString()
      }
    },
    {
      type: 'transaction_added',
      data: {
        transaction: {
          id: `mock-${Date.now()}`,
          type: 'credit',
          amount: Math.random() * 500,
          description: 'Mock transaction',
          category: 'topup',
          timestamp: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      }
    },
    {
      type: 'security_alert',
      data: {
        alert: 'New device login detected',
        timestamp: new Date().toISOString()
      }
    }
  ];

  let index = 0;
  const interval = setInterval(() => {
    if (index < updates.length) {
      onUpdate(updates[index]);
      index++;
    } else {
      clearInterval(interval);
    }
  }, 5000);

  return () => clearInterval(interval);
};