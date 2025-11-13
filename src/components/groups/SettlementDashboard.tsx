import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CreditCard, 
  History, 
  Zap, 
  Bell, 
  Users, 
  TrendingUp,
  RefreshCw,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Import our settlement components
import EnhancedBalanceSection from './EnhancedBalanceSection';
import SettlementHistory from './SettlementHistory';
import SettlementOptimizer from './SettlementOptimizer';
import SettlementNotifications from '../notifications/SettlementNotifications';
import { useSettlementNotifications } from '../notifications/SettlementNotifications';
import settlementService from '@/lib/services/settlementServiceMock';

interface BalanceDetail {
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    avatar?: { url?: string };
  };
  netBalance: number;
  totalGetsBack: number;
  totalNeedsToPay: number;
  owesTo: Array<{
    user: {
      _id: string;
      firstName: string;
      lastName: string;
      avatar?: { url?: string };
    };
    amount: number;
  }>;
  owedBy: Array<{
    user: {
      _id: string;
      firstName: string;
      lastName: string;
      avatar?: { url?: string };
    };
    amount: number;
  }>;
}

interface SettlementSummary {
  totalSettlements: number;
  completedSettlements: number;
  pendingSettlements: number;
  failedSettlements: number;
  totalAmount: number;
  recentSettlements: any[];
}

interface SettlementDashboardProps {
  groupId: string;
  memberBalances: BalanceDetail[];
  currency?: string;
  onBalanceUpdate?: () => void;
}

export const SettlementDashboard: React.FC<SettlementDashboardProps> = ({
  groupId,
  memberBalances,
  currency = 'INR',
  onBalanceUpdate
}) => {
  const { toast } = useToast();
  const { showSettlementToast } = useSettlementNotifications();
  const [activeTab, setActiveTab] = useState('balances');
  const [settlementSummary, setSettlementSummary] = useState<SettlementSummary | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchSettlementSummary();
  }, [groupId]);

  const fetchSettlementSummary = async () => {
    try {
      const response = await settlementService.getSettlementSummary(groupId);
      setSettlementSummary(response.data);
    } catch (error) {
      console.error('Failed to fetch settlement summary:', error);
    }
  };

  const refreshDashboard = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        fetchSettlementSummary(),
        onBalanceUpdate?.()
      ]);
      
      toast({
        title: "Dashboard Refreshed",
        description: "All settlement data has been updated",
        className: "border-green-500/50 bg-green-500/10"
      });
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "Unable to refresh dashboard data",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleOptimizationApplied = (result: any) => {
    toast({
      title: "Settlements Optimized! ✨",
      description: `Reduced ${result.savings.transactionReduction} transactions for the group`,
      className: "border-primary/50 bg-primary/10",
      duration: 7000
    });
    
    // Refresh balances and summary
    onBalanceUpdate?.();
    fetchSettlementSummary();
    
    // Switch to history tab to show new settlements
    setActiveTab('history');
  };

  const formatCurrency = (amount: number) => {
    const symbol = currency === 'USD' ? '$' : '₹';
    return `${symbol}${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  // Calculate dashboard stats
  const totalTransactions = memberBalances.reduce((sum, balance) => sum + balance.owesTo.length, 0);
  const activeMembers = memberBalances.filter(b => b.netBalance !== 0).length;
  const totalVolume = memberBalances.reduce((sum, balance) => 
    sum + balance.owesTo.reduce((owesSum, owe) => owesSum + owe.amount, 0), 0
  );

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-primary" />
              Settlement Center
            </CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={refreshDashboard}
              disabled={isRefreshing}
              className="border-white/30 text-white hover:bg-white/10"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-4 text-center">
                <Users className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                <div className="text-xl font-bold text-white">{activeMembers}</div>
                <div className="text-xs text-white/60">Active Members</div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-4 text-center">
                <TrendingUp className="w-6 h-6 text-green-400 mx-auto mb-2" />
                <div className="text-xl font-bold text-white">{totalTransactions}</div>
                <div className="text-xs text-white/60">Pending Transactions</div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-4 text-center">
                <CreditCard className="w-6 h-6 text-primary mx-auto mb-2" />
                <div className="text-xl font-bold text-white">{formatCurrency(totalVolume)}</div>
                <div className="text-xs text-white/60">Total Volume</div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-4 text-center">
                <CheckCircle className="w-6 h-6 text-green-400 mx-auto mb-2" />
                <div className="text-xl font-bold text-white">
                  {settlementSummary?.completedSettlements || 0}
                </div>
                <div className="text-xs text-white/60">Completed</div>
              </CardContent>
            </Card>
          </div>

          {/* Settlement Status Alert */}
          {totalTransactions === 0 ? (
            <Card className="bg-green-500/10 border-green-500/20 mb-6">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                  <div>
                    <h4 className="font-medium text-green-400">All Settled Up! 🎉</h4>
                    <p className="text-white/70 text-sm">
                      Everyone in the group is settled up. Great job managing your expenses!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : totalTransactions > activeMembers && totalTransactions > 3 ? (
            <Card className="bg-yellow-500/10 border-yellow-500/20 mb-6">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-6 h-6 text-yellow-400" />
                    <div>
                      <h4 className="font-medium text-yellow-400">Optimization Available</h4>
                      <p className="text-white/70 text-sm">
                        Your group could benefit from settlement optimization to reduce transactions.
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setActiveTab('optimizer')}
                    className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Optimize Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-4 bg-black/40 border border-white/20">
          <TabsTrigger 
            value="balances" 
            className="data-[state=active]:bg-primary data-[state=active]:text-white"
          >
            <Users className="w-4 h-4 mr-2" />
            Balances
          </TabsTrigger>
          <TabsTrigger 
            value="history" 
            className="data-[state=active]:bg-primary data-[state=active]:text-white"
          >
            <History className="w-4 h-4 mr-2" />
            History
          </TabsTrigger>
          <TabsTrigger 
            value="optimizer" 
            className="data-[state=active]:bg-primary data-[state=active]:text-white"
          >
            <Zap className="w-4 h-4 mr-2" />
            Optimize
            {totalTransactions > activeMembers && totalTransactions > 3 && (
              <Badge 
                variant="outline" 
                className="ml-2 bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs"
              >
                !
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="notifications" 
            className="data-[state=active]:bg-primary data-[state=active]:text-white"
          >
            <Bell className="w-4 h-4 mr-2" />
            Updates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="balances" className="space-y-6">
          <EnhancedBalanceSection
            memberBalances={memberBalances}
            currency={currency}
            groupId={groupId}
          />
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <SettlementHistory
            groupId={groupId}
            currency={currency}
          />
        </TabsContent>

        <TabsContent value="optimizer" className="space-y-6">
          <SettlementOptimizer
            groupId={groupId}
            memberBalances={memberBalances}
            currency={currency}
            onOptimizationApplied={handleOptimizationApplied}
          />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <SettlementNotifications
            showOnlyUnread={false}
            maxNotifications={20}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettlementDashboard;