import type {
  Expense,
  CreateExpenseRequest,
  UpdateExpenseRequest,
  ExpenseFilters,
  GetExpensesResponse,
  ExpenseComment
} from '../types';
import { apiClient } from '../api';

export const expenseService = {
  // Get expenses with filters
  async getExpenses(filters?: ExpenseFilters) {
    const result = await apiClient.get<{ success: boolean; message: string; data: GetExpensesResponse }>('/api/expenses', filters);
    return result.data; // Extract the data part
  },

  // Get single expense
  async getExpense(id: string) {
    const result = await apiClient.get<{ success: boolean; message: string; data: { expense: Expense } }>('/api/expenses/' + id);
    return result.data;
  },

  // Create new expense
  async createExpense(expenseData: CreateExpenseRequest) {
    const result = await apiClient.post<{ success: boolean; message: string; data: { expense: Expense } }>('/api/expenses', expenseData);
    return result.data;
  },

  // Update expense
  async updateExpense(id: string, updates: UpdateExpenseRequest) {
    const result = await apiClient.put<{ success: boolean; message: string; data: { expense: Expense } }>('/api/expenses/' + id, updates);
    return result.data;
  },

  // Delete expense
  async deleteExpense(id: string) {
    return apiClient.delete<void>('/api/expenses/' + id);
  },

  // Add comment to expense
  async addComment(id: string, text: string) {
    const result = await apiClient.post<{ success: boolean; message: string; data: { comments: ExpenseComment[] } }>('/api/expenses/' + id + '/comments', { text });
    return result.data;
  },

  // Update split status for current user
  async updateSplitStatus(id: string, status: 'acknowledged' | 'paid' | 'settled') {
    const result = await apiClient.put<{ success: boolean; message: string; data: { expense: Partial<Expense> } }>('/api/expenses/' + id + '/split-status', { status });
    return result.data;
  },

  // Upload receipt (placeholder)
  async uploadReceipt(id: string, file: File) {
    const formData = new FormData();
    formData.append('receipt', file);
    
    // Note: This will need a different implementation for file uploads
    return fetch(apiClient['baseURL'] + '/api/expenses/' + id + '/receipt', {
      method: 'POST',
      body: formData,
      headers: {
        'x-user-id': (apiClient['defaultHeaders'] as any)['x-user-id']
      }
    }).then(res => res.json());
  },

  // Get expense categories
  async getCategories() {
    const result = await apiClient.get<{ success: boolean; message: string; data: { categories: string[] } }>('/api/expenses/categories');
    return result.data;
  },

  // Get expense analytics
  async getAnalytics(params?: {
    period?: 'week' | 'month' | 'quarter' | 'year';
    groupId?: string;
    category?: string;
  }) {
    return apiClient.get<any>('/api/expenses/analytics', params);
  }
};