import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { 
  Copy, 
  RefreshCw, 
  QrCode, 
  Share2, 
  Calendar, 
  Shield, 
  Users,
  ExternalLink,
  Clock,
  CheckCircle,
  AlertTriangle,
  Sparkles
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useGetInviteCode, useRegenerateInviteCode } from "@/hooks/useGroups";
import { format } from 'date-fns';

interface GroupInviteCodeManagerProps {
  groupId: string;
  groupName: string;
  isOwner: boolean;
  isAdmin: boolean;
  className?: string;
}

const GroupInviteCodeManager: React.FC<GroupInviteCodeManagerProps> = ({
  groupId,
  groupName,
  isOwner,
  isAdmin,
  className = ""
}) => {
  const { toast } = useToast();
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [isCodeCopied, setIsCodeCopied] = useState(false);
  const [isLinkCopied, setIsLinkCopied] = useState(false);

  // Hooks
  const { data: inviteCodeData, isLoading, refetch } = useGetInviteCode(groupId, isOwner || isAdmin);
  const regenerateInviteCodeMutation = useRegenerateInviteCode();

  const inviteCode = inviteCodeData?.data?.inviteCode;
  const expiresAt = inviteCodeData?.data?.expiresAt;
  const isValid = inviteCodeData?.data?.isValid;

  // Only show if user is owner or admin
  if (!isOwner && !isAdmin) {
    return null;
  }

  const inviteLink = `${window.location.origin}/join-group?code=${inviteCode}`;
  const expiryDate = expiresAt ? new Date(expiresAt) : null;
  const daysUntilExpiry = expiryDate ? Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;

  const handleCopyCode = async () => {
    if (!inviteCode) return;
    
    try {
      await navigator.clipboard.writeText(inviteCode);
      setIsCodeCopied(true);
      setTimeout(() => setIsCodeCopied(false), 2000);
      toast({
        title: "Code Copied! 📋",
        description: "Invite code copied to clipboard"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy code",
        variant: "destructive"
      });
    }
  };

  const handleCopyLink = async () => {
    if (!inviteCode) return;
    
    try {
      await navigator.clipboard.writeText(inviteLink);
      setIsLinkCopied(true);
      setTimeout(() => setIsLinkCopied(false), 2000);
      toast({
        title: "Link Copied! 🔗",
        description: "Invite link copied to clipboard"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive"
      });
    }
  };

  const handleShareLink = async () => {
    if (!inviteCode) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${groupName}`,
          text: `Join our expense group "${groupName}"! Use invite code: ${inviteCode}`,
          url: inviteLink
        });
      } catch (error) {
        // User cancelled share or share not supported
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  const handleRegenerateCode = async () => {
    try {
      await regenerateInviteCodeMutation.mutateAsync({ 
        groupId, 
        expiryDays: 30 
      });
      refetch();
      toast({
        title: "Code Regenerated! ✨",
        description: "New invite code generated successfully"
      });
    } catch (error) {
      // Error handled in mutation
    }
  };

  const getExpiryStatus = () => {
    if (!expiryDate || !isValid) {
      return {
        color: "text-red-500",
        bgColor: "bg-red-500/20",
        borderColor: "border-red-500/30",
        icon: AlertTriangle,
        text: "Expired"
      };
    }
    
    if (daysUntilExpiry <= 3) {
      return {
        color: "text-orange-500",
        bgColor: "bg-orange-500/20",
        borderColor: "border-orange-500/30",
        icon: Clock,
        text: `Expires in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}`
      };
    }
    
    return {
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/20",
      borderColor: "border-emerald-500/30",
      icon: CheckCircle,
      text: `Valid for ${daysUntilExpiry} days`
    };
  };

  const expiryStatus = getExpiryStatus();
  const ExpiryIcon = expiryStatus.icon;

  if (isLoading) {
    return (
      <Card className={`glass-card ${className}`}>
        <CardContent className="p-6 text-center">
          <LoadingSpinner />
          <p className="text-white/60 mt-2">Loading invite code...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={`glass-card hover-lift transition-all duration-300 ${className}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-primary flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Group Invite Code
              </CardTitle>
              <CardDescription>
                Share this code with others to invite them to the group
              </CardDescription>
            </div>
            {isOwner && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRegenerateCode}
                disabled={regenerateInviteCodeMutation.isPending}
                className="border-primary/30 text-primary hover:bg-primary/10"
              >
                {regenerateInviteCodeMutation.isPending ? (
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Invite Code Display */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white/10 rounded-xl border border-white/20">
              <div className="flex-1">
                <Label className="text-white/80 text-sm font-medium">Invite Code</Label>
                <div className="flex items-center gap-3 mt-1">
                  <div className="text-3xl font-bold font-mono text-primary tracking-wider">
                    {inviteCode || 'Loading...'}
                  </div>
                  <Badge 
                    className={`${expiryStatus.bgColor} ${expiryStatus.borderColor} ${expiryStatus.color} border`}
                  >
                    <ExpiryIcon className="w-3 h-3 mr-1" />
                    {expiryStatus.text}
                  </Badge>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={handleCopyCode}
                disabled={!inviteCode}
                className="border-white/30 text-white hover:bg-white/10"
              >
                {isCodeCopied ? (
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>

            {/* Expiry Information */}
            {expiryDate && (
              <div className="flex items-center gap-2 text-sm text-white/60">
                <Calendar className="w-4 h-4" />
                <span>
                  Expires on {format(expiryDate, 'MMM dd, yyyy \'at\' h:mm a')}
                </span>
              </div>
            )}
          </div>

          <Separator className="bg-white/20" />

          {/* Share Options */}
          <div className="space-y-4">
            <h4 className="text-white font-medium flex items-center gap-2">
              <Share2 className="w-4 h-4" />
              Share Options
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Button
                onClick={handleCopyLink}
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 justify-start"
              >
                {isLinkCopied ? (
                  <CheckCircle className="w-4 h-4 mr-2 text-emerald-500" />
                ) : (
                  <ExternalLink className="w-4 h-4 mr-2" />
                )}
                Copy Link
              </Button>
              
              <Button
                onClick={handleShareLink}
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 justify-start"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              
              <Button
                onClick={() => setShowQRDialog(true)}
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 justify-start"
              >
                <QrCode className="w-4 h-4 mr-2" />
                QR Code
              </Button>
            </div>
          </div>

          {/* Usage Instructions */}
          <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
            <h5 className="text-primary font-medium mb-2 flex items-center gap-2">
              <Users className="w-4 h-4" />
              How to use
            </h5>
            <ul className="text-sm text-white/70 space-y-1">
              <li>• Share the invite code with people you want to add</li>
              <li>• They can enter the code on the "Join Group" page</li>
              <li>• The code expires in 30 days for security</li>
              <li>• Generate a new code anytime if needed</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* QR Code Dialog */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="glass-card max-w-md">
          <DialogHeader>
            <DialogTitle className="text-gradient-cyber flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              QR Code Invite
            </DialogTitle>
            <DialogDescription>
              Scan this QR code to join the group instantly
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* QR Code placeholder - in real implementation, use a QR code library */}
            <div className="bg-white p-6 rounded-lg mx-auto w-fit">
              <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                <div className="text-center text-gray-500">
                  <QrCode className="w-12 h-12 mx-auto mb-2" />
                  <p className="text-sm">QR Code</p>
                  <p className="text-xs font-mono mt-2">{inviteCode}</p>
                </div>
              </div>
            </div>
            
            <div className="text-center space-y-2">
              <p className="text-white font-medium">{groupName}</p>
              <p className="text-white/60 text-sm">Invite Code: {inviteCode}</p>
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowQRDialog(false)}
                className="flex-1 border-white/20 text-white hover:bg-white/10"
              >
                Close
              </Button>
              <Button
                onClick={handleCopyLink}
                className="flex-1 bg-gradient-primary text-white"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Link
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default GroupInviteCodeManager;