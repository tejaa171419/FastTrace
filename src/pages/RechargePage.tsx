import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Smartphone,
  Tv,
  Wifi,
  Zap,
  Phone,
  Search,
  Star,
  Clock,
  Gift,
  Tag,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowRight,
  Shield,
  X,
  History,
  Plus,
  Users,
  ArrowLeft
} from 'lucide-react';

interface RechargeProvider {
  id: string;
  name: string;
  type: 'mobile' | 'dth' | 'datacard' | 'broadband';
  logo?: string;
  isPopular: boolean;
  offers?: RechargeOffer[];
}

interface RechargeOffer {
  id: string;
  amount: number;
  validity: string;
  data?: string;
  description: string;
  isPopular?: boolean;
  discount?: number;
  originalPrice?: number;
}

interface RechargeAccount {
  id: string;
  number: string;
  providerName: string;
  providerId: string;
  nickname: string;
  lastRechargeAmount: number;
  lastRechargeDate: string;
  type: 'mobile' | 'dth' | 'datacard' | 'broadband';
}

const RechargePage: React.FC = () => {
  const navigate = useNavigate();
  const [rechargeStep, setRechargeStep] = useState<'category' | 'provider' | 'number' | 'plans' | 'payment' | 'pin' | 'processing' | 'success' | 'failed'>('category');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedProvider, setSelectedProvider] = useState<RechargeProvider | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<RechargeOffer | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [pin, setPin] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [providers, setProviders] = useState<RechargeProvider[]>([]);
  const [savedAccounts, setSavedAccounts] = useState<RechargeAccount[]>([]);
  const [rechargePlans, setRechargePlans] = useState<RechargeOffer[]>([]);
  const [isLoadingProviders, setIsLoadingProviders] = useState(false);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);

  const categories = [
    { id: 'mobile', name: 'Mobile', icon: Smartphone, color: 'text-green-400' },
    { id: 'dth', name: 'DTH/TV', icon: Tv, color: 'text-blue-400' },
    { id: 'datacard', name: 'Data Card', icon: Wifi, color: 'text-purple-400' },
    { id: 'broadband', name: 'Broadband', icon: Zap, color: 'text-orange-400' },
  ];

  useEffect(() => {
    // Load saved accounts
    setSavedAccounts([
      {
        id: '1',
        number: '+1-234-567-8901',
        providerName: 'Verizon',
        providerId: 'provider1',
        nickname: 'My Mobile',
        lastRechargeAmount: 299,
        lastRechargeDate: '2024-01-15',
        type: 'mobile'
      },
      {
        id: '2',
        number: '12345678',
        providerName: 'DirecTV',
        providerId: 'provider2',
        nickname: 'Home DTH',
        lastRechargeAmount: 500,
        lastRechargeDate: '2024-01-10',
        type: 'dth'
      }
    ]);
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      setIsLoadingProviders(true);
      // Simulate API call for providers
      setTimeout(() => {
        const mockProviders: RechargeProvider[] = [
          {
            id: 'provider1',
            name: 'Verizon',
            type: selectedCategory as any,
            isPopular: true,
          },
          {
            id: 'provider2',
            name: 'AT&T',
            type: selectedCategory as any,
            isPopular: true,
          },
          {
            id: 'provider3',
            name: 'T-Mobile',
            type: selectedCategory as any,
            isPopular: false,
          },
          {
            id: 'provider4',
            name: 'Sprint',
            type: selectedCategory as any,
            isPopular: false,
          }
        ];
        setProviders(mockProviders);
        setIsLoadingProviders(false);
      }, 1000);
    }
  }, [selectedCategory]);

  useEffect(() => {
    if (selectedProvider && phoneNumber) {
      setIsLoadingPlans(true);
      // Simulate API call for recharge plans
      setTimeout(() => {
        const mockPlans: RechargeOffer[] = selectedCategory === 'mobile' ? [
          {
            id: 'plan1',
            amount: 199,
            validity: '28 days',
            data: '1.5GB/day',
            description: 'Unlimited calls + SMS + 1.5GB data daily',
            isPopular: true
          },
          {
            id: 'plan2',
            amount: 299,
            validity: '28 days',
            data: '2GB/day',
            description: 'Unlimited calls + SMS + 2GB data daily + Disney+ Hotstar',
            isPopular: true,
            discount: 50,
            originalPrice: 349
          },
          {
            id: 'plan3',
            amount: 449,
            validity: '56 days',
            data: '2GB/day',
            description: 'Unlimited calls + SMS + 2GB data daily + Netflix',
          },
          {
            id: 'plan4',
            amount: 599,
            validity: '84 days',
            data: '1.5GB/day',
            description: 'Unlimited calls + SMS + 1.5GB data daily',
          },
          {
            id: 'plan5',
            amount: 999,
            validity: '84 days',
            data: '2.5GB/day',
            description: 'Unlimited calls + SMS + 2.5GB data daily + Amazon Prime',
            discount: 100,
            originalPrice: 1099
          }
        ] : [
          {
            id: 'dth1',
            amount: 250,
            validity: '30 days',
            description: 'Basic package - 150+ channels',
          },
          {
            id: 'dth2',
            amount: 400,
            validity: '30 days',
            description: 'Premium package - 300+ channels + HD',
            isPopular: true
          },
          {
            id: 'dth3',
            amount: 600,
            validity: '30 days',
            description: 'Ultimate package - 500+ channels + Sports + Movies',
          }
        ];
        setRechargePlans(mockPlans);
        setIsLoadingPlans(false);
      }, 1500);
    }
  }, [selectedProvider, phoneNumber, selectedCategory]);

  const resetModal = () => {
    setRechargeStep('category');
    setSelectedCategory('');
    setSelectedProvider(null);
    setPhoneNumber('');
    setSelectedPlan(null);
    setCustomAmount('');
    setPin('');
    setSearchQuery('');
    setRechargePlans([]);
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setRechargeStep('provider');
  };

  const handleProviderSelect = (provider: RechargeProvider) => {
    setSelectedProvider(provider);
    setRechargeStep('number');
  };

  const handleAccountSelect = (account: RechargeAccount) => {
    setPhoneNumber(account.number);
    setRechargeStep('plans');
  };

  const handleNumberSubmit = () => {
    if (phoneNumber) {
      setRechargeStep('plans');
    }
  };

  const handlePlanSelect = (plan: RechargeOffer) => {
    setSelectedPlan(plan);
    setRechargeStep('payment');
  };

  const handleCustomAmountSelect = () => {
    if (customAmount && parseFloat(customAmount) > 0) {
      setSelectedPlan({
        id: 'custom',
        amount: parseFloat(customAmount),
        validity: 'As per operator',
        description: 'Custom recharge amount'
      });
      setRechargeStep('payment');
    }
  };

  const handlePayment = async () => {
    if (pin.length !== 4) return;
    
    setRechargeStep('processing');
    
    try {
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Simulate random success/failure
      const isSuccess = Math.random() > 0.1;
      
      if (isSuccess) {
        setRechargeStep('success');
      } else {
        setRechargeStep('failed');
      }
    } catch (error) {
      setRechargeStep('failed');
    }
  };

  const filteredProviders = providers.filter(provider =>
    provider.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSavedAccounts = savedAccounts.filter(account =>
    account.type === selectedCategory &&
    (!selectedProvider || account.providerId === selectedProvider.id)
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

  const ProviderCard: React.FC<{ provider: RechargeProvider }> = ({ provider }) => (
    <Card 
      className="glass-card-premium border border-white/20 p-4 wallet-card-clickable"
      onClick={() => handleProviderSelect(provider)}
    >
      <CardContent className="p-0">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-white">{provider.name}</h4>
          {provider.isPopular && (
            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
              <Star className="w-3 h-3 mr-1" />
              Popular
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const AccountCard: React.FC<{ account: RechargeAccount }> = ({ account }) => (
    <Card 
      className="glass-card-premium border border-white/20 p-4 wallet-card-clickable"
      onClick={() => handleAccountSelect(account)}
    >
      <CardContent className="p-0">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h4 className="font-medium text-white">{account.nickname}</h4>
            <p className="text-sm text-gray-400">{account.number}</p>
            <p className="text-xs text-gray-500">{account.providerName}</p>
          </div>
        </div>
        <div className="flex justify-between text-xs text-gray-400">
          <span>Last: ₹{account.lastRechargeAmount}</span>
          <span>{account.lastRechargeDate}</span>
        </div>
      </CardContent>
    </Card>
  );

  const PlanCard: React.FC<{ plan: RechargeOffer }> = ({ plan }) => (
    <Card 
      className="glass-card-premium border border-white/20 p-4 wallet-card-clickable"
      onClick={() => handlePlanSelect(plan)}
    >
      <CardContent className="p-0">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl font-bold text-primary">₹{plan.amount}</span>
              {plan.originalPrice && (
                <span className="text-sm text-gray-400 line-through">₹{plan.originalPrice}</span>
              )}
              {plan.isPopular && (
                <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                  <Star className="w-3 h-3 mr-1" />
                  Popular
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-300 mb-1">
              <Clock className="w-3 h-3" />
              <span>{plan.validity}</span>
              {plan.data && (
                <>
                  <span>•</span>
                  <span>{plan.data}</span>
                </>
              )}
            </div>
          </div>
          {plan.discount && (
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
              <Tag className="w-3 h-3 mr-1" />
              Save ₹{plan.discount}
            </Badge>
          )}
        </div>
        <p className="text-sm text-gray-400">{plan.description}</p>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen-safe bg-gradient-background p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (rechargeStep === 'category') {
                navigate('/wallet');
              } else {
                // Navigate back through the steps
                if (rechargeStep === 'provider') setRechargeStep('category');
                else if (rechargeStep === 'number') setRechargeStep('provider');
                else if (rechargeStep === 'plans') setRechargeStep('number');
                else if (rechargeStep === 'payment') setRechargeStep('plans');
                else if (rechargeStep === 'pin') setRechargeStep('payment');
                else navigate('/wallet');
              }
            }}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-xl font-bold text-gradient-cyber">Recharge & Bill Pay</h1>
          <div className="w-8"></div> {/* Spacer for alignment */}
        </div>

        <Card className="glass-card-premium border border-white/20 shadow-wallet-card rounded-2xl">
          <div className="p-6">
            {rechargeStep === 'category' && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-cyber mx-auto mb-4 flex items-center justify-center">
                    <Smartphone className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-lg font-semibold text-white mb-2">Select Service</h2>
                  <p className="text-gray-400 text-sm">Choose the service you want to recharge</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {categories.map(category => (
                    <CategoryCard key={category.id} category={category} />
                  ))}
                </div>
              </div>
            )}

            {rechargeStep === 'provider' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white">Select Provider</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setRechargeStep('category')}
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

            {rechargeStep === 'number' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white">Enter Details</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setRechargeStep('provider')}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {filteredSavedAccounts.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                      <History className="w-4 h-4 text-blue-400" />
                      Saved Accounts
                    </h3>
                    <div className="space-y-2 mb-4">
                      {filteredSavedAccounts.map(account => (
                        <AccountCard key={account.id} account={account} />
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-300">Enter New Number</h3>
                  <div>
                    <Label className="text-gray-300">
                      {selectedCategory === 'mobile' ? 'Mobile Number' : 
                       selectedCategory === 'dth' ? 'Customer ID / VC Number' :
                       selectedCategory === 'datacard' ? 'Data Card Number' : 'Account Number'}
                    </Label>
                    <Input
                      placeholder={selectedCategory === 'mobile' ? '+1-234-567-8900' : 'Enter number'}
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="bg-background/20 border-white/20 text-white placeholder:text-gray-400"
                    />
                  </div>

                  <Button
                    onClick={handleNumberSubmit}
                    disabled={!phoneNumber}
                    className="w-full btn-cyber h-12"
                  >
                    Browse Plans
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {rechargeStep === 'plans' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white">Select Plan</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setRechargeStep('number')}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <Card className="glass-card border border-white/20 p-3">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-cyber flex items-center justify-center">
                      <Phone className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-medium text-white">{phoneNumber}</h4>
                      <p className="text-sm text-gray-400">{selectedProvider?.name}</p>
                    </div>
                  </div>
                </Card>

                {/* Custom Amount Option */}
                <Card className="glass-card border border-white/20 p-4">
                  <CardHeader className="p-0 mb-3">
                    <h3 className="font-medium text-white">Custom Amount</h3>
                  </CardHeader>
                  <CardContent className="p-0 space-y-3">
                    <Input
                      type="number"
                      placeholder="Enter amount"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      className="bg-background/20 border-white/20 text-white placeholder:text-gray-400"
                    />
                    <Button
                      onClick={handleCustomAmountSelect}
                      disabled={!customAmount || parseFloat(customAmount) <= 0}
                      className="w-full btn-secondary"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Recharge with Custom Amount
                    </Button>
                  </CardContent>
                </Card>

                {isLoadingPlans ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    <span className="ml-2 text-gray-400">Loading plans...</span>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    <h3 className="text-sm font-medium text-gray-300">Available Plans</h3>
                    {rechargePlans.map(plan => (
                      <PlanCard key={plan.id} plan={plan} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {rechargeStep === 'payment' && selectedPlan && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white">Confirm Recharge</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setRechargeStep('plans')}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <Card className="glass-card border border-white/20 p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Number:</span>
                      <span className="text-white font-medium">{phoneNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Provider:</span>
                      <span className="text-white">{selectedProvider?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Plan:</span>
                      <span className="text-white">{selectedPlan.description}</span>
                    </div>
                    {selectedPlan.validity !== 'As per operator' && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Validity:</span>
                        <span className="text-white">{selectedPlan.validity}</span>
                      </div>
                    )}
                    {selectedPlan.data && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Data:</span>
                        <span className="text-white">{selectedPlan.data}</span>
                      </div>
                    )}
                    <hr className="border-white/20" />
                    <div className="flex justify-between text-lg">
                      <span className="text-white font-medium">Amount:</span>
                      <span className="text-green-400 font-bold">₹{selectedPlan.amount}</span>
                    </div>
                  </div>
                </Card>

                <Button
                  onClick={() => setRechargeStep('pin')}
                  className="w-full btn-cyber h-12"
                >
                  Proceed to Pay ₹{selectedPlan.amount}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}

            {rechargeStep === 'pin' && selectedPlan && (
              <div className="space-y-6">
                <div className="text-center">
                  <Shield className="w-12 h-12 mx-auto mb-3 text-primary" />
                  <h2 className="text-lg font-semibold text-white mb-2">Enter PIN</h2>
                  <p className="text-gray-400">Confirm recharge of ₹{selectedPlan.amount}</p>
                  <p className="text-sm text-gray-500">for {phoneNumber}</p>
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
                  Confirm Recharge
                  <Shield className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}

            {rechargeStep === 'processing' && (
              <div className="text-center space-y-6 py-8">
                <Loader2 className="w-16 h-16 mx-auto animate-spin text-primary" />
                <div>
                  <h2 className="text-lg font-semibold text-white mb-2">Processing Recharge</h2>
                  <p className="text-gray-400">Please wait while we process your recharge...</p>
                </div>
              </div>
            )}

            {rechargeStep === 'success' && selectedPlan && (
              <div className="text-center space-y-6 py-8">
                <CheckCircle className="w-16 h-16 mx-auto text-green-400" />
                <div>
                  <h2 className="text-lg font-semibold text-white mb-2">Recharge Successful!</h2>
                  <p className="text-gray-400">₹{selectedPlan.amount} recharged for {phoneNumber}</p>
                  <p className="text-sm text-gray-500">Transaction ID: TXN{Date.now()}</p>
                </div>
                <Button 
                  onClick={() => {
                    resetModal();
                    navigate('/wallet');
                  }} 
                  className="w-full btn-cyber h-12"
                >
                  Done
                </Button>
              </div>
            )}

            {rechargeStep === 'failed' && (
              <div className="text-center space-y-6 py-8">
                <AlertCircle className="w-16 h-16 mx-auto text-red-400" />
                <div>
                  <h2 className="text-lg font-semibold text-white mb-2">Recharge Failed</h2>
                  <p className="text-gray-400">Unable to process your recharge. Please try again.</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setRechargeStep('pin')}
                    variant="outline"
                    className="flex-1 h-12"
                  >
                    Retry
                  </Button>
                  <Button 
                    onClick={() => {
                      resetModal();
                      navigate('/wallet');
                    }} 
                    className="flex-1 btn-cyber h-12"
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default RechargePage;