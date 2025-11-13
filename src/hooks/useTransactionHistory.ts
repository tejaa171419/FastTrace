import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api';

export interface TransactionFilters {
  page?: number;
  limit?: number;
  type?: 'all' | 'income' | 'expense';
  category?: string;
  startDate?: string;
  endDate?: string;
  searchTerm?: string;
  sortBy?: 'date' | 'amount' | 'title';
  sortOrder?: 'asc' | 'desc';
  status?: string;
  groupId?: string;
}

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
  description: string;
  status?: string;
  method?: string;
  from?: string;
  to?: string;
  paidBy?: string;
  splitBetween?: any[];
  settlement_date?: string;
  groupName?: string;
  paymentType?: string;
  transactionRef?: string;
  metadata?: any;
}

export interface HistorySummary {
  totalTransactions: number;
  totalIncome: number;
  totalExpense: number;
  categorySummary?: Array<{
    category: string;
    count: number;
    total: number;
  }>;
  netAmount?: number;
  settledCount?: number;
  pendingCount?: number;
  partialCount?: number;
}

export interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface TransactionHistoryResponse {
  transactions: Transaction[];
  summary: HistorySummary;
  pagination: Pagination;
}

export interface UseTransactionHistoryResult {
  transactions: Transaction[];
  summary: HistorySummary | null;
  pagination: Pagination | null;
  isLoading: boolean;
  error: string | null;
  fetchTransactions: (filters?: TransactionFilters) => Promise<void>;
  refetch: () => Promise<void>;
  setFilters: (filters: TransactionFilters) => void;
  filters: TransactionFilters;
}

/**
 * Custom hook for fetching and managing transaction history
 * 
 * @param mode - The type of history to fetch ('all', 'group', 'personal')
 * @param initialFilters - Initial filter parameters
 * @returns Transaction history data and utility functions
 */
export const useTransactionHistory = (
  mode: 'all' | 'group' | 'personal' = 'all',
  initialFilters: TransactionFilters = {}
): UseTransactionHistoryResult => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<HistorySummary | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<TransactionFilters>({
    page: 1,
    limit: 20,
    sortBy: 'date',
    sortOrder: 'desc',
    ...initialFilters
  });

  // Determine the API endpoint based on mode
  const getEndpoint = useCallback(() => {
    switch (mode) {
      case 'group':
        return '/api/history/group-expenses';
      case 'personal':
        return '/api/history/personal';
      case 'all':
      default:
        return '/api/history/transactions';
    }
  }, [mode]);

  /**
   * Fetch transactions from the API
   */
  const fetchTransactions = useCallback(async (newFilters?: TransactionFilters) => {
    try {
      setIsLoading(true);
      setError(null);

      const appliedFilters = newFilters || filters;
      
      // Clean up filters - remove undefined/null values
      const cleanFilters = Object.entries(appliedFilters).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, any>);

      const endpoint = getEndpoint();
      const response = await apiClient.get<{
        success: boolean;
        data: {
          transactions?: Transaction[];
          expenses?: Transaction[];
          summary: HistorySummary;
          pagination: Pagination;
        };
      }>(endpoint, cleanFilters);

      if (!response.success) {
        throw new Error('Failed to fetch transaction history');
      }

      // Handle different response structures
      const txns = response.data.transactions || response.data.expenses || [];
      
      setTransactions(txns);
      setSummary(response.data.summary);
      setPagination(response.data.pagination);
    } catch (err: any) {
      console.error('Error fetching transaction history:', err);
      setError(err.message || 'Failed to fetch transaction history');
      setTransactions([]);
      setSummary(null);
      setPagination(null);
    } finally {
      setIsLoading(false);
    }
  }, [filters, getEndpoint]);

  /**
   * Refetch with current filters
   */
  const refetch = useCallback(async () => {
    await fetchTransactions(filters);
  }, [fetchTransactions, filters]);

  /**
   * Update filters and trigger fetch
   */
  const updateFilters = useCallback((newFilters: TransactionFilters) => {
    const mergedFilters = {
      ...filters,
      ...newFilters
    };
    setFilters(mergedFilters);
  }, [filters]);

  // Initial fetch
  useEffect(() => {
    fetchTransactions(filters);
  }, [mode]); // Only refetch when mode changes

  // Fetch when filters change (debounced effect)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchTransactions(filters);
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [filters.page, filters.limit, filters.sortBy, filters.sortOrder]); // Only specific filter changes

  return {
    transactions,
    summary,
    pagination,
    isLoading,
    error,
    fetchTransactions,
    refetch,
    setFilters: updateFilters,
    filters
  };
};

/**
 * Hook for fetching history statistics
 */
export const useHistoryStatistics = (period: 'week' | 'month' | 'year' = 'month') => {
  const [statistics, setStatistics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatistics = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiClient.get<{
        success: boolean;
        data: any;
      }>('/api/history/statistics', { period });

      if (!response.success) {
        throw new Error('Failed to fetch statistics');
      }

      setStatistics(response.data);
    } catch (err: any) {
      console.error('Error fetching statistics:', err);
      setError(err.message || 'Failed to fetch statistics');
      setStatistics(null);
    } finally {
      setIsLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  return {
    statistics,
    isLoading,
    error,
    refetch: fetchStatistics
  };
};

export default useTransactionHistory;