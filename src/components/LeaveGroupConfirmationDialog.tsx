import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertTriangle,
  LogOut,
  IndianRupee,
  Users,
  AlertCircle,
  CheckCircle2,
  X,
  Loader2,
  Crown
} from 'lucide-react';

interface GroupMember {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  isActive: boolean;
}

interface GroupData {
  id: string;
  name: string;
  description: string;
  totalMembers: number;
  currency: string;
}

interface UserBalance {
  netBalance: number;
  totalGetsBack: number;
  totalNeedsToPay: number;
}

interface LeaveGroupConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  group: GroupData;
  userBalance: UserBalance;
  isCurrentUserOwner: boolean;
  isCurrentUserAdmin: boolean;
  isLoading: boolean;
  members: GroupMember[];
  currentUserId: string;
}

const LeaveGroupConfirmationDialog = ({
  isOpen,
  onClose,
  onConfirm,
  group,
  userBalance,
  isCurrentUserOwner,
  isCurrentUserAdmin,
  isLoading,
  members,
  currentUserId
}: LeaveGroupConfirmationDialogProps) => {
  const [confirmationText, setConfirmationText] = useState('');
  const [hasReadWarnings, setHasReadWarnings] = useState(false);
  const [isConfirmationValid, setIsConfirmationValid] = useState(false);

  const expectedConfirmationText = group.name.toUpperCase();

  // Check if user has unsettled debts
  const hasUnsettledDebts = useMemo(() => {
    return userBalance.totalNeedsToPay > 0;
  }, [userBalance.totalNeedsToPay]);

  // Check if user will get money back
  const hasMoneyToReceive = useMemo(() => {
    return userBalance.totalGetsBack > 0;
  }, [userBalance.totalGetsBack]);

  // Check if user is the only admin
  const isOnlyAdmin = useMemo(() => {
    if (!isCurrentUserAdmin) return false;
    const adminCount = members.filter(member => member.isAdmin && member.isActive).length;
    return adminCount === 1;
  }, [isCurrentUserAdmin, members]);

  // Check if user is the only member
  const isOnlyMember = useMemo(() => {
    const activeMemberCount = members.filter(member => member.isActive).length;
    return activeMemberCount === 1;
  }, [members]);

  useEffect(() => {
    setIsConfirmationValid(
      confirmationText === expectedConfirmationText && 
      hasReadWarnings && 
      !hasUnsettledDebts &&
      !isCurrentUserOwner
    );
  }, [confirmationText, expectedConfirmationText, hasReadWarnings, hasUnsettledDebts, isCurrentUserOwner]);

  const handleClose = () => {
    setConfirmationText('');
    setHasReadWarnings(false);
    onClose();
  };

  const handleConfirm = () => {
    if (isConfirmationValid) {
      onConfirm();
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${Math.abs(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  const getBlockerReasons = () => {
    const reasons = [];
    
    if (isCurrentUserOwner) {
      reasons.push({
        type: 'error' as const,
        icon: <Crown className="w-4 h-4" />,
        message: 'You are the owner of this group. Transfer ownership to another member before leaving.',
        canProceed: false
      });
    }
    
    if (hasUnsettledDebts) {
      reasons.push({
        type: 'error' as const,
        icon: <IndianRupee className="w-4 h-4" />,
        message: `You have unsettled debts of ${formatCurrency(userBalance.totalNeedsToPay)}. Settle your balances before leaving.`,
        canProceed: false
      });
    }

    return reasons;
  };

  const getWarnings = () => {
    const warnings = [];

    if (hasMoneyToReceive) {
      warnings.push({
        type: 'warning' as const,
        icon: <AlertTriangle className="w-4 h-4" />,
        message: `You will lose ${formatCurrency(userBalance.totalGetsBack)} that other members owe you.`
      });
    }

    if (isOnlyAdmin && !isCurrentUserOwner) {
      warnings.push({
        type: 'warning' as const,
        icon: <Users className="w-4 h-4" />,
        message: 'You are the only admin. The group owner will become the sole admin.'
      });
    }

    if (isOnlyMember) {
      warnings.push({
        type: 'warning' as const,
        icon: <Users className="w-4 h-4" />,
        message: 'You are the only member. This will leave the group empty but not delete it.'
      });
    }

    warnings.push({
      type: 'info' as const,
      icon: <LogOut className="w-4 h-4" />,
      message: 'You will lose access to all group expenses, chat history, and shared data.'
    });

    warnings.push({
      type: 'info' as const,
      icon: <Users className="w-4 h-4" />,
      message: 'You will need to be re-invited or use an invite code to rejoin this group.'
    });

    return warnings;
  };

  const blockers = getBlockerReasons();
  const warnings = getWarnings();
  const canProceed = blockers.length === 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-black/95 border-white/20 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <LogOut className="w-5 h-5 text-red-400" />
            Leave Group
          </DialogTitle>
          <DialogDescription className="text-white/70">
            Are you sure you want to leave "{group.name}"?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Balance Summary */}
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <h4 className="text-white font-medium mb-3 flex items-center gap-2">
              <IndianRupee className="w-4 h-4" />
              Your Current Balance
            </h4>
            <div className="grid grid-cols-3 gap-3 text-center text-sm">
              <div>
                <p className={`font-bold ${
                  userBalance.netBalance > 0 
                    ? 'text-green-400' 
                    : userBalance.netBalance < 0 
                      ? 'text-red-400' 
                      : 'text-gray-400'
                }`}>
                  {formatCurrency(Math.abs(userBalance.netBalance))}
                </p>
                <p className="text-white/60 text-xs">
                  {userBalance.netBalance > 0 
                    ? 'You get back' 
                    : userBalance.netBalance < 0 
                      ? 'You owe' 
                      : 'Settled'
                  }
                </p>
              </div>
              <div>
                <p className="text-green-400 font-bold">
                  {formatCurrency(userBalance.totalGetsBack)}
                </p>
                <p className="text-white/60 text-xs">Gets back</p>
              </div>
              <div>
                <p className="text-red-400 font-bold">
                  {formatCurrency(userBalance.totalNeedsToPay)}
                </p>
                <p className="text-white/60 text-xs">Needs to pay</p>
              </div>
            </div>
          </div>

          {/* Blockers (Prevent leaving) */}
          {blockers.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-red-400 font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Cannot Leave Group
              </h4>
              {blockers.map((blocker, index) => (
                <Alert key={index} className="border-red-500/50 bg-red-500/10">
                  <AlertDescription className="text-red-300 flex items-start gap-2">
                    {blocker.icon}
                    <span className="text-sm">{blocker.message}</span>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          )}

          {/* Warnings */}
          {canProceed && warnings.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-yellow-400 font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Important Warnings
              </h4>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {warnings.map((warning, index) => (
                  <Alert key={index} className={`border-${warning.type === 'warning' ? 'yellow' : 'blue'}-500/50 bg-${warning.type === 'warning' ? 'yellow' : 'blue'}-500/10`}>
                    <AlertDescription className={`text-${warning.type === 'warning' ? 'yellow' : 'blue'}-300 flex items-start gap-2`}>
                      {warning.icon}
                      <span className="text-sm">{warning.message}</span>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </div>
          )}

          {/* Confirmation Requirements */}
          {canProceed && (
            <>
              <Separator className="bg-white/20" />
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="warnings-acknowledged"
                    checked={hasReadWarnings}
                    onCheckedChange={(checked: boolean | "indeterminate") => setHasReadWarnings(checked === true)}
                    className="mt-1"
                  />
                  <Label htmlFor="warnings-acknowledged" className="text-white/80 text-sm cursor-pointer">
                    I understand and acknowledge all the warnings above
                  </Label>
                </div>

                <div className="space-y-2">
                  <Label className="text-white text-sm">
                    Type "{expectedConfirmationText}" to confirm leaving:
                  </Label>
                  <Input
                    value={confirmationText}
                    onChange={(e) => setConfirmationText(e.target.value.toUpperCase())}
                    placeholder={expectedConfirmationText}
                    className="bg-white/10 border-white/30 text-white placeholder:text-white/50"
                    disabled={!hasReadWarnings}
                  />
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={handleClose}
            className="flex-1 border-white/30 text-white hover:bg-white/10"
            disabled={isLoading}
          >
            Cancel
          </Button>
          
          {canProceed ? (
            <Button
              onClick={handleConfirm}
              disabled={!isConfirmationValid || isLoading}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Leaving...
                </>
              ) : (
                <>
                  <LogOut className="w-4 h-4 mr-2" />
                  Leave Group
                </>
              )}
            </Button>
          ) : (
            <Button
              disabled
              className="flex-1 bg-gray-600 text-gray-400 cursor-not-allowed"
            >
              <X className="w-4 h-4 mr-2" />
              Cannot Leave
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LeaveGroupConfirmationDialog;