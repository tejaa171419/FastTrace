import { apiClient } from '../api';

// Types for Personal Dashboard
export interface FinancialOverview {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  savings: number;
  savingsRate: number;
  budgetUtilization: number;
  incomeChange: number;
  expenseChange: number;
  savingsChange: number;
}

export interface QuickStat {
  title: string;
  value: number;
  displayValue: string;
  change: number;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

export interface CategoryExpense {
  category: string;
  totalAmount: number;
  count: number;
  percentage: number;
  color: string;
}

export interface Transaction {
  _id: string;
  title: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  type: 'expense' | 'income';
  paymentMethod?: string;
  icon?: string;
  color?: string;
}

export interface BudgetCategory {
  category: string;
  spent: number;
  budget: number;
  percentage: number;
  color: string;
  isOverBudget: boolean;
}

export interface FinancialGoal {
  _id?: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  percentage: number;
  deadline?: string;
  color: string;
  status: 'on-track' | 'at-risk' | 'completed';
}

export interface DashboardData {
  overview: FinancialOverview;
  quickStats: QuickStat[];
  categoryExpenses: CategoryExpense[];
  recentTransactions: Transaction[];
  budgetCategories: BudgetCategory[];
  financialGoals: FinancialGoal[];
}

export interface DashboardFilters {
  timeRange?: '7d' | '30d' | '90d' | '1y';
  startDate?: string;
  endDate?: string;
}

class PersonalDashboardService {
  /**
   * Get complete dashboard data
   */
  async getDashboardData(filters?: DashboardFilters): Promise<DashboardData> {
    try {
      const params = filters || { timeRange: '30d' };
      const response = await apiClient.get<{
        success: boolean;
        message: string;
        data: DashboardData;
      }>('/api/dashboard/personal', params);

      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch dashboard data');
      }

      return response.data;
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      throw new Error(error.message || 'Failed to load dashboard');
    }
  }

