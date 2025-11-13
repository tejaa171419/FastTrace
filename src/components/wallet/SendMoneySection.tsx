import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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
  Send,
  Users,
  QrCode,
  CreditCard,
  Search,
  AlertCircle,
  CheckCircle,
  Loader2,
  User,
  X,
} from "lucide-react";
import { useUserSearch, SearchUser } from "@/hooks/useUserSearch";
import { useSendMoney } from "@/hooks/useSendMoney";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

export const SendMoneySection = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const { users, loading: searchLoading, search, clearResults } = useUserSearch();
  
  // Transfer state
  const [selectedUser, setSelectedUser] = useState<SearchUser | null>(null);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [pin, setPin] = useState("");
  const [showPinDialog, setShowPinDialog] = useState(false);
  
  const { loading: sendLoading, error: sendError, sendMoney, reset: resetSend } = useSendMoney();

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    if (value.length >= 2) {
      search(value);
    } else {
      clearResults();
    }
  };

  // Select user from search results
  const handleSelectUser = (user: SearchUser) => {
    setSelectedUser(user);
    setSearchQuery(`${user.firstName} ${user.lastName}`);
    clearResults();
  };

  // Clear selected user
  const handleClearUser = () => {
    setSelectedUser(null);
    setSearchQuery("");
    setDescription("");
  };

  // Validate and show PIN dialog
  const handleProceedToPin = () => {
    // Validation
    if (!selectedUser) {
      toast({
        title: "No recipient selected",
        description: "Please select a recipient",
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

    if (amountNum > 50000) {
      toast({
        title: "Amount exceeds limit",
        description: "Maximum transfer amount is ₹50,000",
        variant: "destructive",
      });
      return;
    }

    setShowPinDialog(true);
  };

  // Handle send money
  const handleSendMoney = async () => {
    if (!selectedUser || !pin) return;

    try {
      await sendMoney({
        toUserId: selectedUser._id,
        amount: parseFloat(amount),
        description,
        pin,
      });

      // Success
      toast({
        title: "Money sent successfully!",
        description: `₹${amount} sent to ${selectedUser.firstName} ${selectedUser.lastName}`,
      });

      // Reset form
      setShowPinDialog(false);
      setPin("");
      setAmount("");
      setDescription("");
      handleClearUser();
      resetSend();
    } catch (error: any) {
      toast({
        title: "Transfer failed",
        description: error.message || "Failed to send money",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="glass-card border-primary/20 shadow-glow hover:shadow-glow-lg transition-all duration-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse-glow" />
            Send Money
          </CardTitle>
          <CardDescription>Transfer money to friends or pay for services</CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              className="h-auto flex-col gap-3 p-6 glass-card border-white/20 hover:bg-white/10 group"
              onClick={() => navigate("/wallet/contact-transfer")}
            >
              <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 group-hover:scale-110 transition-transform duration-300">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div className="text-center">
                <p className="font-semibold">To Contact</p>
                <p className="text-xs text-muted-foreground">Send to phone number</p>
              </div>
            </Button>

            <Button 
              variant="outline" 
              className="h-auto flex-col gap-3 p-6 glass-card border-white/20 hover:bg-white/10 group"
              onClick={() => navigate("/wallet/scan-qr")}
            >
              <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 group-hover:scale-110 transition-transform duration-300">
                <QrCode className="w-6 h-6 text-white" />
              </div>
              <div className="text-center">
                <p className="font-semibold">Scan QR</p>
                <p className="text-xs text-muted-foreground">Pay via QR code</p>
              </div>
            </Button>
          </div>

          <Separator />

          {/* Send Form */}
          <div className="space-y-4">
            {/* Recipient Search */}
            <div className="space-y-2">
              <Label htmlFor="recipient">Recipient</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="recipient"
                  placeholder="Search by name or email"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className={`pl-10 glass-card border-white/20 ${selectedUser ? 'pr-10' : ''}`}
                  disabled={!!selectedUser}
                />
                {selectedUser && (
                  <button
                    onClick={handleClearUser}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Search Results */}
              {!selectedUser && users.length > 0 && (
                <div className="glass-card border-white/10 rounded-lg overflow-hidden">
                  {users.map((user) => (
                    <button
                      key={user._id}
                      onClick={() => handleSelectUser(user)}
                      className="w-full p-3 flex items-center gap-3 hover:bg-white/10 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-semibold">
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.firstName} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <User className="w-5 h-5" />
                        )}
                      </div>
                      <div className="text-left flex-1">
                        <p className="font-medium">{user.firstName} {user.lastName}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Search Loading */}
              {searchLoading && (
                <div className="glass-card border-white/10 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Searching...</span>
                  </div>
                </div>
              )}

              {/* Selected User Display */}
              {selectedUser && (
                <div className="glass-card border-green-500/30 rounded-lg p-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{selectedUser.firstName} {selectedUser.lastName}</p>
                    <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-8 glass-card border-white/20"
                  disabled={!selectedUser}
                />
              </div>
              <p className="text-xs text-muted-foreground">Maximum: ₹50,000 per transaction</p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="note">Note (Optional)</Label>
              <Input
                id="note"
                placeholder="Add a note"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="glass-card border-white/20"
                disabled={!selectedUser}
              />
            </div>

            {/* Send Button */}
            <Button 
              className="w-full bg-gradient-primary shadow-glow" 
              size="lg"
              onClick={handleProceedToPin}
              disabled={!selectedUser || !amount || sendLoading}
            >
              {sendLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Money
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* PIN Dialog */}
      <Dialog open={showPinDialog} onOpenChange={setShowPinDialog}>
        <DialogContent className="glass-card border-primary/20">
          <DialogHeader>
            <DialogTitle>Enter Transaction PIN</DialogTitle>
            <DialogDescription>
              Please enter your 4-6 digit PIN to confirm the transfer
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Transfer Summary */}
            {selectedUser && (
              <div className="glass-card border-white/10 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">To</span>
                  <span className="font-medium">{selectedUser.firstName} {selectedUser.lastName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-bold text-primary">₹{amount}</span>
                </div>
                {description && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Note</span>
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
              />
            </div>

            {/* Error Message */}
            {sendError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{sendError}</AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowPinDialog(false);
                setPin("");
                resetSend();
              }}
              disabled={sendLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendMoney}
              disabled={!pin || pin.length < 4 || sendLoading}
              className="bg-gradient-primary"
            >
              {sendLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
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

export default SendMoneySection;