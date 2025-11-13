// Personal Expense Types
export type ExpenseCategory = 
  | 'Food & Dining'
  | 'Transportation'
  | 'Shopping'
  | 'Housing'
  | 'Health & Fitness'
  | 'Entertainment'
  | 'Bills & Utilities'
  | 'Travel'
  | 'Education'
  | 'Groceries'
  | 'Personal Care'
  | 'Home & Garden'
  | 'Gifts & Donations'
  | 'Business'
  | 'settlement'
  | 'Other';

export type PaymentMethod = 'UPI' | 'Credit Card' | 'Debit Card' | 'Cash' | 'Bank Transfer' | 'Wallet';

export interface PersonalExpense {
  _id: string;
  userId: string;
  title: string;
  description?: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
  paymentMethod: PaymentMethod;
  merchant?: string;
  receipt?: {
    url: string;
    filename: string;
  };
  recurring: boolean;
  recurringConfig?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    nextDate?: string;
  };
  tags: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExpenseRequest {
  title: string;
  description?: string;
  amount: number;
  category: ExpenseCategory;
  date?: string;
  paymentMethod?: PaymentMethod;
  merchant?: string;
  recurring?: boolean;
  recurringConfig?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
  };
  tags?: string[];
  notes?: string;
}

export interface UpdateExpenseRequest {
  title?: string;
  description?: string;
  amount?: number;
  category?: ExpenseCategory;
  date?: string;
  paymentMethod?: PaymentMethod;
  merchant?: string;
  recurring?: boolean;
  recurringConfig?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
  };
  tags?: string[];
  notes?: string;
}

export interface ExpenseFilters {
  page?: number;
  limit?: number;
  category?: ExpenseCategory;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  paymentMethod?: PaymentMethod;
  search?: string;
  sortBy?: 'date' | 'amount' | 'title' | 'category';
  sortOrder?: 'asc' | 'desc';
  recurring?: boolean;
}

export interface ExpenseAnalytics {
  totalSpent: number;
  totalExpenses: number;
  averagePerDay: number;
  averagePerExpense: number;
  recurringTotal: number;
  recurringCount: number;
  categoryBreakdown: Array<{
    category: ExpenseCategory;
    amount: number;
    count: number;
    percentage: number;
  }>;
  paymentMethodBreakdown: Array<{
    method: PaymentMethod;
    amount: number;
    count: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    amount: number;
    count: number;
  }>;
  topMerchants: Array<{
    merchant: string;
    amount: number;
    count: number;
  }>;
}

export interface GetExpensesResponse {
  success: boolean;
  message: string;
  data: {
    expenses: PersonalExpense[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export interface GetExpenseResponse {
  success: boolean;
  message: string;
  data: {
    expense: PersonalExpense;
  };
}

export interface GetAnalyticsResponse {
  success: boolean;
  message: string;
  data: ExpenseAnalytics;
}

export interface CategoryConfig {
  id: string;
  name: ExpenseCategory;
  icon: string;
  color: string;
  bgColor: string;
}
