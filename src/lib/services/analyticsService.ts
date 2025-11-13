import { apiClient } from '../api';
import {
  GroupAnalytics,
  UserSpendingSummary,
  MonthlyTrend,
  SpendingInsight,
  AnalyticsFilters,
  AnalyticsResponse,
  TimeRange
} from '@/types/analytics';

class AnalyticsService {
  /**
   * Convert frontend time range format to backend format
   */
  private convertTimeRange(timeRange: TimeRange): '7d' | '30d' | '90d' | '1y' {
    const mapping: Record<TimeRange, '7d' | '30d' | '90d' | '1y'> = {
      'thisWeek': '7d',
      'thisMonth': '30d',
      'last3Months': '90d',
      'thisYear': '1y'
    };
    return mapping[timeRange] || '30d';
  }

  /**
   * Get group analytics data
   */
  async getGroupAnalytics(
    groupId: string,
    timeRange: TimeRange = 'thisMonth'
  ): Promise<GroupAnalytics> {
    try {
      const backendTimeRange = this.convertTimeRange(timeRange);
      const response = await apiClient.get<AnalyticsResponse<{ analytics: GroupAnalytics }>>(
        `/api/analytics/groups/${groupId}`,
        { timeRange: backendTimeRange }
      );

      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch group analytics');
      }

      return response.data.analytics;
    } catch (error: any) {
      console.error('Error fetching group analytics:', error);
      throw new Error(error.message || 'Failed to load group analytics');
    }
  }

  /**
   * Get spending insights for a group
   */
  async getGroupInsights(
    groupId: string,
    timeRange: TimeRange = 'thisMonth'
  ): Promise<SpendingInsight[]> {
    try {
      const backendTimeRange = this.convertTimeRange(timeRange);
      const response = await apiClient.get<AnalyticsResponse<{ insights: any }>>(
        `/api/analytics/groups/${groupId}/insights`,
        { timeRange: backendTimeRange }
      );

      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch insights');
      }

      return this.formatInsights(response.data.insights);
    } catch (error: any) {
      console.error('Error fetching group insights:', error);
      return [];
    }
  }

  /**
   * Get user spending summary (personal analytics)
   */
  async getUserSpendingSummary(
    timeRange: TimeRange = 'thisMonth',
    groupId?: string
  ): Promise<UserSpendingSummary> {
    try {
      const backendTimeRange = this.convertTimeRange(timeRange);
      const params: any = { timeRange: backendTimeRange };
      
      if (groupId) {
        params.groupId = groupId;
      }

      const response = await apiClient.get<AnalyticsResponse<{ summary: UserSpendingSummary }>>(
        '/api/analytics/users/spending',
        params
      );

      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch spending summary');
      }

      return response.data.summary;
    } catch (error: any) {
      console.error('Error fetching user spending summary:', error);
      throw new Error(error.message || 'Failed to load spending summary');
    }
  }

  /**
   * Get expense trends over time
   */
  async getExpenseTrends(
    timeRange: TimeRange = 'last3Months',
    filters?: AnalyticsFilters
  ): Promise<MonthlyTrend[]> {
    try {
      const backendTimeRange = this.convertTimeRange(timeRange);
      const params: any = { timeRange: backendTimeRange };
      
      if (filters?.groupId) {
        params.groupId = filters.groupId;
      }
      if (filters?.category) {
        params.category = filters.category;
      }

      const response = await apiClient.get<AnalyticsResponse<{ trends: MonthlyTrend[] }>>(
        '/api/analytics/trends',
        params
      );

      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch trends');
      }

      return response.data.trends;
    } catch (error: any) {
      console.error('Error fetching expense trends:', error);
      return [];
    }
  }

  /**
   * Clear analytics cache
   */
  async clearCache(pattern?: string): Promise<void> {
    try {
      await apiClient.post<AnalyticsResponse<null>>(
        '/api/analytics/cache/clear',
        { pattern }
      );
    } catch (error: any) {
      console.error('Error clearing cache:', error);
    }
  }

  /**
   * Format insights from backend data
   */
  private formatInsights(insightsData: any): SpendingInsight[] {
    const insights: SpendingInsight[] = [];

    if (insightsData.spendingPatterns) {
      insights.push({
        type: 'primary',
        title: 'Spending Pattern',
        message: insightsData.spendingPatterns,
        icon: '💡'
      });
    }

    if (insightsData.recommendations) {
      insights.push({
        type: 'success',
        title: 'Recommendation',
        message: insightsData.recommendations,
        icon: '✨'
      });
    }

    if (insightsData.warnings) {
      insights.push({
        type: 'warning',
        title: 'Watch Out',
        message: insightsData.warnings,
        icon: '⚠️'
      });
    }

    return insights;
  }

  /**
   * Generate category colors based on category name
   */
  getCategoryColor(category: string): string {
    const colorMap: Record<string, string> = {
      'Food & Dining': '#10b981',
      'Food': '#10b981',
      'Travel': '#3b82f6',
      'Travel & Transport': '#3b82f6',
      'Transportation': '#3b82f6',
      'Entertainment': '#8b5cf6',
      'Housing': '#ef4444',
      'Shopping': '#f59e0b',
      'Bills & Utilities': '#06b6d4',
      'Healthcare': '#ec4899',
      'Education': '#8b5cf6',
      'Other': '#6b7280'
    };

    return colorMap[category] || '#6b7280';
  }

  /**
   * Calculate percentage for category
   */
  calculatePercentage(value: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((value / total) * 100 * 10) / 10;
  }

  /**
   * Format currency amount
   */
  formatAmount(amount: number): string {
    return `₹${amount.toLocaleString('en-IN', { 
      minimumFractionDigits: 0,
      maximumFractionDigits: 0 
    })}`;
  }

  /**
   * Export analytics data to CSV
   */
  exportToCSV(data: any[], filename: string): void {
    try {
      const csv = this.convertToCSV(data);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting to CSV:', error);
    }
  }

  /**
   * Convert data to CSV format
   */
  private convertToCSV(data: any[]): string {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];

    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        return typeof value === 'string' ? `"${value}"` : value;
      });
      csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;
