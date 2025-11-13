import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import FloatingActionButton from "@/components/FloatingActionButton";
import CalculatorModal from "@/components/CalculatorModal";
import { TransactionExportModal } from "@/components/wallet/TransactionExportModal";
import {
  Wallet,
  Send,
  TrendingDown,
  History,
  Settings,
  Eye,
  EyeOff,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Users,
  Receipt,
  Smartphone,
  QrCode,
  Shield,
  Bell,
  Fingerprint,
  Lock,
  Download,
  Upload,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  TrendingUp,
  Home as HomeIcon,
  Coffee,
  ShoppingCart,
  Car
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import withLayout from "@/components/withLayout";
import { useWalletBalance } from "@/hooks/useWalletBalance";
import { useWalletStats } from "@/hooks/useWalletStats";
import { useWalletTransactions } from "@/hooks/useWalletTransactions";
import { SendMoneySection } from "@/components/wallet/SendMoneySection";
import { ExpenseAnalysisSection } from "@/components/wallet/ExpenseAnalysisSection";
import { WalletSettingsSection } from "@/components/wallet/WalletSettingsSection";
import { WalletToBankTransfer } from "@/components/bankTransfer/WalletToBankTransfer";
import { BankToWalletTransfer } from "@/components/bankTransfer/BankToWalletTransfer";
import { WalletToUPITransfer } from "@/components/bankTransfer/WalletToUPITransfer";
import { BankToBankTransfer } from "@/components/bankTransfer/BankToBankTransfer";
import { AddBankAccountModal } from "@/components/bankTransfer/AddBankAccountModal";
import { useBankTransfer, BankAccount } from "@/hooks/useBankTransfer";
import { useAuth } from "@/contexts/AuthContext";
import { useWebSocket } from "@/hooks/useWebSocket";

const WalletPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isConnected, on, off } = useWebSocket({ autoConnect: true });
  const [showBalance, setShowBalance] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [bankTransferTab, setBankTransferTab] = useState("wallet-to-bank");

  // Real data hooks
  const { balance, availableBalance, isLoading: balanceLoading, refetch: refreshBalance } = useWalletBalance();
  const { stats, loading: statsLoading, error: statsError } = useWalletStats();
  const { 
    transactions, 
    loading: transactionsLoading, 
    error: transactionsError,
    refetch: refetchTransactions
  } = useWalletTransactions(10); // Fetch 10 recent transactions
  const { getBankAccounts } = useBankTransfer();

  // Debug log for transactions
  useEffect(() => {
    console.log('📋 WalletPage transactions state:', {
      count: transactions.length,
      loading: transactionsLoading,
      error: transactionsError,
      transactions: transactions
    });
  }, [transactions, transactionsLoading, transactionsError]);

  // Fetch bank accounts for bank transfer tab
  useEffect(() => {
    const fetchBankAccounts = async () => {
      const accounts = await getBankAccounts();
      setBankAccounts(accounts);
    };
    if (activeTab === "bank-transfer") {
      fetchBankAccounts();
    }
  }, [activeTab, getBankAccounts]);

  // Refetch transactions when page becomes active or on mount
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Page became visible, refetch data
        refetchTransactions();
        refreshBalance();
      }
    };

    // Add event listener
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refetchTransactions, refreshBalance]);

  // Setup WebSocket event listeners for real-time updates
  useEffect(() => {
    if (!isConnected) return;

    const handleWalletUpdate = () => {
      console.log('💰 Wallet update received via WebSocket');
      refreshBalance();
      refetchTransactions();
    };

    const handleTransactionComplete = (data: any) => {
      console.log('✅ Transaction completed:', data);
      refreshBalance();
      refetchTransactions();
    };

    const handleBalanceUpdate = (data: any) => {
      console.log('💵 Balance updated:', data);
      refreshBalance();
    };

    // Listen for wallet events
    on('wallet_updated', handleWalletUpdate);
    on('wallet_balance_updated', handleBalanceUpdate);
    on('wallet_transaction_completed', handleTransactionComplete);
    on('transaction_created', handleTransactionComplete);
    on('payment_completed', handleTransactionComplete);

    return () => {
      off('wallet_updated', handleWalletUpdate);
      off('wallet_balance_updated', handleBalanceUpdate);
      off('wallet_transaction_completed', handleTransactionComplete);
      off('transaction_created', handleTransactionComplete);
      off('payment_completed', handleTransactionComplete);
    };
  }, [isConnected, on, off, refreshBalance, refetchTransactions]);

  // Wallet data - using real balance
  const walletData = {
    balance: balance || 0,
    pendingBalance: Math.max(0, (availableBalance || 0) - (balance || 0)),
    currency: "INR",
    accountNumber: "****6789",
    ifscCode: "HDFC0001234"
  };

  // Quick actions
  const quickActions = [
    {
      label: "Send Money",
      icon: Send,
      onClick: () => setActiveTab("send"),
      color: "bg-gradient-to-r from-blue-500 to-cyan-500"
    },
    {
      label: "Bank Transfer",
      icon: CreditCard,
      onClick: () => setActiveTab("bank-transfer"),
      color: "bg-gradient-to-r from-teal-500 to-emerald-500"
    },
    {
      label: "Add Money",
      icon: Plus,
      onClick: () => navigate("/wallet/add-money"),
      color: "bg-gradient-to-r from-green-500 to-emerald-500"
    },
    {
      label: "Scan QR",
      icon: QrCode,
      onClick: () => navigate("/wallet/scan-qr"),
      color: "bg-gradient-to-r from-purple-500 to-pink-500"
    },
    {
      label: "Pay Bills",
      icon: Receipt,
      onClick: () => {},
      color: "bg-gradient-to-r from-orange-500 to-red-500"
    }
  ];

  // Expense categories
  const expenseCategories = [
    { name: "Food & Dining", amount: 3200, icon: Coffee, color: "text-orange-400", percentage: 28 },
    { name: "Shopping", amount: 2400, icon: ShoppingCart, color: "text-purple-400", percentage: 21 },
    { name: "Transportation", amount: 1800, icon: Car, color: "text-blue-400", percentage: 16 },
    { name: "Others", amount: 4000, icon: HomeIcon, color: "text-green-400", percentage: 35 }
  ];

  return (
    <div className="space-y-4 md:space-y-6 py-3 md:py-6 px-2 md:px-0 pb-24 md:pb-6">
      {/* Header with Balance */}
      <Card className="glass-card border-primary/20 shadow-glow hover:shadow-glow-lg transition-all duration-500 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 pointer-events-none" />
        
        <CardContent className="p-3 sm:p-4 md:p-6 relative z-10">
          {/* Top Section - Balance and Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4 md:mb-6">
            <div className="w-full sm:w-auto">
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">Total Balance</p>
              <div className="flex items-center gap-2 sm:gap-3">
                {balanceLoading ? (
                  <Skeleton className="h-8 sm:h-10 w-28 sm:w-32" />
                ) : (
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gradient-cyber">
                    {showBalance ? `₹${walletData.balance.toLocaleString('en-IN')}` : "₹****"}
                  </h2>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowBalance(!showBalance)}
                  className="hover:bg-white/10 p-1 sm:p-2"
                >
                  {showBalance ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                </Button>
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <Badge variant="outline" className="glass-card border-primary/30 px-2 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm flex-shrink-0">
                <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Pending: </span>₹{walletData.pendingBalance.toLocaleString('en-IN')}
              </Badge>
              <Button 
                variant="outline" 
                size="icon" 
                className="glass-card border-white/20 h-8 w-8 sm:h-10 sm:w-10"
                onClick={refreshBalance}
                disabled={balanceLoading}
              >
                <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 ${balanceLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2 md:gap-3">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                className="h-auto flex-col gap-1 p-1.5 sm:p-2 md:p-3 glass-card border-white/20 hover:bg-white/10 transition-all duration-300 group"
                onClick={action.onClick}
              >
                <div className={`p-1.5 sm:p-2 rounded-md sm:rounded-lg ${action.color} group-hover:scale-110 transition-transform duration-300`}>
                  <action.icon className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                </div>
                <span className="text-[9px] sm:text-[10px] font-medium text-center leading-tight">{action.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6 glass-card border-white/10 h-auto p-1">
          <TabsTrigger value="overview" className="text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex-col sm:flex-row gap-0 sm:gap-2 py-2 px-1 sm:px-3">
            <Wallet className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="text-[10px] sm:text-sm">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="send" className="text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex-col sm:flex-row gap-0 sm:gap-2 py-2 px-1 sm:px-3">
            <Send className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="text-[10px] sm:text-sm hidden xs:inline">Send</span>
            <span className="text-[10px] sm:text-sm xs:hidden">Send</span>
          </TabsTrigger>
          <TabsTrigger value="bank-transfer" className="text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex-col sm:flex-row gap-0 sm:gap-2 py-2 px-1 sm:px-3">
            <CreditCard className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="text-[10px] sm:text-sm">Bank</span>
          </TabsTrigger>
          <TabsTrigger value="expenses" className="text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex-col sm:flex-row gap-0 sm:gap-2 py-2 px-1 sm:px-3">
            <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="text-[10px] sm:text-sm">Expense</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex-col sm:flex-row gap-0 sm:gap-2 py-2 px-1 sm:px-3">
            <History className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="text-[10px] sm:text-sm">History</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex-col sm:flex-row gap-0 sm:gap-2 py-2 px-1 sm:px-3">
            <Settings className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="text-[10px] sm:text-sm">Settings</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4 md:space-y-6 mt-4 md:mt-6">
          {statsError && (
            <Alert variant="destructive" className="mx-2 md:mx-0">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs sm:text-sm">{statsError}</AlertDescription>
            </Alert>
          )}
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            {/* Income Card */}
            <StatsCard
              title="Income This Month"
              value={stats?.income.current || 0}
              percentageChange={stats?.income.percentageChange || 0}
              type="income"
              loading={statsLoading}
            />

            {/* Expenses Card */}
            <StatsCard
              title="Expenses This Month"
              value={stats?.expenses.current || 0}
              percentageChange={stats?.expenses.percentageChange || 0}
              type="expenses"
              loading={statsLoading}
            />

            {/* Savings Rate Card */}
            <StatsCard
              title="Savings Rate"
              value={stats?.savings.rate || 0}
              percentageChange={stats?.savings.percentageChange || 0}
              type="savings"
              loading={statsLoading}
              isPercentage={true}
            />
          </div>

          {/* Recent Transactions */}
          <Card className="glass-card border-primary/20 shadow-glow hover:shadow-glow-lg transition-all duration-500">
            <CardHeader className="p-3 sm:p-4 md:p-6">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base md:text-lg">
                  <div className="w-2 h-2 bg-accent rounded-full animate-pulse-glow" />
                  Recent Transactions
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setActiveTab("history")} className="text-xs sm:text-sm px-2 sm:px-3">
                  <span className="hidden sm:inline">View All</span>
                  <span className="sm:hidden">All</span>
                  <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 md:p-6">
              {transactionsLoading ? (
                <div className="space-y-2 sm:space-y-3 md:space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center justify-between p-2 sm:p-3 md:p-4">
                      <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-1">
                        <Skeleton className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-xl" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-3 sm:h-4 w-24 sm:w-32" />
                          <Skeleton className="h-2 sm:h-3 w-32 sm:w-48" />
                        </div>
                      </div>
                      <Skeleton className="h-5 sm:h-6 w-16 sm:w-20" />
                    </div>
                  ))}
                </div>
              ) : transactionsError ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs sm:text-sm">{transactionsError}</AlertDescription>
                </Alert>
              ) : transactions.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <History className="w-8 h-8 sm:w-12 sm:h-12 mx-auto text-muted-foreground mb-3 sm:mb-4" />
                  <h3 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2">No Transactions Yet</h3>
                  <p className="text-muted-foreground text-xs sm:text-sm">
                    Start using your wallet to see transactions here
                  </p>
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3 md:space-y-4">
                  {transactions.slice(0, 5).map((transaction) => (
                    <TransactionItem key={transaction._id} transaction={transaction} currentUserId={user?._id} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Send Money Tab */}
        <TabsContent value="send" className="space-y-6 mt-6">
          <SendMoneySection />
        </TabsContent>

        {/* Bank Transfer Tab */}
        <TabsContent value="bank-transfer" className="space-y-4 md:space-y-6 mt-4 md:mt-6">
          <Card className="glass-card border-primary/20 shadow-glow hover:shadow-glow-lg transition-all duration-500">
            <CardHeader className="p-3 sm:p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-sm sm:text-base md:text-lg">
                    <div className="p-2 rounded-lg bg-gradient-to-r from-primary to-accent">
                      <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    Bank Transfer
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm mt-1">Transfer money between wallet and bank accounts</CardDescription>
                </div>
                <Button
                  onClick={() => setShowAddAccountModal(true)}
                  className="bg-gradient-primary shadow-glow text-xs sm:text-sm h-8 sm:h-10"
                  size="sm"
                >
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Add Account</span>
                  <span className="sm:hidden">Add</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 md:p-6">
              <Tabs value={bankTransferTab} onValueChange={setBankTransferTab} className="space-y-4 sm:space-y-6">
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 glass-card p-1">
                  <TabsTrigger
                    value="wallet-to-bank"
                    className="flex items-center gap-1 sm:gap-2 data-[state=active]:bg-gradient-primary text-[10px] sm:text-sm px-1 sm:px-3"
                  >
                    <Wallet className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                    <span className="hidden sm:inline">Wallet to Bank</span>
                    <span className="sm:hidden">W→B</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="bank-to-wallet"
                    className="flex items-center gap-1 sm:gap-2 data-[state=active]:bg-gradient-primary text-[10px] sm:text-sm px-1 sm:px-3"
                  >
                    <CreditCard className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
                    <span className="hidden sm:inline">Bank to Wallet</span>
                    <span className="sm:hidden">B→W</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="bank-to-bank"
                    className="flex items-center gap-1 sm:gap-2 data-[state=active]:bg-gradient-primary text-[10px] sm:text-sm px-1 sm:px-3"
                  >
                    <ArrowDownRight className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-500" />
                    <span className="hidden sm:inline">Bank to Bank</span>
                    <span className="sm:hidden">B→B</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="wallet-to-upi"
                    className="flex items-center gap-1 sm:gap-2 data-[state=active]:bg-gradient-primary text-[10px] sm:text-sm px-1 sm:px-3"
                  >
                    <Smartphone className="w-3 h-3 sm:w-4 sm:h-4 text-purple-500" />
                    <span className="hidden sm:inline">Wallet to UPI</span>
                    <span className="sm:hidden">UPI</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="wallet-to-bank" className="space-y-4">
                  <Alert className="glass-card border-green-500/20">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <AlertDescription className="text-xs sm:text-sm">
                      Transfer money from wallet to bank. Processing: 1-2 business days.
                    </AlertDescription>
                  </Alert>
                  <WalletToBankTransfer
                    bankAccounts={bankAccounts}
                    walletBalance={balance || 0}
                    onTransferComplete={() => {
                      refreshBalance();
                      refetchTransactions();
                    }}
                    onAddAccount={() => setShowAddAccountModal(true)}
                  />
                </TabsContent>

                <TabsContent value="bank-to-wallet" className="space-y-4">
                  <Alert className="glass-card border-blue-500/20">
                    <AlertCircle className="h-4 w-4 text-blue-500" />
                    <AlertDescription className="text-xs sm:text-sm">
                      Add money from bank to wallet. Processing: 2-4 hours.
                    </AlertDescription>
                  </Alert>
                  <BankToWalletTransfer
                    bankAccounts={bankAccounts}
                    onTransferComplete={() => {
                      refreshBalance();
                      refetchTransactions();
                    }}
                    onAddAccount={() => setShowAddAccountModal(true)}
                  />
                </TabsContent>

                <TabsContent value="bank-to-bank" className="space-y-4">
                  <Alert className="glass-card border-cyan-500/20">
                    <AlertCircle className="h-4 w-4 text-cyan-500" />
                    <AlertDescription className="text-xs sm:text-sm">
                      Instant bank to bank transfer via IMPS.
                    </AlertDescription>
                  </Alert>
                  <BankToBankTransfer
                    bankAccounts={bankAccounts}
                    onTransferComplete={() => {
                      refreshBalance();
                      refetchTransactions();
                    }}
                    onAddAccount={() => setShowAddAccountModal(true)}
                  />
                </TabsContent>

                <TabsContent value="wallet-to-upi" className="space-y-4">
                  <Alert className="glass-card border-purple-500/20">
                    <Clock className="h-4 w-4 text-purple-500" />
                    <AlertDescription className="text-xs sm:text-sm">
                      Send money instantly to any UPI ID.
                    </AlertDescription>
                  </Alert>
                  <WalletToUPITransfer
                    walletBalance={balance || 0}
                    onTransferComplete={() => {
                      refreshBalance();
                      refetchTransactions();
                    }}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Expenses Tab */}
        <TabsContent value="expenses" className="space-y-6 mt-6">
          <ExpenseAnalysisSection />
        </TabsContent>


        {/* History Tab */}
        <TabsContent value="history" className="space-y-4 md:space-y-6 mt-4 md:mt-6">
          <Card className="glass-card border-primary/20 shadow-glow hover:shadow-glow-lg transition-all duration-500">
            <CardHeader className="p-3 sm:p-4 md:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2 text-sm sm:text-base md:text-lg">
                    <div className="w-2 h-2 bg-accent rounded-full animate-pulse-glow" />
                    Transaction History
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Complete history of all wallet transactions</CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="glass-card border-white/20 text-xs sm:text-sm w-full sm:w-auto"
                  onClick={() => setIsExportModalOpen(true)}
                >
                  <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 md:p-6">
              {transactionsLoading ? (
                <div className="space-y-2 sm:space-y-3 md:space-y-4">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                    <div key={i} className="flex items-center justify-between p-2 sm:p-3 md:p-4">
                      <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-1">
                        <Skeleton className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-xl" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-3 sm:h-4 w-24 sm:w-32" />
                          <Skeleton className="h-2 sm:h-3 w-32 sm:w-48" />
                        </div>
                      </div>
                      <Skeleton className="h-5 sm:h-6 w-16 sm:w-20" />
                    </div>
                  ))}
                </div>
              ) : transactionsError ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs sm:text-sm">{transactionsError}</AlertDescription>
                </Alert>
              ) : transactions.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <History className="w-8 h-8 sm:w-12 sm:h-12 mx-auto text-muted-foreground mb-3 sm:mb-4" />
                  <h3 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2">No Transactions Yet</h3>
                  <p className="text-muted-foreground text-xs sm:text-sm">
                    Start using your wallet to see transactions here
                  </p>
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3 md:space-y-4">
                  {transactions.map((transaction) => (
                    <TransactionItem key={transaction._id} transaction={transaction} currentUserId={user?._id} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4 md:space-y-6 mt-4 md:mt-6">
          <WalletSettingsSection />
        </TabsContent>
      </Tabs>

      {/* Floating Action Button - Only visible on mobile/tablet screens */}
      <div className="block md:hidden">
        <FloatingActionButton
          onAddExpense={() => {
            // Navigate to expenses tab or show add expense modal
            setActiveTab("expenses");
          }}
          onSendMoney={() => {
            // Navigate to send money tab
            setActiveTab("send");
          }}
          onScanQR={() => {
            // Navigate to QR scanner page
            navigate("/wallet/scan-qr");
          }}
          onCalculate={() => {
            // Open calculator modal
            setIsCalculatorOpen(true);
          }}
        />
      </div>

      {/* Calculator Modal */}
      <CalculatorModal
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
      />

      {/* Transaction Export Modal */}
      <TransactionExportModal
        open={isExportModalOpen}
        onOpenChange={setIsExportModalOpen}
      />

      {/* Add Bank Account Modal */}
      <AddBankAccountModal
        open={showAddAccountModal}
        onClose={() => setShowAddAccountModal(false)}
        onAccountAdded={async () => {
          const accounts = await getBankAccounts();
          setBankAccounts(accounts);
        }}
      />
    </div>
  );
};

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

// Stats Card Component
interface StatsCardProps {
  title: string;
  value: number;
  percentageChange: number;
  type: 'income' | 'expenses' | 'savings';
  loading: boolean;
  isPercentage?: boolean;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  percentageChange,
  type,
  loading,
  isPercentage = false
}) => {
  const getColor = () => {
    switch (type) {
      case 'income':
        return {
          dot: 'bg-success',
          text: 'text-success',
          bg: 'from-success/10'
        };
      case 'expenses':
        return {
          dot: 'bg-destructive',
          text: 'text-destructive',
          bg: 'from-destructive/10'
        };
      case 'savings':
        return {
          dot: 'bg-primary',
          text: 'text-primary',
          bg: 'from-primary/10'
        };
    }
  };

  const colors = getColor();
  const isPositive = percentageChange >= 0;

  return (
    <Card className={`glass-card border-primary/20 shadow-glow hover:shadow-glow-lg transition-all duration-500 bg-gradient-to-br ${colors.bg}`}>
      <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4 md:p-6">
        <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-2">
          <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 ${colors.dot} rounded-full animate-pulse-glow`} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
        {loading ? (
          <>
            <Skeleton className="h-8 sm:h-10 w-24 sm:w-32 mb-2" />
            <Skeleton className="h-3 sm:h-4 w-32 sm:w-40" />
          </>
        ) : (
          <>
            <p className={`text-xl sm:text-2xl md:text-3xl font-bold ${colors.text}`}>
              {isPercentage ? `${value}%` : `₹${value.toLocaleString('en-IN')}`}
            </p>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
              <span className={isPositive ? 'text-success' : 'text-destructive'}>
                {isPositive ? '+' : ''}{percentageChange}%
              </span>
              {' '}from last month
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
};

// Transaction Item Component
interface TransactionItemProps {
  transaction: any;
  currentUserId?: string;
}

const TransactionItem: React.FC<TransactionItemProps> = ({ transaction, currentUserId }) => {
  // Determine transaction icon and color
  const getTransactionDisplay = () => {
    let icon = Send;
    let color = 'text-blue-400';
    let title = transaction.description || 'Transaction';
    let isCredit = false;

    switch (transaction.type) {
      case 'wallet_topup':
        icon = Plus;
        color = 'text-green-400';
        title = 'Added to Wallet';
        isCredit = true;
        break;
      case 'wallet_transfer':
        // Determine if current user is sender or receiver
        const isSender = transaction.from?._id === currentUserId || transaction.fromUser?._id === currentUserId;
        const isReceiver = transaction.to?._id === currentUserId || transaction.toUser?._id === currentUserId;
        
        console.log('💰 Transaction Display Logic:', {
          transactionId: transaction._id,
          currentUserId,
          fromUserId: transaction.from?._id || transaction.fromUser?._id,
          toUserId: transaction.to?._id || transaction.toUser?._id,
          isSender,
          isReceiver
        });
        
        if (isReceiver && !isSender) {
          // Current user received money
          icon = ArrowDownRight;
          color = 'text-green-400';
          const senderName = transaction.from?.firstName || transaction.fromUser?.firstName || 'User';
          const senderLastName = transaction.from?.lastName || transaction.fromUser?.lastName || '';
          title = `Received from ${senderName} ${senderLastName}`.trim();
          isCredit = true;
        } else if (isSender) {
          // Current user sent money
          icon = Send;
          color = 'text-blue-400';
          const receiverName = transaction.to?.firstName || transaction.toUser?.firstName || 'User';
          const receiverLastName = transaction.to?.lastName || transaction.toUser?.lastName || '';
          title = `Sent to ${receiverName} ${receiverLastName}`.trim();
          isCredit = false;
        } else {
          // Fallback
          title = transaction.description || 'Transfer';
        }
        break;
      case 'settlement':
      case 'group_settlement':
        icon = Users;
        color = 'text-orange-400';
        title = 'Group Settlement';
        // Check if user received or paid in settlement
        const isSettlementReceiver = transaction.to?._id === currentUserId || transaction.toUser?._id === currentUserId;
        isCredit = isSettlementReceiver;
        break;
      case 'expense_payment':
        icon = Receipt;
        color = 'text-purple-400';
        title = 'Expense Payment';
        isCredit = false;
        break;
      default:
        icon = Send;
        color = 'text-blue-400';
    }

    return { icon: icon, color, title, isCredit };
  };

  const { icon: Icon, color, title, isCredit } = getTransactionDisplay();
  const displayAmount = isCredit ? transaction.amount : -transaction.amount;

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins} minutes ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hours ago`;
    } else if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-IN', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  // Status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-success border-success/20 bg-success/10';
      case 'pending':
      case 'processing':
        return 'text-warning border-warning/20 bg-warning/10';
      case 'failed':
      case 'cancelled':
        return 'text-destructive border-destructive/20 bg-destructive/10';
      default:
        return 'text-muted-foreground border-border';
    }
  };

  return (
    <div className="flex items-center justify-between p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl glass-card border-white/10 hover:bg-white/5 transition-all duration-300 group">
      <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-1 min-w-0">
        <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-white/5 border border-white/10 group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
          <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-foreground text-xs sm:text-sm md:text-base truncate">{title}</h4>
          <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">
            {transaction.method?.toUpperCase() || 'WALLET'}
          </p>
          <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">
            {formatDate(transaction.createdAt)}
          </p>
        </div>
      </div>
      <div className="text-right flex-shrink-0 ml-2">
        <p className={`text-sm sm:text-base md:text-lg font-bold ${displayAmount > 0 ? 'text-success' : 'text-foreground'}`}>
          {displayAmount > 0 ? '+' : ''}₹{Math.abs(displayAmount).toLocaleString('en-IN')}
        </p>
        <Badge 
          variant="outline" 
          className={`mt-0.5 sm:mt-1 text-[8px] sm:text-xs px-1 sm:px-2 ${getStatusColor(transaction.status)}`}
        >
          <CheckCircle className="w-2 h-2 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
          <span className="hidden sm:inline">{transaction.status}</span>
          <span className="sm:hidden">{transaction.status.slice(0, 4)}</span>
        </Badge>
      </div>
    </div>
  );
};

export default withLayout(WalletPage);
