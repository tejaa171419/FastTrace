import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Loader2,
  Send,
  Plus,
  Building2,
  BadgeCheck,
} from "lucide-react";
import { useBankWithdrawal, BankAccount } from "@/hooks/useBankWithdrawal";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";

export const BankTransferPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Bank accounts state
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [accountsError, setAccountsError] = useState<string | null>(null);
  
  // Transfer state
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [pin, setPin] = useState("");
  const [showPinDialog, setShowPinDialog] = useState(false);
  
  const { loading: withdrawLoading, error: withdrawError, withdraw, reset: resetWithdraw } = useBankWithdrawal();

  // Fetch bank accounts
  useEffect(() => {
    const fetchBankAccounts = async () => {
      try {
        setLoadingAccounts(true);
        setAccountsError(null);
        
        const response = await apiClient.get('/api/users/profile');
        
        if (response.success && response.data.user.bankAccounts) {
          setBankAccounts(response.data.user.bankAccounts);
          
          // Auto-select primary account
          const primaryAccount = response.data.user.bankAccounts.find((acc: BankAccount) => acc.isPrimary);
          if (primaryAccount && primaryAccount._id) {
            setSelectedAccountId(primaryAccount._id);
          }
        }
      } catch (error: any) {
        console.error('Failed to load bank accounts:', error);
        setAccountsError(error.message || 'Failed to load bank accounts');
      } finally {
        setLoadingAccounts(false);
      }
    };

    fetchBankAccounts();
  }, []);

  // Get selected account details
  const selectedAccount = bankAccounts.find(acc => acc._id === selectedAccountId);

  // Validate and show PIN dialog
  const handleProceedToPin = () => {
    // Validation
    if (!selectedAccountId) {
      toast({
        title: "No bank account selected",
        description: "Please select a bank account",
        variant: "destructive",
      });
      return;
    }

    const amountNum = parseFloat(amount);
    if (!amount || amountNum <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    if (amountNum < 100) {
      toast({
        title: "Minimum amount required",
        description: "Minimum withdrawal amount is ₹100",
        variant: "destructive",
      });
      return;
    }

    if (amountNum > 100000) {
      toast({
        title: "Amount exceeds limit",
        description: "Maximum withdrawal amount is ₹1,00,000",
        variant: "destructive",
      });
      return;
    }

    setShowPinDialog(true);
  };

  // Handle withdrawal
  const handleWithdraw = async () => {
    if (!selectedAccountId || !pin) return;

    try {
      await withdraw({
        bankAccountId: selectedAccountId,
        amount: parseFloat(amount),
        description: description || "Withdrawal to bank account",
        pin,
      });

      // Success
      toast({
        title: "Withdrawal initiated!",
        description: `₹${amount} will be transferred to your bank account within 1-2 business days`,
      });

      // Navigate back after a short delay
      setTimeout(() => {
        navigate("/wallet");
      }, 2000);
    } catch (error: any) {
      toast({
        title: "Withdrawal failed",
        description: error.message || "Failed to process withdrawal",
        variant: "destructive",
      });
    }
  };

  // Handle add bank account
  const handleAddAccount = () => {
    toast({
      title: "Add Bank Account",
      description: "Please go to Profile > Settings to add a bank account",
    });
    // Could navigate to profile page
    // navigate("/profile");
  };

  return (
    <div className="min-h-screen bg-gradient-cyber p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/wallet")}
            className="glass-card border-white/20"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white">Bank Transfer</h1>
            <p className="text-white/60 text-sm">Withdraw money to your bank account</p>
          </div>
        </div>

        {/* Main Card */}
        <Card className="glass-card border-primary/20 shadow-glow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              Withdraw to Bank
            </CardTitle>
            <CardDescription>Transfer money to your registered bank account</CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Loading State */}
            {loadingAccounts && (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            )}

            {/* Error State */}
            {accountsError && !loadingAccounts && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{accountsError}</AlertDescription>
              </Alert>
            )}

            {/* No Bank Accounts */}
            {!loadingAccounts && !accountsError && bankAccounts.length === 0 && (
              <div className="text-center py-8">
                <Building2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground/40" />
                <h3 className="text-lg font-semibold mb-2">No Bank Accounts</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Add a bank account to start withdrawing money
                </p>
                <Button onClick={handleAddAccount} className="bg-gradient-primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Bank Account
                </Button>
              </div>
            )}

            {/* Transfer Form */}
            {!loadingAccounts && !accountsError && bankAccounts.length > 0 && (
              <>
                {/* Bank Account Selection */}
                <div className="space-y-2">
                  <Label htmlFor="bankAccount">Select Bank Account</Label>
                  <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                    <SelectTrigger className="glass-card border-white/20">
                      <SelectValue placeholder="Choose an account" />
                    </SelectTrigger>
                    <SelectContent>
                      {bankAccounts.map((account) => (
                        <SelectItem key={account._id} value={account._id || ""}>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{account.bankName}</span>
                            <span className="text-muted-foreground">••••{account.accountNumber.slice(-4)}</span>
                            {account.isPrimary && (
                              <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">Primary</span>
                            )}
                            {account.isVerified && (
                              <BadgeCheck className="w-4 h-4 text-green-500" />
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
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-lg">{selectedAccount.bankName}</p>
                          {selectedAccount.isVerified && (
                            <BadgeCheck className="w-5 h-5 text-green-500" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{selectedAccount.accountHolderName}</p>
                      </div>
                      <Building2 className="w-8 h-8 text-primary/60" />
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
                      <div>
                        <p className="text-xs text-muted-foreground">Account Number</p>
                        <p className="font-mono">••••{selectedAccount.accountNumber.slice(-4)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">IFSC Code</p>
                        <p className="font-mono">{selectedAccount.ifscCode}</p>
                      </div>
                    </div>
                    {!selectedAccount.isVerified && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          This account is not verified. Withdrawals may take longer to process.
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
                      onChange={(e) => setAmount(e.target.value)}
                      className="pl-8 text-lg glass-card border-white/20"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Min: ₹100 • Max: ₹1,00,000 per transaction
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

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="note">Note (Optional)</Label>
                  <Input
                    id="note"
                    placeholder="Purpose of withdrawal"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="glass-card border-white/20"
                  />
                </div>

                {/* Processing Time Info */}
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    Bank transfers typically take 1-2 business days to process. You'll receive a notification once the transfer is complete.
                  </AlertDescription>
                </Alert>

                {/* Withdraw Button */}
                <Button 
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 shadow-glow h-12 text-base" 
                  onClick={handleProceedToPin}
                  disabled={!selectedAccountId || !amount || withdrawLoading}
                >
                  {withdrawLoading ? (
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

                {/* Add Another Account */}
                <Button
                  variant="outline"
                  className="w-full glass-card border-white/20"
                  onClick={handleAddAccount}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Another Bank Account
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

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
            {/* Withdrawal Summary */}
            {selectedAccount && (
              <div className="glass-card border-white/10 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">Withdrawing to</span>
                  <span className="font-medium">{selectedAccount.bankName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">Account</span>
                  <span className="font-mono text-sm">••••{selectedAccount.accountNumber.slice(-4)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">Amount</span>
                  <span className="font-bold text-2xl text-green-500">₹{amount}</span>
                </div>
                {description && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">Note</span>
                    <span className="text-sm">{description}</span>
                  </div>
                )}
              </div>
            )}

            {/* PIN Input */}
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

            {/* Error Message */}
            {withdrawError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{withdrawError}</AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowPinDialog(false);
                setPin("");
                resetWithdraw();
              }}
              disabled={withdrawLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleWithdraw}
              disabled={!pin || pin.length < 4 || withdrawLoading}
              className="bg-gradient-to-r from-green-500 to-emerald-500"
            >
              {withdrawLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
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

export default BankTransferPage;