import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import analyticsService from '@/lib/services/analyticsService';
import {
  GroupAnalytics,
  UserSpendingSummary,
  MonthlyTrend,
  SpendingInsight,
  TimeRange,
  AnalyticsFilters,
  CategoryData,
  ChartData,
  StatCard
} from '@/types/analytics';
import { TrendingUp, TrendingDown, Calendar, Target, Wallet, Users, PieChart } from 'lucide-react';

interface UseAnalyticsOptions {
  groupId?: string;
  mode: 'group' | 'personal';
  enabled?: boolean;
}

/**
 * Main analytics hook for both group and personal analytics
 */
export const useAnalytics = (options: UseAnalyticsOptions) => {
  const { groupId, mode, enabled = true } = options;
  const [timeRange, setTimeRange] = useState<TimeRange>('thisMonth');
  const [sortBy, setSortBy] = useState<'amount' | 'count' | 'name'>('amount');
  const queryClient = useQueryClient();

  // Fetch group analytics
  const {
    data: groupAnalytics,
    isLoading: groupLoading,
    error: groupError,
    refetch: refetchGroup
  } = useQuery<GroupAnalytics>({
    queryKey: ['groupAnalytics', groupId, timeRange],
    queryFn: () => analyticsService.getGroupAnalytics(groupId!, timeRange),
    enabled: enabled && mode === 'group' && !!groupId && groupId !== 'undefined',
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000
  });

  // Fetch personal spending summary
  const {
    data: personalSummary,
    isLoading: personalLoading,
    error: personalError,
    refetch: refetchPersonal
  } = useQuery<UserSpendingSummary>({
    queryKey: ['personalSummary', timeRange, groupId],
    queryFn: () => analyticsService.getUserSpendingSummary(timeRange, groupId),
    enabled: enabled && mode === 'personal',
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000
  });

  // Fetch expense trends
  const {
    data: trends,
    isLoading: trendsLoading,
    refetch: refetchTrends
  } = useQuery<MonthlyTrend[]>({
    queryKey: ['expenseTrends', timeRange, groupId],
    queryFn: () => analyticsService.getExpenseTrends(timeRange, { groupId }),
    enabled: enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000
  });

  // Fetch insights (only for group mode)
  const {
    data: insights,
    isLoading: insightsLoading
  } = useQuery<SpendingInsight[]>({
    queryKey: ['groupInsights', groupId, timeRange],
    queryFn: () => analyticsService.getGroupInsights(groupId!, timeRange),
    enabled: enabled && mode === 'group' && !!groupId && groupId !== 'undefined',
    staleTime: 10 * 60 * 1000,
    gcTime: 20 * 60 * 1000
  });

  // Get current data based on mode
  const currentData = mode === 'group' ? groupAnalytics : personalSummary;
  const isLoading = mode === 'group' ? groupLoading : personalLoading;
  const error = mode === 'group' ? groupError : personalError;

  // Generate stat cards
  const statCards: StatCard[] = mode === 'group' 
    ? generateGroupStatCards(groupAnalytics)
    : generatePersonalStatCards(personalSummary);

  // Generate chart data
  const chartData: ChartData[] = mode === 'group'
    ? generateGroupChartData(groupAnalytics)
    : generatePersonalChartData(personalSummary);

  // Get sorted category data
  const sortedCategories = getSortedCategories(
    mode === 'group' ? groupAnalytics?.categoryBreakdown : personalSummary?.categoryBreakdown,
    sortBy
  );

  // Refresh all data
  const refresh = useCallback(async () => {
    if (mode === 'group') {
      await refetchGroup();
    } else {
      await refetchPersonal();
    }
    await refetchTrends();
  }, [mode, refetchGroup, refetchPersonal, refetchTrends]);

  // Clear cache
  const clearCache = useCallback(async () => {
    await analyticsService.clearCache();
    queryClient.invalidateQueries({ queryKey: ['groupAnalytics'] });
    queryClient.invalidateQueries({ queryKey: ['personalSummary'] });
    queryClient.invalidateQueries({ queryKey: ['expenseTrends'] });
    queryClient.invalidateQueries({ queryKey: ['groupInsights'] });
  }, [queryClient]);

  // Export data
  const exportData = useCallback(() => {
    const exportData = sortedCategories.map(cat => ({
      Category: cat.category,
      Amount: cat.totalAmount,
      Count: cat.count,
      Percentage: cat.percentage || 0
    }));
    
    const filename = mode === 'group' 
      ? `group_analytics_${groupId}` 
      : 'personal_analytics';
    
    analyticsService.exportToCSV(exportData, filename);
  }, [sortedCategories, mode, groupId]);

  return {
    // Data
    currentData,
    statCards,
    chartData,
    sortedCategories,
    trends: trends || [],
    insights: insights || [],
    
    // State
    timeRange,
    setTimeRange,
    sortBy,
    setSortBy,
    isLoading: isLoading || trendsLoading || insightsLoading,
    error,
    
    // Actions
    refresh,
    clearCache,
    exportData
  };
};

