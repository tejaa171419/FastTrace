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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Receipt,
  Zap,
  Wifi,
  Smartphone,
  Droplets,
  Flame,
  CreditCard,
  Car,
  Search,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowRight,
  Shield,
  X,
  History,
  Star
} from 'lucide-react';

interface UtilityProvider {
  id: string;
  name: string;
  type: 'electricity' | 'gas' | 'water' | 'internet' | 'mobile' | 'insurance' | 'loan';
  logo?: string;
  isPopular: boolean;
  processingTime: string;
  charges: number;
}

interface BillAccount {
  id: string;
  providerId: string;
  accountNumber: string;
  nickname: string;
  lastBillAmount: number;
  dueDate: string;
  isOverdue: boolean;
  consumerName: string;
}

interface BillPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BillPaymentModal: React.FC<BillPaymentModalProps> = ({ isOpen, onClose }) => {
  const [paymentStep, setPaymentStep] = useState<'category' | 'provider' | 'account' | 'amount' | 'pin' | 'processing' | 'success' | 'failed'>('category');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedProvider, setSelectedProvider] = useState<UtilityProvider | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<BillAccount | null>(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [pin, setPin] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [savedAccounts, setSavedAccounts] = useState<BillAccount[]>([]);
  const [providers, setProviders] = useState<UtilityProvider[]>([]);
  const [isLoadingProviders, setIsLoadingProviders] = useState(false);
  const [isLoadingBillDetails, setIsLoadingBillDetails] = useState(false);
  const [billDetails, setBillDetails] = useState<any>(null);

  const categories = [
    { id: 'electricity', name: 'Electricity', icon: Zap, color: 'text-yellow-400' },
    { id: 'gas', name: 'Gas', icon: Flame, color: 'text-orange-400' },
    { id: 'water', name: 'Water', icon: Droplets, color: 'text-blue-400' },
    { id: 'internet', name: 'Internet', icon: Wifi, color: 'text-purple-400' },
    { id: 'mobile', name: 'Mobile', icon: Smartphone, color: 'text-green-400' },
    { id: 'insurance', name: 'Insurance', icon: Shield, color: 'text-indigo-400' },
    { id: 'loan', name: 'Loan EMI', icon: CreditCard, color: 'text-red-400' },
  ];

  useEffect(() => {
    if (isOpen) {
      // Load saved accounts
      setSavedAccounts([
        {
          id: '1',
          providerId: 'provider1',
          accountNumber: '123456789',
          nickname: 'Home Electricity',
          lastBillAmount: 2500,
          dueDate: '2024-02-15',
          isOverdue: false,
          consumerName: 'John Doe'
        },
        {
          id: '2',
          providerId: 'provider2',
          accountNumber: '987654321',
          nickname: 'Internet Bill',
          lastBillAmount: 1200,
          dueDate: '2024-02-10',
          isOverdue: true,
          consumerName: 'John Doe'
        }
      ]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedCategory) {
      setIsLoadingProviders(true);
      // Simulate API call for providers
      setTimeout(() => {
        const mockProviders: UtilityProvider[] = [
          {
            id: 'provider1',
            name: 'State Electricity Board',
            type: selectedCategory as any,
            isPopular: true,
            processingTime: 'Instant',
            charges: 0
          },
          {
            id: 'provider2',
            name: 'Private Power Ltd',
            type: selectedCategory as any,
            isPopular: false,
            processingTime: '2-3 hours',
            charges: 5
          },
          {
            id: 'provider3',
            name: 'City Utilities',
            type: selectedCategory as any,
            isPopular: true,
            processingTime: 'Instant',
            charges: 2
          }
        ];
        setProviders(mockProviders);
        setIsLoadingProviders(false);
      }, 1000);
    }
  }, [selectedCategory]);

  const resetModal = () => {
    setPaymentStep('category');
    setSelectedCategory('');
    setSelectedProvider(null);
    setSelectedAccount(null);
    setAccountNumber('');
    setAmount('');
    setPin('');
    setSearchQuery('');
    setBillDetails(null);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setPaymentStep('provider');
  };

  const handleProviderSelect = (provider: UtilityProvider) => {
    setSelectedProvider(provider);
    setPaymentStep('account');
  };

  const handleAccountSelect = (account: BillAccount) => {
    setSelectedAccount(account);
    setAccountNumber(account.accountNumber);
    setAmount(account.lastBillAmount.toString());
    fetchBillDetails(account);
  };

  const fetchBillDetails = async (account: BillAccount) => {
    setIsLoadingBillDetails(true);
    // Simulate API call for bill details
    setTimeout(() => {
      setBillDetails({
        consumerName: account.consumerName,
        billAmount: account.lastBillAmount,
        dueDate: account.dueDate,
        billNumber: 'BILL' + Date.now(),
        period: 'Jan 2024',
        previousReading: 1000,
        currentReading: 1250,
        unitsConsumed: 250
      });
      setIsLoadingBillDetails(false);
      setPaymentStep('amount');
    }, 1500);
  };

  const handleManualAccountEntry = async () => {
    if (!accountNumber) return;
    
    setIsLoadingBillDetails(true);
    // Simulate API call for bill details
    setTimeout(() => {
      const mockBillDetails = {
        consumerName: 'Customer Name',
        billAmount: 1500 + Math.floor(Math.random() * 2000),
        dueDate: '2024-02-20',
        billNumber: 'BILL' + Date.now(),
        period: 'Jan 2024',
        previousReading: 800,
        currentReading: 1050,
        unitsConsumed: 250
      };
      setBillDetails(mockBillDetails);
      setAmount(mockBillDetails.billAmount.toString());
      setIsLoadingBillDetails(false);
      setPaymentStep('amount');
    }, 2000);
  };

  const handleProceedToPin = () => {
    if (amount && parseFloat(amount) > 0) {
      setPaymentStep('pin');
    }
  };

  const handlePayment = async () => {
    if (pin.length !== 4) return;
    
    setPaymentStep('processing');
    
    try {
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Simulate random success/failure
      const isSuccess = Math.random() > 0.1;
      
      if (isSuccess) {
        setPaymentStep('success');
      } else {
        setPaymentStep('failed');
      }
    } catch (error) {
      setPaymentStep('failed');
    }
  };

  const filteredProviders = providers.filter(provider =>
    provider.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSavedAccounts = savedAccounts.filter(account =>
    selectedProvider && account.providerId === selectedProvider.id
  );

  const CategoryCard: React.FC<{ category: any }> = ({ category }) => {
    const IconComponent = category.icon;
    return (
      <Card 
        className="glass-card-premium border border-white/20 p-4 wallet-card-clickable"
        onClick={() => handleCategorySelect(category.id)}
      >
        <CardContent className="p-0 text-center">
          <IconComponent className={`w-8 h-8 mx-auto mb-2 ${category.color}`} />
          <h3 className="font-medium text-white text-sm">{category.name}</h3>
        </CardContent>
      </Card>
    );
  };

  const ProviderCard: React.FC<{ provider: UtilityProvider }> = ({ provider }) => (
    <Card 
      className="glass-card-premium border border-white/20 p-4 wallet-card-clickable"
      onClick={() => handleProviderSelect(provider)}
    >
      <CardContent className="p-0">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium text-white">{provider.name}</h4>
          {provider.isPopular && (
            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
              <Star className="w-3 h-3 mr-1" />
              Popular
            </Badge>
          )}
        </div>
        <div className="flex justify-between text-xs text-gray-400">
          <span>⚡ {provider.processingTime}</span>
          <span>Fee: ₹{provider.charges}</span>
        </div>
      </CardContent>
    </Card>
  );

  const AccountCard: React.FC<{ account: BillAccount }> = ({ account }) => (
    <Card 
      className="glass-card-premium border border-white/20 p-4 wallet-card-clickable"
      onClick={() => handleAccountSelect(account)}
    >
      <CardContent className="p-0">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h4 className="font-medium text-white">{account.nickname}</h4>
            <p className="text-sm text-gray-400">{account.accountNumber}</p>
          </div>
          {account.isOverdue && (
            <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
              Overdue
            </Badge>
          )}
        </div>
        <div className="flex justify-between text-xs text-gray-400">
          <span>Last Bill: ₹{account.lastBillAmount}</span>
          <span>Due: {account.dueDate}</span>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="glass-card-premium border border-white/20 shadow-wallet-card max-w-md mx-auto">
        <DialogHeader className="bg-gradient-cyber p-4 -m-6 mb-0 rounded-t-lg">
          <DialogTitle className="text-gradient-cyber flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Bill Payment
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 pt-4">
          {paymentStep === 'category' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">Select Bill Category</h3>
              
              <div className="grid grid-cols-2 gap-3">
                {categories.map(category => (
                  <CategoryCard key={category.id} category={category} />
                ))}
              </div>
            </div>
          )}

          {paymentStep === 'provider' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Select Provider</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPaymentStep('category')}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search providers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-background/20 border-white/20 text-white placeholder:text-gray-400"
                />
              </div>

              {isLoadingProviders ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <span className="ml-2 text-gray-400">Loading providers...</span>
                </div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {filteredProviders.map(provider => (
                    <ProviderCard key={provider.id} provider={provider} />
                  ))}
                </div>
              )}
            </div>
          )}

          {paymentStep === 'account' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Select Account</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPaymentStep('provider')}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {filteredSavedAccounts.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                    <History className="w-4 h-4 text-blue-400" />
                    Saved Accounts
                  </h4>
                  <div className="space-y-2 mb-4">
                    {filteredSavedAccounts.map(account => (
                      <AccountCard key={account.id} account={account} />
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-300">Add New Account</h4>
                <div>
                  <Label className="text-gray-300">Account/Consumer Number</Label>
                  <Input
                    placeholder="Enter account number"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="bg-background/20 border-white/20 text-white placeholder:text-gray-400"
                  />
                </div>

                <Button
                  onClick={handleManualAccountEntry}
                  disabled={!accountNumber}
                  className="w-full btn-cyber h-12"
                >
                  Fetch Bill Details
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {paymentStep === 'amount' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Bill Details</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPaymentStep('account')}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {isLoadingBillDetails ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <span className="ml-2 text-gray-400">Fetching bill details...</span>
                </div>
              ) : billDetails ? (
                <div className="space-y-4">
                  <Card className="glass-card border border-white/20 p-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Consumer Name:</span>
                        <span className="text-white font-medium">{billDetails.consumerName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Bill Number:</span>
                        <span className="text-white">{billDetails.billNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Bill Period:</span>
                        <span className="text-white">{billDetails.period}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Due Date:</span>
                        <span className="text-white">{billDetails.dueDate}</span>
                      </div>
                      {billDetails.unitsConsumed && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Units Consumed:</span>
                          <span className="text-white">{billDetails.unitsConsumed}</span>
                        </div>
                      )}
                      <hr className="border-white/20" />
                      <div className="flex justify-between text-lg">
                        <span className="text-white font-medium">Bill Amount:</span>
                        <span className="text-green-400 font-bold">₹{billDetails.billAmount}</span>
                      </div>
                    </div>
                  </Card>

                  <div>
                    <Label className="text-gray-300">Pay Amount (₹)</Label>
                    <Input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="bg-background/20 border-white/20 text-white placeholder:text-gray-400"
                    />
                  </div>

                  <Button
                    onClick={handleProceedToPin}
                    disabled={!amount || parseFloat(amount) <= 0}
                    className="w-full btn-cyber h-12"
                  >
                    Pay ₹{amount || '0.00'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              ) : null}
            </div>
          )}

          {paymentStep === 'pin' && (
            <div className="space-y-6">
              <div className="text-center">
                <Shield className="w-12 h-12 mx-auto mb-3 text-primary" />
                <h3 className="text-lg font-semibold text-white mb-2">Enter PIN</h3>
                <p className="text-gray-400">Confirm bill payment of ₹{amount}</p>
                <p className="text-sm text-gray-500">to {selectedProvider?.name}</p>
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
                onClick={handlePayment}
                disabled={pin.length !== 4}
                className="w-full btn-cyber h-12"
              >
                Confirm Payment
                <Shield className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {paymentStep === 'processing' && (
            <div className="text-center space-y-6 py-8">
              <Loader2 className="w-16 h-16 mx-auto animate-spin text-primary" />
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Processing Payment</h3>
                <p className="text-gray-400">Please wait while we process your bill payment...</p>
              </div>
            </div>
          )}

          {paymentStep === 'success' && (
            <div className="text-center space-y-6 py-8">
              <CheckCircle className="w-16 h-16 mx-auto text-green-400" />
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Payment Successful!</h3>
                <p className="text-gray-400">₹{amount} paid to {selectedProvider?.name}</p>
                <p className="text-sm text-gray-500">Transaction ID: TXN{Date.now()}</p>
              </div>
              <Button onClick={handleClose} className="w-full btn-cyber h-12">
                Done
              </Button>
            </div>
          )}

          {paymentStep === 'failed' && (
            <div className="text-center space-y-6 py-8">
              <AlertCircle className="w-16 h-16 mx-auto text-red-400" />
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Payment Failed</h3>
                <p className="text-gray-400">Unable to process your bill payment. Please try again.</p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setPaymentStep('pin')}
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

export default BillPaymentModal;