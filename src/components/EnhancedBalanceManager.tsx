import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  ArrowUpDown, 
  DollarSign, 
  Users, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Send, 
  Loader2,
  ArrowRight,
  ArrowLeft,
  Wallet,
  Receipt,
  Target,
  Zap,
  Info,
  Star,
  CreditCard
} from 'lucide-react';
import { useBalances, useRecordSettlement } from '@/hooks/useBalances';
import { useGroup } from '@/hooks/useGroups';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface EnhancedBalanceManagerProps {
  groupId: string;
}

// Enhanced Balance Card Component
const BalanceCard = ({ balance, onSettle }) => {
  const getRelationshipConfig = (relationship) => {
    switch (relationship) {
      case 'needs_to_pay':
        return {
          icon: ArrowUpDown,
          color: 'text-red-400',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/20',
          actionText: 'Pay Back',
          actionColor: 'bg-red-500 hover:bg-red-600',
          priority: 'high'
        };
      case 'gets_back':
        return {
          icon: TrendingUp,
          color: 'text-green-400',
          bgColor: 'bg-green-500/10',
          borderColor: 'border-green-500/20',
          actionText: 'Request Payment',
          actionColor: 'bg-green-500 hover:bg-green-600',
          priority: 'medium'
        };
      default:
        return {
          icon: CheckCircle,
          color: 'text-gray-400',
          bgColor: 'bg-gray-500/10',
          borderColor: 'border-gray-500/20',
          actionText: 'Settled',
          actionColor: 'bg-gray-500',
          priority: 'low'
        };
    }
  };

  const config = getRelationshipConfig(balance.relationship);
  const Icon = config.icon;

  return (
    <Card className={`glass-card border ${config.borderColor} hover:shadow-glow transition-all duration-300 transform hover:scale-[1.02]`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-full ${config.bgColor}`}>
              <Icon className={`w-5 h-5 ${config.color}`} />
            </div>
            
            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12 ring-2 ring-white/20">
                <AvatarImage src={balance.otherUser.avatar} alt={balance.otherUser.firstName} />
                <AvatarFallback className="bg-primary/20 text-white font-semibold">
                  {balance.otherUser.firstName?.charAt(0)}{balance.otherUser.lastName?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              
              <div>
                <h4 className="font-semibold text-white text-lg">
                  {balance.otherUser.firstName} {balance.otherUser.lastName}
                </h4>
                <p className="text-sm text-white/60">{balance.relationshipText}</p>
                <Badge variant="outline" className={`mt-1 ${config.color} border-current`}>
                  {balance.displayText}
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className={`text-2xl font-bold ${config.color} mb-2`}>
              ₹{balance.amount.toFixed(2)}
            </div>
            
            {!balance.isSettled && (
              <Button
                size="sm"
                className={`${config.actionColor} text-white`}
                onClick={() => onSettle(balance)}
              >
                <Send className="w-4 h-4 mr-2" />
                {config.actionText}
              </Button>
            )}
            
            {balance.isSettled && (
              <div className="flex items-center gap-1 text-green-400">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Settled</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Enhanced Settlement Suggestion Card
const SettlementSuggestionCard = ({ suggestion, onExecute, index }) => {
  const getPriorityConfig = (priority) => {
    switch (priority) {
      case 'high':
        return {
          color: 'text-red-400',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/30',
          icon: AlertTriangle,
          label: 'High Priority'
        };
      case 'medium':
        return {
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-500/10',
          borderColor: 'border-yellow-500/30',
          icon: Clock,
          label: 'Medium Priority'
        };
      default:
        return {
          color: 'text-blue-400',
          bgColor: 'bg-blue-500/10',
          borderColor: 'border-blue-500/30',
          icon: Info,
          label: 'Low Priority'
        };
    }
  };

  const config = getPriorityConfig(suggestion.priority);
  const PriorityIcon = config.icon;

  return (
    <Card 
      className={`glass-card border ${config.borderColor} hover:shadow-glow transition-all duration-300`}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <Badge variant="outline" className={`${config.color} border-current flex items-center gap-1`}>
            <PriorityIcon className="w-3 h-3" />
            {config.label}
          </Badge>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <div className="flex items-center gap-1 text-white/60">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">~2 min</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Estimated time to complete this settlement</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* From User */}
            <div className="flex items-center gap-2">
              <Avatar className="w-10 h-10">
                <AvatarImage src={suggestion.fromUser.avatar} />
                <AvatarFallback className="bg-red-500/20 text-red-400 text-sm">
                  {suggestion.fromUser.firstName?.charAt(0)}{suggestion.fromUser.lastName?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <span className="text-white font-medium text-sm">
                  {suggestion.fromUser.firstName}
                </span>
                <p className="text-xs text-white/60">Pays</p>
              </div>
            </div>
            
            {/* Arrow */}
            <div className="flex flex-col items-center">
              <ArrowRight className="w-5 h-5 text-primary mb-1" />
              <div className="text-xs text-white/60">₹{suggestion.amount.toFixed(2)}</div>
            </div>
            
            {/* To User */}
            <div className="flex items-center gap-2">
              <Avatar className="w-10 h-10">
                <AvatarImage src={suggestion.toUser.avatar} />
                <AvatarFallback className="bg-green-500/20 text-green-400 text-sm">
                  {suggestion.toUser.firstName?.charAt(0)}{suggestion.toUser.lastName?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <span className="text-white font-medium text-sm">
                  {suggestion.toUser.firstName}
                </span>
                <p className="text-xs text-white/60">Receives</p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <div className="text-xl font-bold text-primary">
              ₹{suggestion.amount.toFixed(2)}
            </div>
            
            <Button
              size="sm"
              className="bg-primary/20 text-primary hover:bg-primary hover:text-white transition-all duration-200"
              onClick={() => onExecute(suggestion)}
            >
              <Zap className="w-4 h-4 mr-1" />
              Execute
            </Button>
          </div>
        </div>
        
        <div className="mt-4">
          <p className="text-sm text-white/70">{suggestion.friendlyDescription}</p>
          {suggestion.statusMessage && (
            <p className="text-xs text-white/50 mt-1">{suggestion.statusMessage}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Enhanced Group Balance Summary
const GroupBalanceSummaryCard = ({ summary, optimization }) => {
  return (
    <Card className="glass-card bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 border-white/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Group Balance Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400 mb-1">
              ₹{summary.totalGetsBack?.toFixed(2) || '0.00'}
            </div>
            <p className="text-sm text-white/60">Total Gets Back</p>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-red-400 mb-1">
              ₹{summary.totalNeedsToPay?.toFixed(2) || '0.00'}
            </div>
            <p className="text-sm text-white/60">Total Needs to Pay</p>
          </div>
          
          <div className="text-center">
            <div className={`text-2xl font-bold mb-1 ${
              summary.netBalance > 0 ? 'text-green-400' : 
              summary.netBalance < 0 ? 'text-red-400' : 'text-gray-400'
            }`}>
              ₹{Math.abs(summary.netBalance || 0).toFixed(2)}
            </div>
            <p className="text-sm text-white/60">
              Net {summary.netBalance > 0 ? 'Gets Back' : summary.netBalance < 0 ? 'Needs to Pay' : 'Balanced'}
            </p>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-primary mb-1">
              {summary.memberCount || 0}
            </div>
            <p className="text-sm text-white/60">Active Members</p>
          </div>
        </div>
        
        {optimization && (
          <div className="border-t border-white/10 pt-4">
            <h4 className="text-white font-medium mb-3 flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Settlement Optimization
            </h4>
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-red-400">
                  {optimization.originalTransactions}
                </div>
                <p className="text-xs text-white/60">Original Payments</p>
              </div>
              
              <div>
                <div className="text-lg font-bold text-primary">
                  {optimization.optimizedTransactions}
                </div>
                <p className="text-xs text-white/60">Optimized Payments</p>
              </div>
              
              <div>
                <div className="text-lg font-bold text-green-400">
                  {optimization.savingsPercentage}%
                </div>
                <p className="text-xs text-white/60">Reduction</p>
              </div>
            </div>
            
            {optimization.savingsPercentage > 0 && (
              <div className="mt-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <p className="text-sm text-green-400 text-center">
                  🎉 You're saving {optimization.transactionReduction} transactions with our smart optimization!
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Main Enhanced Balance Manager Component
export const EnhancedBalanceManager: React.FC<EnhancedBalanceManagerProps> = ({ groupId }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('balances');
  const [isSettleDialogOpen, setIsSettleDialogOpen] = useState(false);
  const [selectedBalance, setSelectedBalance] = useState(null);

  // API hooks
  const { data: groupData, isLoading: groupLoading } = useGroup(groupId);
  const { data: balancesData, isLoading: balancesLoading } = useBalances({ groupId });
  const createSettlementMutation = useRecordSettlement();

  // Extract data
  const group = groupData?.group;
  const balances = balancesData?.balances || [];
  const summary = balancesData?.summary || {};
  
  // Mock settlement suggestions data (in real app, this would come from API)
  const [settlementSuggestions] = useState([
    {
      fromUser: { firstName: 'Alice', lastName: 'Johnson', avatar: null },
      toUser: { firstName: 'Bob', lastName: 'Smith', avatar: null },
      amount: 150.75,
      priority: 'high',
      friendlyDescription: 'Alice pays back Bob - Optimized settlement',
      statusMessage: 'High Priority - Large Amount'
    },
    {
      fromUser: { firstName: 'Charlie', lastName: 'Brown', avatar: null },
      toUser: { firstName: 'Alice', lastName: 'Johnson', avatar: null },
      amount: 45.25,
      priority: 'medium',
      friendlyDescription: 'Charlie pays back Alice - Optimized settlement',
      statusMessage: 'Medium Priority'
    }
  ]);

  const mockOptimization = {
    originalTransactions: 6,
    optimizedTransactions: 2,
    transactionReduction: 4,
    savingsPercentage: 67
  };

  const handleSettle = (balance) => {
    setSelectedBalance(balance);
    setIsSettleDialogOpen(true);
  };

  const handleExecuteSuggestion = (suggestion) => {
    toast({
      title: 'Settlement Executed! 💰',
      description: `${suggestion.fromUser.firstName} paid ₹${suggestion.amount.toFixed(2)} to ${suggestion.toUser.firstName}`
    });
  };

  if (groupLoading || balancesLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin mr-3 text-primary" />
        <span className="text-white/60 text-lg">Loading enhanced balance data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            <Wallet className="w-8 h-8 text-primary" />
            Smart Balance Manager
          </h2>
          <p className="text-white/60 mt-2">AI-powered settlement suggestions and balance optimization</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant={activeTab === 'balances' ? 'default' : 'outline'}
            onClick={() => setActiveTab('balances')}
            className="border-white/20 text-white"
          >
            Current Balances
          </Button>
          <Button
            variant={activeTab === 'suggestions' ? 'default' : 'outline'}
            onClick={() => setActiveTab('suggestions')}
            className="border-white/20 text-white"
          >
            Smart Suggestions
          </Button>
        </div>
      </div>

      {/* Group Summary */}
      <GroupBalanceSummaryCard summary={summary} optimization={mockOptimization} />

      {/* Main Content */}
      {activeTab === 'balances' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-white">Individual Balances</h3>
            <Badge className="bg-primary/20 text-primary border-primary/30">
              {balances.length} relationships
            </Badge>
          </div>
          
          {balances.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="text-center py-12">
                <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">All Settled! 🎉</h3>
                <p className="text-white/60">Everyone is even - no outstanding balances.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {balances.map((balance, index) => (
                <BalanceCard
                  key={balance.id}
                  balance={balance}
                  onSettle={handleSettle}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'suggestions' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <Star className="w-5 h-5 text-primary" />
                AI Settlement Suggestions
              </h3>
              <p className="text-white/60 mt-1">Optimized payment plan to minimize transactions</p>
            </div>
            
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
              {mockOptimization.savingsPercentage}% fewer payments
            </Badge>
          </div>
          
          {settlementSuggestions.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="text-center py-12">
                <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">No Settlements Needed! ✨</h3>
                <p className="text-white/60">All balances are settled - everyone is even.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {settlementSuggestions.map((suggestion, index) => (
                <SettlementSuggestionCard
                  key={index}
                  suggestion={suggestion}
                  onExecute={handleExecuteSuggestion}
                  index={index}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EnhancedBalanceManager;