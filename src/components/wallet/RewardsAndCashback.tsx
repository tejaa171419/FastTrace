import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { walletAPI } from '@/lib/walletAPI';
import type { WalletData } from '@/types/wallet';
import {
  TrendingUp,
  Gift,
  Star,
  Crown,
  Zap,
  Clock,
  Trophy,
  Target,
  Sparkles,
  Award,
  ArrowUp,
  CheckCircle,
  Calendar,
  Coins,
  RotateCcw as History
} from 'lucide-react';

interface RewardsAndCashbackProps {
  wallet: WalletData;
  onRefresh: () => void;
}

const RewardsAndCashback: React.FC<RewardsAndCashbackProps> = ({
  wallet,
  onRefresh
}) => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Load rewards analytics
  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true);
        const data = await walletAPI.getWalletAnalytics();
        setAnalytics(data);
      } catch (error) {
        console.error('Failed to load analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, []);

  // Get tier configuration
  const getTierInfo = (tier: string) => {
    const tierConfig = {
      basic: {
        name: 'Basic',
        icon: Star,
        color: 'text-blue-400',
        bgColor: 'from-blue-500/20 to-blue-600/20',
        borderColor: 'border-blue-500/30',
        cashbackRate: '0.5%',
        minSpending: 0,
        nextTier: 'Silver',
        nextTierSpending: 20000,
        benefits: ['0.5% cashback on all transactions', 'Basic customer support', 'Standard transaction limits']
      },
      silver: {
        name: 'Silver',
        icon: Award,
        color: 'text-gray-400',
        bgColor: 'from-gray-400/20 to-gray-500/20',
        borderColor: 'border-gray-400/30',
        cashbackRate: '0.8%',
        minSpending: 20000,
        nextTier: 'Gold',
        nextTierSpending: 50000,
        benefits: ['0.8% cashback on all transactions', 'Priority customer support', 'Higher transaction limits', 'Exclusive offers']
      },
      gold: {
        name: 'Gold',
        icon: Crown,
        color: 'text-yellow-400',
        bgColor: 'from-yellow-400/20 to-yellow-500/20',
        borderColor: 'border-yellow-400/30',
        cashbackRate: '1.2%',
        minSpending: 50000,
        nextTier: 'Platinum',
        nextTierSpending: 100000,
        benefits: ['1.2% cashback on all transactions', '24/7 priority support', 'Premium transaction limits', 'Special dining offers', 'Travel benefits']
      },
      platinum: {
        name: 'Platinum',
        icon: Trophy,
        color: 'text-purple-400',
        bgColor: 'from-purple-400/20 to-purple-500/20',
        borderColor: 'border-purple-400/30',
        cashbackRate: '1.5%',
        minSpending: 100000,
        nextTier: null,
        nextTierSpending: null,
        benefits: ['1.5% cashback on all transactions', 'Dedicated relationship manager', 'Unlimited transaction limits', 'Luxury dining privileges', 'Premium travel benefits', 'Exclusive event invitations']
      }
    };

    return tierConfig[tier as keyof typeof tierConfig] || tierConfig.basic;
  };

  const tierInfo = getTierInfo(wallet.rewards.tier);
  const TierIcon = tierInfo.icon;

  // Calculate progress to next tier
  const getNextTierProgress = () => {
    if (!tierInfo.nextTier || !tierInfo.nextTierSpending) return 100;
    
    const currentSpending = wallet.statistics.monthlySpending || 0;
    const progress = (currentSpending / tierInfo.nextTierSpending) * 100;
    return Math.min(progress, 100);
  };

  const nextTierProgress = getNextTierProgress();

  // Mock cashback history data
  const cashbackHistory = [
    { date: '2024-01-15', amount: 25.50, description: 'Monthly cashback settlement', type: 'settlement' },
    { date: '2024-01-10', amount: 12.30, description: 'Food delivery cashback', type: 'transaction' },
    { date: '2024-01-08', amount: 8.75, description: 'Online shopping cashback', type: 'transaction' },
    { date: '2024-01-05', amount: 15.20, description: 'Fuel payment cashback', type: 'transaction' },
    { date: '2024-01-03', amount: 5.40, description: 'Utility bill cashback', type: 'transaction' }
  ];

  return (
    <div className="space-y-8">
      {/* Tier Status Card */}
      <Card className={`bg-gradient-to-br ${tierInfo.bgColor} backdrop-blur-xl border ${tierInfo.borderColor} shadow-2xl`}>
        <CardContent className="p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-2xl bg-gradient-to-br ${tierInfo.bgColor} border ${tierInfo.borderColor}`}>
                <TierIcon className={`w-8 h-8 ${tierInfo.color}`} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{tierInfo.name} Member</h2>
                <p className="text-gray-300">Earning {tierInfo.cashbackRate} cashback on all transactions</p>
              </div>
            </div>
            <Badge className={`${tierInfo.bgColor} ${tierInfo.borderColor} ${tierInfo.color} px-4 py-2 text-lg font-bold border`}>
              {tierInfo.name.toUpperCase()}
            </Badge>
          </div>

          {/* Next Tier Progress */}
          {tierInfo.nextTier && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-white font-semibold">Progress to {tierInfo.nextTier}</span>
                <span className="text-white font-semibold">
                  ₹{(wallet.statistics.monthlySpending || 0).toLocaleString()} / ₹{tierInfo.nextTierSpending!.toLocaleString()}
                </span>
              </div>
              <div className="relative">
                <Progress value={nextTierProgress} className="h-4 bg-gray-800" />
                <div 
                  className={`absolute inset-0 rounded-full bg-gradient-to-r ${tierInfo.bgColor.replace('/20', '/80')}`}
                  style={{ width: `${nextTierProgress}%` }}
                ></div>
              </div>
              <p className="text-gray-300 text-sm">
                {tierInfo.nextTierSpending! - (wallet.statistics.monthlySpending || 0) > 0 
                  ? `Spend ₹${(tierInfo.nextTierSpending! - (wallet.statistics.monthlySpending || 0)).toLocaleString()} more this month to reach ${tierInfo.nextTier}`
                  : `Congratulations! You've reached ${tierInfo.nextTier} tier requirements!`
                }
              </p>
            </div>
          )}

          {tierInfo.nextTier === null && (
            <Alert className="border-purple-500/50 bg-purple-500/10">
              <Trophy className="w-4 h-4" />
              <AlertDescription className="text-purple-100">
                🎉 You've reached the highest tier! Enjoy all premium benefits and exclusive privileges.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Rewards Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-green-900/40 via-green-800/40 to-green-900/40 backdrop-blur-xl border border-green-700/50 shadow-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-white text-xl font-bold flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-green-400" />
              Total Cashback
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-4xl font-extrabold text-green-400">
                ₹{wallet.rewards.totalCashback.toFixed(2)}
              </p>
              <p className="text-green-200 text-sm">Lifetime earnings</p>
              <div className="flex items-center gap-2 text-xs text-green-300">
                <ArrowUp className="w-3 h-3" />
                <span>+₹{(wallet.rewards.totalCashback * 0.15).toFixed(2)} this month</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-900/40 via-yellow-800/40 to-yellow-900/40 backdrop-blur-xl border border-yellow-700/50 shadow-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-white text-xl font-bold flex items-center gap-2">
              <Clock className="w-6 h-6 text-yellow-400" />
              Pending Cashback
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-4xl font-extrabold text-yellow-400">
                ₹{wallet.rewards.pendingCashback.toFixed(2)}
              </p>
              <p className="text-yellow-200 text-sm">Will be credited soon</p>
              <div className="flex items-center gap-2 text-xs text-yellow-300">
                <Calendar className="w-3 h-3" />
                <span>Settlement on 1st of next month</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-900/40 via-purple-800/40 to-purple-900/40 backdrop-blur-xl border border-purple-700/50 shadow-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-white text-xl font-bold flex items-center gap-2">
              <Coins className="w-6 h-6 text-purple-400" />
              Loyalty Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-4xl font-extrabold text-purple-400">
                {wallet.rewards.loyaltyPoints}
              </p>
              <p className="text-purple-200 text-sm">Redeem for rewards</p>
              <Button 
                size="sm" 
                className="bg-purple-500 hover:bg-purple-600 text-white text-xs"
                disabled={wallet.rewards.loyaltyPoints < 100}
              >
                Redeem Points
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tier Benefits */}
      <Card className="bg-gradient-to-br from-gray-800/40 via-gray-900/40 to-black/40 backdrop-blur-xl border border-gray-700/50 shadow-2xl">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-3 text-2xl font-bold">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-600/20">
              <Gift className="w-6 h-6" />
            </div>
            {tierInfo.name} Benefits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tierInfo.benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/30 border border-gray-700/30">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                <span className="text-gray-300">{benefit}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cashback History */}
      <Card className="bg-gradient-to-br from-gray-800/40 via-gray-900/40 to-black/40 backdrop-blur-xl border border-gray-700/50 shadow-2xl">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-3 text-2xl font-bold">
            <div className="p-2 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-600/20">
              <History className="w-6 h-6" />
            </div>
            Recent Cashback
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {cashbackHistory.map((cashback, index) => (
              <div key={index} className="flex items-center gap-4 p-4 rounded-xl border border-gray-700/50 hover:bg-gray-700/20 transition-all duration-200">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  cashback.type === 'settlement' 
                    ? 'bg-green-500/20 border border-green-500/30' 
                    : 'bg-blue-500/20 border border-blue-500/30'
                }`}>
                  {cashback.type === 'settlement' ? (
                    <Zap className="w-6 h-6 text-green-400" />
                  ) : (
                    <Gift className="w-6 h-6 text-blue-400" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-white">{cashback.description}</p>
                  <p className="text-gray-400 text-sm">
                    {new Date(cashback.date).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg text-green-400">
                    +₹{cashback.amount.toFixed(2)}
                  </p>
                  <Badge variant="outline" className="text-xs border-green-500/30 text-green-400">
                    Cashback
                  </Badge>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center pt-4">
            <Button variant="link" className="text-blue-400 hover:text-blue-300">
              View All Cashback History →
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Cashback Calculator */}
      <Card className="bg-gradient-to-br from-blue-900/40 via-blue-800/40 to-blue-900/40 backdrop-blur-xl border border-blue-700/50 shadow-2xl">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-3 text-2xl font-bold">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20">
              <Target className="w-6 h-6" />
            </div>
            Cashback Calculator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-gray-800/30 border border-gray-700/30 text-center">
              <p className="text-gray-400 text-sm mb-1">If you spend</p>
              <p className="text-white font-bold text-lg">₹1,000</p>
              <p className="text-blue-400 font-semibold">Earn ₹{(1000 * parseFloat(tierInfo.cashbackRate) / 100).toFixed(2)}</p>
            </div>
            <div className="p-4 rounded-xl bg-gray-800/30 border border-gray-700/30 text-center">
              <p className="text-gray-400 text-sm mb-1">If you spend</p>
              <p className="text-white font-bold text-lg">₹5,000</p>
              <p className="text-blue-400 font-semibold">Earn ₹{(5000 * parseFloat(tierInfo.cashbackRate) / 100).toFixed(2)}</p>
            </div>
            <div className="p-4 rounded-xl bg-gray-800/30 border border-gray-700/30 text-center">
              <p className="text-gray-400 text-sm mb-1">If you spend</p>
              <p className="text-white font-bold text-lg">₹10,000</p>
              <p className="text-blue-400 font-semibold">Earn ₹{(10000 * parseFloat(tierInfo.cashbackRate) / 100).toFixed(2)}</p>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 text-center">
              <p className="text-green-300 text-sm mb-1">Monthly potential</p>
              <p className="text-white font-bold text-lg">₹20,000</p>
              <p className="text-green-400 font-semibold">Earn ₹{(20000 * parseFloat(tierInfo.cashbackRate) / 100).toFixed(2)}</p>
            </div>
          </div>
          
          <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <div>
                <p className="text-purple-300 font-semibold">Bonus Tip</p>
                <p className="text-purple-200 text-sm">
                  Use your ZenithWallet for all transactions to maximize cashback earnings and reach the next tier faster!
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RewardsAndCashback;