  /**
   * Get financial overview
   */
  async getFinancialOverview(timeRange: string = '30d'): Promise<FinancialOverview> {
    try {
      const response = await apiClient.get<{
        success: boolean;
        message: string;
        data: { overview: FinancialOverview };
      }>('/api/dashboard/overview', { timeRange });

      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch overview');
      }

      return response.data.overview;
    } catch (error: any) {
      console.error('Error fetching financial overview:', error);
      throw new Error(error.message || 'Failed to load overview');
    }
  }

  /**
   * Get recent transactions
   */
  async getRecentTransactions(limit: number = 10): Promise<Transaction[]> {
    try {
      const response = await apiClient.get<{
        success: boolean;
        message: string;
        data: { transactions: Transaction[] };
      }>('/api/expenses', {
        splitType: 'personal',
        limit,
        sort: '-date'
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch transactions');
      }

      return response.data.transactions;
    } catch (error: any) {
      console.error('Error fetching transactions:', error);
      return [];
    }
  }

  /**
   * Get category-wise expenses
   */
  async getCategoryExpenses(timeRange: string = '30d'): Promise<CategoryExpense[]> {
    try {
      const response = await apiClient.get<{
        success: boolean;
        message: string;
        data: { summary: { categoryBreakdown: CategoryExpense[] } };
      }>('/api/analytics/users/spending', {
        timeRange,
        splitType: 'personal'
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch category expenses');
      }

      return response.data.summary.categoryBreakdown || [];
    } catch (error: any) {
      console.error('Error fetching category expenses:', error);
      return [];
    }
  }

  /**
   * Get budget categories with spending
   */
  async getBudgetCategories(): Promise<BudgetCategory[]> {
    try {
      const response = await apiClient.get<{
        success: boolean;
        message: string;
        data: { budgets: BudgetCategory[] };
      }>('/api/dashboard/budgets');

      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch budgets');
      }

      return response.data.budgets;
    } catch (error: any) {
      console.error('Error fetching budgets:', error);
      return [];
    }
  }

  /**
   * Create or update budget for a category
   */
  async updateBudget(category: string, amount: number): Promise<void> {
    try {
      await apiClient.post<{
        success: boolean;
        message: string;
      }>('/api/dashboard/budgets', {
        category,
        amount
      });
    } catch (error: any) {
      console.error('Error updating budget:', error);
      throw new Error(error.message || 'Failed to update budget');
    }
  }

  /**
   * Get financial goals
   */
  async getFinancialGoals(): Promise<FinancialGoal[]> {
    try {
      const response = await apiClient.get<{
        success: boolean;
        message: string;
        data: { goals: FinancialGoal[] };
      }>('/api/dashboard/goals');

      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch goals');
      }

      return response.data.goals;
    } catch (error: any) {
      console.error('Error fetching financial goals:', error);
      return [];
    }
  }

  /**
   * Create a new financial goal
   */
  async createGoal(goal: Omit<FinancialGoal, '_id' | 'percentage' | 'status'>): Promise<FinancialGoal> {
    try {
      const response = await apiClient.post<{
        success: boolean;
        message: string;
        data: { goal: FinancialGoal };
      }>('/api/dashboard/goals', goal);

      if (!response.success) {
        throw new Error(response.message || 'Failed to create goal');
      }

      return response.data.goal;
    } catch (error: any) {
      console.error('Error creating goal:', error);
      throw new Error(error.message || 'Failed to create goal');
    }
  }

  /**
   * Update a financial goal
   */
  async updateGoal(goalId: string, updates: Partial<FinancialGoal>): Promise<FinancialGoal> {
    try {
      const response = await apiClient.put<{
        success: boolean;
        message: string;
        data: { goal: FinancialGoal };
      }>(`/api/dashboard/goals/${goalId}`, updates);

      if (!response.success) {
        throw new Error(response.message || 'Failed to update goal');
      }

      return response.data.goal;
    } catch (error: any) {
      console.error('Error updating goal:', error);
      throw new Error(error.message || 'Failed to update goal');
    }
  }

  /**
   * Delete a financial goal
   */
  async deleteGoal(goalId: string): Promise<void> {
    try {
      await apiClient.delete<{
        success: boolean;
        message: string;
      }>(`/api/dashboard/goals/${goalId}`);
    } catch (error: any) {
      console.error('Error deleting goal:', error);
      throw new Error(error.message || 'Failed to delete goal');
    }
  }

  /**
   * Export dashboard data to CSV
   */
  async exportData(format: 'csv' | 'pdf' = 'csv', filters?: DashboardFilters): Promise<Blob> {
    try {
      const params = { ...filters, format };
      const response = await fetch(
        `${apiClient['baseURL']}/api/dashboard/export?${new URLSearchParams(params as any)}`,
        {
          method: 'GET',
          headers: {
            ...apiClient['defaultHeaders']
          }
        }
      );

      if (!response.ok) {
        throw new Error('Export failed');
      }

      return await response.blob();
    } catch (error: any) {
      console.error('Error exporting data:', error);
      throw new Error(error.message || 'Failed to export data');
    }
  }

  /**
   * Get spending insights and recommendations
   */
  async getInsights(timeRange: string = '30d'): Promise<any> {
    try {
      const response = await apiClient.get<{
        success: boolean;
        message: string;
        data: { insights: any };
      }>('/api/dashboard/insights', { timeRange });

      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch insights');
      }

      return response.data.insights;
    } catch (error: any) {
      console.error('Error fetching insights:', error);
      return null;
    }
  }

  /**
   * Format amount with currency
   */
  formatAmount(amount: number, currency: string = 'INR'): string {
    const symbol = currency === 'INR' ? '₹' : '$';
    return `${symbol}${amount.toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })}`;
  }

  /**
   * Calculate percentage change
   */
  calculateChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100 * 10) / 10;
  }
}

export const personalDashboardService = new PersonalDashboardService();
export default personalDashboardService;
