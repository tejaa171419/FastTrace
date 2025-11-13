import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowUpDown, DollarSign, Users, TrendingUp, TrendingDown, CheckCircle, Clock, AlertTriangle, Send, Loader2 } from 'lucide-react';
import { useBalances, useRecordSettlement } from '@/hooks/useBalances';
import { useGroup } from '@/hooks/useGroups';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useForm, UseFormSetValue } from 'react-hook-form';

interface BalanceManagerProps {
  groupId: string;
}

interface SettlementFormData {
  fromUserId: string;
  toUserId: string;
  amount: number;
  description: string;
  method: string;
}

export const BalanceManager: React.FC<BalanceManagerProps> = ({ groupId }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSettleDialogOpen, setIsSettleDialogOpen] = useState(false);

  // API hooks
  const { data: groupData, isLoading: groupLoading } = useGroup(groupId);
  const { data: balancesData, isLoading: balancesLoading } = useBalances({ groupId });
  const createSettlementMutation = useRecordSettlement();

  // Form setup
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<SettlementFormData>();

  // Extract data
  const group = groupData?.group;
  const balances = balancesData?.balances || [];

  // Get settlement suggestions based on balances
  const getSettlementSuggestions = () => {
    // Filter balances where user needs to pay money (negative amount means user needs to pay)
    const needsToPay = balances.filter(b => b.amount < 0).sort((a, b) => a.amount - b.amount);
    // Filter balances where user gets back money (positive amount means user gets back)
    const getsBack = balances.filter(b => b.amount > 0).sort((a, b) => b.amount - a.amount);
    
    const suggestions = [];
    let needsToPayIndex = 0;
    let getsBackIndex = 0;

    while (needsToPayIndex < needsToPay.length && getsBackIndex < getsBack.length) {
      const needsToPayBalance = needsToPay[needsToPayIndex];
      const getsBackBalance = getsBack[getsBackIndex];
      
      // The amount to settle is the minimum of what needs to be paid and what will be received
      const settleAmount = Math.min(Math.abs(needsToPayBalance.amount), getsBackBalance.amount);
      
      suggestions.push({
        from: needsToPayBalance.otherUser,
        to: getsBackBalance.otherUser,
        amount: settleAmount,
        fromUserId: needsToPayBalance.otherUser._id,
        toUserId: getsBackBalance.otherUser._id
      });

      // Update the amounts to reflect the settlement
      needsToPayBalance.amount += settleAmount;
      getsBackBalance.amount -= settleAmount;

      // Move to the next person if the current settlement is complete
      if (Math.abs(needsToPayBalance.amount) < 0.01) needsToPayIndex++;
      if (Math.abs(getsBackBalance.amount) < 0.01) getsBackIndex++;
    }

    return suggestions;
  };

  const suggestions = getSettlementSuggestions();

  // Handle settlement creation
  const onSubmit = async (data: SettlementFormData) => {
    try {
      await createSettlementMutation.mutateAsync({
        groupId,
        fromUserId: data.fromUserId,
        toUserId: data.toUserId,
        amount: data.amount,
        description: data.description,
        method: data.method
      });

      toast({
        title: 'Settlement Recorded! 💰',
        description: 'The settlement has been recorded and balances updated.'
      });

      reset();
      setIsSettleDialogOpen(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to record settlement. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const getBalanceColor = (amount: number) => {
    if (amount > 0) return 'text-success';
    if (amount < 0) return 'text-destructive';
    return 'text-muted-foreground';
  };

  const getBalanceIcon = (amount: number) => {
    if (amount > 0) return TrendingUp;
    if (amount < 0) return TrendingDown;
    return CheckCircle;
  };

  const formatCurrency = (amount: number) => {
    const symbol = group?.currency === 'USD' ? '$' : '₹';
    return `${symbol}${Math.abs(amount).toFixed(2)}`;
  };

  if (groupLoading || balancesLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span className="text-white/60">Loading balances...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center">
          <DollarSign className="w-6 h-6 mr-2 text-primary" />
          Group Balances
        </h2>
        
        <Dialog open={isSettleDialogOpen} onOpenChange={setIsSettleDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary text-white hover:shadow-glow">
              <Send className="w-4 h-4 mr-2" />
              Record Settlement
            </Button>
          </DialogTrigger>
          
          <DialogContent className="sm:max-w-md glass-card">
            <DialogHeader>
              <DialogTitle className="text-xl text-gradient-cyber">Record Settlement</DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white font-medium">From</Label>
                  <Select onValueChange={(value) => setValue('fromUserId', value)}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue placeholder="Select payer" />
                    </SelectTrigger>
                    <SelectContent>
                      {group?.members?.map(member => (
                        <SelectItem key={member.user._id} value={member.user._id}>
                          {member.user.firstName} {member.user.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-white font-medium">To</Label>
                  <Select onValueChange={(value) => setValue('toUserId', value)}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue placeholder="Select recipient" />
                    </SelectTrigger>
                    <SelectContent>
                      {group?.members?.map(member => (
                        <SelectItem key={member.user._id} value={member.user._id}>
                          {member.user.firstName} {member.user.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-white font-medium">Amount ({group?.currency})</Label>
                <Input
                  type="number"
                  step="0.01"
                  {...register('amount', { 
                    required: 'Amount is required',
                    min: { value: 0.01, message: 'Amount must be greater than 0' }
                  })}
                  placeholder="0.00"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                />
                {errors.amount && (
                  <p className="text-red-400 text-sm">{errors.amount.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-white font-medium">Payment Method</Label>
                <Select onValueChange={(value) => setValue('method', value)}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="digital_wallet">Digital Wallet</SelectItem>
                    <SelectItem value="venmo">Venmo</SelectItem>
                    <SelectItem value="paypal">PayPal</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-white font-medium">Description (Optional)</Label>
                <Textarea
                  {...register('description')}
                  placeholder="Payment details..."
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40 resize-none"
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-white/10">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsSettleDialogOpen(false)}
                  className="flex-1 border-white/20 text-white hover:bg-white/10"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createSettlementMutation.isPending}
                  className="flex-1 bg-gradient-primary text-white hover:shadow-glow disabled:opacity-50"
                >
                  {createSettlementMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Recording...
                    </>
                  ) : (
                    'Record Settlement'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Current Balances */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Users className="w-5 h-5 mr-2 text-primary" />
            Current Balances
          </CardTitle>
        </CardHeader>
        <CardContent>
          {balances.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-success mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white mb-2">All Settled! 🎉</h3>
              <p className="text-white/60">Everyone is even - no outstanding balances.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {balances.map((balance, index) => {
                const BalanceIcon = getBalanceIcon(balance.amount);
                return (
                  <div
                    key={balance.otherUser._id}
                    className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-200"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={typeof balance.otherUser.avatar === 'string' ? balance.otherUser.avatar : balance.otherUser.avatar?.url || ''} />
                        <AvatarFallback className="bg-primary/20 text-white">
                          {balance.otherUser.firstName?.charAt(0)}{balance.otherUser.lastName?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-medium text-white">
                          {balance.otherUser.firstName} {balance.otherUser.lastName}
                        </h4>
                        <p className="text-sm text-white/60">{balance.otherUser.email}</p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`text-lg font-bold ${getBalanceColor(balance.amount)} flex items-center`}>
                        <BalanceIcon className="w-4 h-4 mr-1" />
                        {formatCurrency(balance.amount)}
                      </div>
                      <p className="text-xs text-white/40">
                        {balance.amount > 0 ? 'gets back' : balance.amount < 0 ? 'needs to pay back' : 'settled'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Settlement Suggestions */}
      {suggestions.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <ArrowUpDown className="w-5 h-5 mr-2 text-primary" />
              Suggested Settlements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {suggestions.map((suggestion, index) => (
                <div
                  key={`${suggestion.fromUserId}-${suggestion.toUserId}`}
                  className="flex items-center justify-between p-4 rounded-lg bg-primary/10 border border-primary/20"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={suggestion.from.avatar} />
                        <AvatarFallback className="bg-red-500/20 text-red-400 text-sm">
                          {suggestion.from.firstName?.charAt(0)}{suggestion.from.lastName?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-white font-medium">
                        {suggestion.from.firstName} {suggestion.from.lastName}
                      </span>
                    </div>
                    
                    <ArrowUpDown className="w-4 h-4 text-primary" />
                    
                    <div className="flex items-center gap-2">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={suggestion.to.avatar} />
                        <AvatarFallback className="bg-green-500/20 text-green-400 text-sm">
                          {suggestion.to.firstName?.charAt(0)}{suggestion.to.lastName?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-white font-medium">
                        {suggestion.to.firstName} {suggestion.to.lastName}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Badge className="bg-success/20 text-success border-success/30">
                      {formatCurrency(suggestion.amount)}
                    </Badge>
                    <Button
                      size="sm"
                      className="bg-primary/20 text-primary hover:bg-primary hover:text-white"
                      onClick={() => {
                        // Pre-fill settlement form
                        reset({
                          fromUserId: suggestion.fromUserId,
                          toUserId: suggestion.toUserId,
                          amount: suggestion.amount,
                          description: 'Suggested settlement',
                          method: ''
                        });
                        setIsSettleDialogOpen(true);
                      }}
                    >
                      Settle
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};