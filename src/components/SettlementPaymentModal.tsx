import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CreditCard, 
  Smartphone, 
  Building,
  ArrowRight,
  CheckCircle,
  Loader2,
  Shield,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { useInitiateSettlementPayment, useVerifySettlementPayment } from '@/hooks/useSettlementPayment';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  avatar?: { url?: string };
}

interface Settlement {
  fromUserId: string;
  toUserId: string;
  amount: number;
  groupId: string;
  currency: string;
  fromUser: User;
  toUser: User;
}

interface SettlementPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  settlement: Settlement | null;
  onPaymentComplete: (result: any) => void;
}

interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ElementType;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  recommended?: boolean;
}

const SettlementPaymentModal: React.FC<SettlementPaymentModalProps> = ({
  isOpen,
  onClose,
  settlement,
  onPaymentComplete
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedMethod, setSelectedMethod] = useState<string>('upi');
  const [isProcessing, setIsProcessing] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [step, setStep] = useState<'select' | 'processing' | 'success' | 'failed'>('select');

  const initiatePaymentMutation = useInitiateSettlementPayment();
  const verifyPaymentMutation = useVerifySettlementPayment();

  // Payment method options
  const paymentMethods: PaymentMethod[] = [
    {
      id: 'upi',
      name: 'UPI Payment',
      icon: Smartphone,
      description: 'Pay with any UPI app (GPay, PhonePe, Paytm)',
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/30',
      recommended: true
    },
    {
      id: 'card',
      name: 'Credit/Debit Card',
      icon: CreditCard,
      description: 'Visa, Mastercard, RuPay, Amex',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30'
    },
    {
      id: 'netbanking',
      name: 'Net Banking',
      icon: Building,
      description: 'Direct bank transfer',
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/30'
    }
  ];

  // Load Razorpay script
  useEffect(() => {
    if (isOpen && !window.Razorpay) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => setRazorpayLoaded(true);
      script.onerror = () => {
        toast({
          title: "Payment Gateway Error",
          description: "Failed to load payment gateway. Please try again.",
          variant: "destructive"
        });
      };
      document.body.appendChild(script);
    } else if (window.Razorpay) {
      setRazorpayLoaded(true);
    }
  }, [isOpen, toast]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep('select');
      setIsProcessing(false);
      setSelectedMethod('upi');
    }
  }, [isOpen]);

  const formatCurrency = (amount: number, currency: string = 'INR'): string => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  const handlePayment = async () => {
    if (!settlement || !razorpayLoaded) return;

    setIsProcessing(true);
    setStep('processing');

    try {
      // 1. Initiate payment on backend
      const paymentOrder = await initiatePaymentMutation.mutateAsync({
        groupId: settlement.groupId,
        toUserId: settlement.toUserId,
        amount: settlement.amount,
        method: selectedMethod,
        description: `Settlement payment to ${settlement.toUser.firstName} ${settlement.toUser.lastName}`
      });

      // 2. Configure Razorpay options
      const options = {
        key: paymentOrder.razorpayKeyId,
        amount: paymentOrder.amount,
        currency: paymentOrder.currency,
        name: "ZenithWallet",
        description: `Settlement Payment - ${settlement.toUser.firstName} ${settlement.toUser.lastName}`,
        order_id: paymentOrder.orderId,
        handler: async (response: any) => {
          try {
            // 3. Verify payment on backend
            const result = await verifyPaymentMutation.mutateAsync({
              paymentId: paymentOrder.paymentId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });
            
            console.log('✅ Payment verified successfully:', result);
            console.log('Invalidating queries for groupId:', settlement?.groupId);
            
            // Invalidate and refetch ALL balance-related queries immediately
            if (settlement?.groupId) {
              await Promise.all([
                // Group-specific balance queries
                queryClient.invalidateQueries({ queryKey: ['balances', 'group', settlement.groupId] }),
                queryClient.invalidateQueries({ queryKey: ['balances', settlement.groupId] }),
                
                // Group detail which includes balances
                queryClient.invalidateQueries({ queryKey: ['groups', 'detail', settlement.groupId] }),
                
                // General balances
                queryClient.invalidateQueries({ queryKey: ['balances'] }),
                
                // Settlement suggestions
                queryClient.invalidateQueries({ queryKey: ['balances', 'group', settlement.groupId, 'suggestions'] }),
                
                // Force refetch immediately
                queryClient.refetchQueries({ queryKey: ['balances', 'group', settlement.groupId] }),
                queryClient.refetchQueries({ queryKey: ['groups', 'detail', settlement.groupId] })
              ]);
              
              console.log('✅ All balance queries invalidated and refetching');
            }
            
            setStep('success');
            setIsProcessing(false);
            
            // Call completion callback
            onPaymentComplete(result);
            
            // Close modal after delay
            setTimeout(() => {
              onClose();
            }, 2000);
            
          } catch (error) {
            console.error('Payment verification failed:', error);
            setStep('failed');
            setIsProcessing(false);
          }
        },
        modal: {
          ondismiss: () => {
            setStep('select');
            setIsProcessing(false);
            toast({
              title: "Payment Cancelled",
              description: "Settlement payment was cancelled.",
            });
          }
        },
        prefill: {
          name: `${settlement.fromUser.firstName} ${settlement.fromUser.lastName}`,
        },
        theme: {
          color: '#00D2FF'
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();

    } catch (error: any) {
      console.error('Payment initiation failed:', error);
      setStep('failed');
      setIsProcessing(false);
      
      toast({
        title: "Payment Failed",
        description: error.message || "Failed to initiate payment. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (!settlement) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-black/95 border-white/20 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Complete Settlement Payment
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Settlement Summary */}
          <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="w-12 h-12 ring-2 ring-red-500/30">
                    <AvatarImage src={settlement.fromUser.avatar?.url} />
                    <AvatarFallback className="bg-red-500/20 text-red-400">
                      {settlement.fromUser.firstName.charAt(0)}{settlement.fromUser.lastName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-white">
                      {settlement.fromUser.firstName} {settlement.fromUser.lastName}
                    </h3>
                    <p className="text-sm text-white/60">Paying</p>
                  </div>
                </div>

                <ArrowRight className="w-6 h-6 text-primary" />

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <h3 className="font-semibold text-white">
                      {settlement.toUser.firstName} {settlement.toUser.lastName}
                    </h3>
                    <p className="text-sm text-white/60">Receiving</p>
                  </div>
                  <Avatar className="w-12 h-12 ring-2 ring-green-500/30">
                    <AvatarImage src={settlement.toUser.avatar?.url} />
                    <AvatarFallback className="bg-green-500/20 text-green-400">
                      {settlement.toUser.firstName.charAt(0)}{settlement.toUser.lastName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>

              <Separator className="my-4 bg-white/10" />

              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">
                  {formatCurrency(settlement.amount, settlement.currency)}
                </div>
                <p className="text-white/60 text-sm">Settlement Amount</p>
              </div>
            </CardContent>
          </Card>

          {/* Payment Method Selection */}
          {step === 'select' && (
            <div className="space-y-4">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                Choose Payment Method
              </h3>

              <div className="grid grid-cols-1 gap-4">
                {paymentMethods.map((method) => {
                  const Icon = method.icon;
                  const isSelected = selectedMethod === method.id;

                  return (
                    <Card
                      key={method.id}
                      className={`cursor-pointer transition-all duration-300 hover:scale-105 glass-card border ${method.borderColor} hover:shadow-glow ${
                        isSelected ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setSelectedMethod(method.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-3 rounded-full ${method.bgColor}`}>
                            <Icon className={`w-6 h-6 ${method.color}`} />
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-white">{method.name}</h4>
                              {method.recommended && (
                                <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
                                  Recommended
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-white/60">{method.description}</p>
                          </div>

                          <div className="w-5 h-5 rounded-full border-2 border-white/30 flex items-center justify-center">
                            {isSelected && (
                              <div className="w-3 h-3 rounded-full bg-primary" />
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button 
                  variant="outline" 
                  onClick={onClose}
                  className="flex-1 border-white/30 text-white hover:bg-white/10"
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handlePayment}
                  className="flex-1 bg-primary hover:bg-primary/90 text-white"
                  disabled={isProcessing || !razorpayLoaded}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Pay {formatCurrency(settlement.amount)}
                </Button>
              </div>
            </div>
          )}

          {/* Processing State */}
          {step === 'processing' && (
            <div className="text-center py-8">
              <Loader2 className="w-16 h-16 mx-auto text-primary animate-spin mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Processing Payment</h3>
              <p className="text-white/60">Please complete the payment in the gateway...</p>
            </div>
          )}

          {/* Success State */}
          {step === 'success' && (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 mx-auto text-green-400 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Payment Successful!</h3>
              <p className="text-white/60">Settlement completed successfully</p>
              <p className="text-sm text-white/40 mt-2">Balances have been updated</p>
            </div>
          )}

          {/* Failed State */}
          {step === 'failed' && (
            <div className="text-center py-8">
              <AlertCircle className="w-16 h-16 mx-auto text-red-400 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Payment Failed</h3>
              <p className="text-white/60">Something went wrong with the payment</p>
              <div className="flex gap-2 mt-4">
                <Button 
                  variant="outline"
                  onClick={() => setStep('select')}
                  className="flex-1 border-white/30 text-white hover:bg-white/10"
                >
                  Try Again
                </Button>
                <Button 
                  onClick={onClose}
                  className="flex-1"
                >
                  Close
                </Button>
              </div>
            </div>
          )}

          {/* Security Note */}
          {step === 'select' && (
            <Card className="bg-blue-500/5 border-blue-500/20">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-blue-400 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="font-medium text-blue-400">Secure Payment</h4>
                    <p className="text-sm text-white/70">
                      All payments are processed securely through Razorpay. Your payment information 
                      is encrypted and never stored on our servers.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettlementPaymentModal;