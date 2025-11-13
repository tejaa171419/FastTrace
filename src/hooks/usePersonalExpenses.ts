import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { personalExpenseService } from '@/services/personalExpenseService';
import type {
  PersonalExpense,
  ExpenseFilters,
  ExpenseAnalytics,
  CreateExpenseRequest,
  UpdateExpenseRequest
} from '@/types/expense';

interface UsePersonalExpensesReturn {
  expenses: PersonalExpense[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  analytics: ExpenseAnalytics | null;
  analyticsLoading: boolean;
  filters: ExpenseFilters;
  setFilters: (filters: ExpenseFilters) => void;
  createExpense: (data: CreateExpenseRequest) => Promise<PersonalExpense>;
  updateExpense: (id: string, data: UpdateExpenseRequest) => Promise<PersonalExpense>;
  deleteExpense: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
  loadMore: () => Promise<void>;
  hasMore: boolean;
}

/**
 * Custom hook for managing personal expenses
 * @param initialFilters - Initial filter configuration
 * @param autoLoad - Auto-load expenses on mount (default: true)
 */
export const usePersonalExpenses = (
  initialFilters: ExpenseFilters = {},
  autoLoad: boolean = true
): UsePersonalExpensesReturn => {
  const { isAuthenticated } = useAuth();
  
  const [expenses, setExpenses] = useState<PersonalExpense[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [filters, setFiltersState] = useState<ExpenseFilters>(initialFilters);
  
  const [analytics, setAnalytics] = useState<ExpenseAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState<boolean>(false);

  /**
   * Fetch expenses from API
   */
  const fetchExpenses = useCallback(async (append: boolean = false) => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    try {
      if (!append) {
        setLoading(true);
      }
      setError(null);

      const currentPage = append ? pagination.page + 1 : filters.page || 1;
      const response = await personalExpenseService.getExpenses({
        ...filters,
        page: currentPage,
        limit: filters.limit || 10
      });

      if (append) {
        setExpenses(prev => [...prev, ...response.expenses]);
      } else {
        setExpenses(response.expenses);
      }

      setPagination(response.pagination);
      setLoading(false);
    } catch (err: any) {
      console.error('Failed to fetch expenses:', err);
      setError(err.message || 'Failed to fetch expenses');
      setLoading(false);
      
      if (!append) {
        setExpenses([]);
      }
    }
  }, [isAuthenticated, filters]);

  /**
   * Fetch analytics data
   */
  const fetchAnalytics = useCallback(async () => {
    if (!isAuthenticated) {
      return;
    }

    try {
      setAnalyticsLoading(true);
      const data = await personalExpenseService.getAnalytics({
        startDate: filters.startDate,
        endDate: filters.endDate,
        category: filters.category
      });
      setAnalytics(data);
      setAnalyticsLoading(false);
    } catch (err: any) {
      console.error('Failed to fetch analytics:', err);
      setAnalyticsLoading(false);
    }
  }, [isAuthenticated, filters.startDate, filters.endDate, filters.category]);

  /**
   * Create new expense
   */
  const createExpense = useCallback(async (data: CreateExpenseRequest): Promise<PersonalExpense> => {
    try {
      const newExpense = await personalExpenseService.createExpense(data);
      
      // Refresh expenses list
      await fetchExpenses(false);
      
      // Refresh analytics
      await fetchAnalytics();
      
      return newExpense;
    } catch (err: any) {
      console.error('Failed to create expense:', err);
      throw err;
    }
  }, [fetchExpenses, fetchAnalytics]);

  /**
   * Update existing expense
   */
  const updateExpense = useCallback(async (
    id: string,
    data: UpdateExpenseRequest
  ): Promise<PersonalExpense> => {
    try {
      const updatedExpense = await personalExpenseService.updateExpense(id, data);
      
      // Update expense in local state
      setExpenses(prev => prev.map(exp => 
        exp._id === id ? updatedExpense : exp
      ));
      
      // Refresh analytics
      await fetchAnalytics();
      
      return updatedExpense;
    } catch (err: any) {
      console.error('Failed to update expense:', err);
      throw err;
    }
  }, [fetchAnalytics]);

  /**
   * Delete expense
   */
  const deleteExpense = useCallback(async (id: string): Promise<void> => {
    try {
      await personalExpenseService.deleteExpense(id);
      
      // Remove expense from local state
      setExpenses(prev => prev.filter(exp => exp._id !== id));
      
      // Update pagination count
      setPagination(prev => ({
        ...prev,
        total: prev.total - 1
      }));
      
      // Refresh analytics
      await fetchAnalytics();
    } catch (err: any) {
      console.error('Failed to delete expense:', err);
      throw err;
    }
  }, [fetchAnalytics]);

  /**
   * Update filters and refetch
   */
  const setFilters = useCallback((newFilters: ExpenseFilters) => {
    setFiltersState(newFilters);
  }, []);

  /**
   * Load more expenses (pagination)
   */
  const loadMore = useCallback(async () => {
    if (pagination.page < pagination.pages && !loading) {
      await fetchExpenses(true);
    }
  }, [pagination, loading, fetchExpenses]);

  /**
   * Refetch expenses from scratch
   */
  const refetch = useCallback(async () => {
    await fetchExpenses(false);
    await fetchAnalytics();
  }, [fetchExpenses, fetchAnalytics]);

  /**
   * Has more expenses to load
   */
  const hasMore = pagination.page < pagination.pages;

  /**
   * Initial fetch on mount or when filters change
   */
  useEffect(() => {
    if (autoLoad && isAuthenticated) {
      fetchExpenses(false);
      fetchAnalytics();
    }
  }, [autoLoad, isAuthenticated, filters]);

  return {
    expenses,
    loading,
    error,
    pagination,
    analytics,
    analyticsLoading,
    filters,
    setFilters,
    createExpense,
    updateExpense,
    deleteExpense,
    refetch,
    loadMore,
    hasMore
  };
};

export default usePersonalExpenses;
