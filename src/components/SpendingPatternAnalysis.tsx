import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  Legend
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  Target,
  AlertTriangle,
  CheckCircle,
  Info,
  Zap,
  Users,
  CreditCard
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SpendingPatternAnalysisProps {
  groupId: string;
  userId?: string;
  timeRange?: string;
  className?: string;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00'];

const fetchExpenseTrends = async (groupId: string, timeRange: string, category?: string) => {
  const params = new URLSearchParams({
    timeRange,
    groupId
  });
  if (category) params.append('category', category);
  
  const response = await fetch(`/api/analytics/trends?${params}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch trends');
  }
  
  const data = await response.json();
  return data.data;
};

const fetchUserSpending = async (groupId: string, timeRange: string) => {
  const response = await fetch(`/api/analytics/users/spending?timeRange=${timeRange}&groupId=${groupId}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch user spending');
  }
  
  const data = await response.json();
  return data.data.summary;
};

export const SpendingPatternAnalysis: React.FC<SpendingPatternAnalysisProps> = ({
  groupId,
  userId,
  timeRange = '90d',
  className
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [analysisType, setAnalysisType] = useState('trends');
  
  const {
    data: trends,
    isLoading: trendsLoading,
    error: trendsError
  } = useQuery({
    queryKey: ['expense-trends', groupId, timeRange, selectedCategory === 'all' ? undefined : selectedCategory],
    queryFn: () => fetchExpenseTrends(groupId, timeRange, selectedCategory === 'all' ? undefined : selectedCategory),
    staleTime: 5 * 60 * 1000
  });

  const {
    data: userSpending,
    isLoading: spendingLoading
  } = useQuery({
    queryKey: ['user-spending', groupId, timeRange],
    queryFn: () => fetchUserSpending(groupId, timeRange),
    staleTime: 5 * 60 * 1000
  });

  // Analyze spending patterns
  const spendingAnalysis = useMemo(() => {
    if (!trends?.trends || trends.trends.length === 0) {
      return {
        patterns: [],
        insights: [],
        predictions: []
      };
    }

    const trendData = trends.trends;
    const insights = [];
    const patterns = [];
    const predictions = [];

    // Calculate trend direction
    if (trendData.length >= 2) {
      const recent = trendData.slice(-3); // Last 3 periods
      const older = trendData.slice(-6, -3); // Previous 3 periods
      
      const recentAvg = recent.reduce((sum, item) => sum + item.totalAmount, 0) / recent.length;
      const olderAvg = older.length > 0 ? older.reduce((sum, item) => sum + item.totalAmount, 0) / older.length : recentAvg;
      
      const trendPercentage = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;
      
      if (Math.abs(trendPercentage) > 5) {
        insights.push({
          type: trendPercentage > 0 ? 'warning' : 'success',
          title: trendPercentage > 0 ? 'Increasing Spending Trend' : 'Decreasing Spending Trend',
          message: `Spending has ${trendPercentage > 0 ? 'increased' : 'decreased'} by ${Math.abs(trendPercentage).toFixed(1)}% recently`,
          value: trendPercentage,
          icon: trendPercentage > 0 ? TrendingUp : TrendingDown
        });
      }
    }

    // Analyze spending consistency
    const amounts = trendData.map(item => item.totalAmount);
    const mean = amounts.reduce((sum, val) => sum + val, 0) / amounts.length;
    const variance = amounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / amounts.length;
    const standardDeviation = Math.sqrt(variance);
    const coefficientOfVariation = mean > 0 ? (standardDeviation / mean) * 100 : 0;

    if (coefficientOfVariation < 20) {
      patterns.push({
        type: 'consistent',
        title: 'Consistent Spending',
        description: 'Your spending pattern is highly consistent',
        score: 95 - coefficientOfVariation,
        icon: CheckCircle,
        color: 'text-green-400'
      });
    } else if (coefficientOfVariation > 50) {
      patterns.push({
        type: 'volatile',
        title: 'Volatile Spending',
        description: 'Your spending varies significantly over time',
        score: coefficientOfVariation,
        icon: AlertTriangle,
        color: 'text-orange-400'
      });
    }

    // Identify peak spending periods
    const maxAmount = Math.max(...amounts);
    const maxPeriod = trendData.find(item => item.totalAmount === maxAmount);
    
    if (maxPeriod && maxAmount > mean * 1.5) {
      insights.push({
        type: 'info',
        title: 'Peak Spending Period',
        message: `Highest spending was ₹${maxAmount.toFixed(2)} in ${maxPeriod.period}`,
        value: maxAmount,
        icon: Target
      });
    }

    // Simple trend prediction (linear regression)
    if (trendData.length >= 4) {
      const n = trendData.length;
      const x = trendData.map((_, i) => i);
      const y = amounts;
      
      const sumX = x.reduce((sum, val) => sum + val, 0);
      const sumY = y.reduce((sum, val) => sum + val, 0);
      const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
      const sumXX = x.reduce((sum, val) => sum + val * val, 0);
      
      const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;
      
      // Predict next 2 periods
      for (let i = 1; i <= 2; i++) {
        const nextX = n + i - 1;
        const predictedY = slope * nextX + intercept;
        
        predictions.push({
          period: `Forecast ${i}`,
          predictedAmount: Math.max(0, predictedY),
          confidence: Math.max(20, 90 - coefficientOfVariation) // Lower confidence for volatile data
        });
      }
    }

    return { patterns, insights, predictions };
  }, [trends]);

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  if (trendsLoading || spendingLoading) {
    return (
      <Card className={cn('glass-card', className)}>
        <CardContent className=\"flex items-center justify-center h-96\">
          <div className=\"text-white\">Loading spending patterns...</div>
        </CardContent>
      </Card>
    );
  }

  if (trendsError) {
    return (
      <Card className={cn('glass-card', className)}>
        <CardContent className=\"flex items-center justify-center h-96\">
          <div className=\"text-red-400\">Failed to load spending patterns</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className=\"flex items-center justify-between\">
        <h3 className=\"text-xl font-bold text-white flex items-center gap-2\">
          <Zap className=\"w-5 h-5 text-primary\" />
          Spending Pattern Analysis
        </h3>
        <div className=\"flex items-center gap-3\">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className=\"w-40 bg-white/10 border-white/20 text-white\">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value=\"all\">All Categories</SelectItem>
              {userSpending?.categoryBreakdown?.map((cat: any) => (
                <SelectItem key={cat.category} value={cat.category}>
                  {cat.category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Pattern Insights */}
      {spendingAnalysis.insights.length > 0 && (
        <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4\">
          {spendingAnalysis.insights.map((insight, index) => {
            const Icon = insight.icon;
            return (
              <Card key={index} className=\"glass-card\">
                <CardContent className=\"p-4\">
                  <div className=\"flex items-center gap-3\">
                    <Icon className={cn(
                      'w-8 h-8',
                      insight.type === 'warning' && 'text-orange-400',
                      insight.type === 'success' && 'text-green-400',
                      insight.type === 'info' && 'text-blue-400'
                    )} />
                    <div>
                      <h4 className=\"text-white font-medium\">{insight.title}</h4>
                      <p className=\"text-white/70 text-sm\">{insight.message}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Spending Patterns */}
      {spendingAnalysis.patterns.length > 0 && (
        <Card className=\"glass-card\">
          <CardHeader>
            <CardTitle className=\"text-white\">Spending Behavior Patterns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className=\"grid grid-cols-1 md:grid-cols-2 gap-4\">
              {spendingAnalysis.patterns.map((pattern, index) => {
                const Icon = pattern.icon;
                return (
                  <div key={index} className=\"p-4 rounded-lg bg-white/5 border border-white/10\">
                    <div className=\"flex items-center justify-between mb-2\">
                      <div className=\"flex items-center gap-2\">
                        <Icon className={cn('w-5 h-5', pattern.color)} />
                        <h5 className=\"text-white font-medium\">{pattern.title}</h5>
                      </div>
                      <Badge variant=\"outline\" className=\"border-white/30 text-white/70\">
                        {pattern.score.toFixed(0)}%
                      </Badge>
                    </div>
                    <p className=\"text-white/70 text-sm\">{pattern.description}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={analysisType} onValueChange={setAnalysisType}>
        <TabsList className=\"bg-white/10 border-white/20\">
          <TabsTrigger value=\"trends\" className=\"data-[state=active]:bg-white/20\">Trend Analysis</TabsTrigger>
          <TabsTrigger value=\"predictions\" className=\"data-[state=active]:bg-white/20\">Predictions</TabsTrigger>
          <TabsTrigger value=\"comparison\" className=\"data-[state=active]:bg-white/20\">Comparison</TabsTrigger>
        </TabsList>

        <TabsContent value=\"trends\" className=\"mt-6\">
          <Card className=\"glass-card\">
            <CardHeader>
              <CardTitle className=\"text-white\">
                Spending Trends Over Time
                {selectedCategory !== 'all' && (
                  <span className=\"text-primary ml-2\">• {selectedCategory}</span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width=\"100%\" height={400}>
                <LineChart data={trends?.trends || []}>
                  <CartesianGrid strokeDasharray=\"3 3\" stroke=\"rgba(255,255,255,0.1)\" />
                  <XAxis 
                    dataKey=\"period\" 
                    stroke=\"rgba(255,255,255,0.6)\"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke=\"rgba(255,255,255,0.6)\"
                    fontSize={12}
                    tickFormatter={(value) => `₹${value}`}
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
                  <Line 
                    type=\"monotone\" 
                    dataKey=\"totalAmount\" 
                    stroke=\"#8884d8\" 
                    strokeWidth={3}
                    dot={{ fill: '#8884d8', r: 6 }}
                    activeDot={{ r: 8, fill: '#8884d8' }}
                  />
                  <Line 
                    type=\"monotone\" 
                    dataKey=\"averageAmount\" 
                    stroke=\"#82ca9d\" 
                    strokeWidth={2}
                    strokeDasharray=\"5 5\"
                    dot={{ fill: '#82ca9d', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value=\"predictions\" className=\"mt-6\">
          <div className=\"grid grid-cols-1 lg:grid-cols-2 gap-6\">
            {/* Predictions Chart */}
            <Card className=\"glass-card\">
              <CardHeader>
                <CardTitle className=\"text-white\">Spending Forecast</CardTitle>
              </CardHeader>
              <CardContent>
                {spendingAnalysis.predictions.length > 0 ? (
                  <div className=\"space-y-4\">
                    {spendingAnalysis.predictions.map((prediction, index) => (
                      <div key={index} className=\"p-4 rounded-lg bg-white/5 border border-white/10\">
                        <div className=\"flex items-center justify-between mb-2\">
                          <h5 className=\"text-white font-medium\">{prediction.period}</h5>
                          <Badge 
                            variant=\"outline\" 
                            className={cn(
                              'border-white/30',
                              prediction.confidence > 70 ? 'text-green-400 border-green-400/30' :
                              prediction.confidence > 50 ? 'text-yellow-400 border-yellow-400/30' :
                              'text-red-400 border-red-400/30'
                            )}
                          >
                            {prediction.confidence.toFixed(0)}% confidence
                          </Badge>
                        </div>
                        <p className=\"text-xl font-bold text-white\">
                          {formatCurrency(prediction.predictedAmount)}
                        </p>
                        <p className=\"text-white/60 text-sm mt-1\">
                          Based on historical spending patterns
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className=\"text-center py-8\">
                    <Target className=\"w-12 h-12 text-white/20 mx-auto mb-2\" />
                    <p className=\"text-white/60\">Insufficient data for predictions</p>
                    <p className=\"text-white/40 text-sm\">Need at least 4 data points</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Spending Distribution */}
            <Card className=\"glass-card\">
              <CardHeader>
                <CardTitle className=\"text-white\">Expense Frequency</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width=\"100%\" height={300}>
                  <BarChart data={trends?.trends || []}>
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
                    />
                    <Bar dataKey=\"count\" fill=\"#ffc658\" name=\"Expense Count\" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value=\"comparison\" className=\"mt-6\">
          <Card className=\"glass-card\">
            <CardHeader>
              <CardTitle className=\"text-white\">Personal vs Group Spending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className=\"grid grid-cols-1 md:grid-cols-2 gap-6\">
                <div className=\"space-y-4\">
                  <h4 className=\"text-white font-medium flex items-center gap-2\">
                    <Users className=\"w-4 h-4\" />
                    Your Spending Summary
                  </h4>
                  <div className=\"space-y-3\">
                    <div className=\"p-3 rounded-lg bg-white/5\">
                      <p className=\"text-white/60 text-sm\">Expenses You Paid</p>
                      <p className=\"text-xl font-bold text-white\">
                        {formatCurrency(userSpending?.paidExpenses?.totalAmount || 0)}
                      </p>
                      <p className=\"text-white/40 text-xs\">
                        {userSpending?.paidExpenses?.count || 0} transactions
                      </p>
                    </div>
                    <div className=\"p-3 rounded-lg bg-white/5\">
                      <p className=\"text-white/60 text-sm\">Your Share of Group Expenses</p>
                      <p className=\"text-xl font-bold text-white\">
                        {formatCurrency(userSpending?.sharedExpenses?.totalAmount || 0)}
                      </p>
                      <p className=\"text-white/40 text-xs\">
                        {userSpending?.sharedExpenses?.count || 0} shared expenses
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className=\"space-y-4\">
                  <h4 className=\"text-white font-medium flex items-center gap-2\">
                    <CreditCard className=\"w-4 h-4\" />
                    Category Breakdown
                  </h4>
                  <div className=\"space-y-2\">
                    {userSpending?.categoryBreakdown?.slice(0, 5).map((category: any, index: number) => (
                      <div key={category.category} className=\"flex items-center justify-between p-2 rounded bg-white/5\">
                        <div className=\"flex items-center gap-2\">
                          <div 
                            className=\"w-3 h-3 rounded-full\"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className=\"text-white text-sm\">{category.category}</span>
                        </div>
                        <div className=\"text-right\">
                          <p className=\"text-white text-sm font-medium\">
                            {formatCurrency(category.totalAmount)}
                          </p>
                          <p className=\"text-white/60 text-xs\">{category.count} expenses</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SpendingPatternAnalysis;