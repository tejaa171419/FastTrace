import { useState, useEffect, useCallback } from 'react';
import { WalletAPI } from '@/lib/walletAPI';
import { useAuth } from '@/contexts/AuthContext';

export interface WalletStats {
  income: {
    current: number;
    previous: number;
    percentageChange: number;
  };
  expenses: {
    current: number;
    previous: number;
    percentageChange: number;
  };
  savings: {
    amount: number;
    rate: number;
    percentageChange: number;
  };
  topCategories: Array<{
    name: string;
    amount: number;
    percentage: number;
  }>;
}

interface UseWalletStatsReturn {
  stats: WalletStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  period: 'week' | 'month' | 'year';
  setPeriod: (period: 'week' | 'month' | 'year') => void;
}

/**
 * Custom hook to fetch wallet statistics and analytics
 * @param initialPeriod - Initial time period (default: 'month')
 * @param autoLoad - Auto-load stats on mount (default: true)
 */
export const useWalletStats = (
  initialPeriod: 'week' | 'month' | 'year' = 'month',
  autoLoad: boolean = true
): UseWalletStatsReturn => {
  const { isAuthenticated } = useAuth();
  const [stats, setStats] = useState<WalletStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriodState] = useState<'week' | 'month' | 'year'>(initialPeriod);

  const walletAPI = WalletAPI.getInstance();

  /**
   * Fetch wallet statistics from API
   */
  const fetchStats = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch analytics from backend
      const analytics = await walletAPI.getWalletAnalytics(period);
      
      if (analytics) {
        // Calculate statistics
        const income = calculateIncome(analytics);
        const expenses = calculateExpenses(analytics);
        const savings = calculateSavings(income.current, expenses.current, income.previous, expenses.previous);
        const topCategories = getTopCategories(analytics);

        setStats({
          income,
          expenses,
          savings,
          topCategories
        });
      }

      setLoading(false);
    } catch (err: any) {
      console.error('Failed to fetch wallet stats:', err);
      setError(err.message || 'Failed to fetch statistics');
      setLoading(false);
      
      // Set default stats on error
      setStats(null);
    }
  }, [isAuthenticated, walletAPI, period]);

  /**
   * Calculate income statistics
   */
  const calculateIncome = (analytics: any) => {
    const current = analytics.totalIncome || 0;
    const previous = analytics.previousIncome || 0;
    const percentageChange = previous > 0 ? ((current - previous) / previous) * 100 : 0;

    return {
      current,
      previous,
      percentageChange: Math.round(percentageChange * 10) / 10
    };
  };

  /**
   * Calculate expense statistics
   */
  const calculateExpenses = (analytics: any) => {
    const current = analytics.totalExpenses || 0;
    const previous = analytics.previousExpenses || 0;
    const percentageChange = previous > 0 ? ((current - previous) / previous) * 100 : 0;

    return {
      current,
      previous,
      percentageChange: Math.round(percentageChange * 10) / 10
    };
  };

  /**
   * Calculate savings statistics
   */
  const calculateSavings = (
    currentIncome: number, 
    currentExpenses: number,
    previousIncome: number,
    previousExpenses: number
  ) => {
    const amount = currentIncome - currentExpenses;
    const rate = currentIncome > 0 ? (amount / currentIncome) * 100 : 0;
    
    const previousAmount = previousIncome - previousExpenses;
    const previousRate = previousIncome > 0 ? (previousAmount / previousIncome) * 100 : 0;
    
    const percentageChange = previousRate > 0 ? rate - previousRate : 0;

    return {
      amount,
      rate: Math.round(rate * 10) / 10,
      percentageChange: Math.round(percentageChange * 10) / 10
    };
  };

  /**
   * Get top spending categories
   */
  const getTopCategories = (analytics: any): Array<{name: string; amount: number; percentage: number}> => {
    if (!analytics.categoryBreakdown || analytics.categoryBreakdown.length === 0) {
      return [];
    }

    const total = analytics.totalExpenses || 1;
    
    return analytics.categoryBreakdown
      .sort((a: any, b: any) => b.amount - a.amount)
      .slice(0, 5)
      .map((cat: any) => ({
        name: cat.category || 'Others',
        amount: cat.amount || 0,
        percentage: Math.round((cat.amount / total) * 100)
      }));
  };

  /**
   * Update period
   */
  const setPeriod = useCallback((newPeriod: 'week' | 'month' | 'year') => {
    setPeriodState(newPeriod);
  }, []);

  /**
   * Refetch statistics
   */
  const refetch = useCallback(async () => {
    await fetchStats();
  }, [fetchStats]);

  /**
   * Initial fetch on mount or when period changes
   */
  useEffect(() => {
    if (autoLoad) {
      fetchStats();
    }
  }, [fetchStats, autoLoad, period]);

  /**
   * Listen for wallet update events
   */
  useEffect(() => {
    const handleWalletUpdate = () => {
      console.log('Wallet updated - refreshing stats');
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
    stats,
    loading,
    error,
    refetch,
    period,
    setPeriod
  };
};

export default useWalletStats;