import { useState, useEffect, useCallback } from 'react';
import { WalletAPI } from '@/lib/walletAPI';
import { useAuth } from '@/contexts/AuthContext';

export interface Transaction {
  _id: string;
  type: 'wallet_topup' | 'wallet_transfer' | 'settlement' | 'expense_payment' | 'withdrawal' | 'refund';
  amount: number;
  status: 'initiated' | 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'expired' | 'refunded';
  method: 'upi' | 'bank_transfer' | 'card' | 'wallet' | 'netbanking' | 'cash';
  description?: string;
  fromUser?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  toUser?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionFilters {
  type?: string;
  status?: string;
  method?: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
}

interface UseWalletTransactionsReturn {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  filters: TransactionFilters;
  setFilters: (filters: TransactionFilters) => void;
  loadMore: () => Promise<void>;
  refetch: () => Promise<void>;
  clearFilters: () => void;
}

/**
 * Custom hook to fetch and manage wallet transactions
 * @param pageSize - Number of transactions per page (default: 10)
 * @param autoLoad - Auto-load transactions on mount (default: true)
 */
export const useWalletTransactions = (
  pageSize: number = 10,
  autoLoad: boolean = true
): UseWalletTransactionsReturn => {
  const { isAuthenticated } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [filters, setFiltersState] = useState<TransactionFilters>({});

  const walletAPI = WalletAPI.getInstance();

  /**
   * Fetch transactions from API
   */
  const fetchTransactions = useCallback(async (page: number = 1, append: boolean = false) => {
    if (!isAuthenticated) {
      console.log('⚠️ User not authenticated, skipping transaction fetch');
      setLoading(false);
      return;
    }

    try {
      if (!append) {
        setLoading(true);
      }
      setError(null);

      // Build query parameters
      const params: any = {
        page,
        limit: pageSize,
        ...filters
      };

      console.log('📤 Fetching transactions with params:', params);

      // Call API
      const response = await walletAPI.getPaymentHistory(params);
      console.log('📥 getPaymentHistory response:', {
        hasPayments: !!response?.payments,
        paymentsCount: response?.payments?.length || 0,
        pagination: response?.pagination,
        fullResponse: response
      });
      
      // walletAPI.getPaymentHistory returns the data directly, not wrapped in response.data
      if (response && response.payments) {
        const newTransactions = response.payments || [];
        const pagination = response.pagination || {};

        console.log(`✅ Successfully fetched ${newTransactions.length} transactions`);

        if (append) {
          // Append to existing transactions (load more)
          setTransactions(prev => [...prev, ...newTransactions]);
        } else {
          // Replace transactions (refetch or filter change)
          setTransactions(newTransactions);
        }

        setCurrentPage(pagination.page || 1);
        setTotalPages(pagination.pages || 0);
        setTotalCount(pagination.total || 0);
        setHasMore((pagination.page || 0) < (pagination.pages || 0));
      } else {
        // No transactions found
        console.log('⚠️ No transactions found in response, setting empty state');
        if (!append) {
          setTransactions([]);
          setTotalCount(0);
          setTotalPages(0);
          setHasMore(false);
        }
      }

      setLoading(false);
    } catch (err: any) {
      console.error('❌ Failed to fetch transactions:', {
        error: err,
        message: err.message,
        stack: err.stack
      });
      setError(err.message || 'Failed to fetch transactions');
      setLoading(false);
      
      // Set empty data on error
      if (!append) {
        setTransactions([]);
        setTotalCount(0);
        setTotalPages(0);
        setHasMore(false);
      }
    }
  }, [isAuthenticated, walletAPI, filters, pageSize]);

  /**
   * Load more transactions (pagination)
   */
  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    
    const nextPage = currentPage + 1;
    await fetchTransactions(nextPage, true);
  }, [hasMore, loading, currentPage, fetchTransactions]);

  /**
   * Refetch transactions (refresh)
   */
  const refetch = useCallback(async () => {
    setCurrentPage(1);
    await fetchTransactions(1, false);
  }, [fetchTransactions]);

  /**
   * Update filters
   */
  const setFilters = useCallback((newFilters: TransactionFilters) => {
    setFiltersState(newFilters);
    setCurrentPage(1);
  }, []);

  /**
   * Clear all filters
   */
  const clearFilters = useCallback(() => {
    setFiltersState({});
    setCurrentPage(1);
  }, []);

  /**
   * Initial fetch on mount or when filters change
   */
  useEffect(() => {
    if (autoLoad) {
      fetchTransactions(1, false);
    }
  }, [fetchTransactions, autoLoad, filters]);

  /**
   * Listen for wallet update events
   */
  useEffect(() => {
    const handleWalletUpdate = () => {
      console.log('Wallet updated - refreshing transactions');
      refetch();
    };

    window.addEventListener('wallet-updated' as any, handleWalletUpdate as EventListener);
    window.addEventListener('transaction-completed' as any, handleWalletUpdate as EventListener);

    return () => {
      window.removeEventListener('wallet-updated' as any, handleWalletUpdate as EventListener);
      window.removeEventListener('transaction-completed' as any, handleWalletUpdate as EventListener);
    };
  }, [refetch]);

  return {
    transactions,
    loading,
    error,
    hasMore,
    totalCount,
    currentPage,
    totalPages,
    filters,
    setFilters,
    loadMore,
    refetch,
    clearFilters
  };
};

/**
 * Trigger a transaction completed event
 * Call this after any successful transaction
 */
export const triggerTransactionUpdate = () => {
  const event = new CustomEvent('transaction-completed', {
    detail: { timestamp: new Date().toISOString() }
  });
  window.dispatchEvent(event);
};

export default useWalletTransactions;