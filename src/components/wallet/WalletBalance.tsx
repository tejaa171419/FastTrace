import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { WalletData } from '@/types/wallet';
import {
  WalletIcon,
  TrendingUp,
  AlertTriangle,
  Plus,
  Send,
  Shield,
  Eye,
  EyeOff,
  Sparkles,
  Lock
} from 'lucide-react';

interface WalletBalanceProps {
  wallet: WalletData;
  showBalance: boolean;
  onAddMoney: () => void;
  onTransfer: () => void;
  onSecuritySettings: () => void;
}

const WalletBalance: React.FC<WalletBalanceProps> = ({
  wallet,
  showBalance,
  onAddMoney,
  onTransfer,
  onSecuritySettings
}) => {
  const [animatedBalance, setAnimatedBalance] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Animate balance changes
  useEffect(() => {
    if (showBalance && wallet.balance !== animatedBalance) {
      setIsAnimating(true);
      const difference = wallet.balance - animatedBalance;
      const steps = 20;
      const stepValue = difference / steps;
      let currentStep = 0;

      const interval = setInterval(() => {
        currentStep++;
        setAnimatedBalance(prev => prev + stepValue);
        
        if (currentStep >= steps) {
          setAnimatedBalance(wallet.balance);
          setIsAnimating(false);
          clearInterval(interval);
        }
      }, 50);

      return () => clearInterval(interval);
    }
  }, [wallet.balance, animatedBalance, showBalance]);

  // Get tier colors and benefits
  const getTierStyles = (tier: string) => {
    switch (tier) {
      case 'platinum':
        return {
          gradient: 'from-purple-500 via-pink-500 to-purple-600',
          bg: 'bg-purple-500/20',
          border: 'border-purple-500/30',
          text: 'text-purple-400',
          icon: '💎'
        };
      case 'gold':
        return {
          gradient: 'from-yellow-400 via-yellow-500 to-amber-500',
          bg: 'bg-yellow-500/20',
          border: 'border-yellow-500/30',
          text: 'text-yellow-400',
          icon: '👑'
        };
      case 'silver':
        return {
          gradient: 'from-gray-400 via-gray-500 to-gray-600',
          bg: 'bg-gray-500/20',
          border: 'border-gray-500/30',
          text: 'text-gray-400',
          icon: '⭐'
        };
      default:
        return {
          gradient: 'from-blue-400 via-blue-500 to-blue-600',
          bg: 'bg-blue-500/20',
          border: 'border-blue-500/30',
          text: 'text-blue-400',
          icon: '🌟'
        };
    }
  };

  const tierStyles = getTierStyles(wallet.rewards.tier);

  // Calculate progress percentages
  const dailyProgress = (wallet.limits.daily.used / wallet.limits.daily.limit) * 100;
  const monthlyProgress = (wallet.limits.monthly.used / wallet.limits.monthly.limit) * 100;

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-gray-800/50 via-gray-900/50 to-black/50 backdrop-blur-xl border border-gray-700/50 shadow-2xl">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10"></div>
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-transparent rounded-full blur-2xl"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-500/20 to-transparent rounded-full blur-2xl"></div>

      <CardContent className="relative p-8">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-600/20 backdrop-blur-sm border border-white/10">
              <WalletIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-gray-300 text-lg font-medium">Wallet Balance</p>
              <div className="flex items-center gap-3 mt-1">
                <Badge className={`${tierStyles.bg} ${tierStyles.border} ${tierStyles.text} text-sm px-3 py-1 font-semibold border`}>
                  {tierStyles.icon} {wallet.rewards.tier.toUpperCase()}
                </Badge>
                <Badge variant="outline" className="text-xs text-gray-400 border-gray-600">
                  {wallet.status.toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>
          
          {/* Account Status Indicators */}
          <div className="flex items-center gap-2">
            {wallet.security.pinSet && (
              <div className="p-2 rounded-lg bg-green-500/20 border border-green-500/30">
                <Lock className="w-4 h-4 text-green-400" />
              </div>
            )}
            {wallet.kyc.status === 'verified' && (
              <div className="p-2 rounded-lg bg-blue-500/20 border border-blue-500/30">
                <Shield className="w-4 h-4 text-blue-400" />
              </div>
            )}
          </div>
        </div>

        {/* Balance Display */}
        <div className="text-center mb-6">
          <div className="relative inline-block">
            <p className={`text-4xl md:text-5xl font-bold mb-3 tracking-tight transition-all duration-500 ${
              isAnimating ? 'scale-105' : 'scale-100'
            }`}>
              <span className="bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
                {showBalance 
                  ? `₹${animatedBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` 
                  : "••••••••"
                }
              </span>
            </p>
            {isAnimating && (
              <div className="absolute -inset-3 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-xl blur-lg"></div>
            )}
          </div>
          
          {/* Available Balance & Pending */}
          <div className="flex items-center justify-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/20 border border-green-500/30">
              <TrendingUp className="w-3 h-3 text-green-400" />
              <span className="text-green-300 font-medium">
                Available: ₹{(wallet.availableBalance || wallet.balance).toLocaleString('en-IN')}
              </span>
            </div>
            {wallet.rewards.totalCashback > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/20 border border-purple-500/30">
                <Sparkles className="w-3 h-3 text-purple-400" />
                <span className="text-purple-300 font-medium">
                  Cashback: ₹{wallet.rewards.totalCashback.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* KYC Status Alert */}
        {wallet.kyc.status !== 'verified' && (
          <Alert className="mb-6 border-yellow-500/50 bg-yellow-500/10 text-yellow-100">
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription>
              <span className="font-medium">KYC Verification Required:</span> Complete your identity verification to unlock higher transaction limits and premium features.
              <Button 
                variant="link" 
                className="p-0 h-auto text-yellow-300 hover:text-yellow-200 ml-2"
                onClick={onSecuritySettings}
              >
                Verify Now →
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Compact Quick Action Buttons */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Button 
            onClick={onAddMoney}
            className="h-14 flex-col gap-1.5 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            <span className="text-xs font-medium">Add Money</span>
          </Button>
          
          <Button 
            onClick={onTransfer}
            disabled={!wallet.security.pinSet}
            className="h-14 flex-col gap-1.5 bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white border-0 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            <span className="text-xs font-medium">
              {wallet.security.pinSet ? 'Transfer' : 'Set PIN'}
            </span>
          </Button>

          <Button 
            onClick={onSecuritySettings}
            className="h-14 flex-col gap-1.5 bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white border-0 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Shield className="w-4 h-4" />
            <span className="text-xs font-medium">Security</span>
          </Button>
        </div>

        {/* Compact Spending Limits */}
        <div className="space-y-4 p-4 rounded-xl bg-gradient-to-r from-gray-800/30 to-gray-900/30 backdrop-blur-sm border border-gray-700/50">
          <h3 className="text-white font-medium text-sm mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Spending Limits
          </h3>
          
          {/* Daily Limit */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-300 text-xs">Daily Spending</span>
              <span className="text-white font-medium text-xs">
                ₹{wallet.limits.daily.used.toLocaleString()} / ₹{wallet.limits.daily.limit.toLocaleString()}
              </span>
            </div>
            <Progress 
              value={dailyProgress} 
              className="h-2 bg-gray-800"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>{dailyProgress.toFixed(0)}% used</span>
              <span>₹{wallet.limits.daily.remaining.toLocaleString()} left</span>
            </div>
          </div>

          {/* Monthly Limit */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-300 text-xs">Monthly Spending</span>
              <span className="text-white font-medium text-xs">
                ₹{wallet.limits.monthly.used.toLocaleString()} / ₹{wallet.limits.monthly.limit.toLocaleString()}
              </span>
            </div>
            <Progress 
              value={monthlyProgress} 
              className="h-2 bg-gray-800"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>{monthlyProgress.toFixed(0)}% used</span>
              <span>₹{wallet.limits.monthly.remaining.toLocaleString()} left</span>
            </div>
          </div>

          {/* Transaction Limit */}
          <div className="flex justify-between items-center p-3 rounded-lg bg-gray-800/50 border border-gray-700/30">
            <span className="text-gray-300 text-xs">Per Transaction</span>
            <span className="text-white font-medium text-xs">
              ₹{wallet.limits.perTransaction.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Rewards Preview */}
        {wallet.rewards.pendingCashback > 0 && (
          <div className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-green-400" />
                <div>
                  <p className="text-green-300 font-semibold">Pending Cashback</p>
                  <p className="text-green-200 text-sm">Will be credited soon</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-green-400">
                ₹{wallet.rewards.pendingCashback.toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WalletBalance;