import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  DollarSign,
  Users,
  Target,
  PieChart
} from 'lucide-react';

// Define the structure of our analytics data
interface AnalyticsData {
  totalAmount: number;
  averageExpense: number;
  expenseCount: number;
  categoryBreakdown: Array<{
    category: string;
    amount: number;
    percentage: number;
    count: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    amount: number;
    count: number;
  }>;
  userContributions: Array<{
    userId: string;
    name: string;
    totalPaid: number;
    expenseCount: number;
    avgExpense: number;
    percentage: number;
  }>;
  paymentMethods: Array<{
    method: string;
    count: number;
    percentage: number;
  }>;
  currentUserStats: {
    totalPaid: number;
    totalShare: number;
    expenseCount: number;
    avgShare: number;
    netContribution: number;
  };
}

interface ExpenseAnalyticsProps {
  expenses: any[];
  groupId: string;
  currentUserId: string;
  isLoading?: boolean;
}

const ExpenseAnalytics = ({ expenses, groupId, currentUserId, isLoading }: ExpenseAnalyticsProps) => {
  
  // Algorithm: Comprehensive expense analysis
  const analytics = useMemo<AnalyticsData>(() => {
    if (!expenses || expenses.length === 0) {
      return {
        totalAmount: 0,
        averageExpense: 0,
        expenseCount: 0,
        categoryBreakdown: [],
        monthlyTrend: [],
        userContributions: [],
        paymentMethods: [],
        currentUserStats: {
          totalPaid: 0,
          totalShare: 0,
          expenseCount: 0,
          avgShare: 0,
          netContribution: 0
        }
      };
    }

    const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const expenseCount = expenses.length;
    const averageExpense = totalAmount / expenseCount;

    // Category breakdown analysis
    const categoryMap = new Map();
    expenses.forEach(expense => {
      const category = expense.category || 'Other';
      categoryMap.set(category, (categoryMap.get(category) || 0) + expense.amount);
    });

    const categoryBreakdown = Array.from(categoryMap.entries())
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: (amount / totalAmount) * 100,
        count: expenses.filter(e => (e.category || 'Other') === category).length
      }))
      .sort((a, b) => b.amount - a.amount);

    // Monthly trend analysis
    const monthMap = new Map();
    expenses.forEach(expense => {
      const month = new Date(expense.date).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short' 
      });
      monthMap.set(month, (monthMap.get(month) || 0) + expense.amount);
    });

    const monthlyTrend = Array.from(monthMap.entries())
      .map(([month, amount]) => ({
        month,
        amount,
        count: expenses.filter(e => 
          new Date(e.date).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short' 
          }) === month
        ).length
      }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

    // User contribution analysis
    const userMap = new Map();
    expenses.forEach(expense => {
      const paidBy = expense.paidBy._id || expense.paidBy;
      const paidByName = expense.paidByName || 
        (typeof expense.paidBy === 'object' ? 
          `${expense.paidBy.firstName || ''} ${expense.paidBy.lastName || ''}`.trim() : 
          'Unknown'
        );
      
      if (!userMap.has(paidBy)) {
        userMap.set(paidBy, {
          name: paidByName,
          totalPaid: 0,
          expenseCount: 0,
          avgExpense: 0
        });
      }
      
      const user = userMap.get(paidBy);
      user.totalPaid += expense.amount;
      user.expenseCount += 1;
      user.avgExpense = user.totalPaid / user.expenseCount;
    });

    const userContributions = Array.from(userMap.entries())
      .map(([userId, data]) => ({
        userId,
        ...data,
        percentage: (data.totalPaid / totalAmount) * 100
      }))
      .sort((a, b) => b.totalPaid - a.totalPaid);

    // Payment method analysis
    const paymentMethodMap = new Map();
    expenses.forEach(expense => {
      const method = expense.paymentMethod || 'cash';
      paymentMethodMap.set(method, (paymentMethodMap.get(method) || 0) + 1);
    });

    const paymentMethods = Array.from(paymentMethodMap.entries())
      .map(([method, count]) => ({
        method: method.charAt(0).toUpperCase() + method.slice(1),
        count,
        percentage: (count / expenseCount) * 100
      }))
      .sort((a, b) => b.count - a.count);

    // Current user specific statistics
    const userExpenses = expenses.filter(expense => 
      expense.paidBy._id === currentUserId || expense.paidBy === currentUserId
    );
    
    const userTotalPaid = userExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    const userTotalShare = expenses.reduce((sum, expense) => {
      const userSplit = expense.splitBetween?.find(split => 
        split.user._id === currentUserId || split.user === currentUserId
      );
      return sum + (userSplit ? userSplit.amount : 0);
    }, 0);

    const currentUserStats = {
      totalPaid: userTotalPaid,
      totalShare: userTotalShare,
      expenseCount: userExpenses.length,
      avgShare: userTotalShare / expenseCount || 0,
      netContribution: userTotalPaid - userTotalShare
    };

    return {
      totalAmount,
      averageExpense,
      expenseCount,
      categoryBreakdown,
      monthlyTrend,
      userContributions,
      paymentMethods,
      currentUserStats
    };
  }, [expenses, currentUserId]);

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  if (isLoading) {
    return (
      <Card className="glass-card border-white/20">
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-white/60">Loading analytics...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card border-white/20">
          <CardContent className="p-4 text-center">
            <DollarSign className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{formatCurrency(analytics.totalAmount)}</p>
            <p className="text-white/60 text-sm">Total Expenses</p>
          </CardContent>
        </Card>
        
        <Card className="glass-card border-white/20">
          <CardContent className="p-4 text-center">
            <BarChart3 className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{analytics.expenseCount}</p>
            <p className="text-white/60 text-sm">Total Transactions</p>
          </CardContent>
        </Card>
        
        <Card className="glass-card border-white/20">
          <CardContent className="p-4 text-center">
            <Target className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{formatCurrency(analytics.averageExpense)}</p>
            <p className="text-white/60 text-sm">Average Expense</p>
          </CardContent>
        </Card>
        
        <Card className="glass-card border-white/20">
          <CardContent className="p-4 text-center">
            <Users className="w-8 h-8 text-purple-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{analytics.userContributions.length}</p>
            <p className="text-white/60 text-sm">Active Contributors</p>
          </CardContent>
        </Card>
      </div>

      {/* Current User Stats */}
      <Card className="glass-card border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="w-5 h-5" />
            Your Expense Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-500/10 rounded-lg">
              <p className="text-blue-400 font-bold text-lg">
                {formatCurrency(analytics.currentUserStats.totalPaid)}
              </p>
              <p className="text-white/60 text-sm">You Paid</p>
            </div>
            <div className="text-center p-3 bg-yellow-500/10 rounded-lg">
              <p className="text-yellow-400 font-bold text-lg">
                {formatCurrency(analytics.currentUserStats.totalShare)}
              </p>
              <p className="text-white/60 text-sm">Your Share</p>
            </div>
            <div className="text-center p-3 bg-green-500/10 rounded-lg">
              <p className="text-green-400 font-bold text-lg">
                {analytics.currentUserStats.expenseCount}
              </p>
              <p className="text-white/60 text-sm">Expenses Paid</p>
            </div>
            <div className={`text-center p-3 rounded-lg ${
              analytics.currentUserStats.netContribution >= 0 
                ? 'bg-green-500/10' 
                : 'bg-red-500/10'
            }`}>
              <p className={`font-bold text-lg ${
                analytics.currentUserStats.netContribution >= 0 
                  ? 'text-green-400' 
                  : 'text-red-400'
              }`}>
                {formatCurrency(Math.abs(analytics.currentUserStats.netContribution))}
              </p>
              <p className="text-white/60 text-sm">
                {analytics.currentUserStats.netContribution >= 0 ? 'Net Positive' : 'Net Negative'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <Card className="glass-card border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <PieChart className="w-5 h-5" />
            Expense Categories
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {analytics.categoryBreakdown.slice(0, 5).map((category, index) => (
            <div key={category.category} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-white font-medium">{category.category}</span>
                <div className="text-right">
                  <span className="text-white font-bold">{formatCurrency(category.amount)}</span>
                  <span className="text-white/60 text-sm ml-2">
                    ({category.percentage.toFixed(1)}%)
                  </span>
                </div>
              </div>
              <Progress 
                value={category.percentage} 
                className="h-2 bg-white/10"
              />
              <div className="flex justify-between text-xs text-white/60">
                <span>{category.count} transactions</span>
                <span>Avg: {formatCurrency(category.amount / category.count)}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* User Contributions */}
      <Card className="glass-card border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="w-5 h-5" />
            Member Contributions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {analytics.userContributions.slice(0, 5).map((user, index) => (
            <div key={user.userId} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                  index === 0 ? 'bg-yellow-500' : 
                  index === 1 ? 'bg-gray-400' : 
                  index === 2 ? 'bg-amber-600' : 'bg-blue-500'
                }`}>
                  {index + 1}
                </div>
                <div>
                  <p className="text-white font-medium">{user.name}</p>
                  <p className="text-white/60 text-sm">{user.expenseCount} expenses</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white font-bold">{formatCurrency(user.totalPaid)}</p>
                <p className="text-white/60 text-sm">{user.percentage.toFixed(1)}% of total</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Monthly Trend */}
      {analytics.monthlyTrend.length > 1 && (
        <Card className="glass-card border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Monthly Spending Trend
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {analytics.monthlyTrend.map((month, index) => {
              const prevMonth = index > 0 ? analytics.monthlyTrend[index - 1] : null;
              const trend = prevMonth ? 
                ((month.amount - prevMonth.amount) / prevMonth.amount) * 100 : 0;
              
              return (
                <div key={month.month} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span className="text-white font-medium">{month.month}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold">{formatCurrency(month.amount)}</p>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-white/60">{month.count} expenses</span>
                      {prevMonth && (
                        <Badge 
                          className={`${
                            trend > 0 
                              ? 'bg-red-500/20 text-red-400' 
                              : 'bg-green-500/20 text-green-400'
                          }`}
                        >
                          {trend > 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                          {Math.abs(trend).toFixed(1)}%
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ExpenseAnalytics;