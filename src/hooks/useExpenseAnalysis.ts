import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api';

export interface ExpenseCategory {
  name: string;
  type: string;
  amount: number;
  count: number;
  avgAmount: number;
  percentage: number;
}

interface ExpenseAnalysisData {
  categories: ExpenseCategory[];
  totalExpenses: number;
  period: string;
  startDate: string;
  endDate: string;
}

interface UseExpenseAnalysisReturn {
  data: ExpenseAnalysisData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  setPeriod: (period: 'week' | 'month' | 'year') => void;
}

/**
 * Hook to fetch expense analysis by category
 * @param initialPeriod - Initial time period (default: 'month')
 * @param autoLoad - Auto-load on mount (default: true)
 */
export const useExpenseAnalysis = (
  initialPeriod: 'week' | 'month' | 'year' = 'month',
  autoLoad: boolean = true
): UseExpenseAnalysisReturn => {
  const [data, setData] = useState<ExpenseAnalysisData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriodState] = useState<'week' | 'month' | 'year'>(initialPeriod);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get('/api/payments/analytics/categories', {
        period,
        limit: 10,
      });

      if (response.success) {
        setData(response.data);
      } else {
      setError(response.message || 'Failed to load expense analysis');
      }
    } catch (err: any) {
      const errorMessage = err.message || err.data?.message || 'Failed to load expense analysis';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [period]);

  const setPeriod = useCallback((newPeriod: 'week' | 'month' | 'year') => {
    setPeriodState(newPeriod);
  }, []);

  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (autoLoad) {
      fetchData();
    }
  }, [fetchData, autoLoad]);

  // Listen for wallet updates
  useEffect(() => {
    const handleWalletUpdate = () => {
      refetch();
    };

    window.addEventListener('wallet-updated', handleWalletUpdate);
    window.addEventListener('transaction-completed', handleWalletUpdate);

    return () => {
      window.removeEventListener('wallet-updated', handleWalletUpdate);
      window.removeEventListener('transaction-completed', handleWalletUpdate);
    };
  }, [refetch]);

  return {
    data,
    loading,
    error,
    refetch,
    setPeriod,
  };
};

export default useExpenseAnalysis;