import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Target,
  Calendar,
  Users,
  User,
  IndianRupee
} from 'lucide-react';

interface BudgetAnalyticsProps {
  budgets: Budget[];
  expenses: Expense[];
}

interface Budget {
  id: string;
  name: string;
  amount: number;
  spent: number;
  endDate: string;
  type: 'personal' | 'group';
  category?: string;
}

interface Expense {
  id: string;
  category: string;
  amount: number;
  date: string;
}

const BudgetAnalytics = ({ budgets, expenses }: BudgetAnalyticsProps) => {
  // Calculate category-wise spending
  const categorySpending = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {});

  const categoryData = Object.entries(categorySpending).map(([category, amount]) => ({
    name: category,
    value: amount as number,
    percentage: Math.round(((amount as number) / expenses.reduce((sum, e) => sum + e.amount, 0)) * 100)
  }));

  // Monthly spending trend (mock data)
  const monthlyTrend = [
    { month: 'Oct', personal: 12000, group: 8000 },
    { month: 'Nov', personal: 15000, group: 12000 },
    { month: 'Dec', personal: 18000, group: 15000 },
    { month: 'Jan', personal: 14000, group: 10000 }
  ];

  // Budget status overview
  const totalBudgetAmount = budgets.reduce((sum, b) => sum + b.amount, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
  const overBudgetCount = budgets.filter(b => (b.spent / b.amount) > 0.9).length;
  const underBudgetCount = budgets.filter(b => (b.spent / b.amount) < 0.5).length;

  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0'];

  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean;
    payload?: Array<{ dataKey: string; value: number; color: string }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black/90 border border-white/20 rounded-lg p-3">
          <p className="text-white font-medium">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-white/80" style={{ color: entry.color }}>
              {entry.dataKey}: ₹{entry.value.toLocaleString('en-IN')}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Overview Cards */}
        <Card className="glass-card border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-500">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white/60 text-sm">Active Budgets</p>
                <p className="text-white font-semibold text-lg">{budgets.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-green-500">
                <IndianRupee className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white/60 text-sm">Total Allocated</p>
                <p className="text-white font-semibold text-lg">
                  ₹{totalBudgetAmount.toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-orange-500">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white/60 text-sm">Total Spent</p>
                <p className="text-white font-semibold text-lg">
                  ₹{totalSpent.toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-red-500">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white/60 text-sm">Over Budget</p>
                <p className="text-white font-semibold text-lg">{overBudgetCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution */}
        <Card className="glass-card border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name} ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center">
                <p className="text-white/60">No expense data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Trend */}
        <Card className="glass-card border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Monthly Spending Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                  <XAxis dataKey="month" tick={{ fill: '#ffffff80' }} />
                  <YAxis tick={{ fill: '#ffffff80' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="personal" fill="#8884d8" name="Personal" />
                  <Bar dataKey="group" fill="#82ca9d" name="Group" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget Status Cards */}
      <div className="space-y-4">
        <h3 className="text-white font-semibold text-lg">Budget Status Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map(budget => {
            const progress = Math.min((budget.spent / budget.amount) * 100, 100);
            const daysLeft = Math.ceil((new Date(budget.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
            const status = progress >= 90 ? 'danger' : progress >= 70 ? 'warning' : 'good';
            
            return (
              <Card key={budget.id} className="glass-card border-white/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h4 className="text-white font-medium truncate">{budget.name}</h4>
                      <Badge variant="outline" className="text-xs">
                        {budget.type === 'group' ? (
                          <Users className="w-3 h-3 mr-1" />
                        ) : (
                          <User className="w-3 h-3 mr-1" />
                        )}
                        {budget.type}
                      </Badge>
                    </div>
                    {status === 'danger' && <AlertTriangle className="w-4 h-4 text-red-400" />}
                    {status === 'warning' && <TrendingUp className="w-4 h-4 text-yellow-400" />}
                    {status === 'good' && <Target className="w-4 h-4 text-green-400" />}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="space-y-2">
                      <span className="text-white/70">
                        ₹{budget.spent.toLocaleString('en-IN')} / ₹{budget.amount.toLocaleString('en-IN')}
                      </span>
                      <span className={
                        status === 'danger' ? 'text-red-400' :
                        status === 'warning' ? 'text-yellow-400' : 'text-green-400'
                      }>
                        {progress.toFixed(0)}%
                      </span>
                    </div>
                    <Progress 
                      value={progress} 
                      className={`h-2 ${
                        status === 'danger' ? 'bg-red-500/20' :
                        status === 'warning' ? 'bg-yellow-500/20' : 'bg-green-500/20'
                      }`}
                    />
                    <div className="flex items-center justify-between text-xs text-white/60">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {daysLeft > 0 ? `${daysLeft} days left` : 'Expired'}
                      </span>
                      <span>{budget.category}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BudgetAnalytics;