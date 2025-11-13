import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  Wallet,
  Building2,
  ArrowRightLeft,
  Smartphone,
  History,
  TrendingUp,
  Plus,
  CheckCircle2,
  AlertCircle,
  Clock,
  Download,
} from "lucide-react";
import { useBankTransfer, BankAccount, BankTransfer } from "@/hooks/useBankTransfer";
import { useWalletBalance } from "@/hooks/useWalletBalance";
import { useToast } from "@/hooks/use-toast";
import { WalletToBankTransfer } from "@/components/bankTransfer/WalletToBankTransfer";
import { BankToWalletTransfer } from "@/components/bankTransfer/BankToWalletTransfer";
import { WalletToUPITransfer } from "@/components/bankTransfer/WalletToUPITransfer";
import { BankToBankTransfer } from "@/components/bankTransfer/BankToBankTransfer";
import { TransferHistory } from "@/components/bankTransfer/TransferHistory";
import { AddBankAccountModal } from "@/components/bankTransfer/AddBankAccountModal";

export const AdvancedBankTransferPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { balance, isLoading: balanceLoading } = useWalletBalance();
  const { 
    getBankAccounts, 
    getTransferStats, 
    loading: bankLoading 
  } = useBankTransfer();

  const [activeTab, setActiveTab] = useState("wallet-to-bank");
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch bank accounts
  useEffect(() => {
    const fetchAccounts = async () => {
      const accounts = await getBankAccounts();
      setBankAccounts(accounts);
    };

    fetchAccounts();
  }, [getBankAccounts, refreshKey]);

  // Fetch statistics
  useEffect(() => {
    const fetchStats = async () => {
      const statsData = await getTransferStats('month');
      setStats(statsData);
    };

    fetchStats();
  }, [getTransferStats, refreshKey]);

  const handleAccountAdded = () => {
    setRefreshKey(prev => prev + 1);
    toast({
      title: "Success!",
      description: "Bank account added successfully",
    });
  };

  const handleTransferComplete = () => {
    setRefreshKey(prev => prev + 1);
    toast({
      title: "Transfer Initiated!",
      description: "Your transfer has been initiated successfully",
    });
  };

  const transferTypes = [
    {
      id: "wallet-to-bank",
      label: "Wallet to Bank",
      icon: Wallet,
      color: "text-green-500",
      description: "Withdraw money from wallet to bank account"
    },
    {
      id: "bank-to-wallet",
      label: "Bank to Wallet",
      icon: Building2,
      color: "text-blue-500",
      description: "Add money from bank to wallet"
    },
    {
      id: "bank-to-bank",
      label: "Bank to Bank",
      icon: ArrowRightLeft,
      color: "text-cyan-500",
      description: "Transfer between bank accounts via IMPS"
    },
    {
      id: "wallet-to-upi",
      label: "Wallet to UPI",
      icon: Smartphone,
      color: "text-purple-500",
      description: "Send money to any UPI ID"
    },
    {
      id: "history",
      label: "History",
      icon: History,
      color: "text-orange-500",
      description: "View transfer history"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-cyber p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
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
              <h1 className="text-2xl md:text-3xl font-bold text-white">Bank Transfer Hub</h1>
              <p className="text-white/60 text-sm mt-1">
                Manage all your bank transfers in one place
              </p>
            </div>
          </div>

          <Button
            onClick={() => setShowAddAccountModal(true)}
            className="bg-gradient-primary shadow-glow"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Bank Account
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Wallet Balance */}
          <Card className="glass-card border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Wallet Balance</p>
                  {balanceLoading ? (
                    <Skeleton className="h-6 w-24" />
                  ) : (
                    <p className="text-2xl font-bold text-green-500">
                      ₹{balance?.toLocaleString('en-IN') || '0'}
                    </p>
                  )}
                </div>
                <div className="p-3 rounded-full bg-green-500/10">
                  <Wallet className="w-5 h-5 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bank Accounts */}
          <Card className="glass-card border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Bank Accounts</p>
                  {bankLoading ? (
                    <Skeleton className="h-6 w-16" />
                  ) : (
                    <p className="text-2xl font-bold text-blue-500">
                      {bankAccounts.length}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {bankAccounts.filter(acc => acc.isVerified).length} verified
                  </p>
                </div>
                <div className="p-3 rounded-full bg-blue-500/10">
                  <Building2 className="w-5 h-5 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Transfers */}
          <Card className="glass-card border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Total Transfers</p>
                  <p className="text-2xl font-bold text-purple-500">
                    {stats?.transferStats?.total || 0}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats?.transferStats?.completed || 0} completed
                  </p>
                </div>
                <div className="p-3 rounded-full bg-purple-500/10">
                  <ArrowRightLeft className="w-5 h-5 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Amount Transferred */}
          <Card className="glass-card border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">This Month</p>
                  <p className="text-2xl font-bold text-orange-500">
                    ₹{stats?.transferStats?.totalAmount?.toLocaleString('en-IN') || '0'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Transferred
                  </p>
                </div>
                <div className="p-3 rounded-full bg-orange-500/10">
                  <TrendingUp className="w-5 h-5 text-orange-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Transfer Section */}
        <Card className="glass-card border-primary/20 shadow-glow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-r from-primary to-accent">
                <ArrowRightLeft className="w-5 h-5 text-white" />
              </div>
              Transfer Money
            </CardTitle>
            <CardDescription>
              Choose a transfer type and complete your transaction securely
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 glass-card p-1">
                {transferTypes.map((type) => (
                  <TabsTrigger
                    key={type.id}
                    value={type.id}
                    className="flex items-center gap-2 data-[state=active]:bg-gradient-primary"
                  >
                    <type.icon className={`w-4 h-4 ${type.color}`} />
                    <span className="hidden sm:inline">{type.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* Wallet to Bank */}
              <TabsContent value="wallet-to-bank" className="space-y-4">
                <Alert className="glass-card border-green-500/20">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <AlertDescription>
                    Transfer money from your wallet to any bank account. 
                    Processing time: 1-2 business days.
                  </AlertDescription>
                </Alert>

                <WalletToBankTransfer
                  bankAccounts={bankAccounts}
                  walletBalance={balance || 0}
                  onTransferComplete={handleTransferComplete}
                  onAddAccount={() => setShowAddAccountModal(true)}
                />
              </TabsContent>

              {/* Bank to Wallet */}
              <TabsContent value="bank-to-wallet" className="space-y-4">
                <Alert className="glass-card border-blue-500/20">
                  <AlertCircle className="h-4 w-4 text-blue-500" />
                  <AlertDescription>
                    Add money from your bank account to wallet. 
                    Manual verification required. Processing time: 2-4 hours.
                  </AlertDescription>
                </Alert>

                <BankToWalletTransfer
                  bankAccounts={bankAccounts}
                  onTransferComplete={handleTransferComplete}
                  onAddAccount={() => setShowAddAccountModal(true)}
                />
              </TabsContent>

              {/* Bank to Bank */}
              <TabsContent value="bank-to-bank" className="space-y-4">
                <Alert className="glass-card border-cyan-500/20">
                  <ArrowRightLeft className="h-4 w-4 text-cyan-500" />
                  <AlertDescription>
                    Instant bank to bank transfer via IMPS. 
                    Transfer money directly between any bank accounts in minutes.
                  </AlertDescription>
                </Alert>

                <BankToBankTransfer
                  bankAccounts={bankAccounts}
                  onTransferComplete={handleTransferComplete}
                  onAddAccount={() => setShowAddAccountModal(true)}
                />
              </TabsContent>

              {/* Wallet to UPI */}
              <TabsContent value="wallet-to-upi" className="space-y-4">
                <Alert className="glass-card border-purple-500/20">
                  <Clock className="h-4 w-4 text-purple-500" />
                  <AlertDescription>
                    Send money instantly to any UPI ID. 
                    Instant transfer with minimal fees.
                  </AlertDescription>
                </Alert>

                <WalletToUPITransfer
                  walletBalance={balance || 0}
                  onTransferComplete={handleTransferComplete}
                />
              </TabsContent>

              {/* Transfer History */}
              <TabsContent value="history" className="space-y-4">
                <TransferHistory />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Bank Accounts List */}
        {bankAccounts.length > 0 && (
          <Card className="glass-card border-primary/20">
            <CardHeader>
              <CardTitle>Your Bank Accounts</CardTitle>
              <CardDescription>
                {bankAccounts.length} {bankAccounts.length === 1 ? 'account' : 'accounts'} linked
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bankAccounts.map((account) => (
                  <div
                    key={account._id}
                    className="glass-card border-white/10 rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{account.bankName}</p>
                          {account.isPrimary && (
                            <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30">
                              Primary
                            </Badge>
                          )}
                          {account.isVerified ? (
                            <Badge variant="outline" className="bg-green-500/20 text-green-500 border-green-500/30">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Verified
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-orange-500/20 text-orange-500 border-orange-500/30">
                              <Clock className="w-3 h-3 mr-1" />
                              Pending
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {account.accountHolderName}
                        </p>
                      </div>
                      <Building2 className="w-8 h-8 text-primary/60" />
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
                      <div>
                        <p className="text-xs text-muted-foreground">Account</p>
                        <p className="font-mono text-sm">
                          ••••{account.accountNumber.slice(-4)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">IFSC</p>
                        <p className="font-mono text-sm">{account.ifscCode}</p>
                      </div>
                    </div>

                    {account.bankDetails && (
                      <div className="text-xs text-muted-foreground pt-2 border-t border-white/10">
                        {account.bankDetails.branch && (
                          <p>Branch: {account.bankDetails.branch}</p>
                        )}
                        {account.bankDetails.city && account.bankDetails.state && (
                          <p>{account.bankDetails.city}, {account.bankDetails.state}</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add Bank Account Modal */}
      <AddBankAccountModal
        open={showAddAccountModal}
        onClose={() => setShowAddAccountModal(false)}
        onAccountAdded={handleAccountAdded}
      />
    </div>
  );
};

export default AdvancedBankTransferPage;
