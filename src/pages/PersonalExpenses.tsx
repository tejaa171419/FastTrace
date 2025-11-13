import { useState, useMemo, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Search, 
  Filter, 
  Plus, 
  TrendingDown, 
  TrendingUp, 
  Calendar as CalendarIcon, 
  Receipt, 
  ShoppingCart, 
  Car, 
  Home, 
  Heart, 
  Gamepad2, 
  Coffee,
  MoreHorizontal,
  ArrowUpDown,
  Download,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  AlertCircle
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import withLayout from "@/components/withLayout";
import { usePersonalExpenses } from "@/hooks/usePersonalExpenses";
import { getCategoryConfig, getCategoryIcon } from "@/components/expenses/categoryConfig";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { useWebSocket } from "@/hooks/useWebSocket";
import { walletEvents, emitTransactionCompleted } from "@/lib/walletEvents";
import { FinancialGoalDialog } from "@/components/dashboard/FinancialGoalDialog";
import { FinancialGoalsCard } from "@/components/dashboard/FinancialGoalsCard";
import { BudgetDialog } from "@/components/dashboard/BudgetDialog";
import { ExpenseDetailsDialog } from "@/components/expenses/ExpenseDetailsDialog";
import { personalDashboardService } from "@/lib/services/personalDashboardService";

interface PersonalExpensesProps {
  onAddExpense?: () => void;
  onSendMoney?: () => void;
  onScanQR?: () => void;
  onCalculate?: () => void;
}

const PersonalExpenses = ({
  onAddExpense,
  onSendMoney,
  onScanQR,
  onCalculate
}: PersonalExpensesProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<any>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'title'>('date');
  const [dateRange, setDateRange] = useState<Date | undefined>(new Date());
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<any>(null);
  const [financialGoals, setFinancialGoals] = useState<any[]>([]);
  const [goalsLoading, setGoalsLoading] = useState(true);
  const [budgetDialogOpen, setBudgetDialogOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<{ category: string; amount: number } | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<any>(null);
  const isMobile = useIsMobile();
  
  // WebSocket for real-time updates
  const { isConnected, on, off } = useWebSocket({ autoConnect: true });

  // Fetch personal expenses with real API
  const {
    expenses,
    loading,
    error,
    analytics,
    analyticsLoading,
    filters,
    setFilters,
    createExpense,
    updateExpense,
    deleteExpense,
    refetch
  } = usePersonalExpenses({
    sortBy: sortBy,
    sortOrder: 'desc'
  });

  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    };
    return date.toLocaleDateString('en-US', options);
  };

  // Calculate real expense statistics
  const expenseCategories = useMemo(() => {
    if (!analytics) return [];
    return analytics.categoryBreakdown.map(cat => {
      const config = getCategoryConfig(cat.category);
      const Icon = getCategoryIcon(cat.category);
      return {
        id: config.id,
        name: cat.category,
        icon: Icon,
        color: config.bgColor,
        amount: cat.amount
      };
    });
  }, [analytics]);

  // Apply filters to expenses
  const filteredAndSortedExpenses = useMemo(() => {
    let filtered = expenses;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(expense =>
        expense.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.merchant?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter(expense => expense.category === selectedCategory);
    }

    // Sort expenses
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'amount':
          return b.amount - a.amount;
        case 'title':
          return a.title.localeCompare(b.title);
        case 'date':
        default:
          return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
    });
  }, [expenses, searchTerm, selectedCategory, sortBy]);

  // Calculate statistics from real data
  const totalSpent = analytics?.totalSpent || 0;
  const avgPerDay = analytics?.averagePerDay || 0;
  const totalRecurring = analytics?.recurringTotal || 0;
  const recurringCount = analytics?.recurringCount || 0;
  const totalExpenses = analytics?.totalExpenses || 0;

  // Handle view expense details
  const handleViewExpense = (expense: any) => {
    setSelectedExpense(expense);
    setDetailsDialogOpen(true);
  };

  // Handle edit expense
  const handleEditExpense = (expense: any) => {
    // TODO: Implement edit functionality
    toast.info('Edit functionality coming soon');
  };

  // Handle delete expense
  const handleDeleteExpense = async (expenseId: string) => {
    try {
      const deletedExpense = expenses.find(e => e._id === expenseId);
      await deleteExpense(expenseId);
      
      // Emit wallet event for cross-component updates
      if (deletedExpense) {
        emitTransactionCompleted(deletedExpense, {
          source: 'expense_deleted',
          action: 'delete'
        });
      }
      
      toast.success('Expense deleted successfully');
      await refetch(); // Refresh the list
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete expense';
      toast.error(errorMessage);
      console.error('Delete expense error:', err);
    }
  };

  // Load financial goals
  const loadFinancialGoals = async () => {
    try {
      setGoalsLoading(true);
      const data = await personalDashboardService.getDashboardData({ timeRange: '30d' });
      setFinancialGoals(data.financialGoals || []);
    } catch (err: any) {
      console.error('Failed to load financial goals:', err);
      toast.error(err.message || 'Failed to load financial goals');
    } finally {
      setGoalsLoading(false);
    }
  };

  // Goal management
  const handleAddGoal = () => {
    setSelectedGoal(null);
    setGoalDialogOpen(true);
  };

  const handleSaveGoal = async (goalData: any) => {
    try {
      if (selectedGoal) {
        await personalDashboardService.updateGoal(selectedGoal._id, goalData);
        toast.success('Financial goal updated successfully');
      } else {
        await personalDashboardService.createGoal(goalData);
        toast.success('Financial goal created successfully');
      }
      await loadFinancialGoals();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save goal');
      throw err;
    }
  };

  // Budget management
  const handleAddBudget = () => {
    setSelectedBudget(null);
    setBudgetDialogOpen(true);
  };

  const handleSaveBudget = async (category: string, amount: number) => {
    try {
      await personalDashboardService.updateBudget(category, amount);
      toast.success(`Budget for ${category} updated successfully`);
      await refetch(); // Refresh expenses to show updated budget
    } catch (err: any) {
      toast.error(err.message || 'Failed to save budget');
      throw err;
    }
  };

  // Load goals on mount
  useEffect(() => {
    loadFinancialGoals();
  }, []);
  
  // Setup WebSocket event listeners for wallet updates
  useEffect(() => {
    if (!isConnected) return;

    const handleWalletUpdate = () => {
      console.log('💰 Wallet update in PersonalExpenses - refreshing data');
      // Refresh expenses and analytics when wallet updates
      refetch();
    };

    const handleTransactionComplete = (data: any) => {
      console.log('✅ Transaction completed in PersonalExpenses:', data);
      // Refresh to show updated stats
      refetch();
    };

    // Listen for wallet events
    on('wallet_updated', handleWalletUpdate);
    on('wallet_balance_updated', handleWalletUpdate);
    on('wallet_transaction_completed', handleTransactionComplete);
    on('transaction_created', handleTransactionComplete);
    on('payment_completed', handleTransactionComplete);

    return () => {
      off('wallet_updated', handleWalletUpdate);
      off('wallet_balance_updated', handleWalletUpdate);
      off('wallet_transaction_completed', handleTransactionComplete);
      off('transaction_created', handleTransactionComplete);
      off('payment_completed', handleTransactionComplete);
    };
  }, [isConnected, on, off, refetch]);
  
  // Listen to wallet events from event emitter
  useEffect(() => {
    const handleBalanceUpdate = () => {
      console.log('💵 Balance update in PersonalExpenses - refreshing data');
      refetch();
    };

    const handleTransactionEvent = () => {
      console.log('📊 Transaction event in PersonalExpenses - refreshing data');
      refetch();
    };

    // Subscribe to wallet events
    const unsubscribeBalance = walletEvents.on('balance_updated', handleBalanceUpdate);
    const unsubscribeTransactionCompleted = walletEvents.on('transaction_completed', handleTransactionEvent);
    const unsubscribeTransactionCreated = walletEvents.on('transaction_created', handleTransactionEvent);
    const unsubscribeTopup = walletEvents.on('wallet_topup', handleTransactionEvent);
    const unsubscribeTransfer = walletEvents.on('wallet_transfer', handleTransactionEvent);
    const unsubscribeBankTransfer = walletEvents.on('bank_transfer_completed', handleTransactionEvent);

    return () => {
      unsubscribeBalance();
      unsubscribeTransactionCompleted();
      unsubscribeTransactionCreated();
      unsubscribeTopup();
      unsubscribeTransfer();
      unsubscribeBankTransfer();
    };
  }, [refetch]);

  return (
    <div className="space-y-6 py-6">
      {/* Enhanced Header */}
      <div className="text-center space-y-4 animate-fade-in">
        <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-red-500/10 backdrop-blur-sm border border-purple-500/20">
          <Receipt className="w-5 h-5 mr-2 text-purple-400" />
          <span className="text-purple-400 font-medium text-sm">Personal Expenses</span>
        </div>
        
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent mb-2">
          Expense Tracker
        </h1>
        
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Monitor your spending patterns, categorize expenses, and gain insights into your financial habits
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-slide-up">
        <Card className="glass-card hover-lift group">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-red-400" />
              <span className="text-xs text-muted-foreground">Total Spent</span>
            </div>
            {analyticsLoading ? (
              <Skeleton className="h-6 w-24 mb-1" />
            ) : (
              <p className="text-xl font-bold text-red-400">₹{totalSpent.toLocaleString()}</p>
            )}
            <p className="text-xs text-muted-foreground">This month</p>
          </div>
        </Card>

        <Card className="glass-card hover-lift group">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <CalendarIcon className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-muted-foreground">Daily Average</span>
            </div>
            {analyticsLoading ? (
              <Skeleton className="h-6 w-24 mb-1" />
            ) : (
              <p className="text-xl font-bold text-blue-400">₹{Math.round(avgPerDay).toLocaleString()}</p>
            )}
            <p className="text-xs text-muted-foreground">Per day</p>
          </div>
        </Card>

        <Card className="glass-card hover-lift group">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-xs text-muted-foreground">Recurring</span>
            </div>
            {analyticsLoading ? (
              <Skeleton className="h-6 w-24 mb-1" />
            ) : (
              <p className="text-xl font-bold text-green-400">₹{totalRecurring.toLocaleString()}</p>
            )}
            <p className="text-xs text-muted-foreground">{recurringCount} items</p>
          </div>
        </Card>

        <Card className="glass-card hover-lift group">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Receipt className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-muted-foreground">Transactions</span>
            </div>
            {loading ? (
              <Skeleton className="h-6 w-16 mb-1" />
            ) : (
              <p className="text-xl font-bold text-purple-400">{totalExpenses}</p>
            )}
            <p className="text-xs text-muted-foreground">This month</p>
          </div>
        </Card>
      </div>

      {/* Category Overview */}
      <Card className="glass-card animate-slide-up">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-foreground flex items-center">
              <ShoppingCart className="w-5 h-5 mr-2 text-primary" />
              Expense Categories
            </h3>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleAddBudget}
                className="border-primary/20 hover:bg-primary/10"
              >
                <Plus className="w-4 h-4 mr-2" />
                Set Budget
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="border-primary/20 hover:bg-primary/10"
              >
                View All Categories
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {expenseCategories.map((category, index) => {
              const Icon = category.icon;
              return (
                <div 
                  key={category.id} 
                  className="p-4 rounded-xl bg-card/30 border border-border/30 hover:bg-card/50 hover:border-primary/20 transition-all duration-300 cursor-pointer group"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="text-center space-y-3">
                    <div className={`w-12 h-12 rounded-xl ${category.color} flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-sm">{category.name}</p>
                      <p className="text-lg font-bold text-primary">₹{category.amount.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Expense List */}
      <Card className="glass-card animate-slide-up">
        <div className="p-6">
          {/* Header with filters */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-6 gap-4">
            <h3 className="text-xl font-semibold text-foreground flex items-center">
              <Receipt className="w-5 h-5 mr-2 text-primary" />
              Recent Expenses
            </h3>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input 
                  placeholder="Search expenses..." 
                  value={searchTerm} 
                  onChange={e => setSearchTerm(e.target.value)} 
                  className="pl-10 w-full sm:w-64 bg-background/50 border-border/50 backdrop-blur-sm" 
                />
              </div>
              
              {/* Category Filter */}
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {expenseCategories.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="amount">Amount</SelectItem>
                  <SelectItem value="title">Name</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Add Expense Button */}
              <Button 
                onClick={onAddExpense}
                className="bg-gradient-primary hover:shadow-glow text-primary-foreground"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Expense
              </Button>
            </div>
          </div>
          
          {/* Action Bar */}
          <div className="flex items-center justify-between mb-4 p-3 bg-muted/20 rounded-lg">
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {filteredAndSortedExpenses.length} expenses found
              </span>
              {searchTerm && (
                <Badge variant="secondary" className="text-xs">
                  Filtered by: "{searchTerm}"
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <ArrowUpDown className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Expense List */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="p-4 rounded-xl bg-card/30 border border-border/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <Skeleton className="w-12 h-12 rounded-xl" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-64" />
                        <Skeleton className="h-3 w-56" />
                      </div>
                    </div>
                    <Skeleton className="h-6 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <Alert variant="destructive" className="border-red-500/20">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">Failed to load expenses</p>
                  <p className="text-sm">{error}</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => refetch()}
                    className="mt-2"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          ) : filteredAndSortedExpenses.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No expenses found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? 'Try adjusting your search terms' : 'Start tracking your expenses'}
              </p>
              <Button onClick={onAddExpense} className="bg-gradient-primary hover:shadow-glow text-primary-foreground">
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Expense
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAndSortedExpenses.map((expense, index) => {
                const config = getCategoryConfig(expense.category);
                const Icon = getCategoryIcon(expense.category);
              
                return (
                  <div 
                    key={expense._id} 
                    className="p-4 rounded-xl bg-card/30 border border-border/30 hover:bg-card/50 hover:border-primary/20 transition-all duration-300 hover-lift group"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${config.bgColor} group-hover:scale-110 transition-transform duration-300`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                      
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-foreground">{expense.title}</h4>
                            {expense.recurring && (
                              <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                                Recurring
                              </Badge>
                            )}
                            {expense.receipt && (
                              <Receipt className="w-4 h-4 text-green-400" />
                            )}
                          </div>
                          {expense.description && (
                            <p className="text-sm text-muted-foreground">{expense.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>{formatDate(expense.date)}</span>
                            <span>•</span>
                            <span>{expense.paymentMethod}</span>
                            {expense.merchant && (
                              <>
                                <span>•</span>
                                <span>{expense.merchant}</span>
                              </>
                            )}
                          </div>
                          {expense.tags && expense.tags.length > 0 && (
                            <div className="flex items-center gap-1 mt-2">
                              {expense.tags.map(tag => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                    </div>
                    
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-lg font-bold text-red-400">
                            -₹{expense.amount.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">{config.name}</p>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleViewExpense(expense)}
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleEditExpense(expense)}
                            title="Edit expense"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400"
                            onClick={() => handleDeleteExpense(expense._id)}
                            title="Delete expense"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>

      {/* Financial Goals Section */}
      {!goalsLoading && financialGoals.length > 0 && (
        <FinancialGoalsCard goals={financialGoals} onAddGoal={handleAddGoal} />
      )}

      {/* Financial Goal Dialog */}
      <FinancialGoalDialog
        open={goalDialogOpen}
        onOpenChange={setGoalDialogOpen}
        goal={selectedGoal}
        onSave={handleSaveGoal}
      />

      {/* Budget Dialog */}
      <BudgetDialog
        open={budgetDialogOpen}
        onOpenChange={setBudgetDialogOpen}
        category={selectedBudget?.category}
        amount={selectedBudget?.amount}
        onSave={handleSaveBudget}
      />

      {/* Expense Details Dialog */}
      <ExpenseDetailsDialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        expense={selectedExpense}
        onEdit={handleEditExpense}
        onDelete={handleDeleteExpense}
      />
    </div>
  );
};

// Wrap with ErrorBoundary for enhanced error handling
const PersonalExpensesWithErrorBoundary = () => (
  <ErrorBoundary>
    <PersonalExpenses />
  </ErrorBoundary>
);

export default withLayout(PersonalExpensesWithErrorBoundary);
