import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  TrendingUp, TrendingDown, BarChart3, PieChart, Calendar,
  Target, AlertTriangle, CheckCircle, DollarSign, 
  ArrowUpRight, ArrowDownRight, Filter, Download,
  Zap, Brain, Award, Clock
} from "lucide-react";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart as RechartsPieChart, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format, subDays } from "date-fns";

// Generate mock analytics data
const generateAnalyticsData = () => {
  const categories = [
    { name: 'Food & Dining', color: '#FF6B6B', icon: '🍽️', amount: 2450, budget: 3000, trend: 'up', trendValue: 12 },
    { name: 'Transportation', color: '#4ECDC4', icon: '🚗', amount: 1200, budget: 1500, trend: 'down', trendValue: 8 },
    { name: 'Entertainment', color: '#45B7D1', icon: '🎬', amount: 800, budget: 1000, trend: 'up', trendValue: 15 },
    { name: 'Shopping', color: '#96CEB4', icon: '🛍️', amount: 1500, budget: 2000, trend: 'up', trendValue: 5 },
    { name: 'Utilities', color: '#FECA57', icon: '⚡', amount: 900, budget: 1200, trend: 'down', trendValue: 3 },
  ];

  const dailyData = Array.from({ length: 30 }, (_, i) => {
    const date = subDays(new Date(), 29 - i);
    return {
      date: format(date, 'MMM dd'),
      amount: Math.round(300 + Math.random() * 800),
      budget: 600,
      savings: Math.round(50 + Math.random() * 200)
    };
  });

  return { categories, dailyData };
};

interface AdvancedBudgetAnalyticsProps {
  mode?: 'personal' | 'group';
}

const AdvancedBudgetAnalytics = ({ mode = 'personal' }: AdvancedBudgetAnalyticsProps) => {
  const [timeRange, setTimeRange] = useState('30d');
  const [activeTab, setActiveTab] = useState('overview');
  
  const { categories, dailyData } = useMemo(() => generateAnalyticsData(), [timeRange]);

  // Calculate metrics
  const totalSpending = categories.reduce((sum, cat) => sum + cat.amount, 0);
  const totalBudget = categories.reduce((sum, cat) => sum + cat.budget, 0);
  const budgetUtilization = (totalSpending / totalBudget) * 100;
  const totalSavings = dailyData.reduce((sum, day) => sum + day.savings, 0);
  const savingsRate = (totalSavings / totalSpending) * 100;

  // Generate insights
  const insights = useMemo(() => {
    const results = [];
    
    if (budgetUtilization > 85) {
      results.push({
        type: 'warning',
        title: 'Budget Alert',
        description: `${budgetUtilization.toFixed(1)}% of budget used`,
        icon: AlertTriangle
      });
    }

    const topCategory = categories.reduce((max, cat) => cat.amount > max.amount ? cat : max);
    results.push({
      type: 'info',
      title: 'Top Category',
      description: `${topCategory.name}: ₹${topCategory.amount}`,
      icon: PieChart
    });

    if (savingsRate > 15) {
      results.push({
        type: 'success',
        title: 'Great Savings',
        description: `${savingsRate.toFixed(1)}% savings rate`,
        icon: CheckCircle
      });
    }

    return results;
  }, [categories, budgetUtilization, savingsRate]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Advanced Budget Analytics
              </CardTitle>
              <CardDescription>
                Deep insights into your {mode} spending patterns
              </CardDescription>
            </div>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7 days</SelectItem>
                <SelectItem value="30d">30 days</SelectItem>
                <SelectItem value="90d">3 months</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Spending</p>
                <p className="text-2xl font-bold">₹{totalSpending.toLocaleString()}</p>
              </div>
              <DollarSign className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Budget Used</p>
                <p className="text-2xl font-bold">{budgetUtilization.toFixed(1)}%</p>
                <Progress value={budgetUtilization} className="mt-2" />
              </div>
              <Target className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Savings Rate</p>
                <p className="text-2xl font-bold">{savingsRate.toFixed(1)}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Categories</p>
                <p className="text-2xl font-bold">{categories.length}</p>
              </div>
              <PieChart className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Smart Insights */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Smart Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {insights.map((insight, index) => (
              <Alert key={index} className="border-2">
                <insight.icon className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium">{insight.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {insight.description}
                  </div>
                </AlertDescription>
              </Alert>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Spending Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="amount" stroke="#FF6B6B" fill="#FF6B6B" fillOpacity={0.6} />
                  <Line type="monotone" dataKey="budget" stroke="#FFA500" strokeDasharray="5 5" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Category Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <RechartsPieChart 
                      data={categories} 
                      cx="50%" 
                      cy="50%" 
                      outerRadius={80} 
                      dataKey="amount"
                    >
                      {categories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </RechartsPieChart>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Category Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categories.map((category) => (
                    <div key={category.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="text-sm">{category.icon} {category.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">₹{category.amount}</span>
                          <Badge variant={category.trend === 'up' ? 'destructive' : 'secondary'}>
                            {category.trend === 'up' ? '↑' : '↓'} {category.trendValue}%
                          </Badge>
                        </div>
                      </div>
                      <Progress value={(category.amount / category.budget) * 100} />
                      <div className="text-xs text-muted-foreground">
                        ₹{category.amount} of ₹{category.budget} budget
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Spending Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="amount" stroke="#8884d8" name="Daily Spending" />
                  <Line type="monotone" dataKey="budget" stroke="#82ca9d" name="Budget Target" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedBudgetAnalytics;