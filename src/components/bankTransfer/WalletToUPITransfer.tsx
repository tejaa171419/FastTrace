import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Smartphone, Send, Loader2, AlertCircle, CheckCircle2, Zap } from "lucide-react";
import { useBankTransfer } from "@/hooks/useBankTransfer";
import { useToast } from "@/hooks/use-toast";

interface WalletToUPITransferProps {
  walletBalance: number;
  onTransferComplete: () => void;
}

export const WalletToUPITransfer = ({
  walletBalance,
  onTransferComplete
}: WalletToUPITransferProps) => {
  const { toast } = useToast();
  const { initiateTransfer, loading } = useBankTransfer();

  const [upiId, setUpiId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [pin, setPin] = useState("");
  const [showPinDialog, setShowPinDialog] = useState(false);

  const UPI_FEE = 2; // ₹2 flat fee
  const GST = UPI_FEE * 0.18;
  const TOTAL_FEE = UPI_FEE + GST;

  const validateUpiId = (id: string): boolean => {
    // UPI ID format: username@bankname
    const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/;
    return upiRegex.test(id);
  };

  const handleProceedToPin = () => {
    // Validations
    if (!upiId) {
      toast({
        title: "UPI ID required",
        description: "Please enter a valid UPI ID",
        variant: "destructive",
      });
      return;
    }

    if (!validateUpiId(upiId)) {
      toast({
        title: "Invalid UPI ID",
        description: "UPI ID format should be like: username@bankname",
        variant: "destructive",
      });
      return;
    }

    const numAmount = parseFloat(amount);
    if (!amount || numAmount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    if (numAmount < 10) {
      toast({
        title: "Minimum amount required",
        description: "Minimum UPI transfer amount is ₹10",
        variant: "destructive",
      });
      return;
    }

    if (numAmount > 100000) {
      toast({
        title: "Amount exceeds limit",
        description: "Maximum UPI transfer amount is ₹1,00,000",
        variant: "destructive",
      });
      return;
    }

    const totalAmount = numAmount + TOTAL_FEE;
    if (totalAmount > walletBalance) {
      toast({
        title: "Insufficient balance",
        description: `You need ₹${totalAmount.toFixed(2)} (₹${numAmount} + ₹${TOTAL_FEE.toFixed(2)} fees) but have ₹${walletBalance.toFixed(2)}`,
        variant: "destructive",
      });
      return;
    }

    setShowPinDialog(true);
  };

  const handleTransfer = async () => {
    if (!pin || pin.length < 4) {
      toast({
        title: "Invalid PIN",
        description: "Please enter your 4-6 digit PIN",
        variant: "destructive",
      });
      return;
    }

    try {
      await initiateTransfer({
        transferType: 'wallet_to_upi',
        amount: parseFloat(amount),
        description: description || `UPI transfer to ${upiId}`,
        purpose: 'personal',
        pin,
        sourceType: 'wallet',
        destinationType: 'upi',
        destinationUpiId: upiId
      });

      setShowPinDialog(false);
      setAmount("");
      setDescription("");
      setPin("");
      setUpiId("");

      onTransferComplete();

      toast({
        title: "Transfer successful!",
        description: `₹${amount} sent to ${upiId} instantly`,
      });
    } catch (error: any) {
      toast({
        title: "Transfer failed",
        description: error.message || "Failed to process transfer",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* UPI ID Input */}
      <div className="space-y-2">
        <Label htmlFor="upiId">Recipient UPI ID</Label>
        <div className="relative">
          <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            id="upiId"
            type="text"
            placeholder="username@bankname"
            value={upiId}
            onChange={(e) => setUpiId(e.target.value.toLowerCase())}
            className="pl-10 glass-card border-white/20"
          />
        </div>
        {upiId && !validateUpiId(upiId) && (
          <p className="text-xs text-red-500">Invalid UPI ID format</p>
        )}
        {upiId && validateUpiId(upiId) && (
          <p className="text-xs text-green-500 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Valid UPI ID
          </p>
        )}
      </div>

      {/* Common UPI Providers */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">Common UPI Providers:</p>
        <div className="flex flex-wrap gap-2">
          {['@paytm', '@phonepe', '@ybl', '@oksbi', '@icici'].map((provider) => (
            <Button
              key={provider}
              variant="outline"
              size="sm"
              onClick={() => {
                const username = upiId.split('@')[0] || '';
                setUpiId(username + provider);
              }}
              className="glass-card border-white/20 text-xs"
            >
              {provider}
            </Button>
          ))}
        </div>
      </div>

      {/* Amount */}
      <div className="space-y-2">
        <Label htmlFor="amount">Amount (₹)</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-semibold text-primary">₹</span>
          <Input
            id="amount"
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="pl-8 text-lg glass-card border-white/20"
          />
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            Min: ₹10 • Max: ₹1,00,000 • Available: ₹{walletBalance.toLocaleString('en-IN')}
          </span>
          <span className="text-orange-500">+ ₹{TOTAL_FEE.toFixed(2)} fees</span>
        </div>
      </div>

      {/* Quick Amount Buttons */}
      <div className="grid grid-cols-4 gap-2">
        {[100, 500, 1000, 5000].map((value) => (
          <Button
            key={value}
            variant="outline"
            size="sm"
            onClick={() => setAmount(value.toString())}
            className="glass-card border-white/20"
            disabled={value + TOTAL_FEE > walletBalance}
          >
            ₹{value >= 1000 ? `${value / 1000}k` : value}
          </Button>
        ))}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Note (Optional)</Label>
        <Input
          id="description"
          placeholder="What's this payment for?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="glass-card border-white/20"
          maxLength={100}
        />
      </div>

      {/* Fee Breakdown */}
      {amount && parseFloat(amount) > 0 && (
        <div className="glass-card border-white/10 rounded-lg p-4 space-y-2">
          <p className="text-sm font-semibold">Payment Summary</p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Transfer Amount</span>
              <span>₹{parseFloat(amount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">UPI Processing Fee</span>
              <span>₹{UPI_FEE.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">GST (18%)</span>
              <span>₹{GST.toFixed(2)}</span>
            </div>
            <div className="border-t border-white/10 pt-2 flex justify-between font-semibold">
              <span>Total Deduction</span>
              <span className="text-primary">₹{(parseFloat(amount) + TOTAL_FEE).toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Instant Transfer Info */}
      <Alert className="glass-card border-purple-500/20">
        <Zap className="h-4 w-4 text-purple-500" />
        <AlertDescription className="text-sm">
          <strong>Instant Transfer!</strong> Your money will be sent immediately to the recipient's UPI account.
        </AlertDescription>
      </Alert>

      {/* Transfer Button */}
      <Button
        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 shadow-glow h-12"
        onClick={handleProceedToPin}
        disabled={!upiId || !validateUpiId(upiId) || !amount || loading}
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Send className="w-5 h-5 mr-2" />
            Pay ₹{amount || "0"} via UPI
          </>
        )}
      </Button>

      {/* PIN Dialog */}
      <Dialog open={showPinDialog} onOpenChange={setShowPinDialog}>
        <DialogContent className="glass-card border-primary/20">
          <DialogHeader>
            <DialogTitle>Confirm UPI Payment</DialogTitle>
            <DialogDescription>
              Enter your transaction PIN to complete this payment
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="glass-card border-white/10 rounded-lg p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground text-sm">Paying to</span>
                <span className="font-medium font-mono">{upiId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground text-sm">Amount</span>
                <span className="font-bold text-2xl text-purple-500">₹{amount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">+ Fees</span>
                <span>₹{TOTAL_FEE.toFixed(2)}</span>
              </div>
              {description && (
                <div className="flex justify-between text-sm pt-2 border-t border-white/10">
                  <span className="text-muted-foreground">Note</span>
                  <span className="text-right">{description}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="pin">Transaction PIN</Label>
              <Input
                id="pin"
                type="password"
                placeholder="Enter 4-6 digit PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                maxLength={6}
                className="glass-card border-white/20 text-center text-2xl tracking-widest"
                autoFocus
              />
            </div>

            <Alert className="glass-card border-purple-500/20">
              <Zap className="h-4 w-4 text-purple-500" />
              <AlertDescription className="text-xs">
                This payment will be processed instantly. Please ensure the UPI ID is correct.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowPinDialog(false);
                setPin("");
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleTransfer}
              disabled={!pin || pin.length < 4 || loading}
              className="bg-gradient-to-r from-purple-500 to-pink-500"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Confirm Payment
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
