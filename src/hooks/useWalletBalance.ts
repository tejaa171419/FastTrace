import { useState, useEffect, useCallback } from 'react';
import { WalletAPI } from '@/lib/walletAPI';
import { useAuth } from '@/contexts/AuthContext';
import type { WalletData } from '@/types/wallet';
import { walletEvents, WalletEventData } from '@/lib/walletEvents';

interface UseWalletBalanceReturn {
  balance: number;
  availableBalance: number;
  isLoading: boolean;
  error: string | null;
  walletData: WalletData | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook to fetch and manage wallet balance with real-time updates
 * @param autoRefresh - Enable automatic balance refresh (default: true)
 * @param refreshInterval - Refresh interval in milliseconds (default: 30000ms / 30s)
 */
export const useWalletBalance = (
  autoRefresh: boolean = true,
  refreshInterval: number = 30000
): UseWalletBalanceReturn => {
  const { user, isAuthenticated } = useAuth();
  const [balance, setBalance] = useState<number>(0);
  const [availableBalance, setAvailableBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [walletData, setWalletData] = useState<WalletData | null>(null);

  const walletAPI = WalletAPI.getInstance();

  /**
   * Fetch wallet balance from API
   */
  const fetchWalletBalance = useCallback(async () => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      const wallet = await walletAPI.getWalletDetails();
      
      setWalletData(wallet);
      setBalance(wallet.balance);
      setAvailableBalance(wallet.availableBalance || wallet.balance);
      setIsLoading(false);
    } catch (err: any) {
      console.error('Failed to fetch wallet balance:', err);
      setError(err.message || 'Failed to fetch wallet balance');
      setIsLoading(false);
      
      // Set default values on error
      setBalance(0);
      setAvailableBalance(0);
    }
  }, [isAuthenticated, walletAPI]);

  /**
   * Manual refetch function
   */
  const refetch = useCallback(async () => {
    setIsLoading(true);
    await fetchWalletBalance();
  }, [fetchWalletBalance]);

  /**
   * Initial fetch on mount or when user changes
   */
  useEffect(() => {
    fetchWalletBalance();
  }, [fetchWalletBalance, user?.id]);

  /**
   * Auto-refresh balance at specified interval
   */
  useEffect(() => {
    if (!autoRefresh || !isAuthenticated) {
      return;
    }

    const intervalId = setInterval(() => {
      fetchWalletBalance();
    }, refreshInterval);

    return () => {
      clearInterval(intervalId);
    };
  }, [autoRefresh, refreshInterval, fetchWalletBalance, isAuthenticated]);

  /**
   * Listen for wallet events from the event emitter
   */
  useEffect(() => {
    const handleBalanceUpdate = (data: WalletEventData) => {
      console.log('Balance update event received:', data);
      if (data.balance !== undefined) {
        setBalance(data.balance);
        setAvailableBalance(data.balance);
      } else {
        refetch();
      }
    };

    const handleTransactionEvent = (data: WalletEventData) => {
      console.log('Transaction event received:', data);
      refetch();
    };

    // Subscribe to wallet events
    const unsubscribeBalance = walletEvents.on('balance_updated', handleBalanceUpdate);
    const unsubscribeTransactionCompleted = walletEvents.on('transaction_completed', handleTransactionEvent);
    const unsubscribeTransactionCreated = walletEvents.on('transaction_created', handleTransactionEvent);
    const unsubscribeTopup = walletEvents.on('wallet_topup', handleTransactionEvent);
    const unsubscribeTransfer = walletEvents.on('wallet_transfer', handleTransactionEvent);
    const unsubscribeBankTransfer = walletEvents.on('bank_transfer_completed', handleTransactionEvent);

    // Also listen for legacy custom events
    const handleWalletUpdate = (event: CustomEvent) => {
      console.log('Legacy wallet update event received:', event.detail);
      refetch();
    };

    window.addEventListener('wallet-updated' as any, handleWalletUpdate as EventListener);

    return () => {
      // Unsubscribe from wallet events
      unsubscribeBalance();
      unsubscribeTransactionCompleted();
      unsubscribeTransactionCreated();
      unsubscribeTopup();
      unsubscribeTransfer();
      unsubscribeBankTransfer();
      
      // Remove legacy listener
      window.removeEventListener('wallet-updated' as any, handleWalletUpdate as EventListener);
    };
  }, [refetch]);

  return {
    balance,
    availableBalance,
    isLoading,
    error,
    walletData,
    refetch
  };
};

/**
 * Trigger a global wallet update event
 * Call this function after any wallet transaction to update the balance display
 */
export const triggerWalletUpdate = () => {
  const event = new CustomEvent('wallet-updated', {
    detail: { timestamp: new Date().toISOString() }
  });
  window.dispatchEvent(event);
};

export default useWalletBalance;