/**
 * Generate stat cards for group analytics
 */
function generateGroupStatCards(analytics?: GroupAnalytics): StatCard[] {
  if (!analytics) return [];

  return [
    {
      title: 'Total Expenses',
      value: `₹${analytics.totalAmount.toLocaleString('en-IN')}`,
      icon: Wallet,
      trend: {
        value: analytics.recentTrends.percentageChange,
        label: 'vs last period'
      },
      color: analytics.recentTrends.percentageChange >= 0 ? 'destructive' : 'success'
    },
    {
      title: 'Expense Count',
      value: analytics.totalExpenses.toString(),
      icon: Target,
      subtitle: `Avg: ₹${Math.round(analytics.averageExpense)}`
    },
    {
      title: 'Top Spender',
      value: analytics.topSpender.userName,
      icon: Users,
      subtitle: `₹${analytics.topSpender.totalSpent.toLocaleString('en-IN')}`
    },
    {
      title: 'Largest Expense',
      value: `₹${analytics.largestExpense.amount.toLocaleString('en-IN')}`,
      icon: TrendingUp,
      subtitle: analytics.largestExpense.category
    }
  ];
}

/**
 * Generate stat cards for personal analytics
 */
function generatePersonalStatCards(summary?: UserSpendingSummary): StatCard[] {
  if (!summary) return [];

  const totalSpent = summary.paidExpenses.totalAmount + summary.sharedExpenses.totalAmount;
  const totalCount = summary.paidExpenses.count + summary.sharedExpenses.count;
  const avgPerExpense = totalCount > 0 ? totalSpent / totalCount : 0;

  const topCategory = summary.categoryBreakdown.length > 0 
    ? summary.categoryBreakdown[0]
    : null;

  return [
    {
      title: 'Total Spent',
      value: `₹${totalSpent.toLocaleString('en-IN')}`,
      icon: Wallet,
      color: 'primary'
    },
    {
      title: 'Expenses Paid',
      value: summary.paidExpenses.count.toString(),
      icon: TrendingUp,
      subtitle: `₹${summary.paidExpenses.totalAmount.toLocaleString('en-IN')}`
    },
    {
      title: 'Top Category',
      value: topCategory?.category || 'N/A',
      icon: PieChart,
      subtitle: topCategory ? `₹${topCategory.totalAmount.toLocaleString('en-IN')}` : ''
    },
    {
      title: 'Average Expense',
      value: `₹${Math.round(avgPerExpense).toLocaleString('en-IN')}`,
      icon: Calendar,
      subtitle: `${totalCount} transactions`
    }
  ];
}

/**
 * Generate chart data for group analytics
 */
function generateGroupChartData(analytics?: GroupAnalytics): ChartData[] {
  if (!analytics || !analytics.categoryBreakdown) return [];

  return analytics.categoryBreakdown.map(cat => ({
    name: cat.category,
    value: cat.totalAmount,
    color: analyticsService.getCategoryColor(cat.category)
  }));
}

/**
 * Generate chart data for personal analytics
 */
function generatePersonalChartData(summary?: UserSpendingSummary): ChartData[] {
  if (!summary || !summary.categoryBreakdown) return [];

  return summary.categoryBreakdown.map(cat => ({
    name: cat.category,
    value: cat.totalAmount,
    color: analyticsService.getCategoryColor(cat.category)
  }));
}

/**
 * Get sorted categories
 */
function getSortedCategories(
  categories?: CategoryData[],
  sortBy: 'amount' | 'count' | 'name' = 'amount'
): CategoryData[] {
  if (!categories) return [];

  const total = categories.reduce((sum, cat) => sum + cat.totalAmount, 0);
  
  const withPercentages = categories.map(cat => ({
    ...cat,
    percentage: analyticsService.calculatePercentage(cat.totalAmount, total),
    color: analyticsService.getCategoryColor(cat.category)
  }));

  return withPercentages.sort((a, b) => {
    switch (sortBy) {
      case 'amount':
        return b.totalAmount - a.totalAmount;
      case 'count':
        return b.count - a.count;
      case 'name':
        return a.category.localeCompare(b.category);
      default:
        return 0;
    }
  });
}

export default useAnalytics;
