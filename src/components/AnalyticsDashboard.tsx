import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Receipt,
  Users,
  Calendar,
  PieChart as PieChartIcon,
  BarChart3,
  Lightbulb,
  RefreshCw,
  Download,
  Filter
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface AnalyticsDashboardProps {
  groupId: string;
  className?: string;
}

const COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00',
  '#ff00ff', '#00ffff', '#ff0000', '#0000ff', '#ffff00'
];

const TIME_RANGES = [
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
  { value: '1y', label: '1 Year' }
];

const fetchGroupAnalytics = async (groupId: string, timeRange: string) => {
  const response = await fetch(`/api/analytics/groups/${groupId}?timeRange=${timeRange}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch analytics');
  }
  
  const data = await response.json();
  return data.data.analytics;
};

const fetchSpendingInsights = async (groupId: string, timeRange: string) => {
  const response = await fetch(`/api/analytics/groups/${groupId}/insights?timeRange=${timeRange}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch insights');
  }
  
  const data = await response.json();
  return data.data.insights;
};

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  groupId,
  className
}) => {
  const [timeRange, setTimeRange] = useState('30d');
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();

  const {
    data: analytics,
    isLoading: analyticsLoading,
    error: analyticsError,
    refetch: refetchAnalytics
  } = useQuery({
    queryKey: ['group-analytics', groupId, timeRange],
    queryFn: () => fetchGroupAnalytics(groupId, timeRange),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000 // 10 minutes
  });

  const {
    data: insights,
    isLoading: insightsLoading
  } = useQuery({
    queryKey: ['spending-insights', groupId, timeRange],
    queryFn: () => fetchSpendingInsights(groupId, timeRange),
    staleTime: 5 * 60 * 1000
  });

  const handleRefresh = async () => {
    try {
      await refetchAnalytics();
      toast({
        title: \"Analytics Updated\",
        description: \"Dashboard data has been refreshed.\",
        className: \"border-green-500/50 bg-green-500/10\"
      });
    } catch (error) {
      toast({
        title: \"Refresh Failed\",
        description: \"Failed to update analytics data.\",
        variant: \"destructive\"
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  const formatPercentage = (value: number) => {
    const sign = value > 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  if (analyticsLoading) {
    return (
      <Card className={cn('glass-card', className)}>
        <CardContent className=\"flex items-center justify-center h-96\">
          <RefreshCw className=\"w-8 h-8 animate-spin text-primary\" />
          <span className=\"ml-2 text-white\">Loading analytics...</span>
        </CardContent>
      </Card>
    );
  }

  if (analyticsError) {
    return (
      <Card className={cn('glass-card', className)}>
        <CardContent className=\"flex items-center justify-center h-96\">
          <div className=\"text-center\">
            <p className=\"text-red-400 mb-4\">Failed to load analytics</p>
            <Button onClick={handleRefresh} variant=\"outline\">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className=\"flex items-center justify-between\">
        <h2 className=\"text-2xl font-bold text-white flex items-center gap-2\">
          <BarChart3 className=\"w-6 h-6 text-primary\" />
          Analytics Dashboard
        </h2>
        <div className=\"flex items-center gap-4\">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className=\"w-32 bg-white/10 border-white/20 text-white\">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIME_RANGES.map(range => (
                <SelectItem key={range.value} value={range.value}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={handleRefresh}
            variant=\"outline\"
            size=\"sm\"
            className=\"border-white/30 text-white hover:bg-white/10\"
          >
            <RefreshCw className=\"w-4 h-4\" />
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4\">
        <Card className=\"glass-card\">
          <CardContent className=\"p-6\">
            <div className=\"flex items-center justify-between\">
              <div>
                <p className=\"text-white/60 text-sm\">Total Expenses</p>
                <p className=\"text-2xl font-bold text-white\">
                  {formatCurrency(analytics?.expenseStats?.totalAmount || 0)}
                </p>
                {analytics?.expenseStats?.trends?.amountChange !== undefined && (
                  <div className=\"flex items-center gap-1 mt-1\">
                    {analytics.expenseStats.trends.amountChange > 0 ? (
                      <TrendingUp className=\"w-4 h-4 text-red-400\" />
                    ) : (
                      <TrendingDown className=\"w-4 h-4 text-green-400\" />
                    )}
                    <span className={cn(
                      'text-xs',
                      analytics.expenseStats.trends.amountChange > 0 ? 'text-red-400' : 'text-green-400'
                    )}>
                      {formatPercentage(analytics.expenseStats.trends.amountChange)}
                    </span>
                  </div>
                )}
              </div>
              <DollarSign className=\"w-8 h-8 text-primary\" />
            </div>
          </CardContent>
        </Card>

        <Card className=\"glass-card\">
          <CardContent className=\"p-6\">
            <div className=\"flex items-center justify-between\">
              <div>
                <p className=\"text-white/60 text-sm\">Total Count</p>
                <p className=\"text-2xl font-bold text-white\">
                  {analytics?.expenseStats?.totalExpenses || 0}
                </p>
                {analytics?.expenseStats?.trends?.countChange !== undefined && (
                  <div className=\"flex items-center gap-1 mt-1\">
                    {analytics.expenseStats.trends.countChange > 0 ? (
                      <TrendingUp className=\"w-4 h-4 text-blue-400\" />
                    ) : (
                      <TrendingDown className=\"w-4 h-4 text-gray-400\" />
                    )}
                    <span className=\"text-xs text-blue-400\">
                      {formatPercentage(analytics.expenseStats.trends.countChange)}
                    </span>
                  </div>
                )}
              </div>
              <Receipt className=\"w-8 h-8 text-primary\" />
            </div>
          </CardContent>
        </Card>

        <Card className=\"glass-card\">
          <CardContent className=\"p-6\">
            <div className=\"flex items-center justify-between\">
              <div>
                <p className=\"text-white/60 text-sm\">Average Expense</p>
                <p className=\"text-2xl font-bold text-white\">
                  {formatCurrency(analytics?.expenseStats?.averageExpense || 0)}
                </p>
              </div>
              <BarChart3 className=\"w-8 h-8 text-primary\" />
            </div>
          </CardContent>
        </Card>

        <Card className=\"glass-card\">
          <CardContent className=\"p-6\">
            <div className=\"flex items-center justify-between\">
              <div>
                <p className=\"text-white/60 text-sm\">Active Members</p>
                <p className=\"text-2xl font-bold text-white\">
                  {analytics?.userSpending?.length || 0}
                </p>
              </div>
              <Users className=\"w-8 h-8 text-primary\" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      {insights && insights.length > 0 && (
        <Card className=\"glass-card\">
          <CardHeader>
            <CardTitle className=\"text-white flex items-center gap-2\">
              <Lightbulb className=\"w-5 h-5 text-primary\" />
              Spending Insights
            </CardTitle>
          </CardHeader>
          <CardContent className=\"space-y-3\">
            {insights.map((insight: any, index: number) => (
              <div
                key={index}
                className={cn(
                  'p-4 rounded-lg border',
                  insight.type === 'warning' && 'border-orange-500/30 bg-orange-500/10',
                  insight.type === 'info' && 'border-blue-500/30 bg-blue-500/10',
                  insight.type === 'action' && 'border-green-500/30 bg-green-500/10'
                )}
              >
                <h4 className=\"font-medium text-white mb-1\">{insight.title}</h4>
                <p className=\"text-white/70 text-sm mb-2\">{insight.message}</p>
                <p className=\"text-white/60 text-xs\">{insight.recommendation}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className=\"bg-white/10 border-white/20\">
          <TabsTrigger value=\"overview\" className=\"data-[state=active]:bg-white/20\">Overview</TabsTrigger>
          <TabsTrigger value=\"categories\" className=\"data-[state=active]:bg-white/20\">Categories</TabsTrigger>
          <TabsTrigger value=\"trends\" className=\"data-[state=active]:bg-white/20\">Trends</TabsTrigger>
          <TabsTrigger value=\"members\" className=\"data-[state=active]:bg-white/20\">Members</TabsTrigger>
        </TabsList>

        <TabsContent value=\"overview\" className=\"mt-6\">
          <div className=\"grid grid-cols-1 lg:grid-cols-2 gap-6\">
            {/* Monthly Trends */}
            <Card className=\"glass-card\">
              <CardHeader>
                <CardTitle className=\"text-white\">Monthly Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width=\"100%\" height={300}>
                  <AreaChart data={analytics?.monthlyTrends || []}>
                    <CartesianGrid strokeDasharray=\"3 3\" stroke=\"rgba(255,255,255,0.1)\" />
                    <XAxis 
                      dataKey=\"period\" 
                      stroke=\"rgba(255,255,255,0.6)\"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke=\"rgba(255,255,255,0.6)\"
                      fontSize={12}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '8px',
                        color: 'white'
                      }}
                      formatter={(value: number) => [formatCurrency(value), 'Amount']}
                    />
                    <Area 
                      type=\"monotone\" 
                      dataKey=\"totalAmount\" 
                      stroke=\"#8884d8\" 
                      fill=\"#8884d8\"
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Payment Patterns */}
            <Card className=\"glass-card\">
              <CardHeader>
                <CardTitle className=\"text-white\">Settlement Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width=\"100%\" height={300}>
                  <LineChart data={analytics?.paymentPatterns?.settlementTrends || []}>
                    <CartesianGrid strokeDasharray=\"3 3\" stroke=\"rgba(255,255,255,0.1)\" />
                    <XAxis 
                      dataKey=\"period\" 
                      stroke=\"rgba(255,255,255,0.6)\"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke=\"rgba(255,255,255,0.6)\"
                      fontSize={12}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '8px',
                        color: 'white'
                      }}
                      formatter={(value: number) => [formatCurrency(value), 'Settled']}
                    />
                    <Line 
                      type=\"monotone\" 
                      dataKey=\"totalAmount\" 
                      stroke=\"#82ca9d\" 
                      strokeWidth={2}
                      dot={{ fill: '#82ca9d', r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value=\"categories\" className=\"mt-6\">
          <div className=\"grid grid-cols-1 lg:grid-cols-2 gap-6\">
            {/* Category Pie Chart */}
            <Card className=\"glass-card\">
              <CardHeader>
                <CardTitle className=\"text-white\">Expense by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width=\"100%\" height={350}>
                  <PieChart>
                    <Pie
                      data={analytics?.categoryBreakdown || []}
                      cx=\"50%\"
                      cy=\"50%\"
                      labelLine={false}
                      label={({ category, percentage }) => `${category}: ${percentage}%`}
                      outerRadius={100}
                      fill=\"#8884d8\"
                      dataKey=\"totalAmount\"
                    >
                      {(analytics?.categoryBreakdown || []).map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '8px',
                        color: 'white'
                      }}
                      formatter={(value: number) => [formatCurrency(value), 'Amount']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Category List */}
            <Card className=\"glass-card\">
              <CardHeader>
                <CardTitle className=\"text-white\">Category Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className=\"h-80\">
                  <div className=\"space-y-3\">
                    {(analytics?.categoryBreakdown || []).map((category: any, index: number) => (
                      <div key={category.category} className=\"flex items-center justify-between p-3 rounded-lg bg-white/5\">
                        <div className=\"flex items-center gap-3\">
                          <div 
                            className=\"w-4 h-4 rounded-full\"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <div>
                            <p className=\"text-white font-medium\">{category.category}</p>
                            <p className=\"text-white/60 text-sm\">{category.count} expenses</p>
                          </div>
                        </div>
                        <div className=\"text-right\">
                          <p className=\"text-white font-medium\">{formatCurrency(category.totalAmount)}</p>
                          <p className=\"text-white/60 text-sm\">{category.percentage}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value=\"trends\" className=\"mt-6\">
          <Card className=\"glass-card\">
            <CardHeader>
              <CardTitle className=\"text-white\">Expense Trends Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width=\"100%\" height={400}>
                <BarChart data={analytics?.monthlyTrends || []}>
                  <CartesianGrid strokeDasharray=\"3 3\" stroke=\"rgba(255,255,255,0.1)\" />
                  <XAxis 
                    dataKey=\"period\" 
                    stroke=\"rgba(255,255,255,0.6)\"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke=\"rgba(255,255,255,0.6)\"
                    fontSize={12}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(0,0,0,0.8)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '8px',
                      color: 'white'
                    }}
                    formatter={(value: number, name: string) => [
                      name === 'totalAmount' ? formatCurrency(value) : value,
                      name === 'totalAmount' ? 'Total Amount' : 'Count'
                    ]}
                  />
                  <Legend 
                    wrapperStyle={{ color: 'rgba(255,255,255,0.8)' }}
                  />
                  <Bar dataKey=\"totalAmount\" fill=\"#8884d8\" name=\"Total Amount\" />
                  <Bar dataKey=\"count\" fill=\"#82ca9d\" name=\"Expense Count\" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value=\"members\" className=\"mt-6\">
          <Card className=\"glass-card\">
            <CardHeader>
              <CardTitle className=\"text-white\">Member Spending Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className=\"space-y-4\">
                {(analytics?.userSpending || []).map((member: any) => (
                  <div key={member.userId} className=\"flex items-center justify-between p-4 rounded-lg bg-white/5\">
                    <div className=\"flex items-center gap-3\">
                      <div className=\"w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-white font-medium\">
                        {member.userName.split(' ').map((n: string) => n[0]).join('')}
                      </div>
                      <div>
                        <p className=\"text-white font-medium\">{member.userName}</p>
                        <p className=\"text-white/60 text-sm\">{member.expenseCount} expenses</p>
                      </div>
                    </div>
                    <div className=\"text-right\">
                      <p className=\"text-white font-medium\">{formatCurrency(member.totalPaid)}</p>
                      <div className=\"flex items-center gap-2\">
                        <div className=\"w-20 h-2 bg-white/20 rounded-full overflow-hidden\">
                          <div 
                            className=\"h-full bg-primary rounded-full\"
                            style={{ width: `${member.percentage}%` }}
                          />
                        </div>
                        <span className=\"text-white/60 text-sm\">{member.percentage}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsDashboard;