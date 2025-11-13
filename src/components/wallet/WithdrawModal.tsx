import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Banknote,
  CreditCard,
  University,
  Clock,
  Shield,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowRight,
  X,
  Plus,
  Star,
  AlertTriangle,
  Info,
  History
} from 'lucide-react';

interface BankAccount {
  id: string;
  accountNumber: string;
  ifscCode: string;
  accountHolderName: string;
  bankName: string;
  accountType: 'savings' | 'current';
  isVerified: boolean;
  isDefault: boolean;
  addedDate: string;
}

interface WithdrawMethod {
  id: string;
  name: string;
  icon: any;
  processingTime: string;
  charges: number;
  minAmount: number;
  maxAmount: number;
  description: string;
  isAvailable: boolean;
}

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WithdrawModal: React.FC<WithdrawModalProps> = ({ isOpen, onClose }) => {
  const [withdrawStep, setWithdrawStep] = useState<'method' | 'account' | 'amount' | 'pin' | 'processing' | 'success' | 'failed'>('method');
  const [selectedMethod, setSelectedMethod] = useState<WithdrawMethod | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [pin, setPin] = useState('');
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [showAddAccount, setShowAddAccount] = useState(false);
  
  // New account form
  const [newAccountNumber, setNewAccountNumber] = useState('');
  const [newIfscCode, setNewIfscCode] = useState('');
  const [newAccountHolderName, setNewAccountHolderName] = useState('');
  const [newBankName, setNewBankName] = useState('');
  const [newAccountType, setNewAccountType] = useState<'savings' | 'current'>('savings');

  const withdrawMethods: WithdrawMethod[] = [
    {
      id: 'instant',
      name: 'Instant Transfer',
      icon: Banknote,
      processingTime: 'Instant',
      charges: 5,
      minAmount: 100,
      maxAmount: 50000,
      description: 'Transfer to your bank account instantly',
      isAvailable: true
    },
    {
      id: 'imps',
      name: 'IMPS Transfer',
      icon: CreditCard,
      processingTime: '1-2 hours',
      charges: 2,
      minAmount: 100,
      maxAmount: 200000,
      description: 'Immediate Payment Service',
      isAvailable: true
    },
    {
      id: 'neft',
      name: 'NEFT Transfer',
      icon: University,
      processingTime: '2-4 hours',
      charges: 0,
      minAmount: 100,
      maxAmount: 1000000,
      description: 'National Electronic Funds Transfer',
      isAvailable: true
    }
  ];

  const currentBalance = 25000; // Mock wallet balance

  useEffect(() => {
    if (isOpen) {
      // Load saved bank accounts
      setBankAccounts([
        {
          id: '1',
          accountNumber: '1234567890',
          ifscCode: 'HDFC0000123',
          accountHolderName: 'John Doe',
          bankName: 'HDFC Bank',
          accountType: 'savings',
          isVerified: true,
          isDefault: true,
          addedDate: '2024-01-15'
        },
        {
          id: '2',
          accountNumber: '9876543210',
          ifscCode: 'ICIC0000456',
          accountHolderName: 'John Doe',
          bankName: 'ICICI Bank',
          accountType: 'current',
          isVerified: true,
          isDefault: false,
          addedDate: '2024-01-10'
        }
      ]);
    }
  }, [isOpen]);

  const resetModal = () => {
    setWithdrawStep('method');
    setSelectedMethod(null);
    setSelectedAccount(null);
    setWithdrawAmount('');
    setPin('');
    setShowAddAccount(false);
    setNewAccountNumber('');
    setNewIfscCode('');
    setNewAccountHolderName('');
    setNewBankName('');
    setNewAccountType('savings');
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const handleMethodSelect = (method: WithdrawMethod) => {
    setSelectedMethod(method);
    setWithdrawStep('account');
  };

  const handleAccountSelect = (account: BankAccount) => {
    setSelectedAccount(account);
    setWithdrawStep('amount');
  };

  const handleAddNewAccount = () => {
    if (!newAccountNumber || !newIfscCode || !newAccountHolderName || !newBankName) {
      return;
    }

    const newAccount: BankAccount = {
      id: Date.now().toString(),
      accountNumber: newAccountNumber,
      ifscCode: newIfscCode.toUpperCase(),
      accountHolderName: newAccountHolderName,
      bankName: newBankName,
      accountType: newAccountType,
      isVerified: false, // Would need verification in real app
      isDefault: bankAccounts.length === 0,
      addedDate: new Date().toISOString().split('T')[0]
    };

    setBankAccounts([...bankAccounts, newAccount]);
    setShowAddAccount(false);
    
    // Reset form
    setNewAccountNumber('');
    setNewIfscCode('');
    setNewAccountHolderName('');
    setNewBankName('');
    setNewAccountType('savings');
  };

  const validateWithdrawAmount = () => {
    const amount = parseFloat(withdrawAmount);
    if (!selectedMethod) return false;
    
    return amount >= selectedMethod.minAmount && 
           amount <= selectedMethod.maxAmount && 
           amount <= currentBalance;
  };

  const getEffectiveAmount = () => {
    const amount = parseFloat(withdrawAmount) || 0;
    const charges = selectedMethod?.charges || 0;
    return amount - charges;
  };

  const handleProceedToPin = () => {
    if (validateWithdrawAmount()) {
      setWithdrawStep('pin');
    }
  };

  const handleWithdraw = async () => {
    if (pin.length !== 4) return;
    
    setWithdrawStep('processing');
    
    try {
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Simulate random success/failure
      const isSuccess = Math.random() > 0.1;
      
      if (isSuccess) {
        setWithdrawStep('success');
      } else {
        setWithdrawStep('failed');
      }
    } catch (error) {
      setWithdrawStep('failed');
    }
  };

  const MethodCard: React.FC<{ method: WithdrawMethod }> = ({ method }) => {
    const IconComponent = method.icon;
    return (
      <Card 
        className={`glass-card-premium border border-white/20 p-4 wallet-card-clickable ${
          method.isAvailable ? 'hover:border-primary/50' : 'opacity-50 cursor-not-allowed'
        }`}
        onClick={() => method.isAvailable && handleMethodSelect(method)}
      >
        <CardContent className="p-0">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-gradient-cyber flex items-center justify-center">
                <IconComponent className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="font-medium text-white">{method.name}</h4>
                <p className="text-sm text-gray-400">{method.description}</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1 text-gray-400">
              <Clock className="w-3 h-3" />
              <span>{method.processingTime}</span>
            </div>
            <div className="text-gray-400">
              Fee: ₹{method.charges}
            </div>
            <div className="text-gray-400">
              Min: ₹{method.minAmount}
            </div>
            <div className="text-gray-400">
              Max: ₹{method.maxAmount.toLocaleString()}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const AccountCard: React.FC<{ account: BankAccount }> = ({ account }) => (
    <Card 
      className="glass-card-premium border border-white/20 p-4 wallet-card-clickable"
      onClick={() => handleAccountSelect(account)}
    >
      <CardContent className="p-0">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium text-white">{account.bankName}</h4>
              {account.isDefault && (
                <Badge className="bg-primary/20 text-primary border-primary/30">
                  <Star className="w-3 h-3 mr-1" />
                  Default
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-400">{account.accountHolderName}</p>
            <p className="text-xs text-gray-500">
              ****{account.accountNumber.slice(-4)} • {account.accountType.toUpperCase()}
            </p>
            <p className="text-xs text-gray-500">{account.ifscCode}</p>
          </div>
          <div className="flex items-center gap-1">
            {account.isVerified ? (
              <CheckCircle className="w-4 h-4 text-green-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="glass-card-premium border border-white/20 shadow-wallet-card max-w-md mx-auto">
        <DialogHeader className="bg-gradient-cyber p-4 -m-6 mb-0 rounded-t-lg">
          <DialogTitle className="text-gradient-cyber flex items-center gap-2">
            <Banknote className="w-5 h-5" />
            Withdraw Money
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 pt-4">
          {withdrawStep === 'method' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Select Withdraw Method</h3>
              </div>

              <Card className="glass-card border border-white/20 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Available Balance:</span>
                  <span className="text-2xl font-bold text-green-400">₹{currentBalance.toLocaleString()}</span>
                </div>
              </Card>
              
              <div className="space-y-3">
                {withdrawMethods.map(method => (
                  <MethodCard key={method.id} method={method} />
                ))}
              </div>
            </div>
          )}

          {withdrawStep === 'account' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Select Bank Account</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setWithdrawStep('method')}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {selectedMethod && (
                <Card className="glass-card border border-white/20 p-3">
                  <div className="flex items-center gap-3">
                    <selectedMethod.icon className="w-6 h-6 text-primary" />
                    <div>
                      <h4 className="font-medium text-white">{selectedMethod.name}</h4>
                      <p className="text-sm text-gray-400">{selectedMethod.processingTime} • Fee: ₹{selectedMethod.charges}</p>
                    </div>
                  </div>
                </Card>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-300">Saved Accounts</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddAccount(true)}
                    className="h-8 text-xs"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add New
                  </Button>
                </div>

                {showAddAccount && (
                  <Card className="glass-card border border-white/20 p-4">
                    <CardHeader className="p-0 mb-3">
                      <h4 className="font-medium text-white">Add Bank Account</h4>
                    </CardHeader>
                    <CardContent className="p-0 space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-gray-300 text-xs">Account Number</Label>
                          <Input
                            placeholder="1234567890"
                            value={newAccountNumber}
                            onChange={(e) => setNewAccountNumber(e.target.value)}
                            className="h-9 text-xs bg-background/20 border-white/20 text-white"
                          />
                        </div>
                        <div>
                          <Label className="text-gray-300 text-xs">IFSC Code</Label>
                          <Input
                            placeholder="HDFC0000123"
                            value={newIfscCode}
                            onChange={(e) => setNewIfscCode(e.target.value.toUpperCase())}
                            className="h-9 text-xs bg-background/20 border-white/20 text-white"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-gray-300 text-xs">Account Holder Name</Label>
                        <Input
                          placeholder="John Doe"
                          value={newAccountHolderName}
                          onChange={(e) => setNewAccountHolderName(e.target.value)}
                          className="h-9 text-xs bg-background/20 border-white/20 text-white"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-gray-300 text-xs">Bank Name</Label>
                          <Input
                            placeholder="HDFC Bank"
                            value={newBankName}
                            onChange={(e) => setNewBankName(e.target.value)}
                            className="h-9 text-xs bg-background/20 border-white/20 text-white"
                          />
                        </div>
                        <div>
                          <Label className="text-gray-300 text-xs">Account Type</Label>
                          <Select value={newAccountType} onValueChange={(value: 'savings' | 'current') => setNewAccountType(value)}>
                            <SelectTrigger className="h-9 text-xs bg-background/20 border-white/20 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="savings">Savings</SelectItem>
                              <SelectItem value="current">Current</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleAddNewAccount}
                          disabled={!newAccountNumber || !newIfscCode || !newAccountHolderName || !newBankName}
                          className="flex-1 h-8 text-xs btn-cyber"
                        >
                          Add Account
                        </Button>
                        <Button
                          onClick={() => setShowAddAccount(false)}
                          variant="outline"
                          className="h-8 text-xs"
                        >
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {bankAccounts.map(account => (
                    <AccountCard key={account.id} account={account} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {withdrawStep === 'amount' && selectedMethod && selectedAccount && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Enter Amount</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setWithdrawStep('account')}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <Card className="glass-card border border-white/20 p-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">To:</span>
                    <span className="text-white">{selectedAccount.bankName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Account:</span>
                    <span className="text-white">****{selectedAccount.accountNumber.slice(-4)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Method:</span>
                    <span className="text-white">{selectedMethod.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Processing:</span>
                    <span className="text-white">{selectedMethod.processingTime}</span>
                  </div>
                </div>
              </Card>

              <div className="space-y-4">
                <div>
                  <Label className="text-gray-300">Withdraw Amount (₹)</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="bg-background/20 border-white/20 text-white placeholder:text-gray-400 text-lg h-12"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>Min: ₹{selectedMethod.minAmount}</span>
                    <span>Max: ₹{selectedMethod.maxAmount.toLocaleString()}</span>
                  </div>
                </div>

                {withdrawAmount && (
                  <Card className="glass-card border border-white/20 p-3">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Withdraw Amount:</span>
                        <span className="text-white">₹{parseFloat(withdrawAmount).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Processing Fee:</span>
                        <span className="text-white">₹{selectedMethod.charges}</span>
                      </div>
                      <hr className="border-white/20" />
                      <div className="flex justify-between font-medium">
                        <span className="text-white">You'll Receive:</span>
                        <span className="text-green-400">₹{getEffectiveAmount().toLocaleString()}</span>
                      </div>
                    </div>
                  </Card>
                )}

                {withdrawAmount && parseFloat(withdrawAmount) > currentBalance && (
                  <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <span className="text-red-400 text-sm">Insufficient balance</span>
                  </div>
                )}

                <Button
                  onClick={handleProceedToPin}
                  disabled={!validateWithdrawAmount()}
                  className="w-full btn-cyber h-12"
                >
                  Proceed to Withdraw
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {withdrawStep === 'pin' && (
            <div className="space-y-6">
              <div className="text-center">
                <Shield className="w-12 h-12 mx-auto mb-3 text-primary" />
                <h3 className="text-lg font-semibold text-white mb-2">Enter PIN</h3>
                <p className="text-gray-400">Confirm withdrawal of ₹{withdrawAmount}</p>
                <p className="text-sm text-gray-500">to {selectedAccount?.bankName}</p>
              </div>

              <div className="flex justify-center gap-2">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center ${
                      i < pin.length ? 'border-primary bg-primary/20' : 'border-white/20 bg-background/20'
                    }`}
                  >
                    {i < pin.length && <div className="w-3 h-3 rounded-full bg-primary" />}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '⌫'].map((num, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="h-12 text-lg bg-background/20 border-white/20 hover:bg-primary/20 hover:border-primary/30"
                    onClick={() => {
                      if (num === '⌫') {
                        setPin(prev => prev.slice(0, -1));
                      } else if (num !== '' && pin.length < 4) {
                        setPin(prev => prev + num.toString());
                      }
                    }}
                    disabled={num === ''}
                  >
                    {num}
                  </Button>
                ))}
              </div>

              <Button
                onClick={handleWithdraw}
                disabled={pin.length !== 4}
                className="w-full btn-cyber h-12"
              >
                Confirm Withdrawal
                <Shield className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {withdrawStep === 'processing' && (
            <div className="text-center space-y-6 py-8">
              <Loader2 className="w-16 h-16 mx-auto animate-spin text-primary" />
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Processing Withdrawal</h3>
                <p className="text-gray-400">Please wait while we process your withdrawal...</p>
              </div>
            </div>
          )}

          {withdrawStep === 'success' && (
            <div className="text-center space-y-6 py-8">
              <CheckCircle className="w-16 h-16 mx-auto text-green-400" />
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Withdrawal Successful!</h3>
                <p className="text-gray-400">₹{getEffectiveAmount().toLocaleString()} will be credited to your account</p>
                <p className="text-sm text-gray-500">Expected in {selectedMethod?.processingTime}</p>
                <p className="text-xs text-gray-500">Transaction ID: TXN{Date.now()}</p>
              </div>
              <Button onClick={handleClose} className="w-full btn-cyber h-12">
                Done
              </Button>
            </div>
          )}

          {withdrawStep === 'failed' && (
            <div className="text-center space-y-6 py-8">
              <AlertCircle className="w-16 h-16 mx-auto text-red-400" />
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Withdrawal Failed</h3>
                <p className="text-gray-400">Unable to process your withdrawal. Please try again.</p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setWithdrawStep('pin')}
                  variant="outline"
                  className="flex-1 h-12"
                >
                  Retry
                </Button>
                <Button onClick={handleClose} className="flex-1 btn-cyber h-12">
                  Close
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WithdrawModal;