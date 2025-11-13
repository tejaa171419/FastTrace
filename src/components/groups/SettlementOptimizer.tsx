import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  Zap, 
  ArrowRight, 
  TrendingDown, 
  Users, 
  Calculator,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Lightbulb,
  Target,
  Award
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import settlementService from '@/lib/services/settlementServiceMock';

interface BalanceDetail {
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    avatar?: { url?: string };
  };
  netBalance: number;
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

interface OptimizedSettlement {
  fromUserId: string;
  toUserId: string;
  amount: number;
  reason: string;
  savings: {
    reducedTransactions: number;
    simplifiedAmount: number;
  };
}

interface OptimizationResult {
  currentSettlements: Array<{
    fromUserId: string;
    toUserId: string;
    amount: number;
  }>;
  optimizedSettlements: OptimizedSettlement[];
  savings: {
    transactionReduction: number;
    complexityReduction: number;
    totalSavings: number;
  };
}

interface SettlementOptimizerProps {
  groupId: string;
  memberBalances: BalanceDetail[];
  currency?: string;
  onOptimizationApplied?: (result: OptimizationResult) => void;
}

export const SettlementOptimizer: React.FC<SettlementOptimizerProps> = ({
  groupId,
  memberBalances,
  currency = 'INR',
  onOptimizationApplied
}) => {
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const formatCurrency = (amount: number) => {
    const symbol = currency === 'USD' ? '$' : '₹';
    return `${symbol}${Math.abs(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  // Local optimization algorithm - can be replaced with API call
  const optimizeSettlementsLocally = (balances: BalanceDetail[]): OptimizationResult => {
    // Extract all individual debts
    const allDebts: Array<{
      fromUserId: string;
      toUserId: string;
      amount: number;
    }> = [];

    balances.forEach(balance => {
      balance.owesTo.forEach(debt => {
        allDebts.push({
          fromUserId: balance.user._id,
          toUserId: debt.user._id,
          amount: debt.amount
        });
      });
    });

    // Create creditor and debtor lists with net balances
    const creditors: Array<{ userId: string, amount: number }> = [];
    const debtors: Array<{ userId: string, amount: number }> = [];

    balances.forEach(balance => {
      if (balance.netBalance > 0) {
        creditors.push({ userId: balance.user._id, amount: balance.netBalance });
      } else if (balance.netBalance < 0) {
        debtors.push({ userId: balance.user._id, amount: Math.abs(balance.netBalance) });
      }
    });

    // Sort creditors (descending) and debtors (descending) for optimal matching
    creditors.sort((a, b) => b.amount - a.amount);
    debtors.sort((a, b) => b.amount - a.amount);

    // Apply greedy algorithm to minimize transactions
    const optimizedDebts: OptimizedSettlement[] = [];
    const creditorsWork = [...creditors];
    const debtorsWork = [...debtors];

    while (creditorsWork.length > 0 && debtorsWork.length > 0) {
      const creditor = creditorsWork[0];
      const debtor = debtorsWork[0];

      const settlementAmount = Math.min(creditor.amount, debtor.amount);

      optimizedDebts.push({
        fromUserId: debtor.userId,
        toUserId: creditor.userId,
        amount: settlementAmount,
        reason: `Optimized settlement to minimize transactions`,
        savings: {
          reducedTransactions: 0, // Will be calculated later
          simplifiedAmount: settlementAmount
        }
      });

      // Update amounts
      creditor.amount -= settlementAmount;
      debtor.amount -= settlementAmount;

      // Remove if amount becomes 0
      if (creditor.amount === 0) {
        creditorsWork.shift();
      }
      if (debtor.amount === 0) {
        debtorsWork.shift();
      }
    }

    // Calculate savings
    const transactionReduction = allDebts.length - optimizedDebts.length;
    const complexityReduction = Math.round((transactionReduction / allDebts.length) * 100);

    return {
      currentSettlements: allDebts,
      optimizedSettlements: optimizedDebts,
      savings: {
        transactionReduction,
        complexityReduction,
        totalSavings: transactionReduction * 10 // Assume ₹10 per transaction saved
      }
    };
  };

  const analyzeOptimization = async () => {
    setIsAnalyzing(true);
    try {
      // For now, use local algorithm. Replace with API call later:
      // const response = await settlementService.getOptimizedSettlements(
      //   groupId, 
      //   memberBalances.map(b => b.user._id)
      // );
      // setOptimizationResult(response.data);

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      const result = optimizeSettlementsLocally(memberBalances);
      setOptimizationResult(result);

      toast({
        title: "Analysis Complete",
        description: `Found ${result.savings.transactionReduction} transactions that can be optimized`,
        className: "border-green-500/50 bg-green-500/10"
      });
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: "Unable to analyze settlements. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const applyOptimization = async () => {
    if (!optimizationResult) return;

    setIsApplying(true);
    try {
      // Apply optimized settlements
      const response = await settlementService.applySimplifiedSettlements({
        groupId,
        memberIds: memberBalances.map(b => b.user._id)
      });

      toast({
        title: "Optimization Applied! ✨",
        description: `Successfully reduced ${optimizationResult.savings.transactionReduction} transactions`,
        className: "border-green-500/50 bg-green-500/10",
        duration: 5000
      });

      onOptimizationApplied?.(optimizationResult);
      setOptimizationResult(null);
    } catch (error) {
      toast({
        title: "Failed to Apply Optimization",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsApplying(false);
    }
  };

  const getUserById = (userId: string) => {
    return memberBalances.find(b => b.user._id === userId)?.user;
  };

  const hasOptimizationPotential = () => {
    const totalDebts = memberBalances.reduce((sum, balance) => sum + balance.owesTo.length, 0);
    const nonSettledMembers = memberBalances.filter(b => b.netBalance !== 0).length;
    return totalDebts > nonSettledMembers - 1 && totalDebts > 2;
  };

  return (
    <div className="space-y-6">
      <Card className="glass-card border-primary/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Settlement Optimizer
            <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30">
              Smart Simplify
            </Badge>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Optimization Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-4 text-center">
                <Calculator className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">
                  {memberBalances.reduce((sum, b) => sum + b.owesTo.length, 0)}
                </div>
                <div className="text-sm text-white/60">Current Transactions</div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-4 text-center">
                <Users className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">
                  {memberBalances.filter(b => b.netBalance !== 0).length}
                </div>
                <div className="text-sm text-white/60">Active Members</div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-4 text-center">
                <TrendingDown className="w-8 h-8 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold text-primary">
                  {optimizationResult ? optimizationResult.savings.transactionReduction : '?'}
                </div>
                <div className="text-sm text-white/60">Potential Reduction</div>
              </CardContent>
            </Card>
          </div>

          {/* Optimization Status */}
          {!hasOptimizationPotential() ? (
            <Card className="bg-green-500/10 border-green-500/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                  <div>
                    <h4 className="font-medium text-green-400">Already Optimized!</h4>
                    <p className="text-white/70 text-sm">
                      Your group's settlements are already in their most efficient form.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : optimizationResult ? (
            <Card className="bg-primary/10 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Target className="w-6 h-6 text-primary" />
                    <div>
                      <h4 className="font-medium text-primary">Optimization Ready</h4>
                      <p className="text-white/70 text-sm">
                        We found a way to reduce complexity by {optimizationResult.savings.complexityReduction}%
                      </p>
                    </div>
                  </div>
                  <Award className="w-8 h-8 text-primary" />
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-xl font-bold text-red-400">
                      -{optimizationResult.savings.transactionReduction}
                    </div>
                    <div className="text-xs text-white/60">Transactions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-green-400">
                      {optimizationResult.savings.complexityReduction}%
                    </div>
                    <div className="text-xs text-white/60">Simpler</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-primary">
                      {formatCurrency(optimizationResult.savings.totalSavings)}
                    </div>
                    <div className="text-xs text-white/60">Estimated Savings</div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={applyOptimization}
                    disabled={isApplying}
                    className="flex-1 bg-gradient-to-r from-primary to-secondary text-white hover:from-primary/80 hover:to-secondary/80 transition-all duration-300"
                  >
                    {isApplying ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Applying...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        Apply Optimization
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowDetails(!showDetails)}
                    className="border-white/30 text-white hover:bg-white/10"
                  >
                    {showDetails ? 'Hide' : 'Show'} Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-yellow-500/10 border-yellow-500/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  <Lightbulb className="w-6 h-6 text-yellow-400" />
                  <div>
                    <h4 className="font-medium text-yellow-400">Optimization Available</h4>
                    <p className="text-white/70 text-sm">
                      Your group may benefit from settlement optimization.
                    </p>
                  </div>
                </div>
                
                <Button
                  onClick={analyzeOptimization}
                  disabled={isAnalyzing}
                  className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:from-yellow-600 hover:to-orange-600 transition-all duration-300"
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Calculator className="w-4 h-4 mr-2" />
                      Analyze Optimization
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Optimization Details */}
          {showDetails && optimizationResult && (
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-4">
                <h4 className="font-medium text-white mb-4 flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-primary" />
                  Optimization Preview
                </h4>

                <div className="space-y-4">
                  <div>
                    <h5 className="text-sm font-medium text-red-400 mb-2">
                      Current Settlements ({optimizationResult.currentSettlements.length})
                    </h5>
                    <div className="space-y-2">
                      {optimizationResult.currentSettlements.slice(0, 5).map((settlement, index) => {
                        const fromUser = getUserById(settlement.fromUserId);
                        const toUser = getUserById(settlement.toUserId);
                        
                        return (
                          <div key={index} className="flex items-center justify-between text-sm bg-red-500/10 p-2 rounded border border-red-500/20">
                            <div className="flex items-center gap-2">
                              <Avatar className="w-6 h-6">
                                <AvatarImage src={fromUser?.avatar?.url} />
                                <AvatarFallback className="bg-red-500/20 text-red-400 text-xs">
                                  {fromUser?.firstName.charAt(0)}{fromUser?.lastName.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <ArrowRight className="w-3 h-3 text-white/40" />
                              <Avatar className="w-6 h-6">
                                <AvatarImage src={toUser?.avatar?.url} />
                                <AvatarFallback className="bg-green-500/20 text-green-400 text-xs">
                                  {toUser?.firstName.charAt(0)}{toUser?.lastName.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-white/80">
                                {fromUser?.firstName} → {toUser?.firstName}
                              </span>
                            </div>
                            <span className="text-red-400 font-medium">
                              {formatCurrency(settlement.amount)}
                            </span>
                          </div>
                        );
                      })}
                      {optimizationResult.currentSettlements.length > 5 && (
                        <div className="text-center text-white/60 text-sm">
                          +{optimizationResult.currentSettlements.length - 5} more transactions
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator className="bg-white/10" />

                  <div>
                    <h5 className="text-sm font-medium text-green-400 mb-2">
                      Optimized Settlements ({optimizationResult.optimizedSettlements.length})
                    </h5>
                    <div className="space-y-2">
                      {optimizationResult.optimizedSettlements.map((settlement, index) => {
                        const fromUser = getUserById(settlement.fromUserId);
                        const toUser = getUserById(settlement.toUserId);
                        
                        return (
                          <div key={index} className="flex items-center justify-between text-sm bg-green-500/10 p-2 rounded border border-green-500/20">
                            <div className="flex items-center gap-2">
                              <Avatar className="w-6 h-6">
                                <AvatarImage src={fromUser?.avatar?.url} />
                                <AvatarFallback className="bg-red-500/20 text-red-400 text-xs">
                                  {fromUser?.firstName.charAt(0)}{fromUser?.lastName.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <ArrowRight className="w-3 h-3 text-white/40" />
                              <Avatar className="w-6 h-6">
                                <AvatarImage src={toUser?.avatar?.url} />
                                <AvatarFallback className="bg-green-500/20 text-green-400 text-xs">
                                  {toUser?.firstName.charAt(0)}{toUser?.lastName.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-white/80">
                                {fromUser?.firstName} → {toUser?.firstName}
                              </span>
                            </div>
                            <span className="text-green-400 font-medium">
                              {formatCurrency(settlement.amount)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <Card className="bg-primary/10 border-primary/20">
                    <CardContent className="p-3">
                      <div className="text-center">
                        <div className="text-lg font-bold text-primary mb-1">
                          {optimizationResult.savings.transactionReduction} fewer transactions
                        </div>
                        <div className="text-sm text-white/70">
                          Making settlements {optimizationResult.savings.complexityReduction}% simpler for everyone
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Info Card */}
          <Card className="bg-blue-500/5 border-blue-500/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-blue-400 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-medium text-blue-400">How Settlement Optimization Works</h4>
                  <p className="text-sm text-white/70">
                    Our algorithm analyzes all debts in your group and finds the minimum number of transactions 
                    needed to settle everyone. Instead of everyone paying individually, we create the most efficient 
                    payment routes that benefit the entire group.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettlementOptimizer;