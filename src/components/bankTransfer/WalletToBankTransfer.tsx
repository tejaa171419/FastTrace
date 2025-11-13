import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Building2, Send, Loader2, AlertCircle, CheckCircle2, Plus } from "lucide-react";
import { useBankTransfer, BankAccount } from "@/hooks/useBankTransfer";
import { useToast } from "@/hooks/use-toast";

interface WalletToBankTransferProps {
  bankAccounts: BankAccount[];
  walletBalance: number;
  onTransferComplete: () => void;
  onAddAccount: () => void;
}

export const WalletToBankTransfer = ({
  bankAccounts,
  walletBalance,
  onTransferComplete,
  onAddAccount
}: WalletToBankTransferProps) => {
  const { toast } = useToast();
  const { initiateTransfer, loading } = useBankTransfer();

  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [pin, setPin] = useState("");
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [fees, setFees] = useState({ processing: 0, gst: 0, total: 0 });

  const selectedAccount = bankAccounts.find(acc => acc._id === selectedAccountId);

  // Calculate fees
  const calculateFees = (transferAmount: number) => {
    const processingFee = transferAmount >= 25000 ? 5 : 0;
    const gst = processingFee * 0.18;
    const total = processingFee + gst;
    return { processing: processingFee, gst, total };
  };

  const handleAmountChange = (value: string) => {
    setAmount(value);
    const numAmount = parseFloat(value);
    if (numAmount > 0) {
      setFees(calculateFees(numAmount));
    } else {
      setFees({ processing: 0, gst: 0, total: 0 });
    }
  };

  const handleProceedToPin = () => {
    // Validations
    if (!selectedAccountId) {
      toast({
        title: "No account selected",
        description: "Please select a bank account",
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

    if (numAmount < 100) {
      toast({
        title: "Minimum amount required",
        description: "Minimum transfer amount is ₹100",
        variant: "destructive",
      });
      return;
    }

    const totalAmount = numAmount + fees.total;
    if (totalAmount > walletBalance) {
      toast({
        title: "Insufficient balance",
        description: `You need ₹${totalAmount.toFixed(2)} (₹${numAmount} + ₹${fees.total.toFixed(2)} fees) but have ₹${walletBalance.toFixed(2)}`,
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
        transferType: 'wallet_to_bank',
        amount: parseFloat(amount),
        description: description || 'Withdrawal to bank account',
        purpose: 'personal',
        pin,
        sourceType: 'wallet',
        destinationType: 'bank',
        destinationBankAccountId: selectedAccountId
      });

      setShowPinDialog(false);
      setAmount("");
      setDescription("");
      setPin("");
      setSelectedAccountId("");

      onTransferComplete();

      toast({
        title: "Transfer initiated!",
        description: `₹${amount} will be transferred to your bank account within 1-2 business days`,
      });
    } catch (error: any) {
      toast({
        title: "Transfer failed",
        description: error.message || "Failed to process transfer",
        variant: "destructive",
      });
    }
  };

  if (bankAccounts.length === 0) {
    return (
      <div className="text-center py-12">
        <Building2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground/40" />
        <h3 className="text-lg font-semibold mb-2">No Bank Accounts</h3>
        <p className="text-muted-foreground text-sm mb-6">
          Add a bank account to start withdrawing money from your wallet
        </p>
        <Button onClick={onAddAccount} className="bg-gradient-primary">
          <Plus className="w-4 h-4 mr-2" />
          Add Bank Account
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Bank Account Selection */}
      <div className="space-y-2">
        <Label htmlFor="bankAccount">Select Bank Account</Label>
        <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
          <SelectTrigger className="glass-card border-white/20">
            <SelectValue placeholder="Choose a bank account" />
          </SelectTrigger>
          <SelectContent>
            {bankAccounts.map((account) => (
              <SelectItem key={account._id} value={account._id}>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{account.bankName}</span>
                  <span className="text-muted-foreground">••••{account.accountNumber.slice(-4)}</span>
                  {account.isVerified && (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Selected Account Details */}
      {selectedAccount && (
        <div className="glass-card border-white/10 rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">{selectedAccount.bankName}</p>
              <p className="text-sm text-muted-foreground">{selectedAccount.accountHolderName}</p>
            </div>
            <Building2 className="w-8 h-8 text-primary/60" />
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
            <div>
              <p className="text-xs text-muted-foreground">Account</p>
              <p className="font-mono text-sm">••••{selectedAccount.accountNumber.slice(-4)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">IFSC</p>
              <p className="font-mono text-sm">{selectedAccount.ifscCode}</p>
            </div>
          </div>
          {!selectedAccount.isVerified && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                This account is not verified. Transfers may take longer.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

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
            onChange={(e) => handleAmountChange(e.target.value)}
            className="pl-8 text-lg glass-card border-white/20"
          />
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            Min: ₹100 • Available: ₹{walletBalance.toLocaleString('en-IN')}
          </span>
          {fees.total > 0 && (
            <span className="text-orange-500">+ ₹{fees.total.toFixed(2)} fees</span>
          )}
        </div>
      </div>

      {/* Quick Amount Buttons */}
      <div className="grid grid-cols-4 gap-2">
        {[500, 1000, 5000, 10000].map((value) => (
          <Button
            key={value}
            variant="outline"
            size="sm"
            onClick={() => handleAmountChange(value.toString())}
            className="glass-card border-white/20"
            disabled={value > walletBalance}
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
          placeholder="Purpose of withdrawal"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="glass-card border-white/20"
        />
      </div>

      {/* Fee Breakdown */}
      {fees.total > 0 && (
        <div className="glass-card border-white/10 rounded-lg p-4 space-y-2">
          <p className="text-sm font-semibold">Fee Breakdown</p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Transfer Amount</span>
              <span>₹{parseFloat(amount || '0').toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Processing Fee</span>
              <span>₹{fees.processing.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">GST (18%)</span>
              <span>₹{fees.gst.toFixed(2)}</span>
            </div>
            <div className="border-t border-white/10 pt-2 flex justify-between font-semibold">
              <span>Total Deduction</span>
              <span className="text-primary">₹{(parseFloat(amount || '0') + fees.total).toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Processing Info */}
      <Alert className="glass-card border-blue-500/20">
        <AlertCircle className="h-4 w-4 text-blue-500" />
        <AlertDescription className="text-sm">
          Bank transfers typically take 1-2 business days to process.
        </AlertDescription>
      </Alert>

      {/* Transfer Button */}
      <Button
        className="w-full bg-gradient-to-r from-green-500 to-emerald-500 shadow-glow h-12"
        onClick={handleProceedToPin}
        disabled={!selectedAccountId || !amount || loading}
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Send className="w-5 h-5 mr-2" />
            Withdraw ₹{amount || "0"}
          </>
        )}
      </Button>

      {/* PIN Dialog */}
      <Dialog open={showPinDialog} onOpenChange={setShowPinDialog}>
        <DialogContent className="glass-card border-primary/20">
          <DialogHeader>
            <DialogTitle>Confirm Withdrawal</DialogTitle>
            <DialogDescription>
              Enter your transaction PIN to complete this withdrawal
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {selectedAccount && (
              <div className="glass-card border-white/10 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">Withdrawing to</span>
                  <span className="font-medium">{selectedAccount.bankName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">Account</span>
                  <span className="font-mono text-sm">••••{selectedAccount.accountNumber.slice(-4)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">Amount</span>
                  <span className="font-bold text-2xl text-green-500">₹{amount}</span>
                </div>
                {fees.total > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">+ Fees</span>
                    <span>₹{fees.total.toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}

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
              className="bg-gradient-to-r from-green-500 to-emerald-500"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Confirm Withdrawal
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
