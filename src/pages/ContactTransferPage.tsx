import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Search,
  User,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  Send,
  Users,
} from "lucide-react";
import { useUserSearch, SearchUser } from "@/hooks/useUserSearch";
import { useSendMoney } from "@/hooks/useSendMoney";
import { useToast } from "@/hooks/use-toast";

export const ContactTransferPage = () => {
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
    setAmount("");
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
        description: description || `Transfer to ${selectedUser.firstName}`,
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

      // Navigate back after a short delay to allow events to propagate
      setTimeout(() => {
        navigate("/wallet");
      }, 1500);
    } catch (error: any) {
      toast({
        title: "Transfer failed",
        description: error.message || "Failed to send money",
        variant: "destructive",
      });
    }
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
            <h1 className="text-2xl font-bold text-white">Send to Contact</h1>
            <p className="text-white/60 text-sm">Transfer money to other ZenithWallet users</p>
          </div>
        </div>

        {/* Main Card */}
        <Card className="glass-card border-primary/20 shadow-glow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500">
                <Users className="w-5 h-5 text-white" />
              </div>
              Transfer to User
            </CardTitle>
            <CardDescription>Search and select a user to send money</CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Recipient Search */}
            <div className="space-y-2">
              <Label htmlFor="recipient">Search Recipient</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="recipient"
                  placeholder="Search by name or email..."
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
                <div className="glass-card border-white/10 rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                  {users.map((user) => (
                    <button
                      key={user._id}
                      onClick={() => handleSelectUser(user)}
                      className="w-full p-3 flex items-center gap-3 hover:bg-white/10 transition-colors border-b border-white/5 last:border-0"
                    >
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-semibold flex-shrink-0">
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.firstName} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <span className="text-lg">{user.firstName[0]}{user.lastName[0]}</span>
                        )}
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <p className="font-medium truncate">{user.firstName} {user.lastName}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                      <CheckCircle className="w-5 h-5 text-primary opacity-0 group-hover:opacity-100" />
                    </button>
                  ))}
                </div>
              )}

              {/* Search Loading */}
              {searchLoading && (
                <div className="glass-card border-white/10 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Searching users...</span>
                  </div>
                </div>
              )}

              {/* No Results */}
              {!searchLoading && searchQuery.length >= 2 && users.length === 0 && !selectedUser && (
                <div className="glass-card border-white/10 rounded-lg p-4 text-center">
                  <User className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">No users found</p>
                </div>
              )}

              {/* Selected User Display */}
              {selectedUser && (
                <div className="glass-card border-green-500/30 rounded-lg p-4 flex items-center gap-3 bg-green-500/5">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white flex-shrink-0">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{selectedUser.firstName} {selectedUser.lastName}</p>
                    <p className="text-xs text-muted-foreground truncate">{selectedUser.email}</p>
                  </div>
                </div>
              )}
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
                  disabled={!selectedUser}
                />
              </div>
              <p className="text-xs text-muted-foreground">Maximum: ₹50,000 per transaction</p>
            </div>

            {/* Quick Amount Buttons */}
            {selectedUser && (
              <div className="grid grid-cols-4 gap-2">
                {[100, 500, 1000, 5000].map((value) => (
                  <Button
                    key={value}
                    variant="outline"
                    size="sm"
                    onClick={() => setAmount(value.toString())}
                    className="glass-card border-white/20"
                  >
                    ₹{value}
                  </Button>
                ))}
              </div>
            )}

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="note">Note (Optional)</Label>
              <Input
                id="note"
                placeholder="Add a note for this transfer"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="glass-card border-white/20"
                disabled={!selectedUser}
              />
            </div>

            {/* Send Button */}
            <Button 
              className="w-full bg-gradient-primary shadow-glow h-12 text-base" 
              onClick={handleProceedToPin}
              disabled={!selectedUser || !amount || sendLoading}
            >
              {sendLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Send ₹{amount || "0"}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* PIN Dialog */}
      <Dialog open={showPinDialog} onOpenChange={setShowPinDialog}>
        <DialogContent className="glass-card border-primary/20">
          <DialogHeader>
            <DialogTitle>Confirm Transfer</DialogTitle>
            <DialogDescription>
              Enter your transaction PIN to complete this transfer
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Transfer Summary */}
            {selectedUser && (
              <div className="glass-card border-white/10 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">Sending to</span>
                  <span className="font-medium">{selectedUser.firstName} {selectedUser.lastName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">Amount</span>
                  <span className="font-bold text-2xl text-primary">₹{amount}</span>
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

export default ContactTransferPage;