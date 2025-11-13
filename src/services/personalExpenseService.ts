import { apiClient } from '@/lib/api';
import type {
  PersonalExpense,
  CreateExpenseRequest,
  UpdateExpenseRequest,
  ExpenseFilters,
  GetExpensesResponse,
  GetExpenseResponse,
  GetAnalyticsResponse,
  ExpenseCategory
} from '@/types/expense';

/**
 * Personal Expense Service
 * Handles all API calls for personal expense management
 */
export const personalExpenseService = {
  /**
   * Get list of personal expenses with filters and pagination
   */
  async getExpenses(filters?: ExpenseFilters): Promise<GetExpensesResponse['data']> {
    try {
      const response = await apiClient.get<GetExpensesResponse>(
        '/api/expenses/personal',
        filters
      );
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch expenses');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch expenses:', error);
      throw error;
    }
  },

  /**
   * Get single expense by ID
   */
  async getExpense(id: string): Promise<PersonalExpense> {
    try {
      const response = await apiClient.get<GetExpenseResponse>(
        `/api/expenses/personal/${id}`
      );
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch expense');
      }
      
      return response.data.expense;
    } catch (error: any) {
      console.error('Failed to fetch expense:', error);
      throw error;
    }
  },

  /**
   * Create new personal expense
   */
  async createExpense(expenseData: CreateExpenseRequest): Promise<PersonalExpense> {
    try {
      const response = await apiClient.post<GetExpenseResponse>(
        '/api/expenses/personal',
        expenseData
      );
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to create expense');
      }
      
      return response.data.expense;
    } catch (error: any) {
      console.error('Failed to create expense:', error);
      throw error;
    }
  },

  /**
   * Update existing expense
   */
  async updateExpense(id: string, updates: UpdateExpenseRequest): Promise<PersonalExpense> {
    try {
      const response = await apiClient.put<GetExpenseResponse>(
        `/api/expenses/personal/${id}`,
        updates
      );
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to update expense');
      }
      
      return response.data.expense;
    } catch (error: any) {
      console.error('Failed to update expense:', error);
      throw error;
    }
  },

  /**
   * Delete expense
   */
  async deleteExpense(id: string): Promise<void> {
    try {
      const response = await apiClient.delete<{ success: boolean; message: string }>(
        `/api/expenses/personal/${id}`
      );
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete expense');
      }
    } catch (error: any) {
      console.error('Failed to delete expense:', error);
      throw error;
    }
  },

  /**
   * Get expense analytics and statistics
   */
  async getAnalytics(filters?: {
    startDate?: string;
    endDate?: string;
    category?: ExpenseCategory;
  }): Promise<GetAnalyticsResponse['data']> {
    try {
      const response = await apiClient.get<GetAnalyticsResponse>(
        '/api/expenses/personal/analytics',
        filters
      );
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch analytics');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch analytics:', error);
      throw error;
    }
  },

  /**
   * Get available expense categories
   */
  async getCategories(): Promise<ExpenseCategory[]> {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: { categories: ExpenseCategory[] };
      }>('/api/expenses/personal/categories');
      
      if (!response.success) {
        throw new Error('Failed to fetch categories');
      }
      
      return response.data.categories;
    } catch (error: any) {
      console.error('Failed to fetch categories:', error);
      // Return default categories on error
      return [
        'Food & Dining',
        'Transportation',
        'Shopping',
        'Housing',
        'Health & Fitness',
        'Entertainment',
        'Bills & Utilities',
        'Travel',
        'Education',
        'Groceries',
        'Personal Care',
        'Home & Garden',
        'Gifts & Donations',
        'Business',
        'Other'
      ];
    }
  },

  /**
   * Upload receipt for expense
   */
  async uploadReceipt(expenseId: string, file: File): Promise<{ url: string; filename: string }> {
    try {
      const formData = new FormData();
      formData.append('receipt', file);
      
      const response = await fetch(`/api/expenses/personal/${expenseId}/receipt`, {
        method: 'POST',
        body: formData,
        headers: {
          'x-user-id': localStorage.getItem('currentUserId') || '',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload receipt');
      }
      
      const data = await response.json();
      return data.data.receipt;
    } catch (error: any) {
      console.error('Failed to upload receipt:', error);
      throw error;
    }
  },

  /**
   * Get expense trends over time
   */
  async getTrends(period: 'week' | 'month' | 'year' = 'month'): Promise<any> {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: any;
      }>('/api/expenses/personal/trends', { period });
      
      if (!response.success) {
        throw new Error('Failed to fetch trends');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch trends:', error);
      throw error;
    }
  }
};

export default personalExpenseService;
