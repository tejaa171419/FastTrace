import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Building2, ArrowRightLeft, Loader2, CheckCircle2, AlertCircle, Plus, Search } from "lucide-react";
import { useBankTransfer, BankAccount } from "@/hooks/useBankTransfer";
import { useToast } from "@/hooks/use-toast";

interface BankToBankTransferProps {
  bankAccounts: BankAccount[];
  onTransferComplete: () => void;
  onAddAccount: () => void;
}

export const BankToBankTransfer = ({
  bankAccounts,
  onTransferComplete,
  onAddAccount
}: BankToBankTransferProps) => {
  const { toast } = useToast();
  const { initiateTransfer, lookupIFSC, loading } = useBankTransfer();

  const [sourceBankId, setSourceBankId] = useState("");
  const [useNewDestination, setUseNewDestination] = useState(false);
  const [destinationBankId, setDestinationBankId] = useState("");
  
  // For new destination bank
  const [destAccountNumber, setDestAccountNumber] = useState("");
  const [destIfscCode, setDestIfscCode] = useState("");
  const [destBankName, setDestBankName] = useState("");
  const [destAccountHolder, setDestAccountHolder] = useState("");
  const [ifscLookupLoading, setIfscLookupLoading] = useState(false);
  
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [pin, setPin] = useState("");
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [fees, setFees] = useState({ processing: 0, gst: 0, total: 0 });

  const sourceBank = bankAccounts.find(acc => acc._id === sourceBankId);
  const destinationBank = bankAccounts.find(acc => acc._id === destinationBankId);

  // Calculate IMPS fees
  const calculateFees = (transferAmount: number) => {
    const processingFee = Math.min(5 + (transferAmount * 0.005), 25); // ₹5 + 0.5% (max ₹25)
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

  const handleIFSCLookup = async () => {
    if (!destIfscCode || destIfscCode.length !== 11) {
      toast({
        title: "Invalid IFSC",
        description: "IFSC code must be 11 characters",
        variant: "destructive",
      });
      return;
    }

    setIfscLookupLoading(true);
    const details = await lookupIFSC(destIfscCode);
    setIfscLookupLoading(false);

    if (details) {
      setDestBankName(details.bankName);
      toast({
        title: "Bank found!",
        description: `${details.bankName} - ${details.branch}`,
      });
    } else {
      toast({
        title: "IFSC not found",
        description: "Please check the IFSC code",
        variant: "destructive",
      });
    }
  };

  const handleProceedToPin = () => {
    // Validations
    if (!sourceBankId) {
      toast({
        title: "Select source bank",
        description: "Please select your bank account",
        variant: "destructive",
      });
      return;
    }

    if (!useNewDestination && !destinationBankId) {
      toast({
        title: "Select destination",
        description: "Please select destination bank account",
        variant: "destructive",
      });
      return;
    }

    if (useNewDestination) {
      if (!destAccountNumber || !destIfscCode || !destBankName || !destAccountHolder) {
        toast({
          title: "Incomplete details",
          description: "Please fill all destination bank details",
          variant: "destructive",
        });
        return;
      }
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

    if (numAmount > 200000) {
      toast({
        title: "Amount exceeds limit",
        description: "Maximum IMPS transfer amount is ₹2,00,000",
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
      const transferData: any = {
        transferType: 'bank_to_bank',
        amount: parseFloat(amount),
        description: description || 'Bank to bank transfer',
        purpose: 'personal',
        pin,
        sourceType: 'bank',
        sourceBankAccountId: sourceBankId,
        destinationType: 'bank',
      };

      if (useNewDestination) {
        transferData.destinationAccountNumber = destAccountNumber;
        transferData.destinationIfscCode = destIfscCode;
        transferData.destinationBankName = destBankName;
        transferData.destinationAccountHolderName = destAccountHolder;
      } else {
        transferData.destinationBankAccountId = destinationBankId;
      }

      await initiateTransfer(transferData);

      // Reset form
      setShowPinDialog(false);
      setAmount("");
      setDescription("");
      setPin("");
      setSourceBankId("");
      setDestinationBankId("");
      setDestAccountNumber("");
      setDestIfscCode("");
      setDestBankName("");
      setDestAccountHolder("");
      setUseNewDestination(false);

      onTransferComplete();

      toast({
        title: "Transfer initiated!",
        description: "Bank to bank transfer will be processed within minutes via IMPS",
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
          Add at least one bank account to start bank transfers
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
      {/* Source Bank Selection */}
      <div className="space-y-2">
        <Label htmlFor="sourceBank">From Bank Account</Label>
        <Select value={sourceBankId} onValueChange={setSourceBankId}>
          <SelectTrigger className="glass-card border-white/20">
            <SelectValue placeholder="Select source bank account" />
          </SelectTrigger>
          <SelectContent>
            {bankAccounts.filter(acc => acc.isVerified).map((account) => (
              <SelectItem key={account._id} value={account._id}>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{account.bankName}</span>
                  <span className="text-muted-foreground">••••{account.accountNumber.slice(-4)}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {bankAccounts.filter(acc => acc.isVerified).length === 0 && (
          <p className="text-xs text-orange-500">No verified accounts available for transfers</p>
        )}
      </div>

      {/* Destination Type Toggle */}
      <div className="glass-card border-white/10 rounded-lg p-4">
        <Label className="text-base mb-3 block">Transfer To</Label>
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant={!useNewDestination ? "default" : "outline"}
            className={!useNewDestination ? "bg-gradient-primary" : "glass-card border-white/20"}
            onClick={() => setUseNewDestination(false)}
          >
            Saved Account
          </Button>
          <Button
            variant={useNewDestination ? "default" : "outline"}
            className={useNewDestination ? "bg-gradient-primary" : "glass-card border-white/20"}
            onClick={() => setUseNewDestination(true)}
          >
            New Account
          </Button>
        </div>
      </div>

      {/* Destination - Saved Account */}
      {!useNewDestination && (
        <div className="space-y-2">
          <Label htmlFor="destBank">To Bank Account</Label>
          <Select value={destinationBankId} onValueChange={setDestinationBankId}>
            <SelectTrigger className="glass-card border-white/20">
              <SelectValue placeholder="Select destination bank account" />
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
      )}

      {/* Destination - New Account */}
      {useNewDestination && (
        <div className="space-y-4 glass-card border-white/10 rounded-lg p-4">
          <p className="text-sm font-semibold">Enter Destination Bank Details</p>
          
          {/* IFSC Code with Lookup */}
          <div className="space-y-2">
            <Label htmlFor="destIfsc">IFSC Code</Label>
            <div className="flex gap-2">
              <Input
                id="destIfsc"
                placeholder="HDFC0001234"
                value={destIfscCode}
                onChange={(e) => setDestIfscCode(e.target.value.toUpperCase())}
                maxLength={11}
                className="glass-card border-white/20 font-mono uppercase"
              />
              <Button
                onClick={handleIFSCLookup}
                disabled={ifscLookupLoading || destIfscCode.length !== 11}
                size="icon"
                className="bg-gradient-primary"
              >
                {ifscLookupLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Bank Name (auto-filled or manual) */}
          <div className="space-y-2">
            <Label htmlFor="destBankName">Bank Name</Label>
            <Input
              id="destBankName"
              placeholder="Bank name"
              value={destBankName}
              onChange={(e) => setDestBankName(e.target.value)}
              className="glass-card border-white/20"
            />
          </div>

          {/* Account Number */}
          <div className="space-y-2">
            <Label htmlFor="destAccNum">Account Number</Label>
            <Input
              id="destAccNum"
              placeholder="Enter account number"
              value={destAccountNumber}
              onChange={(e) => setDestAccountNumber(e.target.value.replace(/\D/g, ''))}
              className="glass-card border-white/20 font-mono"
            />
          </div>

          {/* Account Holder Name */}
          <div className="space-y-2">
            <Label htmlFor="destAccHolder">Account Holder Name</Label>
            <Input
              id="destAccHolder"
              placeholder="As per bank records"
              value={destAccountHolder}
              onChange={(e) => setDestAccountHolder(e.target.value)}
              className="glass-card border-white/20"
            />
          </div>
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
            Min: ₹100 • Max: ₹2,00,000 (IMPS limit)
          </span>
          {fees.total > 0 && (
            <span className="text-orange-500">+ ₹{fees.total.toFixed(2)} fees</span>
          )}
        </div>
      </div>

      {/* Quick Amount Buttons */}
      <div className="grid grid-cols-4 gap-2">
        {[1000, 5000, 10000, 50000].map((value) => (
          <Button
            key={value}
            variant="outline"
            size="sm"
            onClick={() => handleAmountChange(value.toString())}
            className="glass-card border-white/20"
          >
            ₹{value >= 1000 ? `${value / 1000}k` : value}
          </Button>
        ))}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Purpose (Optional)</Label>
        <Input
          id="description"
          placeholder="Purpose of transfer"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="glass-card border-white/20"
        />
      </div>

      {/* Fee Breakdown */}
      {fees.total > 0 && (
        <div className="glass-card border-white/10 rounded-lg p-4 space-y-2">
          <p className="text-sm font-semibold">IMPS Fee Breakdown</p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Transfer Amount</span>
              <span>₹{parseFloat(amount || '0').toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">IMPS Fee (₹5 + 0.5%)</span>
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

      {/* Info Alert */}
      <Alert className="glass-card border-blue-500/20">
        <ArrowRightLeft className="h-4 w-4 text-blue-500" />
        <AlertDescription className="text-sm">
          <strong>IMPS Transfer</strong> - Instant bank to bank transfer. Money will be credited within minutes.
        </AlertDescription>
      </Alert>

      {/* Transfer Button */}
      <Button
        className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 shadow-glow h-12"
        onClick={handleProceedToPin}
        disabled={!sourceBankId || (!useNewDestination && !destinationBankId) || !amount || loading}
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <ArrowRightLeft className="w-5 h-5 mr-2" />
            Transfer ₹{amount || "0"}
          </>
        )}
      </Button>

      {/* PIN Dialog */}
      <Dialog open={showPinDialog} onOpenChange={setShowPinDialog}>
        <DialogContent className="glass-card border-primary/20">
          <DialogHeader>
            <DialogTitle>Confirm Bank Transfer</DialogTitle>
            <DialogDescription>
              Enter your transaction PIN to complete this IMPS transfer
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="glass-card border-white/10 rounded-lg p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground text-sm">From</span>
                <span className="font-medium">{sourceBank?.bankName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground text-sm">To</span>
                <span className="font-medium">
                  {useNewDestination ? destBankName : destinationBank?.bankName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground text-sm">Amount</span>
                <span className="font-bold text-2xl text-blue-500">₹{amount}</span>
              </div>
              {fees.total > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">+ IMPS Fees</span>
                  <span>₹{fees.total.toFixed(2)}</span>
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
              className="bg-gradient-to-r from-blue-500 to-cyan-500"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Confirm Transfer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
