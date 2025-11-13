export interface CategoryData {
  category: string;
  count: number;
  totalAmount: number;
  percentage?: number;
  color?: string;
}

export interface CategoryTrend extends CategoryData {
  current: number;
  previous: number;
  change: number;
  color: string;
  name: string;
}

export interface ChartData {
  name: string;
  value: number;
  color?: string;
}

export interface MonthlyTrend {
  period: string;
  year: number;
  month?: number;
  week?: number;
  count: number;
  totalAmount: number;
  averageAmount: number;
}

export interface StatCard {
  title: string;
  value: string;
  icon: any;
  trend?: {
    value: number;
    label: string;
  };
  subtitle?: string;
  color?: 'success' | 'primary' | 'warning' | 'destructive';
}

export interface GroupAnalytics {
  totalExpenses: number;
  totalAmount: number;
  averageExpense: number;
  categoryBreakdown: CategoryData[];
  topSpender: {
    userId: string;
    userName: string;
    totalSpent: number;
    expenseCount: number;
  };
  expensesByMember: Array<{
    userId: string;
    userName: string;
    totalSpent: number;
    expenseCount: number;
  }>;
  recentTrends: {
    totalExpenses: number;
    totalAmount: number;
    percentageChange: number;
  };
  largestExpense: {
    id: string;
    description: string;
    amount: number;
    category: string;
    date: string;
  };
}

export interface UserSpendingSummary {
  timeRange: string;
  period: {
    startDate: string;
    endDate: string;
  };
  paidExpenses: {
    count: number;
    totalAmount: number;
  };
  sharedExpenses: {
    count: number;
    totalAmount: number;
  };
  categoryBreakdown: CategoryData[];
}

export interface SpendingInsight {
  type: 'success' | 'primary' | 'warning' | 'destructive';
  title: string;
  message: string;
  icon: string;
}

export interface AnalyticsFilters {
  timeRange?: '7d' | '30d' | '90d' | '1y';
  groupId?: string;
  category?: string;
}

export interface AnalyticsResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export type TimeRange = 'thisWeek' | 'thisMonth' | 'last3Months' | 'thisYear';

export interface AnalyticsState {
  groupAnalytics: GroupAnalytics | null;
  personalSummary: UserSpendingSummary | null;
  trends: MonthlyTrend[];
  insights: SpendingInsight[];
  isLoading: boolean;
  error: string | null;
}

export interface GoalProgress {
  name: string;
  current: number;
  target: number;
  percentage: number;
  color: string;
}
