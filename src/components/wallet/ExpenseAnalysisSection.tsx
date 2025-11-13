import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  TrendingDown,
  Wallet,
  Send,
  Users,
  ShoppingCart,
  Coffee,
  Car,
  Home,
  RefreshCw,
} from "lucide-react";
import { useExpenseAnalysis } from "@/hooks/useExpenseAnalysis";
import { useState } from "react";

// Icon mapping for different expense types
const getCategoryIcon = (type: string) => {
  const iconMap: Record<string, any> = {
    wallet_topup: Wallet,
    wallet_transfer: Send,
    settlement: Users,
    expense_payment: ShoppingCart,
    withdrawal: TrendingDown,
    refund: RefreshCw,
  };
  return iconMap[type] || Coffee;
};

// Color mapping for categories
const getCategoryColor = (type: string) => {
  const colorMap: Record<string, string> = {
    wallet_topup: "text-blue-400",
    wallet_transfer: "text-purple-400",
    settlement: "text-orange-400",
    expense_payment: "text-red-400",
    withdrawal: "text-yellow-400",
    refund: "text-green-400",
  };
  return colorMap[type] || "text-gray-400";
};

export const ExpenseAnalysisSection = () => {
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
  const { data, loading, error, refetch, setPeriod: updatePeriod } = useExpenseAnalysis(period);

  const handlePeriodChange = (newPeriod: 'week' | 'month' | 'year') => {
    setPeriod(newPeriod);
    updatePeriod(newPeriod);
  };

  return (
    <div className="space-y-6">
      <Card className="glass-card border-primary/20 shadow-glow hover:shadow-glow-lg transition-all duration-500">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <div className="w-2 h-2 bg-destructive rounded-full animate-pulse-glow" />
                Expense Breakdown
              </CardTitle>
              <CardDescription>
                {period === 'week' && 'Weekly spending by category'}
                {period === 'month' && 'Monthly spending by category'}
                {period === 'year' && 'Yearly spending by category'}
              </CardDescription>
            </div>
            
            {/* Period Selector */}
            <div className="flex gap-2">
              <Button
                variant={period === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePeriodChange('week')}
                className={period === 'week' ? 'bg-gradient-primary' : 'glass-card border-white/20'}
              >
                Week
              </Button>
              <Button
                variant={period === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePeriodChange('month')}
                className={period === 'month' ? 'bg-gradient-primary' : 'glass-card border-white/20'}
              >
                Month
              </Button>
              <Button
                variant={period === 'year' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePeriodChange('year')}
                className={period === 'year' ? 'bg-gradient-primary' : 'glass-card border-white/20'}
              >
                Year
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Loading State */}
          {loading && (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                  <Skeleton className="h-2 w-full" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Empty State */}
          {!loading && !error && data && data.categories.length === 0 && (
            <div className="text-center py-12">
              <ShoppingCart className="w-16 h-16 mx-auto text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-foreground">No Expenses Yet</h3>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                Your expense breakdown will appear here once you start making transactions.
              </p>
            </div>
          )}

          {/* Category List */}
          {!loading && !error && data && data.categories.length > 0 && (
            <>
              {/* Total Expenses Card */}
              <div className="glass-card border-white/10 rounded-lg p-4 bg-gradient-to-br from-red-500/10 to-pink-500/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gradient-to-r from-red-500 to-pink-500">
                      <TrendingDown className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Expenses</p>
                      <p className="text-2xl font-bold text-red-400">
                        ₹{data.totalExpenses.toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      {data.categories.reduce((sum, cat) => sum + cat.count, 0)} transactions
                    </p>
                  </div>
                </div>
              </div>

              {/* Categories */}
              <div className="space-y-4">
                {data.categories.map((category, index) => {
                  const Icon = getCategoryIcon(category.type);
                  const color = getCategoryColor(category.type);

                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Icon className={`w-5 h-5 ${color}`} />
                          <div>
                            <span className="font-medium">{category.name}</span>
                            <p className="text-xs text-muted-foreground">
                              {category.count} transaction{category.count !== 1 ? 's' : ''}
                              {' • '}Avg: ₹{category.avgAmount.toLocaleString('en-IN')}
                            </p>
                          </div>
                        </div>
                        <span className="font-semibold">
                          ₹{category.amount.toLocaleString('en-IN')}
                        </span>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-red-500 to-pink-500 transition-all duration-1000"
                          style={{ width: `${category.percentage}%` }}
                        />
                      </div>
                      
                      <p className="text-xs text-muted-foreground">
                        {category.percentage}% of total expenses
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Refresh Button */}
              <Button
                variant="outline"
                className="w-full glass-card border-white/20"
                onClick={refetch}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh Data
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ExpenseAnalysisSection;