import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, Eye, EyeOff, Download, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";

interface AccountDetails {
  accountNumber: string;
  ifscCode: string;
  accountHolderName?: string;
  kycStatus: string;
  kycLevel: number;
  balance?: number;
  currency?: string;
  status?: string;
}

interface AccountDetailsCardProps {
  accountDetails: AccountDetails;
  userName: string;
  onStatementDownload?: () => void;
  isLoading?: boolean;
}

export const AccountDetailsCard = ({ 
  accountDetails, 
  userName,
  onStatementDownload,
  isLoading = false 
}: AccountDetailsCardProps) => {
  const { toast } = useToast();
  const [showAccountNumber, setShowAccountNumber] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [downloadingStatement, setDownloadingStatement] = useState(false);

  const handleCopyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      toast({
        title: "Copied!",
        description: `${fieldName} copied to clipboard`,
      });
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleDownloadStatement = async () => {
    try {
      setDownloadingStatement(true);
      
      const response = await apiClient.get('/api/wallet/settings/statement', {
        format: 'pdf',
      });

      if (response.success) {
        // In a real implementation, you would trigger a PDF download
        // For now, we show the data or trigger email notification
        toast({
          title: "Success",
          description: response.data?.message || "Your statement will be emailed to you shortly",
        });

        if (onStatementDownload) {
          onStatementDownload();
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to download statement",
        variant: "destructive",
      });
    } finally {
      setDownloadingStatement(false);
    }
  };

  const getKycStatusColor = () => {
    switch (accountDetails.kycStatus) {
      case 'verified':
        return 'bg-success/20 text-success';
      case 'pending':
        return 'bg-warning/20 text-warning';
      case 'rejected':
        return 'bg-destructive/20 text-destructive';
      default:
        return 'bg-muted/20 text-muted-foreground';
    }
  };

  const getKycStatusText = () => {
    switch (accountDetails.kycStatus) {
      case 'not_started':
        return 'NOT STARTED';
      case 'verified':
        return 'VERIFIED';
      case 'pending':
        return 'PENDING';
      case 'rejected':
        return 'REJECTED';
      default:
        return accountDetails.kycStatus.toUpperCase();
    }
  };

  const maskAccountNumber = (accountNumber: string) => {
    if (!accountNumber || accountNumber === 'Not Set') return accountNumber;
    return '••••••••';
  };

  return (
    <Card className="glass-card border-primary/20 shadow-glow hover:shadow-glow-lg transition-all duration-500">
      <CardHeader className="p-3 sm:p-4 md:p-6">
        <CardTitle className="flex items-center gap-2 text-sm sm:text-base md:text-lg">
          <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          Account Details
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          View your wallet account information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-4 md:p-6">
        {/* Account Holder */}
        <div className="space-y-2">
          <Label className="text-xs sm:text-sm">Account Holder</Label>
          <div className="flex items-center gap-2">
            <Input
              value={accountDetails.accountHolderName || userName}
              readOnly
              className="glass-card border-white/20 text-xs sm:text-sm"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleCopyToClipboard(accountDetails.accountHolderName || userName, 'Account Holder')}
              className="glass-card border-white/20 h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0"
            >
              {copiedField === 'Account Holder' ? (
                <Check className="w-3 h-3 sm:w-4 sm:h-4 text-success" />
              ) : (
                <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Account Number */}
        <div className="space-y-2">
          <Label className="text-xs sm:text-sm">Account Number</Label>
          <div className="flex items-center gap-2">
            <Input
              value={showAccountNumber ? accountDetails.accountNumber : maskAccountNumber(accountDetails.accountNumber)}
              readOnly
              className="glass-card border-white/20 text-xs sm:text-sm"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowAccountNumber(!showAccountNumber)}
              className="glass-card border-white/20 h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0"
            >
              {showAccountNumber ? (
                <EyeOff className="w-3 h-3 sm:w-4 sm:h-4" />
              ) : (
                <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
              )}
            </Button>
            {accountDetails.accountNumber && accountDetails.accountNumber !== 'Not Set' && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleCopyToClipboard(accountDetails.accountNumber, 'Account Number')}
                className="glass-card border-white/20 h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0"
              >
                {copiedField === 'Account Number' ? (
                  <Check className="w-3 h-3 sm:w-4 sm:h-4 text-success" />
                ) : (
                  <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                )}
              </Button>
            )}
          </div>
        </div>

        {/* IFSC Code */}
        <div className="space-y-2">
          <Label className="text-xs sm:text-sm">IFSC Code</Label>
          <div className="flex items-center gap-2">
            <Input
              value={accountDetails.ifscCode}
              readOnly
              className="glass-card border-white/20 text-xs sm:text-sm"
            />
            {accountDetails.ifscCode && accountDetails.ifscCode !== 'Not Set' && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleCopyToClipboard(accountDetails.ifscCode, 'IFSC Code')}
                className="glass-card border-white/20 h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0"
              >
                {copiedField === 'IFSC Code' ? (
                  <Check className="w-3 h-3 sm:w-4 sm:h-4 text-success" />
                ) : (
                  <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                )}
              </Button>
            )}
          </div>
        </div>

        {/* KYC Status */}
        <div className="space-y-2">
          <Label className="text-xs sm:text-sm">KYC Status</Label>
          <div className="flex items-center gap-2">
            <Input
              value={getKycStatusText()}
              readOnly
              className="glass-card border-white/20 text-xs sm:text-sm capitalize flex-1"
            />
            <div className={`px-3 py-2 rounded text-xs font-medium whitespace-nowrap ${getKycStatusColor()}`}>
              Level {accountDetails.kycLevel}
            </div>
          </div>
        </div>

        {/* Download Statement Button */}
        <Button
          variant="outline"
          className="w-full glass-card border-white/20 text-xs sm:text-sm"
          onClick={handleDownloadStatement}
          disabled={downloadingStatement || isLoading}
        >
          <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
          {downloadingStatement ? "Generating..." : "Download Statement"}
        </Button>
      </CardContent>
    </Card>
  );
};
