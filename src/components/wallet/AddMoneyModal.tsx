import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { walletAPI } from '@/lib/walletAPI';
import { useAuth } from '@/contexts/AuthContext';
import type { WalletData, WalletError, PaymentOrder } from '@/types/wallet';
import { emitWalletTopup, emitBalanceUpdate } from '@/lib/walletEvents';
import {
  Plus,
  CreditCard,
  Smartphone,
  Building,
  Shield,
  AlertTriangle,
  CheckCircle,
  X,
  Loader2,
  Zap,
  Banknote,
  Wallet
} from 'lucide-react';

// Razorpay types
declare global {
  interface Window {
    Razorpay: any;
  }
}

interface AddMoneyModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallet: WalletData;
  onSuccess: () => void;
  onError: (error: WalletError) => void;
}

const AddMoneyModal: React.FC<AddMoneyModalProps> = ({
  isOpen,
  onClose,
  wallet,
  onSuccess,
  onError
}) => {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'input' | 'processing' | 'success' | 'failed'>('input');
  const [paymentOrder, setPaymentOrder] = useState<PaymentOrder | null>(null);
  // Keep a ref copy to avoid race conditions in Razorpay callback
  const paymentOrderRef = useRef<PaymentOrder | null>(null);
  const [error, setError] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const { user } = useAuth();

  // Predefined amounts for quick selection
  const quickAmounts = [100, 500, 1000, 2000, 5000, 10000];

  // Payment method options
  const paymentMethods = [
    {
      id: 'upi',
      name: 'UPI',
      icon: Smartphone,
      description: 'Pay with UPI apps like GPay, PhonePe, Paytm',
      popular: true
    },
    {
      id: 'card',
      name: 'Credit/Debit Card',
      icon: CreditCard,
      description: 'Visa, Mastercard, RuPay, Amex'
    },
    {
      id: 'netbanking',
      name: 'Net Banking',
      icon: Building,
      description: 'Pay directly from your bank account'
    }
  ];

  // Load Razorpay script
  useEffect(() => {
    if (isOpen && !window.Razorpay) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => {
        console.log('Razorpay SDK loaded successfully');
      };
      script.onerror = () => {
        setError('Failed to load payment gateway. Please try again.');
      };
      document.body.appendChild(script);
    }
  }, [isOpen]);

  // Reset modal state when opening
  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setMethod('upi');
      setDescription('');
      setStep('input');
      setError('');
      setValidationErrors({});
      setPaymentOrder(null);
    }
  }, [isOpen]);

  // Validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!amount || parseFloat(amount) <= 0) {
      errors.amount = 'Please enter a valid amount';
    } else if (parseFloat(amount) < 1) {
      errors.amount = 'Minimum amount is ₹1';
    } else if (parseFloat(amount) > 100000) {
      errors.amount = 'Maximum amount is ₹1,00,000';
    }

    if (!method) {
      errors.method = 'Please select a payment method';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Calculate fees (if any)
  const calculateFees = (amount: number): number => {
    // UPI is typically free, cards might have fees
    if (method === 'card' && amount > 2000) {
      return Math.round(amount * 0.02); // 2% for cards above ₹2000
    }
    return 0;
  };

  // Handle quick amount selection
  const selectQuickAmount = (quickAmount: number) => {
    setAmount(quickAmount.toString());
    setValidationErrors({});
  };

  // Handle payment initiation
  const handlePayment = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      setStep('processing');
      setError('');

      const amountValue = parseFloat(amount);
      const fees = calculateFees(amountValue);
      
      // Create payment order
      const orderData = await walletAPI.createTopupOrder(
        amountValue,
        method,
        description || `Wallet top-up of ₹${amount}`
      );

      setPaymentOrder(orderData);
      paymentOrderRef.current = orderData;

      // Configure Razorpay options
      const options = {
        key: orderData.razorpayKeyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "ZenithWallet",
        description: `Add ₹${amount} to wallet`,
        order_id: orderData.orderId,
        handler: handlePaymentSuccess,
        modal: {
          ondismiss: handlePaymentDismiss
        },
        prefill: {
          name: `${user?.firstName} ${user?.lastName}`,
          email: user?.email,
          contact: user?.phone || ""
        },
        notes: {
          wallet_topup: 'true',
          user_id: user?.id,
          amount: amountValue.toString()
        },
        theme: {
          color: "#3B82F6"
        },
        method: {
          upi: method === 'upi',
          card: method === 'card',
          netbanking: method === 'netbanking',
          wallet: false
        }
      };

      // Open Razorpay payment dialog
      const paymentObject = new window.Razorpay(options);
      paymentObject.open();

    } catch (error: any) {
      console.error('Payment initiation failed:', error);
      setError(error.message || 'Failed to initiate payment');
      setStep('failed');
      onError(error);
    } finally {
      setLoading(false);
    }
  };

  // Handle successful payment
  const handlePaymentSuccess = async (response: any) => {
    try {
      setStep('processing');
      
      // Resolve the pending payment context safely
      const pending = paymentOrderRef.current || paymentOrder;
      if (!pending?.paymentId) {
        throw new Error('Missing payment context (paymentId). Please try again.');
      }
      // Verify payment on backend
      const result = await walletAPI.verifyPayment({
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
        payment_id: pending.paymentId
      });

      setStep('success');
      
      // Emit wallet events for cross-component updates
      const amountValue = parseFloat(amount);
      emitWalletTopup(amountValue, {
        source: 'razorpay',
        orderId: response.razorpay_order_id,
        paymentId: response.razorpay_payment_id,
        method: method,
        timestamp: new Date().toISOString()
      });
      
      // If result contains new balance, emit it
      if (result?.wallet?.balance) {
        emitBalanceUpdate(result.wallet.balance, {
          source: 'wallet_topup',
          previousBalance: wallet.balance
        });
      }
      
      // Notify parent components
      onSuccess();
      
      // Auto-close after 3 seconds
      setTimeout(() => {
        onClose();
      }, 3000);

    } catch (error: any) {
      console.error('Payment verification failed:', error);
      setError('Payment verification failed. Please contact support if money was deducted.');
      setStep('failed');
      onError(error);
    }
  };

  // Handle payment dismissal
  const handlePaymentDismiss = () => {
    setStep('input');
    setError('Payment was cancelled');
  };

  // Render payment method card
  const renderPaymentMethod = (paymentMethod: any) => {
    const IconComponent = paymentMethod.icon;
    const isSelected = method === paymentMethod.id;

    return (
      <Card 
        key={paymentMethod.id}
        className={`cursor-pointer transition-all duration-200 ${
          isSelected 
            ? 'border-blue-500 bg-blue-500/10' 
            : 'border-gray-700 hover:border-gray-600 bg-gray-800/30'
        }`}
        onClick={() => setMethod(paymentMethod.id)}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              isSelected ? 'bg-blue-500/20' : 'bg-gray-700/50'
            }`}>
              <IconComponent className={`w-5 h-5 ${
                isSelected ? 'text-blue-400' : 'text-gray-400'
              }`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className={`font-semibold ${
                  isSelected ? 'text-blue-300' : 'text-white'
                }`}>
                  {paymentMethod.name}
                </span>
                {paymentMethod.popular && (
                  <Badge className="bg-green-500/20 text-green-400 text-xs px-2 py-0.5">
                    Popular
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-400 mt-1">
                {paymentMethod.description}
              </p>
            </div>
            {isSelected && (
              <CheckCircle className="w-5 h-5 text-blue-400" />
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Render step content
  const renderStepContent = () => {
    switch (step) {
      case 'input':
        return (
          <div className="space-y-6">
            {/* Amount Input */}
            <div>
              <Label htmlFor="amount" className="text-white font-medium">Amount</Label>
              <div className="mt-2">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">₹</span>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Enter amount"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      setValidationErrors({});
                    }}
                    className="pl-8 bg-gray-900/50 border-gray-700 text-white text-lg font-semibold"
                    min="1"
                    max="100000"
                  />
                </div>
                {validationErrors.amount && (
                  <p className="text-red-400 text-sm mt-1">{validationErrors.amount}</p>
                )}
              </div>
              
              {/* Quick Amount Selection */}
              <div className="mt-3">
                <p className="text-sm text-gray-400 mb-2">Quick select:</p>
                <div className="grid grid-cols-3 gap-2">
                  {quickAmounts.map((quickAmount) => (
                    <Button
                      key={quickAmount}
                      variant="outline"
                      size="sm"
                      onClick={() => selectQuickAmount(quickAmount)}
                      className="border-gray-700 text-gray-300 hover:bg-blue-500/20 hover:border-blue-500"
                    >
                      ₹{quickAmount.toLocaleString()}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Payment Method Selection */}
            <div>
              <Label className="text-white font-medium">Payment Method</Label>
              <div className="mt-3 space-y-3">
                {paymentMethods.map(renderPaymentMethod)}
              </div>
              {validationErrors.method && (
                <p className="text-red-400 text-sm mt-1">{validationErrors.method}</p>
              )}
            </div>

            {/* Description (Optional) */}
            <div>
              <Label htmlFor="description" className="text-white font-medium">
                Description <span className="text-gray-400">(Optional)</span>
              </Label>
              <Input
                id="description"
                placeholder="Add a note for this transaction"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-2 bg-gray-900/50 border-gray-700 text-white"
                maxLength={500}
              />
            </div>

            {/* Transaction Summary */}
            {amount && parseFloat(amount) > 0 && (
              <Card className="bg-gray-800/30 border-gray-700">
                <CardContent className="p-4">
                  <h4 className="text-white font-semibold mb-3">Transaction Summary</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Amount</span>
                      <span className="text-white font-semibold">₹{parseFloat(amount).toLocaleString()}</span>
                    </div>
                    {calculateFees(parseFloat(amount)) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Processing Fee</span>
                        <span className="text-white">₹{calculateFees(parseFloat(amount))}</span>
                      </div>
                    )}
                    <div className="border-t border-gray-700 pt-2">
                      <div className="flex justify-between">
                        <span className="text-white font-semibold">Total</span>
                        <span className="text-white font-bold">
                          ₹{(parseFloat(amount) + calculateFees(parseFloat(amount))).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Security Notice */}
            <Alert className="border-blue-500/50 bg-blue-500/10">
              <Shield className="w-4 h-4" />
              <AlertDescription className="text-blue-100">
                Your payment is secured with industry-standard encryption. We never store your payment information.
              </AlertDescription>
            </Alert>

            {error && (
              <Alert className="border-red-500/50 bg-red-500/10">
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription className="text-red-100">{error}</AlertDescription>
              </Alert>
            )}
          </div>
        );

      case 'processing':
        return (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Processing Payment</h3>
            <p className="text-gray-400">Please complete the payment in the popup window</p>
            <div className="mt-4 max-w-xs mx-auto">
              <Progress value={75} className="h-2" />
            </div>
          </div>
        );

      case 'success':
        return (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Payment Successful!</h3>
            <p className="text-gray-400 mb-4">₹{amount} has been added to your wallet</p>
            <div className="flex items-center justify-center gap-2 text-sm text-green-400">
              <Zap className="w-4 h-4" />
              <span>Funds are now available in your wallet</span>
            </div>
          </div>
        );

      case 'failed':
        return (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center">
              <X className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Payment Failed</h3>
            <p className="text-gray-400 mb-4">{error || 'Something went wrong with your payment'}</p>
            <Button
              onClick={() => setStep('input')}
              className="bg-blue-500 hover:bg-blue-600"
            >
              Try Again
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-br from-gray-900 to-black border border-gray-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
              <Plus className="w-5 h-5" />
            </div>
            Add Money to Wallet
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {step === 'input' && 'Add money to your ZenithWallet using various payment methods'}
            {step === 'processing' && 'Completing your payment securely'}
            {step === 'success' && 'Your wallet has been topped up successfully'}
            {step === 'failed' && 'We encountered an issue with your payment'}
          </DialogDescription>
        </DialogHeader>

        {renderStepContent()}

        {step === 'input' && (
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePayment}
              disabled={loading || !amount || parseFloat(amount) <= 0}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Banknote className="w-4 h-4 mr-2" />
                  Pay ₹{amount ? parseFloat(amount).toLocaleString() : '0'}
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AddMoneyModal;