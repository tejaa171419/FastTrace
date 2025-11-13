import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Eye, EyeOff, RefreshCw, Download, Calendar, Wifi, WifiOff, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import withLayout from "@/components/withLayout";
import ExpenseChart from "@/components/ExpenseChart";
import { personalDashboardService, DashboardData } from "@/lib/services/personalDashboardService";
import { StatCard } from "@/components/dashboard/StatCard";
import { BudgetProgressCard } from "@/components/dashboard/BudgetProgressCard";
import { TransactionListCard } from "@/components/dashboard/TransactionListCard";
import { FinancialGoalsCard } from "@/components/dashboard/FinancialGoalsCard";
import { QuickActionsCard } from "@/components/dashboard/QuickActionsCard";
import { FinancialGoalDialog } from "@/components/dashboard/FinancialGoalDialog";
import { BudgetDialog } from "@/components/dashboard/BudgetDialog";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useWalletBalance } from "@/hooks/useWalletBalance";
import ErrorBoundary from "@/components/ErrorBoundary";

const PersonalDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showBalance, setShowBalance] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [budgetDialogOpen, setBudgetDialogOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<any>(null);
  const [selectedBudget, setSelectedBudget] = useState<{ category: string; amount: number } | null>(null);
  
  // Initialize WebSocket for real-time updates
  const { isConnected, on, off } = useWebSocket({ autoConnect: true });
  
  // Get wallet balance for real-time updates
  const { balance: walletBalance, refetch: refetchWalletBalance } = useWalletBalance();

  // Load dashboard data
  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await personalDashboardService.getDashboardData({ timeRange });
      setDashboardData(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [timeRange, toast]);

  // Refresh dashboard data
  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await loadDashboardData();
      toast({
        title: "Refreshed",
        description: "Dashboard data updated successfully",
      });
    } finally {
      setRefreshing(false);
    }
  };

  // Export data
  const handleExport = async () => {
    try {
      const blob = await personalDashboardService.exportData('csv', { timeRange });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `dashboard_export_${Date.now()}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Exported",
        description: "Dashboard data exported successfully",
      });
    } catch (error: any) {
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export data",
        variant: "destructive",
      });
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
        toast({
          title: "Goal Updated",
          description: "Financial goal updated successfully",
        });
      } else {
        await personalDashboardService.createGoal(goalData);
        toast({
          title: "Goal Created",
          description: "Financial goal created successfully",
        });
      }
      await loadDashboardData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save goal",
        variant: "destructive",
      });
      throw error;
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
      toast({
        title: "Budget Updated",
        description: `Budget for ${category} updated successfully`,
      });
      await loadDashboardData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save budget",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Handle real-time dashboard updates
  const handleDashboardUpdate = useCallback(async (data: any) => {
    console.log('📊 Real-time dashboard update:', data);
    
    // Refresh dashboard data on any update
    try {
      await loadDashboardData();
      
      // Show appropriate toast based on update type
      if (data.type === 'budget_updated') {
        toast({
          title: "Budget Updated",
          description: "Your budget has been updated",
        });
      } else if (data.type === 'goal_created') {
        toast({
          title: "Goal Created",
          description: "New financial goal added",
        });
      } else if (data.type === 'goal_updated') {
        toast({
          title: "Goal Updated",
          description: "Financial goal has been updated",
        });
      } else if (data.type === 'goal_deleted') {
        toast({
          title: "Goal Deleted",
          description: "Financial goal has been removed",
        });
      }
    } catch (error) {
      console.error('Failed to refresh dashboard after update:', error);
    }
  }, [toast, loadDashboardData]);

  // Setup WebSocket event listeners
  useEffect(() => {
    if (!isConnected) return;

    // Wallet event handler
    const handleWalletUpdate = (data: any) => {
      console.log('💰 Wallet update in dashboard:', data);
      // Refresh both dashboard data and wallet balance
      loadDashboardData();
      refetchWalletBalance();
    };

    // Listen for dashboard updates
    on('dashboard_updated', handleDashboardUpdate);
    on('expense_created', handleDashboardUpdate);
    on('expense_updated', handleDashboardUpdate);
    on('expense_deleted', handleDashboardUpdate);
    on('budget_updated', handleDashboardUpdate);
    on('goal_updated', handleDashboardUpdate);
    
    // Listen for wallet updates
    on('wallet_updated', handleWalletUpdate);
    on('wallet_balance_updated', handleWalletUpdate);
    on('wallet_transaction_completed', handleWalletUpdate);
    on('transaction_created', handleWalletUpdate);
    on('payment_completed', handleWalletUpdate);
    
    // Listen for settlement payment completion
    on('balance_updated', handleWalletUpdate);

    return () => {
      off('dashboard_updated', handleDashboardUpdate);
      off('expense_created', handleDashboardUpdate);
      off('expense_updated', handleDashboardUpdate);
      off('expense_deleted', handleDashboardUpdate);
      off('budget_updated', handleDashboardUpdate);
      off('goal_updated', handleDashboardUpdate);
      
      // Remove wallet listeners
      off('wallet_updated', handleWalletUpdate);
      off('wallet_balance_updated', handleWalletUpdate);
      off('wallet_transaction_completed', handleWalletUpdate);
      off('transaction_created', handleWalletUpdate);
      off('payment_completed', handleWalletUpdate);
      
      // Remove settlement listeners
      off('balance_updated', handleWalletUpdate);
    };
  }, [isConnected, on, off, handleDashboardUpdate, loadDashboardData]);

  // Load data on mount and when timeRange changes
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);


  // Quick actions
  const quickActions = [
    {
      label: "Add Expense",
      icon: "Plus",
      onClick: () => navigate('/personal-expenses'),
      color: "bg-gradient-to-r from-blue-500 to-purple-600"
    },
    {
      label: "View Analytics",
      icon: "PieChart",
      onClick: () => navigate('/analytics'),
      color: "bg-gradient-to-r from-green-500 to-teal-600"
    },
    {
      label: "See History",
      icon: "Receipt",
      onClick: () => navigate('/history'),
      color: "bg-gradient-to-r from-orange-500 to-pink-600"
    },
    {
      label: "Wallet",
      icon: "CreditCard",
      onClick: () => navigate('/wallet'),
      color: "bg-gradient-to-r from-purple-500 to-indigo-600"
    }
  ];

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Show error state if no data
  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">No data available</p>
          <Button onClick={loadDashboardData}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gradient-cyber mb-2">
            Personal Finance Dashboard
          </h1>
          <p className="text-muted-foreground">
            Track your income, expenses, and savings goals
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Time Range Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="glass-card border-white/20"
              >
                <Calendar className="w-4 h-4 mr-2" />
                {timeRange === '7d' ? '7 Days' : timeRange === '30d' ? '30 Days' : timeRange === '90d' ? '90 Days' : '1 Year'}
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass-card border-primary/20">
              <DropdownMenuItem 
                onClick={() => setTimeRange('7d')}
                className={timeRange === '7d' ? 'bg-primary/10 text-primary' : ''}
              >
                7 Days
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setTimeRange('30d')}
                className={timeRange === '30d' ? 'bg-primary/10 text-primary' : ''}
              >
                30 Days
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setTimeRange('90d')}
                className={timeRange === '90d' ? 'bg-primary/10 text-primary' : ''}
              >
                90 Days
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setTimeRange('1y')}
                className={timeRange === '1y' ? 'bg-primary/10 text-primary' : ''}
              >
                1 Year
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {/* WebSocket Connection Status */}
          <Badge 
            variant="outline" 
            className={isConnected 
              ? 'bg-success/20 text-success border-success/30' 
              : 'bg-muted/20 text-muted-foreground border-muted/30'}
          >
            {isConnected ? (
              <>
                <Wifi className="w-3 h-3 mr-1" />
                Live
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 mr-1" />
                Offline
              </>
            )}
          </Badge>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="glass-card border-white/20"
          >
            <RefreshCw className={refreshing ? 'w-4 h-4 mr-2 animate-spin' : 'w-4 h-4 mr-2'} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="glass-card border-white/20"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowBalance(!showBalance)}
            className="glass-card border-white/20"
          >
            {showBalance ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
            {showBalance ? 'Hide' : 'Show'} Balance
          </Button>
          <Button
            size="sm"
            className="bg-gradient-primary shadow-glow"
            onClick={() => navigate('/personal-expenses')}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Expense
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardData.quickStats.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.displayValue}
            change={stat.change}
            icon={stat.icon}
            color={stat.color}
            bgColor={stat.bgColor}
            borderColor={stat.borderColor}
            showBalance={showBalance}
          />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Expense Breakdown Chart */}
        <Card className="lg:col-span-2 glass-card border-primary/20 shadow-glow hover:shadow-glow-lg transition-all duration-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse-glow" />
                  Expense Breakdown
                </CardTitle>
                <CardDescription>Monthly spending distribution</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/analytics')}>
                View Details
                <Plus className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {dashboardData.categoryExpenses.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No expense data available</p>
              </div>
            ) : (
              <ExpenseChart 
                type="pie" 
                data={dashboardData.categoryExpenses} 
                title="" 
                gradient={true}
                showGlow={true}
              />
            )}
          </CardContent>
        </Card>

        {/* Budget Progress */}
        <div className="relative">
          <BudgetProgressCard budgets={dashboardData.budgetCategories} />
          <Button
            size="sm"
            variant="outline"
            onClick={handleAddBudget}
            className="absolute top-4 right-4 glass-card border-white/20"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Budget
          </Button>
        </div>
      </div>

      {/* Quick Actions & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <QuickActionsCard actions={quickActions} />

        {/* Recent Transactions */}
        <TransactionListCard transactions={dashboardData.recentTransactions} />
      </div>

      {/* Financial Goals */}
      <FinancialGoalsCard goals={dashboardData.financialGoals} onAddGoal={handleAddGoal} />

      {/* Goal Dialog */}
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
    </div>
  );
};

// Wrap with ErrorBoundary for enhanced error handling
const PersonalDashboardWithErrorBoundary = () => (
  <ErrorBoundary>
    <PersonalDashboard />
  </ErrorBoundary>
);

export default withLayout(PersonalDashboardWithErrorBoundary);
