import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowUpRight,
  ArrowDownRight,
  Send,
  Plus,
  Users,
  QrCode,
  History,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Loader2,
} from "lucide-react";
import { useWalletStats } from "@/hooks/useWalletStats";
import { useWalletTransactions } from "@/hooks/useWalletTransactions";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";

interface WalletOverviewSectionProps {
  onViewAllTransactions: () => void;
}

/**
 * Stats Card Component
 */
interface StatsCardProps {
  title: string;
  value: number;
  percentageChange: number;
  type: "income" | "expenses" | "savings";
  loading: boolean;
  isPercentage?: boolean;
}

const StatsCard = ({
  title,
  value,
  percentageChange,
  type,
  loading,
  isPercentage = false,
}: StatsCardProps) => {
  const colorConfig = {
    income: {
      bg: "bg-success",
      text: "text-success",
      gradient: "from-green-500/20 to-emerald-500/20",
    },
    expenses: {
      bg: "bg-destructive",
      text: "text-destructive",
      gradient: "from-red-500/20 to-pink-500/20",
    },
    savings: {
      bg: "bg-primary",
      text: "text-primary",
      gradient: "from-blue-500/20 to-purple-500/20",
    },
  };

  const config = colorConfig[type];
  const isPositive = percentageChange >= 0;

  return (
    <Card className="glass-card border-primary/20 shadow-glow hover:shadow-glow-lg transition-all duration-500 relative overflow-hidden">
      <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} pointer-events-none`} />
      
      <CardHeader className="pb-3 relative z-10">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <div className={`w-2 h-2 ${config.bg} rounded-full animate-pulse-glow`} />
          {title}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="relative z-10">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
        ) : (
          <>
            <p className={`text-3xl font-bold ${config.text}`}>
              {isPercentage ? `${value.toFixed(1)}%` : `₹${value.toLocaleString('en-IN')}`}
            </p>
            <div className="flex items-center gap-1 mt-2">
              {isPositive ? (
                <TrendingUp className="w-3 h-3 text-green-400" />
              ) : (
                <TrendingDown className="w-3 h-3 text-red-400" />
              )}
              <p className={`text-xs ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                {isPositive ? '+' : ''}{percentageChange.toFixed(1)}% from last month
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Transaction Icon Helper
 */
const getTransactionIcon = (type: string) => {
  const iconMap: Record<string, any> = {
    wallet_topup: Plus,
    wallet_transfer: Send,
    settlement: Users,
    expense_payment: QrCode,
    withdrawal: ArrowUpRight,
    refund: ArrowDownRight,
  };
  return iconMap[type] || Send;
};

/**
 * Transaction Color Helper
 */
const getTransactionColor = (type: string, amount: number) => {
  if (amount > 0) return "text-green-400";
  return "text-blue-400";
};

/**
 * Main Overview Section Component
 */
export const WalletOverviewSection = ({ onViewAllTransactions }: WalletOverviewSectionProps) => {
  const { user } = useAuth();
  
  // Fetch real data
  const { stats, loading: statsLoading, error: statsError } = useWalletStats('month');
  const { 
    transactions, 
    loading: transactionsLoading, 
    error: transactionsError 
  } = useWalletTransactions(5); // Fetch only 5 recent

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <StatsCard
          title="Income This Month"
          value={stats?.income.current || 0}
          percentageChange={stats?.income.percentageChange || 0}
          type="income"
          loading={statsLoading}
        />

        <StatsCard
          title="Expenses This Month"
          value={stats?.expenses.current || 0}
          percentageChange={stats?.expenses.percentageChange || 0}
          type="expenses"
          loading={statsLoading}
        />

        <StatsCard
          title="Savings Rate"
          value={stats?.savings.rate || 0}
          percentageChange={stats?.savings.percentageChange || 0}
          type="savings"
          loading={statsLoading}
          isPercentage={true}
        />
      </div>

      {/* Stats Error */}
      {statsError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Failed to load statistics: {statsError}</AlertDescription>
        </Alert>
      )}

      {/* Recent Transactions */}
      <Card className="glass-card border-primary/20 shadow-glow hover:shadow-glow-lg transition-all duration-500">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <div className="w-2 h-2 bg-accent rounded-full animate-pulse-glow" />
              Recent Transactions
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onViewAllTransactions}
            >
              View All
              <ArrowUpRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {transactionsLoading ? (
            // Loading Skeleton
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-xl glass-card border-white/10">
                  <div className="flex items-center gap-4 flex-1">
                    <Skeleton className="w-12 h-12 rounded-xl" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : transactionsError ? (
            // Error State
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{transactionsError}</AlertDescription>
            </Alert>
          ) : transactions.length === 0 ? (
            // Empty State
            <div className="text-center py-12">
              <History className="w-16 h-16 mx-auto text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-foreground">No Transactions Yet</h3>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                Start using your wallet to see transactions here. Add money, send payments, or split expenses with friends.
              </p>
            </div>
          ) : (
            // Transaction List
            <div className="space-y-4">
              {transactions.map((transaction) => {
                const currentUserId = user?.id;
                
                // Determine if current user is sender or receiver
                const isSender = transaction.from?._id === currentUserId || transaction.fromUser?._id === currentUserId;
                const isReceiver = transaction.to?._id === currentUserId || transaction.toUser?._id === currentUserId;
                
                let isCredit = false;
                let Icon = getTransactionIcon(transaction.type);
                let color = 'text-blue-400';
                
                // Determine credit/debit based on user role
                if (transaction.type === 'wallet_topup') {
                  isCredit = true;
                  Icon = Plus;
                  color = 'text-green-400';
                } else if (transaction.type === 'wallet_transfer') {
                  if (isReceiver && !isSender) {
                    isCredit = true;
                    Icon = ArrowDownRight;
                    color = 'text-green-400';
                  } else if (isSender) {
                    isCredit = false;
                    Icon = Send;
                    color = 'text-blue-400';
                  }
                } else if (transaction.type === 'settlement' || transaction.type === 'group_settlement') {
                  isCredit = isReceiver;
                  Icon = Users;
                  color = 'text-orange-400';
                }

                // Format description - show the OTHER party's name
                const getDescription = () => {
                  if (transaction.type === 'wallet_transfer') {
                    if (isReceiver && !isSender) {
                      // Show sender's name
                      const senderName = transaction.from?.firstName || transaction.fromUser?.firstName || 'User';
                      const senderLastName = transaction.from?.lastName || transaction.fromUser?.lastName || '';
                      return `From: ${senderName} ${senderLastName}`.trim();
                    } else if (isSender) {
                      // Show receiver's name
                      const receiverName = transaction.to?.firstName || transaction.toUser?.firstName || 'User';
                      const receiverLastName = transaction.to?.lastName || transaction.toUser?.lastName || '';
                      return `To: ${receiverName} ${receiverLastName}`.trim();
                    }
                  }
                  if (transaction.description) return transaction.description;
                  return transaction.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                };

                // Format title
                const getTitle = () => {
                  switch (transaction.type) {
                    case 'wallet_topup':
                      return 'Added to Wallet';
                    case 'wallet_transfer':
                      if (isReceiver && !isSender) {
                        const senderName = transaction.from?.firstName || transaction.fromUser?.firstName || 'User';
                        const senderLastName = transaction.from?.lastName || transaction.fromUser?.lastName || '';
                        return `Received from ${senderName} ${senderLastName}`.trim();
                      } else if (isSender) {
                        const receiverName = transaction.to?.firstName || transaction.toUser?.firstName || 'User';
                        const receiverLastName = transaction.to?.lastName || transaction.toUser?.lastName || '';
                        return `Sent to ${receiverName} ${receiverLastName}`.trim();
                      }
                      return 'Transfer';
                    case 'settlement':
                    case 'group_settlement':
                      return 'Group Settlement';
                    case 'expense_payment':
                      return 'Expense Payment';
                    case 'withdrawal':
                      return 'Withdrawal';
                    case 'refund':
                      return 'Refund';
                    default:
                      return transaction.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                  }
                };

                // Format date
                const formatDate = () => {
                  try {
                    return formatDistanceToNow(new Date(transaction.createdAt), { addSuffix: true });
                  } catch {
                    return new Date(transaction.createdAt).toLocaleDateString();
                  }
                };

                return (
                  <div
                    key={transaction._id}
                    className="flex items-center justify-between p-4 rounded-xl glass-card border-white/10 hover:bg-white/5 transition-all duration-300 group cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-white/5 border border-white/10 group-hover:scale-110 transition-transform duration-300">
                        <Icon className={`w-5 h-5 ${color}`} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">{getTitle()}</h4>
                        <p className="text-sm text-muted-foreground">{getDescription()}</p>
                        <p className="text-xs text-muted-foreground mt-1">{formatDate()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${isCredit ? 'text-success' : 'text-foreground'}`}>
                        {isCredit ? '+' : '-'}₹{Math.abs(transaction.amount).toLocaleString('en-IN')}
                      </p>
                      <Badge 
                        variant="outline" 
                        className={`mt-1 ${
                          transaction.status === 'completed' ? 'border-green-500/30 text-green-400' :
                          transaction.status === 'pending' ? 'border-yellow-500/30 text-yellow-400' :
                          transaction.status === 'failed' ? 'border-red-500/30 text-red-400' :
                          'border-gray-500/30 text-gray-400'
                        }`}
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {transaction.status}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WalletOverviewSection;