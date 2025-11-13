import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import {
  Target,
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  PieChart as PieChartIcon
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Budget {
  _id?: string;
  category: string;
  amount: number;
  period: 'monthly' | 'quarterly' | 'yearly';
  startDate: string;
  endDate: string;
  isActive: boolean;
}

interface BudgetComparison {
  category: string;
  budgetAmount: number;
  actualAmount: number;
  percentage: number;
  status: 'under' | 'over' | 'ontrack';
  variance: number;
  variancePercentage: number;
}

interface BudgetVsActualProps {
  groupId: string;
  timeRange?: string;
  className?: string;
}

const COLORS = {
  under: '#10b981',
  ontrack: '#f59e0b', 
  over: '#ef4444'
};

const fetchBudgets = async (groupId: string) => {
  // Mock API call - in real implementation, this would call the backend
  return [
    {
      _id: '1',
      category: 'Food & Dining',
      amount: 5000,
      period: 'monthly' as const,
      startDate: '2025-09-01',
      endDate: '2025-09-30',
      isActive: true
    },
    {
      _id: '2',  
      category: 'Transportation',
      amount: 2000,
      period: 'monthly' as const,
      startDate: '2025-09-01',
      endDate: '2025-09-30',
      isActive: true
    },
    {
      _id: '3',
      category: 'Entertainment',
      amount: 1500,
      period: 'monthly' as const,
      startDate: '2025-09-01',
      endDate: '2025-09-30', 
      isActive: true
    }
  ];
};

const fetchActualSpending = async (groupId: string, timeRange: string) => {
  const response = await fetch(`/api/analytics/groups/${groupId}?timeRange=${timeRange}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch spending data');
  }
  
  const data = await response.json();
  return data.data.analytics.categoryBreakdown || [];
};

export const BudgetVsActual: React.FC<BudgetVsActualProps> = ({
  groupId,
  timeRange = '30d',
  className
}) => {
  const [showBudgetDialog, setShowBudgetDialog] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [newBudget, setNewBudget] = useState<Partial<Budget>>({
    category: '',
    amount: 0,
    period: 'monthly'
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: budgets = [],
    isLoading: budgetsLoading
  } = useQuery({
    queryKey: ['budgets', groupId],
    queryFn: () => fetchBudgets(groupId),
    staleTime: 5 * 60 * 1000
  });

  const {
    data: actualSpending = [],
    isLoading: spendingLoading
  } = useQuery({
    queryKey: ['actual-spending', groupId, timeRange],
    queryFn: () => fetchActualSpending(groupId, timeRange),
    staleTime: 5 * 60 * 1000
  });

  // Calculate budget comparisons
  const budgetComparisons = useMemo(() => {
    return budgets.map((budget: Budget) => {
      const actualCategory = actualSpending.find(
        (spending: any) => spending.category.toLowerCase() === budget.category.toLowerCase()
      );
      
      const actualAmount = actualCategory ? actualCategory.totalAmount : 0;
      const percentage = budget.amount > 0 ? (actualAmount / budget.amount) * 100 : 0;
      const variance = actualAmount - budget.amount;
      const variancePercentage = budget.amount > 0 ? (variance / budget.amount) * 100 : 0;
      
      let status: 'under' | 'over' | 'ontrack' = 'under';
      if (percentage > 105) status = 'over';
      else if (percentage > 85) status = 'ontrack';
      
      return {
        category: budget.category,
        budgetAmount: budget.amount,
        actualAmount,
        percentage,
        status,
        variance,
        variancePercentage
      } as BudgetComparison;
    });
  }, [budgets, actualSpending]);

  const saveBudgetMutation = useMutation({
    mutationFn: async (budgetData: Partial<Budget>) => {
      // Mock API call - in real implementation, this would save to backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      return budgetData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets', groupId] });
      setShowBudgetDialog(false);
      setEditingBudget(null);
      setNewBudget({ category: '', amount: 0, period: 'monthly' });
      toast({
        title: \"Budget Saved\",
        description: \"Budget has been saved successfully.\",
        className: \"border-green-500/50 bg-green-500/10\"
      });
    },
    onError: () => {
      toast({
        title: \"Save Failed\",
        description: \"Failed to save budget. Please try again.\",
        variant: \"destructive\"
      });
    }
  });

  const deleteBudgetMutation = useMutation({
    mutationFn: async (budgetId: string) => {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500));
      return budgetId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets', groupId] });
      toast({
        title: \"Budget Deleted\",
        description: \"Budget has been deleted successfully.\",
        className: \"border-green-500/50 bg-green-500/10\"
      });
    }
  });

  const handleSaveBudget = () => {
    if (!newBudget.category || !newBudget.amount) {
      toast({
        title: \"Validation Error\",
        description: \"Please fill in all required fields.\",
        variant: \"destructive\"
      });
      return;
    }

    saveBudgetMutation.mutate({
      ...newBudget,
      isActive: true,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    } as Budget);
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'under':
        return <CheckCircle className=\"w-4 h-4 text-green-400\" />;
      case 'ontrack':
        return <Target className=\"w-4 h-4 text-yellow-400\" />;
      case 'over':
        return <AlertTriangle className=\"w-4 h-4 text-red-400\" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'under':
        return 'Under Budget';
      case 'ontrack':
        return 'On Track';
      case 'over':
        return 'Over Budget';
      default:
        return 'Unknown';
    }
  };

  if (budgetsLoading || spendingLoading) {
    return (
      <Card className={cn('glass-card', className)}>
        <CardContent className=\"flex items-center justify-center h-96\">
          <div className=\"text-white\">Loading budget analysis...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className=\"flex items-center justify-between\">
        <h3 className=\"text-xl font-bold text-white flex items-center gap-2\">
          <Target className=\"w-5 h-5 text-primary\" />
          Budget vs Actual
        </h3>
        <Dialog open={showBudgetDialog} onOpenChange={setShowBudgetDialog}>
          <DialogTrigger asChild>
            <Button className=\"bg-primary hover:bg-primary/80\">
              <Plus className=\"w-4 h-4 mr-2\" />
              Add Budget
            </Button>
          </DialogTrigger>
          <DialogContent className=\"bg-gray-900 border-gray-700\">
            <DialogHeader>
              <DialogTitle className=\"text-white\">
                {editingBudget ? 'Edit Budget' : 'Create New Budget'}
              </DialogTitle>
            </DialogHeader>
            <div className=\"space-y-4\">
              <div>
                <Label htmlFor=\"category\" className=\"text-white\">Category</Label>
                <Input
                  id=\"category\"
                  value={newBudget.category}
                  onChange={(e) => setNewBudget({ ...newBudget, category: e.target.value })}
                  placeholder=\"e.g., Food & Dining\"
                  className=\"bg-white/10 border-white/20 text-white\"
                />
              </div>
              <div>
                <Label htmlFor=\"amount\" className=\"text-white\">Budget Amount</Label>
                <Input
                  id=\"amount\"
                  type=\"number\"
                  value={newBudget.amount}
                  onChange={(e) => setNewBudget({ ...newBudget, amount: parseFloat(e.target.value) || 0 })}
                  placeholder=\"5000\"
                  className=\"bg-white/10 border-white/20 text-white\"
                />
              </div>
              <div>
                <Label htmlFor=\"period\" className=\"text-white\">Period</Label>
                <Select
                  value={newBudget.period}
                  onValueChange={(value: 'monthly' | 'quarterly' | 'yearly') => 
                    setNewBudget({ ...newBudget, period: value })
                  }
                >
                  <SelectTrigger className=\"bg-white/10 border-white/20 text-white\">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=\"monthly\">Monthly</SelectItem>
                    <SelectItem value=\"quarterly\">Quarterly</SelectItem>
                    <SelectItem value=\"yearly\">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className=\"flex gap-2 pt-4\">
                <Button
                  onClick={handleSaveBudget}
                  disabled={saveBudgetMutation.isPending}
                  className=\"flex-1 bg-primary hover:bg-primary/80\"
                >
                  {saveBudgetMutation.isPending ? 'Saving...' : 'Save Budget'}
                </Button>
                <Button
                  variant=\"outline\"
                  onClick={() => setShowBudgetDialog(false)}
                  className=\"border-white/30 text-white hover:bg-white/10\"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Budget Overview Cards */}
      <div className=\"grid grid-cols-1 md:grid-cols-3 gap-4\">
        <Card className=\"glass-card\">
          <CardContent className=\"p-6\">
            <div className=\"flex items-center justify-between\">
              <div>
                <p className=\"text-white/60 text-sm\">Total Budget</p>
                <p className=\"text-2xl font-bold text-white\">
                  {formatCurrency(budgets.reduce((sum: number, b: Budget) => sum + b.amount, 0))}
                </p>
              </div>
              <Target className=\"w-8 h-8 text-primary\" />
            </div>
          </CardContent>
        </Card>

        <Card className=\"glass-card\">
          <CardContent className=\"p-6\">
            <div className=\"flex items-center justify-between\">
              <div>
                <p className=\"text-white/60 text-sm\">Total Spent</p>
                <p className=\"text-2xl font-bold text-white\">
                  {formatCurrency(budgetComparisons.reduce((sum, b) => sum + b.actualAmount, 0))}
                </p>
              </div>
              <DollarSign className=\"w-8 h-8 text-primary\" />
            </div>
          </CardContent>
        </Card>

        <Card className=\"glass-card\">
          <CardContent className=\"p-6\">
            <div className=\"flex items-center justify-between\">
              <div>
                <p className=\"text-white/60 text-sm\">Budget Status</p>
                <p className=\"text-2xl font-bold text-white\">
                  {budgetComparisons.filter(b => b.status === 'under').length} / {budgetComparisons.length}
                </p>
                <p className=\"text-white/60 text-xs\">Categories under budget</p>
              </div>
              <CheckCircle className=\"w-8 h-8 text-green-400\" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget Comparison List */}
      <Card className=\"glass-card\">
        <CardHeader>
          <CardTitle className=\"text-white\">Budget Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className=\"space-y-4\">
            {budgetComparisons.map((comparison, index) => (
              <div key={index} className=\"p-4 rounded-lg bg-white/5 border border-white/10\">
                <div className=\"flex items-center justify-between mb-3\">
                  <div className=\"flex items-center gap-3\">
                    <h4 className=\"text-white font-medium\">{comparison.category}</h4>
                    {getStatusIcon(comparison.status)}
                    <Badge
                      variant=\"outline\"
                      className={cn(
                        'text-xs',
                        comparison.status === 'under' && 'border-green-400/30 text-green-400',
                        comparison.status === 'ontrack' && 'border-yellow-400/30 text-yellow-400',
                        comparison.status === 'over' && 'border-red-400/30 text-red-400'
                      )}
                    >
                      {getStatusText(comparison.status)}
                    </Badge>
                  </div>
                  <div className=\"flex items-center gap-2\">
                    <Button
                      variant=\"ghost\"
                      size=\"sm\"
                      onClick={() => {
                        const budget = budgets.find((b: Budget) => b.category === comparison.category);
                        if (budget) {
                          setEditingBudget(budget);
                          setNewBudget({ ...budget });
                          setShowBudgetDialog(true);
                        }
                      }}
                      className=\"text-white/70 hover:text-white hover:bg-white/10\"
                    >
                      <Edit className=\"w-3 h-3\" />
                    </Button>
                    <Button
                      variant=\"ghost\"
                      size=\"sm\"
                      onClick={() => {
                        const budget = budgets.find((b: Budget) => b.category === comparison.category);
                        if (budget?._id) {
                          deleteBudgetMutation.mutate(budget._id);
                        }
                      }}
                      className=\"text-red-400 hover:text-red-300 hover:bg-red-400/10\"
                    >
                      <Trash2 className=\"w-3 h-3\" />
                    </Button>
                  </div>
                </div>
                
                <div className=\"grid grid-cols-1 md:grid-cols-3 gap-4 mb-3\">
                  <div>
                    <p className=\"text-white/60 text-sm\">Budget</p>
                    <p className=\"text-white font-medium\">{formatCurrency(comparison.budgetAmount)}</p>
                  </div>
                  <div>
                    <p className=\"text-white/60 text-sm\">Actual</p>
                    <p className=\"text-white font-medium\">{formatCurrency(comparison.actualAmount)}</p>
                  </div>
                  <div>
                    <p className=\"text-white/60 text-sm\">Variance</p>
                    <p className={cn(
                      'font-medium flex items-center gap-1',
                      comparison.variance > 0 ? 'text-red-400' : 'text-green-400'
                    )}>
                      {comparison.variance > 0 ? <TrendingUp className=\"w-3 h-3\" /> : <TrendingDown className=\"w-3 h-3\" />}
                      {formatCurrency(Math.abs(comparison.variance))}
                      <span className=\"text-xs\">
                        ({Math.abs(comparison.variancePercentage).toFixed(1)}%)
                      </span>
                    </p>
                  </div>
                </div>
                
                <div className=\"space-y-2\">
                  <div className=\"flex justify-between text-sm\">
                    <span className=\"text-white/60\">Progress</span>
                    <span className=\"text-white/60\">{comparison.percentage.toFixed(1)}%</span>
                  </div>
                  <Progress 
                    value={Math.min(comparison.percentage, 100)}
                    className=\"h-2\"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.1)'
                    } as any}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Budget vs Actual Chart */}
      <Card className=\"glass-card\">
        <CardHeader>
          <CardTitle className=\"text-white\">Budget vs Actual Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width=\"100%\" height={400}>
            <BarChart data={budgetComparisons}>
              <CartesianGrid strokeDasharray=\"3 3\" stroke=\"rgba(255,255,255,0.1)\" />
              <XAxis 
                dataKey=\"category\" 
                stroke=\"rgba(255,255,255,0.6)\"
                fontSize={12}
                angle={-45}
                textAnchor=\"end\"
                height={80}
              />
              <YAxis 
                stroke=\"rgba(255,255,255,0.6)\"
                fontSize={12}
                tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'rgba(0,0,0,0.8)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  color: 'white'
                }}
                formatter={(value: number, name: string) => [
                  formatCurrency(value),
                  name === 'budgetAmount' ? 'Budget' : 'Actual'
                ]}
              />
              <Bar dataKey=\"budgetAmount\" fill=\"#8884d8\" name=\"Budget\" />
              <Bar dataKey=\"actualAmount\" fill=\"#82ca9d\" name=\"Actual\" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default BudgetVsActual;