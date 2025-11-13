import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  UserPlus, 
  Check, 
  QrCode, 
  Shield,
  Clock,
  Info,
  Sparkles,
  ArrowRight,
  Lock,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useJoinGroup } from "@/hooks/useGroups";
import withLayout from "@/components/withLayout";
import { useAuth } from "@/contexts/AuthContext";

// JoinGroup component for use as child component (no layout)
const JoinGroup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  
  // State
  const [joinCode, setJoinCode] = useState("");
  const [isValidFormat, setIsValidFormat] = useState(false);
  
  // API hooks
  const joinGroupMutation = useJoinGroup();

  // Validate code format (3 letters + 4 numbers)
  useEffect(() => {
    const codePattern = /^[A-Z]{3}[0-9]{4}$/;
    setIsValidFormat(codePattern.test(joinCode));
  }, [joinCode]);

  const handleJoinByCode = async () => {
    const trimmedCode = joinCode.trim();
    
    if (!trimmedCode) {
      toast({
        title: "Missing Invite Code",
        description: "Please enter an invitation code to continue",
        variant: "destructive"
      });
      return;
    }

    if (!isValidFormat) {
      toast({
        title: "Invalid Code Format",
        description: "Invite code should be 3 letters followed by 4 numbers (e.g., ABC1234)",
        variant: "destructive"
      });
      return;
    }

    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to join a group",
        variant: "destructive"
      });
      navigate(`/login?returnUrl=/join-group`);
      return;
    }

    try {
      const result = await joinGroupMutation.mutateAsync({ inviteCode: trimmedCode });
      setJoinCode("");
      
      if (result.data.requestPending) {
        toast({
          title: "Request Sent! 📤",
          description: "Your join request has been sent to the group admin for approval."
        });
      } else {
        toast({
          title: "Welcome! 🎉",
          description: `You've successfully joined ${result.data.group.name}!`
        });
        navigate('/groups');
      }
    } catch (error: any) {
      // Error already handled by mutation with toast
      console.error('Join group error:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && joinCode.trim() && isValidFormat) {
      handleJoinByCode();
    }
  };

  return (
    <div className="w-full h-full overflow-y-auto overflow-x-hidden py-6 sm:py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-8 sm:space-y-12">
        
        {/* Header Section */}
        <div className="text-center space-y-4 sm:space-y-6 animate-fade-in">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 backdrop-blur-sm border border-primary/20">
            <Lock className="w-4 h-4 mr-2 text-primary" />
            <span className="text-primary text-sm font-medium">Private Groups Only</span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gradient-cyber">
            Join a Private Group
          </h1>
          
          <p className="text-base sm:text-lg text-white/70 max-w-2xl mx-auto leading-relaxed">
            All groups on ZenithWallet are private and secure. You'll need an invitation code from a group admin to join.
          </p>
        </div>

        {/* Main Card */}
        <div className="grid md:grid-cols-3 gap-6 sm:gap-8 animate-slide-up">
          
          {/* Left Column - Main Join Form */}
          <div className="md:col-span-2">
            <Card className="glass-card border border-white/20 shadow-glow">
              <CardHeader className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <QrCode className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-white">Enter Invitation Code</CardTitle>
                    <CardDescription className="text-white/60">
                      Get the code from your group admin
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Code Input */}
                <div className="space-y-3">
                  <Label htmlFor="join-code" className="text-white font-semibold text-base">
                    Invitation Code *
                  </Label>
                  
                  <div className="relative">
                    <Input 
                      id="join-code" 
                      placeholder="ABC1234" 
                      value={joinCode} 
                      onChange={e => {
                        const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                        if (value.length <= 7) {
                          setJoinCode(value);
                        }
                      }}
                      onKeyPress={handleKeyPress}
                      maxLength={7}
                      className="bg-background/50 border-border/50 text-white placeholder:text-white/40 font-mono text-center text-2xl tracking-widest py-6 sm:py-8 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                      disabled={joinGroupMutation.isPending}
                    />
                    
                    {joinCode && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {isValidFormat ? (
                          <div className="p-1 rounded-full bg-green-500/20">
                            <Check className="w-5 h-5 text-green-500" />
                          </div>
                        ) : (
                          <div className="p-1 rounded-full bg-orange-500/20">
                            <AlertCircle className="w-5 h-5 text-orange-500" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Format Hint */}
                  {joinCode && (
                    <div className="text-sm text-center">
                      {isValidFormat ? (
                        <span className="text-green-500 flex items-center justify-center gap-1.5">
                          <Check className="w-4 h-4" />
                          Valid code format
                        </span>
                      ) : (
                        <span className="text-orange-500 flex items-center justify-center gap-1.5">
                          <Info className="w-4 h-4" />
                          Format: 3 letters + 4 numbers
                        </span>
                      )}
                    </div>
                  )}
                  
                  <p className="text-xs text-white/40 text-center">
                    Example: ABC1234 • Case insensitive
                  </p>
                </div>

                <Separator className="bg-white/10" />

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Button 
                    onClick={handleJoinByCode} 
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-lg py-6 sm:py-7 shadow-lg hover:shadow-glow transition-all duration-300 font-semibold"
                    disabled={!joinCode.trim() || !isValidFormat || joinGroupMutation.isPending}
                  >
                    {joinGroupMutation.isPending ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                        Joining Group...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-5 h-5 mr-2" />
                        Join Group
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => navigate('/groups')}
                    className="w-full border-white/30 text-white hover:bg-white/10 py-5"
                  >
                    View My Groups
                  </Button>
                </div>

                {/* Info Alert */}
                <Alert className="bg-primary/10 border-primary/30">
                  <Shield className="h-4 w-4 text-primary" />
                  <AlertDescription className="text-white/80 text-sm">
                    Don't have an invite code? Ask the group admin to send you one via the "Invite Members" option in their group settings.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Info & Features */}
          <div className="space-y-6">
            
            {/* How It Works */}
            <Card className="glass-card border border-white/20">
              <CardHeader>
                <CardTitle className="text-primary flex items-center gap-2 text-lg">
                  <Sparkles className="w-5 h-5" />
                  How It Works
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                      1
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium text-sm">Get Invite Code</p>
                      <p className="text-white/60 text-xs mt-1">Request from group admin</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                      2
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium text-sm">Enter Code</p>
                      <p className="text-white/60 text-xs mt-1">Type the 7-character code</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                      3
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium text-sm">Join Instantly</p>
                      <p className="text-white/60 text-xs mt-1">Start sharing expenses</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security Info */}
            <Card className="glass-card border border-white/20 bg-gradient-to-br from-blue-500/10 to-purple-500/10">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-white text-sm mb-1">Privacy First</h4>
                    <p className="text-white/70 text-xs leading-relaxed">
                      All groups are private to ensure your financial data stays secure and is only shared with trusted members.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Tips */}
            <Card className="glass-card border border-white/20">
              <CardHeader>
                <CardTitle className="text-primary text-sm flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Quick Tips
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5 text-xs text-white/70">
                <div className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <p>Invite codes are case-insensitive</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <p>Each code is unique to a specific group</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <p>Codes may expire after a certain period</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <p>Contact the admin if your code doesn't work</p>
                </div>
              </CardContent>
            </Card>

            {/* Create Group CTA */}
            <Card className="glass-card border border-primary/30 bg-gradient-to-br from-primary/10 to-transparent">
              <CardContent className="p-5 text-center space-y-3">
                <h4 className="font-bold text-white">Want to create your own?</h4>
                <p className="text-white/70 text-sm">
                  Start a new group and invite your friends or colleagues
                </p>
                <Button 
                  onClick={() => navigate('/create-group')}
                  variant="outline"
                  className="w-full border-primary/50 text-primary hover:bg-primary/10"
                >
                  Create New Group
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom Info */}
        <div className="text-center space-y-4 animate-fade-in">
          <Separator className="bg-white/10" />
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-white/50">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              <span>Secure & Private</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>Encrypted Data</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Instant Verification</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Standalone JoinGroup page with layout (for /join-group route)
const JoinGroupPage = withLayout(JoinGroup, { defaultMode: 'group', defaultSubNav: 'join-group' });

// Export both versions
export default JoinGroup;
export { JoinGroupPage };
