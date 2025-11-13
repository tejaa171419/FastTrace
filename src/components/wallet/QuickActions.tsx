import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { WalletData } from '@/types/wallet';
import {
  Plus,
  Send,
  Scan,
  Smartphone,
  CreditCard,
  Shield,
  QrCode,
  Zap,
  Users,
  Receipt,
  Settings,
  TrendingUp,
  Gift,
  History
} from 'lucide-react';

interface QuickActionsProps {
  wallet: WalletData;
  onAddMoney: () => void;
  onTransfer: () => void;
  onQRPayment: () => void;
  onSecurity: () => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({
  wallet,
  onAddMoney,
  onTransfer,
  onQRPayment,
  onSecurity
}) => {
  const navigate = useNavigate();
  // Primary actions (most commonly used)
  const primaryActions = [
    {
      id: 'add-money',
      icon: Plus,
      label: 'Add Money',
      description: 'Top up wallet',
      onClick: onAddMoney,
      color: 'bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
      badge: null,
      disabled: false
    },
    {
      id: 'transfer',
      icon: Send,
      label: 'Transfer',
      description: 'Send money',
      onClick: onTransfer,
      color: 'bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700',
      badge: !wallet.security.pinSet ? 'PIN Required' : null,
      disabled: !wallet.security.pinSet
    },
    {
      id: 'qr-payment',
      icon: QrCode,
      label: 'QR Pay',
      description: 'Scan & pay',
      onClick: onQRPayment,
      color: 'bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700',
      badge: null,
      disabled: !wallet.security.pinSet
    },
    {
      id: 'security',
      icon: Shield,
      label: 'Security',
      description: 'Manage settings',
      onClick: !wallet.security.pinSet ? () => navigate('/wallet/set-pin') : onSecurity,
      color: 'bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700',
      badge: !wallet.security.pinSet ? 'Setup' : null,
      disabled: false
    }
  ];

  // Secondary actions (additional features)
  const secondaryActions = [
    {
      id: 'upi-payment',
      icon: Smartphone,
      label: 'UPI Pay',
      description: 'Pay to UPI ID',
      onClick: () => {}, // Would implement UPI payment modal
      disabled: !wallet.security.pinSet
    },
    {
      id: 'bill-pay',
      icon: Receipt,
      label: 'Pay Bills',
      description: 'Utilities & more',
      onClick: () => {}, // Would implement bill payment
      disabled: false
    },
    {
      id: 'group-pay',
      icon: Users,
      label: 'Group Pay',
      description: 'Split expenses',
      onClick: () => {}, // Would navigate to group expenses
      disabled: false
    },
    {
      id: 'rewards',
      icon: Gift,
      label: 'Rewards',
      description: 'View cashback',
      onClick: () => {}, // Would show rewards tab
      badge: wallet.rewards.pendingCashback > 0 ? `₹${wallet.rewards.pendingCashback.toFixed(0)}` : null,
      disabled: false
    }
  ];

  // Render primary action button
  const renderPrimaryAction = (action: any) => (
    <div key={action.id} className="relative">
      <Button
        onClick={action.onClick}
        disabled={action.disabled}
        className={`
          w-full h-16 flex-col gap-1.5 text-white border-0 rounded-xl shadow-lg 
          hover:shadow-xl transition-all duration-200 
          disabled:opacity-50 disabled:cursor-not-allowed
          ${action.color}
        `}
      >
        <action.icon className="w-4 h-4" />
        <div className="text-center">
          <span className="text-xs font-medium block">{action.label}</span>
          <span className="text-xs opacity-80">{action.description}</span>
        </div>
      </Button>
      
      {action.badge && (
        <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1.5 py-0.5">
          {action.badge}
        </Badge>
      )}
    </div>
  );

  // Render secondary action button
  const renderSecondaryAction = (action: any) => (
    <div key={action.id} className="relative">
      <Button
        variant="outline"
        onClick={action.onClick}
        disabled={action.disabled}
        className="w-full h-12 flex items-center gap-2 border-gray-700 text-gray-300 hover:bg-gray-700/20 hover:border-gray-600 hover:text-white rounded-lg transition-all duration-200 disabled:opacity-50"
      >
        <div className="p-1.5 rounded bg-gray-800/50">
          <action.icon className="w-3 h-3" />
        </div>
        <div className="flex-1 text-left">
          <span className="text-xs font-medium block">{action.label}</span>
          <span className="text-xs text-gray-500">{action.description}</span>
        </div>
      </Button>
      
      {action.badge && (
        <Badge className="absolute -top-1 -right-1 bg-green-500 text-white text-xs px-1.5 py-0.5">
          {action.badge}
        </Badge>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Primary Quick Actions */}
      <Card className="bg-gradient-to-br from-gray-800/40 via-gray-900/40 to-black/40 backdrop-blur-xl border border-gray-700/50 shadow-xl">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-600/20">
              <Zap className="w-4 h-4 text-blue-400" />
            </div>
            <h3 className="text-white font-medium text-sm">Quick Actions</h3>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {primaryActions.map(renderPrimaryAction)}
          </div>
        </CardContent>
      </Card>

      {/* Secondary Actions */}
      <Card className="bg-gradient-to-br from-gray-800/30 via-gray-900/30 to-black/30 backdrop-blur-xl border border-gray-700/50 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-600/20">
              <Settings className="w-4 h-4 text-purple-400" />
            </div>
            <h3 className="text-white font-medium text-sm">More Actions</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {secondaryActions.slice(0, 4).map(renderSecondaryAction)}
          </div>
        </CardContent>
      </Card>

      {/* Balance-based Suggestions */}
      {wallet.balance < 500 && (
        <Card className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 backdrop-blur-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/20">
                <TrendingUp className="w-5 h-5 text-yellow-400" />
              </div>
              <div className="flex-1">
                <h4 className="text-yellow-300 font-semibold">Low Balance Alert</h4>
                <p className="text-yellow-200 text-sm">
                  Your wallet balance is low. Add money for seamless transactions.
                </p>
              </div>
              <Button
                size="sm"
                onClick={onAddMoney}
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
              >
                Add Money
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KYC Reminder */}
      {wallet.kyc.status !== 'verified' && (
        <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/30 backdrop-blur-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Shield className="w-5 h-5 text-blue-400" />
              </div>
              <div className="flex-1">
                <h4 className="text-blue-300 font-semibold">Complete KYC Verification</h4>
                <p className="text-blue-200 text-sm">
                  Unlock higher limits and premium features by completing your verification.
                </p>
              </div>
              <Button
                size="sm"
                onClick={onSecurity}
                className="bg-blue-500 hover:bg-blue-600 text-white font-semibold"
              >
                Verify Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security Reminder */}
      {!wallet.security.pinSet && (
        <Card className="bg-gradient-to-br from-red-500/10 to-pink-500/10 border border-red-500/30 backdrop-blur-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/20">
                <Shield className="w-5 h-5 text-red-400" />
              </div>
              <div className="flex-1">
                <h4 className="text-red-300 font-semibold">Set Transaction PIN</h4>
                <p className="text-red-200 text-sm">
                  Secure your wallet with a transaction PIN to enable transfers and payments.
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => navigate('/wallet/set-pin')}
                className="bg-red-500 hover:bg-red-600 text-white font-semibold"
              >
                Set PIN
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity Summary */}
      {wallet.statistics.transactionCount > 0 && (
        <Card className="bg-gradient-to-br from-gray-800/20 via-gray-900/20 to-black/20 backdrop-blur-xl border border-gray-700/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gray-700/50">
                  <History className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                  <h4 className="text-gray-300 font-semibold">Recent Activity</h4>
                  <p className="text-gray-400 text-sm">
                    {wallet.statistics.transactionCount} transactions this month
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <p className="text-gray-300 font-semibold">
                  ₹{(wallet.statistics.totalCredits - wallet.statistics.totalDebits).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">Net flow</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default QuickActions;