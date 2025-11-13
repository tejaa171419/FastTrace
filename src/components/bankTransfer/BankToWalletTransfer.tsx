import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Building2, Upload, Plus, CheckCircle2, AlertCircle, Copy } from "lucide-react";
import { BankAccount } from "@/hooks/useBankTransfer";
import { useToast } from "@/hooks/use-toast";

interface BankToWalletTransferProps {
  bankAccounts: BankAccount[];
  onTransferComplete: () => void;
  onAddAccount: () => void;
}

export const BankToWalletTransfer = ({
  bankAccounts,
  onTransferComplete,
  onAddAccount
}: BankToWalletTransferProps) => {
  const { toast } = useToast();
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [amount, setAmount] = useState("");

  const selectedAccount = bankAccounts.find(acc => acc._id === selectedAccountId);

  // Platform bank details for deposits
  const platformBankDetails = {
    accountNumber: "1234567890",
    ifscCode: "HDFC0001234",
    bankName: "HDFC Bank",
    accountHolderName: "FastTrace Wallet Services",
    branch: "Cyber City Branch"
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  const handleSubmit = () => {
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
        description: "Minimum deposit amount is ₹100",
        variant: "destructive",
      });
      return;
    }

    // In production, this would create a pending transfer record
    toast({
      title: "Instructions sent!",
      description: "Please complete the bank transfer. Your wallet will be credited after verification (2-4 hours).",
    });
    
    onTransferComplete();
  };

  if (bankAccounts.length === 0) {
    return (
      <div className="text-center py-12">
        <Building2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground/40" />
        <h3 className="text-lg font-semibold mb-2">No Bank Accounts</h3>
        <p className="text-muted-foreground text-sm mb-6">
          Add a bank account to deposit money to your wallet
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
      {/* Source Bank Account Selection */}
      <div className="space-y-2">
        <Label htmlFor="sourceAccount">Transfer From (Your Bank)</Label>
        <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
          <SelectTrigger className="glass-card border-white/20">
            <SelectValue placeholder="Choose your bank account" />
          </SelectTrigger>
          <SelectContent>
            {bankAccounts.map((account) => (
              <SelectItem key={account._id} value={account._id}>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{account.bankName}</span>
                  <span className="text-muted-foreground">••••{account.accountNumber.slice(-4)}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Amount */}
      <div className="space-y-2">
        <Label htmlFor="amount">Amount to Deposit (₹)</Label>
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
        <p className="text-xs text-muted-foreground">
          Min: ₹100 • No maximum limit
        </p>
      </div>

      {/* Quick Amount Buttons */}
      <div className="grid grid-cols-4 gap-2">
        {[500, 1000, 5000, 10000].map((value) => (
          <Button
            key={value}
            variant="outline"
            size="sm"
            onClick={() => setAmount(value.toString())}
            className="glass-card border-white/20"
          >
            ₹{value >= 1000 ? `${value / 1000}k` : value}
          </Button>
        ))}
      </div>

      {/* Platform Bank Details */}
      <div className="glass-card border-blue-500/20 rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold text-blue-500">Transfer To (FastTrace Wallet)</h3>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 glass-card border-white/10 rounded-lg">
            <div>
              <p className="text-xs text-muted-foreground">Bank Name</p>
              <p className="font-semibold">{platformBankDetails.bankName}</p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => copyToClipboard(platformBankDetails.bankName, "Bank Name")}
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center justify-between p-3 glass-card border-white/10 rounded-lg">
            <div>
              <p className="text-xs text-muted-foreground">Account Number</p>
              <p className="font-mono font-semibold">{platformBankDetails.accountNumber}</p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => copyToClipboard(platformBankDetails.accountNumber, "Account Number")}
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center justify-between p-3 glass-card border-white/10 rounded-lg">
            <div>
              <p className="text-xs text-muted-foreground">IFSC Code</p>
              <p className="font-mono font-semibold">{platformBankDetails.ifscCode}</p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => copyToClipboard(platformBankDetails.ifscCode, "IFSC Code")}
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center justify-between p-3 glass-card border-white/10 rounded-lg">
            <div>
              <p className="text-xs text-muted-foreground">Account Holder</p>
              <p className="font-semibold">{platformBankDetails.accountHolderName}</p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => copyToClipboard(platformBankDetails.accountHolderName, "Account Holder Name")}
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <Alert className="glass-card border-orange-500/20">
        <AlertCircle className="h-4 w-4 text-orange-500" />
        <AlertDescription>
          <p className="font-semibold mb-2">Important Instructions:</p>
          <ul className="text-sm space-y-1 list-disc list-inside">
            <li>Transfer exactly ₹{amount || "___"} from your bank account</li>
            <li>Use the bank details shown above</li>
            <li>Your wallet will be credited within 2-4 hours after verification</li>
            <li>You'll receive a notification once credited</li>
            <li>Keep your transaction reference number safe</li>
          </ul>
        </AlertDescription>
      </Alert>

      {/* Processing Info */}
      <Alert className="glass-card border-blue-500/20">
        <CheckCircle2 className="h-4 w-4 text-blue-500" />
        <AlertDescription className="text-sm">
          <strong>No fees!</strong> Bank to wallet deposits are completely free. 
          The full amount will be credited to your wallet.
        </AlertDescription>
      </Alert>

      {/* Submit Button */}
      <Button
        className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 shadow-glow h-12"
        onClick={handleSubmit}
        disabled={!selectedAccountId || !amount}
      >
        <CheckCircle2 className="w-5 h-5 mr-2" />
        I've Completed the Transfer
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        Click above after completing the bank transfer. We'll verify and credit your wallet.
      </p>
    </div>
  );
};
