import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CreditCard, 
  Smartphone, 
  Wallet, 
  Building,
  QrCode,
  ArrowRight,
  CheckCircle,
  Loader2,
  ExternalLink,
  Shield
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  settlement: {
    from: {
      _id: string;
      firstName: string;
      lastName: string;
      avatar?: { url?: string };
    };
    to: {
      _id: string;
      firstName: string;
      lastName: string;
      avatar?: { url?: string };
    };
    amount: number;
    currency: string;
  } | null;
  onPaymentInitiated: (method: string, transactionId: string) => void;
}

interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ElementType;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  upiId?: string;
  redirectUrl?: string;
  available: boolean;
  recommended?: boolean;
}

const PaymentMethodModal: React.FC<PaymentMethodModalProps> = ({
  isOpen,
  onClose,
  settlement,
  onPaymentInitiated
}) => {
  const { toast } = useToast();
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const paymentMethods: PaymentMethod[] = [
    {
      id: 'gpay',
      name: 'Google Pay',
      icon: Smartphone,
      description: 'Pay instantly with Google Pay UPI',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
      upiId: 'gpay',
      available: true,
      recommended: true
    },
    {
      id: 'phonepe',
      name: 'PhonePe',
      icon: Smartphone,
      description: 'Quick payment with PhonePe UPI',
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/30',
      upiId: 'phonepe',
      available: true
    },
    {
      id: 'paytm',
      name: 'Paytm',
      icon: Wallet,
      description: 'Pay with Paytm Wallet or UPI',
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500/30',
      upiId: 'paytm',
      available: true
    },
    {
      id: 'upi',
      name: 'Other UPI Apps',
      icon: QrCode,
      description: 'Use any UPI-enabled app',
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/30',
      upiId: 'upi',
      available: true
    },
    {
      id: 'netbanking',
      name: 'Net Banking',
      icon: Building,
      description: 'Pay via your bank account',
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/30',
      available: true
    },
    {
      id: 'card',
      name: 'Debit/Credit Card',
      icon: CreditCard,
      description: 'Pay with your card',
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-500/10',
      borderColor: 'border-indigo-500/30',
      available: true
    }
  ];

  const formatCurrency = (amount: number, currency: string = 'INR') => {
    const symbol = currency === 'USD' ? '$' : '₹';
    return `${symbol}${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  const generateUPILink = (method: string) => {
    if (!settlement) return '';

    const receiverUPI = `${settlement.to.firstName.toLowerCase()}.${settlement.to.lastName.toLowerCase()}@paytm`; // This would be fetched from user profile
    const amount = settlement.amount;
    const note = `Settlement payment from ${settlement.from.firstName} to ${settlement.to.firstName}`;
    const transactionRef = `TXN${Date.now()}`;

    // UPI Intent format
    const upiIntent = `upi://pay?pa=${receiverUPI}&am=${amount}&cu=${settlement.currency}&tn=${encodeURIComponent(note)}&tr=${transactionRef}`;

    return upiIntent;
  };

  const handlePaymentMethod = async (methodId: string) => {
    if (!settlement) return;

    setSelectedMethod(methodId);
    setIsProcessing(true);

    try {
      const transactionId = `TXN${Date.now()}_${methodId}`;
      
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (methodId === 'gpay' || methodId === 'phonepe' || methodId === 'paytm' || methodId === 'upi') {
        // Generate UPI intent link
        const upiLink = generateUPILink(methodId);
        
        toast({
          title: "Redirecting to Payment App",
          description: `Opening ${paymentMethods.find(m => m.id === methodId)?.name}...`,
        });

        // Attempt to open UPI app
        window.location.href = upiLink;
        
        // Fallback: If UPI app doesn't open, show manual UPI details
        setTimeout(() => {
          toast({
            title: "Payment Initiated",
            description: "Please complete the payment in your UPI app and return to confirm.",
            duration: 5000
          });
        }, 2000);

      } else {
        // For non-UPI methods, show success message
        toast({
          title: "Payment Gateway",
          description: `Redirecting to ${paymentMethods.find(m => m.id === methodId)?.name} payment gateway...`,
        });
      }

      // Call the callback to update the UI
      onPaymentInitiated(methodId, transactionId);
      
      // Close modal after successful initiation
      setTimeout(() => {
        onClose();
        setIsProcessing(false);
        setSelectedMethod(null);
      }, 2000);

    } catch (error) {
      toast({
        title: "Payment Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
      setIsProcessing(false);
      setSelectedMethod(null);
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
                    <AvatarImage src={settlement.from.avatar?.url} />
                    <AvatarFallback className="bg-red-500/20 text-red-400">
                      {settlement.from.firstName.charAt(0)}{settlement.from.lastName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-white">
                      {settlement.from.firstName} {settlement.from.lastName}
                    </h3>
                    <p className="text-sm text-white/60">Paying</p>
                  </div>
                </div>

                <ArrowRight className="w-6 h-6 text-primary" />

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <h3 className="font-semibold text-white">
                      {settlement.to.firstName} {settlement.to.lastName}
                    </h3>
                    <p className="text-sm text-white/60">Receiving</p>
                  </div>
                  <Avatar className="w-12 h-12 ring-2 ring-green-500/30">
                    <AvatarImage src={settlement.to.avatar?.url} />
                    <AvatarFallback className="bg-green-500/20 text-green-400">
                      {settlement.to.firstName.charAt(0)}{settlement.to.lastName.charAt(0)}
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

          {/* Payment Methods */}
          <div className="space-y-4">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              Choose Payment Method
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {paymentMethods.map((method) => {
                const Icon = method.icon;
                const isSelected = selectedMethod === method.id;
                const isCurrentlyProcessing = isProcessing && isSelected;

                return (
                  <Card
                    key={method.id}
                    className={`cursor-pointer transition-all duration-300 hover:scale-105 ${
                      method.available 
                        ? `glass-card border ${method.borderColor} hover:shadow-glow ${isSelected ? 'ring-2 ring-primary' : ''}` 
                        : 'glass-card border-white/10 opacity-50 cursor-not-allowed'
                    }`}
                    onClick={() => method.available && !isProcessing && handlePaymentMethod(method.id)}
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
                            {!method.available && (
                              <Badge variant="outline" className="border-red-500/30 text-red-400 text-xs">
                                Coming Soon
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-white/60">{method.description}</p>
                        </div>

                        {isCurrentlyProcessing ? (
                          <Loader2 className="w-5 h-5 text-primary animate-spin" />
                        ) : method.available ? (
                          <ExternalLink className="w-5 h-5 text-white/40" />
                        ) : (
                          <div className="w-5 h-5" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Security Note */}
          <Card className="bg-blue-500/5 border-blue-500/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-blue-400 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-medium text-blue-400">Secure Payment</h4>
                  <p className="text-sm text-white/70">
                    All payments are processed securely. Your payment information is never stored on our servers.
                    After completing the payment, return to this app to confirm the settlement.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

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
              onClick={() => {
                toast({
                  title: "Payment Completed?",
                  description: "If you've completed the payment, we'll mark this settlement as paid.",
                });
                // This would typically involve a confirmation step
              }}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white"
              disabled={isProcessing}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              I've Completed Payment
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentMethodModal;