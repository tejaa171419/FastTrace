import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { WalletData, WalletError } from '@/types/wallet';
import {
  Shield,
  Lock,
  Smartphone,
  CheckCircle,
  AlertTriangle,
  Settings,
  Key,
  Fingerprint,
  Phone,
  Mail,
  CreditCard,
  IdCard,
  FileText,
  ArrowRight,
  Edit
} from 'lucide-react';

interface SecuritySettingsProps {
  wallet?: WalletData;
  onRefresh?: () => void;
  onError?: (error: WalletError) => void;
}

const SecuritySettings: React.FC<SecuritySettingsProps> = ({
  wallet: walletProp,
  onRefresh = () => {},
  onError = () => {}
}) => {
  // Default wallet object for when no wallet is provided
  const defaultWallet = {
    id: '',
    balance: 0,
    formattedBalance: '₹0.00',
    currency: 'INR',
    status: 'active' as const,
    limits: {
      daily: { limit: 0, used: 0, remaining: 0 },
      monthly: { limit: 0, used: 0, remaining: 0 },
      perTransaction: 0
    },
    security: {
      pinSet: false,
      biometricEnabled: false,
      twoFactorEnabled: false
    },
    kyc: {
      status: 'not_started' as const,
      verificationLevel: 'basic' as const
    },
    rewards: {
      totalCashback: 0,
      pendingCashback: 0,
      loyaltyPoints: 0,
      tier: 'basic' as const
    },
    recentTransactions: [],
    statistics: {
      totalCredits: 0,
      totalDebits: 0,
      transactionCount: 0
    },
    createdAt: new Date().toISOString(),
    lastActivity: new Date().toISOString()
  };

  // Use provided wallet or default
  const wallet = walletProp || defaultWallet;
  const navigate = useNavigate();

  // Navigate to PIN setup page
  const handlePinSetup = () => {
    navigate('/wallet/set-pin', {
      state: { 
        changingPin: wallet.security.pinSet,
        returnTo: '/wallet'
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* Security Overview */}
      <Card className="bg-gradient-to-br from-blue-900/40 via-blue-800/40 to-blue-900/40 backdrop-blur-xl border border-blue-700/50 shadow-2xl">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-3 text-xl font-bold">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20">
              <Shield className="w-6 h-6" />
            </div>
            Security Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Security Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-gray-800/30 border border-gray-700/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-300 font-medium">Transaction PIN</span>
                <Badge variant={wallet.security.pinSet ? 'default' : 'destructive'} className="px-2 py-1">
                  {wallet.security.pinSet ? 'Set' : 'Not Set'}
                </Badge>
              </div>
              <p className="text-gray-400 text-sm">
                {wallet.security.pinSet 
                  ? 'Your transactions are secured with PIN' 
                  : 'Set a PIN to secure your transactions'
                }
              </p>
            </div>

            <div className="p-4 rounded-xl bg-gray-800/30 border border-gray-700/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-300 font-medium">Two-Factor Auth</span>
                <Badge variant={wallet.security.twoFactorEnabled ? 'default' : 'secondary'} className="px-2 py-1">
                  {wallet.security.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
              <p className="text-gray-400 text-sm">
                {wallet.security.twoFactorEnabled 
                  ? 'Extra security layer is active' 
                  : 'Add extra security to your account'
                }
              </p>
            </div>

            <div className="p-4 rounded-xl bg-gray-800/30 border border-gray-700/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-300 font-medium">Biometric Auth</span>
                <Badge variant={wallet.security.biometricEnabled ? 'default' : 'secondary'} className="px-2 py-1">
                  {wallet.security.biometricEnabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
              <p className="text-gray-400 text-sm">
                {wallet.security.biometricEnabled 
                  ? 'Fingerprint/Face ID is enabled' 
                  : 'Use biometrics for quick access'
                }
              </p>
            </div>
          </div>

          {/* Security Score */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/30">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-white font-semibold text-lg">Security Score</h4>
              <div className="text-3xl font-bold text-green-400">
                {wallet.security.pinSet && wallet.security.twoFactorEnabled && wallet.security.biometricEnabled 
                  ? '100%' 
                  : wallet.security.pinSet && wallet.security.twoFactorEnabled 
                  ? '80%' 
                  : wallet.security.pinSet 
                  ? '60%' 
                  : '20%'
                }
              </div>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-green-400 to-blue-500 h-3 rounded-full transition-all duration-500"
                style={{ 
                  width: wallet.security.pinSet && wallet.security.twoFactorEnabled && wallet.security.biometricEnabled 
                    ? '100%' 
                    : wallet.security.pinSet && wallet.security.twoFactorEnabled 
                    ? '80%' 
                    : wallet.security.pinSet 
                    ? '60%' 
                    : '20%'
                }}
              ></div>
            </div>
            <p className="text-gray-300 text-sm mt-2">
              {wallet.security.pinSet && wallet.security.twoFactorEnabled && wallet.security.biometricEnabled 
                ? 'Excellent security! All features enabled.' 
                : 'Improve your security by enabling more features below.'
              }
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PIN Management */}
        <Card className="bg-gradient-to-br from-gray-800/40 via-gray-900/40 to-black/40 backdrop-blur-xl border border-gray-700/50 shadow-xl">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-3">
              <Lock className="w-5 h-5" />
              Transaction PIN
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-800/30 border border-gray-700/50">
              <div>
                <p className="text-white font-semibold">PIN Status</p>
                <p className="text-gray-400 text-sm">
                  {wallet.security.pinSet ? 'PIN is set and secure' : 'No PIN configured'}
                </p>
              </div>
              <Badge variant={wallet.security.pinSet ? 'default' : 'destructive'}>
                {wallet.security.pinSet ? 'Active' : 'Inactive'}
              </Badge>
            </div>

            <Button
              onClick={handlePinSetup}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold h-11"
            >
              <Key className="w-4 h-4 mr-2" />
              {wallet.security.pinSet ? 'Change PIN' : 'Set PIN'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>

            {!wallet.security.pinSet && (
              <Alert className="border-yellow-500/50 bg-yellow-500/10">
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription className="text-yellow-100">
                  Set up a transaction PIN to enable transfers and secure payments. 
                  <button 
                    onClick={handlePinSetup}
                    className="underline font-medium ml-1 hover:text-yellow-50"
                  >
                    Set up now
                  </button>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Two-Factor Authentication */}
        <Card className="bg-gradient-to-br from-gray-800/40 via-gray-900/40 to-black/40 backdrop-blur-xl border border-gray-700/50 shadow-xl">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-3">
              <Smartphone className="w-5 h-5" />
              Two-Factor Authentication
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-800/30 border border-gray-700/50">
              <div>
                <p className="text-white font-semibold">2FA Status</p>
                <p className="text-gray-400 text-sm">
                  {wallet.security.twoFactorEnabled ? 'Extra security is enabled' : 'No additional security'}
                </p>
              </div>
              <Badge variant={wallet.security.twoFactorEnabled ? 'default' : 'secondary'}>
                {wallet.security.twoFactorEnabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>

            <div className="space-y-2">
              <Button variant="outline" className="w-full border-gray-700 text-gray-300 hover:bg-gray-800 justify-start">
                <Phone className="w-4 h-4 mr-2" />
                SMS Verification
              </Button>
              <Button variant="outline" className="w-full border-gray-700 text-gray-300 hover:bg-gray-800 justify-start">
                <Mail className="w-4 h-4 mr-2" />
                Email Verification
              </Button>
              <Button variant="outline" className="w-full border-gray-700 text-gray-300 hover:bg-gray-800 justify-start">
                <Smartphone className="w-4 h-4 mr-2" />
                Authenticator App
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Biometric Authentication */}
        <Card className="bg-gradient-to-br from-gray-800/40 via-gray-900/40 to-black/40 backdrop-blur-xl border border-gray-700/50 shadow-xl">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-3">
              <Fingerprint className="w-5 h-5" />
              Biometric Authentication
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-800/30 border border-gray-700/50">
              <div>
                <p className="text-white font-semibold">Biometric Status</p>
                <p className="text-gray-400 text-sm">
                  {wallet.security.biometricEnabled ? 'Fingerprint/Face ID enabled' : 'Quick biometric access disabled'}
                </p>
              </div>
              <Badge variant={wallet.security.biometricEnabled ? 'default' : 'secondary'}>
                {wallet.security.biometricEnabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>

            <Button
              variant="outline"
              className="w-full border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              <Fingerprint className="w-4 h-4 mr-2" />
              {wallet.security.biometricEnabled ? 'Manage Biometrics' : 'Enable Biometrics'}
            </Button>

            <p className="text-xs text-gray-500">
              Use your fingerprint or face to quickly access your wallet and authorize transactions.
            </p>
          </CardContent>
        </Card>

        {/* KYC Verification */}
        <Card className="bg-gradient-to-br from-gray-800/40 via-gray-900/40 to-black/40 backdrop-blur-xl border border-gray-700/50 shadow-xl">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-3">
              <IdCard className="w-5 h-5" />
              KYC Verification
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-800/30 border border-gray-700/50">
              <div>
                <p className="text-white font-semibold">Verification Level</p>
                <p className="text-gray-400 text-sm capitalize">
                  {wallet.kyc.verificationLevel} • {wallet.kyc.status}
                </p>
              </div>
              <Badge variant={wallet.kyc.status === 'verified' ? 'default' : 'secondary'}>
                {wallet.kyc.status}
              </Badge>
            </div>

            {wallet.kyc.status !== 'verified' && (
              <div className="space-y-2">
                <Button variant="outline" className="w-full border-gray-700 text-gray-300 hover:bg-gray-800 justify-start">
                  <IdCard className="w-4 h-4 mr-2" />
                  Upload Aadhaar Card
                </Button>
                <Button variant="outline" className="w-full border-gray-700 text-gray-300 hover:bg-gray-800 justify-start">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Upload PAN Card
                </Button>
                <Button variant="outline" className="w-full border-gray-700 text-gray-300 hover:bg-gray-800 justify-start">
                  <FileText className="w-4 h-4 mr-2" />
                  Bank Statement
                </Button>
              </div>
            )}

            {wallet.kyc.status === 'verified' && (
              <Alert className="border-green-500/50 bg-green-500/10">
                <CheckCircle className="w-4 h-4" />
                <AlertDescription className="text-green-100">
                  Your identity is verified. You can enjoy higher transaction limits and premium features.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SecuritySettings;