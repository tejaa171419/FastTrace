import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Building2, Search, Loader2, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import { useBankTransfer } from "@/hooks/useBankTransfer";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";

interface AddBankAccountModalProps {
  open: boolean;
  onClose: () => void;
  onAccountAdded: () => void;
}

export const AddBankAccountModal = ({
  open,
  onClose,
  onAccountAdded
}: AddBankAccountModalProps) => {
  const { toast } = useToast();
  const { lookupIFSC, addBankAccount, loading } = useBankTransfer();

  const [step, setStep] = useState(1);
  const [ifscCode, setIfscCode] = useState("");
  const [ifscDetails, setIfscDetails] = useState<any>(null);
  const [ifscLoading, setIfscLoading] = useState(false);
  
  const [accountNumber, setAccountNumber] = useState("");
  const [confirmAccountNumber, setConfirmAccountNumber] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [accountType, setAccountType] = useState("savings");
  const [isPrimary, setIsPrimary] = useState(false);

  const handleIFSCLookup = async () => {
    if (!ifscCode || ifscCode.length !== 11) {
      toast({
        title: "Invalid IFSC",
        description: "IFSC code must be 11 characters",
        variant: "destructive",
      });
      return;
    }

    setIfscLoading(true);
    const details = await lookupIFSC(ifscCode);
    setIfscLoading(false);

    if (details) {
      setIfscDetails(details);
      setStep(2);
    } else {
      toast({
        title: "IFSC not found",
        description: "Please check the IFSC code and try again",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async () => {
    // Validations
    if (!accountNumber || accountNumber.length < 8) {
      toast({
        title: "Invalid account number",
        description: "Account number must be at least 8 digits",
        variant: "destructive",
      });
      return;
    }

    if (accountNumber !== confirmAccountNumber) {
      toast({
        title: "Account numbers don't match",
        description: "Please ensure both account numbers are the same",
        variant: "destructive",
      });
      return;
    }

    if (!accountHolderName || accountHolderName.length < 3) {
      toast({
        title: "Invalid name",
        description: "Account holder name must be at least 3 characters",
        variant: "destructive",
      });
      return;
    }

    try {
      await addBankAccount({
        accountNumber,
        ifscCode: ifscCode.toUpperCase(),
        bankName: ifscDetails?.bankName || "Unknown Bank",
        accountHolderName,
        accountType,
        isPrimary
      });

      // Reset form
      resetForm();
      
      toast({
        title: "Account added!",
        description: "Your bank account has been added successfully",
      });

      onAccountAdded();
      onClose();
    } catch (error: any) {
      toast({
        title: "Failed to add account",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setStep(1);
    setIfscCode("");
    setIfscDetails(null);
    setAccountNumber("");
    setConfirmAccountNumber("");
    setAccountHolderName("");
    setAccountType("savings");
    setIsPrimary(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="glass-card border-primary/20 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            Add Bank Account
          </DialogTitle>
          <DialogDescription>
            Step {step} of 2 - {step === 1 ? "Find your bank" : "Enter account details"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Step 1: IFSC Lookup */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ifsc">IFSC Code</Label>
                <div className="flex gap-2">
                  <Input
                    id="ifsc"
                    placeholder="HDFC0001234"
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                    maxLength={11}
                    className="glass-card border-white/20 uppercase font-mono"
                  />
                  <Button
                    onClick={handleIFSCLookup}
                    disabled={ifscLoading || !ifscCode || ifscCode.length !== 11}
                    className="bg-gradient-primary"
                  >
                    {ifscLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Search className="w-4 h-4 mr-2" />
                        Lookup
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter your bank's IFSC code to auto-fill bank details
                </p>
              </div>

              <Alert className="glass-card border-blue-500/20">
                <AlertCircle className="h-4 w-4 text-blue-500" />
                <AlertDescription className="text-sm">
                  <strong>Where to find IFSC?</strong>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Bank passbook or cheque book</li>
                    <li>Bank's mobile app or website</li>
                    <li>Account statement</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Step 2: Account Details */}
          {step === 2 && ifscDetails && (
            <div className="space-y-4">
              {/* Bank Details (Read-only) */}
              <div className="glass-card border-white/10 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2 text-green-500">
                  <CheckCircle2 className="w-5 h-5" />
                  <p className="font-semibold">Bank Details Found</p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Bank Name</p>
                    <p className="font-semibold">{ifscDetails.bankName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">IFSC Code</p>
                    <p className="font-mono font-semibold">{ifscDetails.ifscCode}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Branch</p>
                    <p>{ifscDetails.branch}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">City</p>
                    <p>{ifscDetails.city}, {ifscDetails.state}</p>
                  </div>
                </div>
              </div>

              {/* Account Number */}
              <div className="space-y-2">
                <Label htmlFor="accountNumber">Account Number</Label>
                <Input
                  id="accountNumber"
                  type="text"
                  placeholder="Enter your account number"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                  className="glass-card border-white/20 font-mono"
                />
              </div>

              {/* Confirm Account Number */}
              <div className="space-y-2">
                <Label htmlFor="confirmAccountNumber">Confirm Account Number</Label>
                <Input
                  id="confirmAccountNumber"
                  type="text"
                  placeholder="Re-enter your account number"
                  value={confirmAccountNumber}
                  onChange={(e) => setConfirmAccountNumber(e.target.value.replace(/\D/g, ''))}
                  className="glass-card border-white/20 font-mono"
                />
                {accountNumber && confirmAccountNumber && (
                  <p className={`text-xs flex items-center gap-1 ${
                    accountNumber === confirmAccountNumber ? "text-green-500" : "text-red-500"
                  }`}>
                    {accountNumber === confirmAccountNumber ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" /> Account numbers match
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3 h-3" /> Account numbers don't match
                      </>
                    )}
                  </p>
                )}
              </div>

              {/* Account Holder Name */}
              <div className="space-y-2">
                <Label htmlFor="accountHolderName">Account Holder Name</Label>
                <Input
                  id="accountHolderName"
                  type="text"
                  placeholder="As per bank records"
                  value={accountHolderName}
                  onChange={(e) => setAccountHolderName(e.target.value)}
                  className="glass-card border-white/20"
                />
              </div>

              {/* Account Type */}
              <div className="space-y-2">
                <Label htmlFor="accountType">Account Type</Label>
                <Select value={accountType} onValueChange={setAccountType}>
                  <SelectTrigger className="glass-card border-white/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="savings">Savings Account</SelectItem>
                    <SelectItem value="current">Current Account</SelectItem>
                    <SelectItem value="salary">Salary Account</SelectItem>
                    <SelectItem value="nri">NRI Account</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Set as Primary */}
              <div className="flex items-center justify-between glass-card border-white/10 rounded-lg p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="primary" className="text-base cursor-pointer">
                    Set as Primary Account
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Use this account for quick withdrawals
                  </p>
                </div>
                <Switch
                  id="primary"
                  checked={isPrimary}
                  onCheckedChange={setIsPrimary}
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {step === 1 ? (
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={
                  loading ||
                  !accountNumber ||
                  !confirmAccountNumber ||
                  accountNumber !== confirmAccountNumber ||
                  !accountHolderName
                }
                className="bg-gradient-primary"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Add Account
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
