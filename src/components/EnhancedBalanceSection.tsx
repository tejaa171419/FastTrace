import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChevronDown, ChevronRight, IndianRupee, CreditCard, CheckCircle, Clock, Send, X, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import PaymentMethodModal from './PaymentMethodModal';
import SettlementPaymentModal from './SettlementPaymentModal';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import settlementService from '@/lib/services/settlementServiceMock';
import { useRealTimeBalanceUpdates } from '@/hooks/useRealTimeBalanceUpdates';
import { useQueryClient } from '@tanstack/react-query';

interface BalanceDetail {
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    avatar?: {
      url?: string;
    };
  };
  netBalance: number;
  totalGetsBack: number;
  totalNeedsToPay: number;
  owesTo: Array<{
    user: {
      _id: string;
      firstName: string;
      lastName: string;
      avatar?: {
        url?: string;
      };
    };
    amount: number;
  }>;
  owedBy: Array<{
    user: {
      _id: string;
      firstName: string;
      lastName: string;
      avatar?: {
        url?: string;
      };
    };
    amount: number;
  }>;
}

interface EnhancedBalanceSectionProps {
  memberBalances: BalanceDetail[];
  currency?: string;
  groupId?: string;
}

interface Settlement {
  fromUserId: string;
  toUserId: string;
  amount: number;
  groupId: string;
  currency: string;
  fromUser: {
    _id: string;
    firstName: string;
    lastName: string;
    avatar?: { url?: string };
  };
  toUser: {
    _id: string;
    firstName: string;
    lastName: string;
    avatar?: { url?: string };
  };
}

interface PendingSettlement {
  id: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  transactionId?: string;
  paymentMethod?: string;
  createdAt: Date;
}

export const EnhancedBalanceSection: React.FC<EnhancedBalanceSectionProps> = ({ 
  memberBalances, 
  currency = 'INR',
  groupId
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Mock implementation of showSettlementToast
  const showSettlementToast = (status: string, fromUser: string, toUser: string, amount: number, currency: string, method: string) => {
    console.log(`Settlement toast: ${status} ${fromUser} -> ${toUser} ${amount}${currency}`);
  };
  
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [showSettlementPaymentModal, setShowSettlementPaymentModal] = useState(false);
  const [selectedSettlement, setSelectedSettlement] = useState<Settlement | null>(null);
  const [pendingSettlements, setPendingSettlements] = useState<PendingSettlement[]>([]);

  // Initialize real-time balance updates
  const { isConnected, lastUpdate, requestBalanceUpdate, isRefreshing } = useRealTimeBalanceUpdates(groupId);

  // Listen for WebSocket balance_updated events
  useEffect(() => {
    if (!groupId || typeof window === 'undefined') return;

    const handleBalanceUpdate = (data: any) => {
      console.log('🔔 Received balance_updated event:', data);
      
      if (data.groupId === groupId && data.type === 'settlement_completed') {
        // Invalidate balance queries to trigger refetch
        queryClient.invalidateQueries({ queryKey: ['balances', 'group', groupId] });
        queryClient.invalidateQueries({ queryKey: ['groups', 'detail', groupId] });
        queryClient.invalidateQueries({ queryKey: ['balances'] });
        
        // Show toast notification
        const isCurrentUserPayer = user && data.fromUserId === user._id;
        const isCurrentUserReceiver = user && data.toUserId === user._id;
        
        if (isCurrentUserPayer || isCurrentUserReceiver) {
          toast({
            title: "💸 Settlement Completed!",
            description: `Payment of ₹${data.amount.toFixed(2)} has been processed. Balances updated.`,
            className: "border-green-500/50 bg-green-500/10"
          });
        }
        
        // Request immediate balance refresh
        if (requestBalanceUpdate) {
          setTimeout(() => requestBalanceUpdate(), 500);
        }
      }
    };

    // Add event listener if socket is available
    const socket = (window as any).socket;
    if (socket) {
      socket.on('balance_updated', handleBalanceUpdate);
      console.log('✅ Listening for balance_updated events on groupId:', groupId);
    }

    return () => {
      if (socket) {
        socket.off('balance_updated', handleBalanceUpdate);
        console.log('🔇 Stopped listening for balance_updated events');
      }
    };
  }, [groupId, user, queryClient, toast, requestBalanceUpdate]);

  const formatCurrency = (amount: number) => {
    const symbol = currency === 'USD' ? '$' : '₹';
    return `${symbol}${Math.abs(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  const toggleExpand = (userId: string) => {
    setExpandedUser(expandedUser === userId ? null : userId);
  };

  const handlePaymentInitiate = (fromUser: any, toUser: any, amount: number) => {
    const settlement: Settlement = {
      fromUserId: fromUser._id,
      toUserId: toUser._id,
      amount,
      groupId: groupId || '',
      currency,
      fromUser: {
        _id: fromUser._id,
        firstName: fromUser.firstName,
        lastName: fromUser.lastName,
        avatar: fromUser.avatar
      },
      toUser: {
        _id: toUser._id,
        firstName: toUser.firstName,
        lastName: toUser.lastName,
        avatar: toUser.avatar
      }
    };
    
    setSelectedSettlement(settlement);
    setShowSettlementPaymentModal(true);
  };

  const handlePaymentComplete = async (paymentResult: any) => {
    if (!selectedSettlement || !groupId) return;
    
    try {
      console.log('💰 Payment completed:', paymentResult);
      
      // Show success notification toast
      showSettlementToast(
        'completed',
        selectedSettlement.fromUser.firstName,
        selectedSettlement.toUser.firstName,
        selectedSettlement.amount,
        currency,
        'razorpay'
      );
      
      toast({
        title: "💸 Payment Received!",
        description: `Settlement of ${formatCurrency(selectedSettlement.amount)} completed successfully. Balances have been updated.`,
        className: "border-green-500/50 bg-green-500/10"
      });
      
      // Update pending settlements to mark as completed
      setPendingSettlements(prev => 
        prev.map(settlement => 
          settlement.fromUserId === selectedSettlement.fromUserId && 
          settlement.toUserId === selectedSettlement.toUserId
            ? { ...settlement, status: 'completed' as const }
            : settlement
        )
      );
      
      // Request immediate balance refresh for real-time update
      if (requestBalanceUpdate) {
        setTimeout(() => {
          requestBalanceUpdate();
        }, 1000); // Small delay to allow backend processing
      }
      
      // Close the modal
      setShowSettlementPaymentModal(false);
      setSelectedSettlement(null);
      
    } catch (error) {
      console.error('Failed to complete settlement:', error);
      toast({
        title: "Settlement Error",
        description: "Failed to complete settlement. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getSettlementStatus = (fromUserId: string, toUserId: string) => {
    return pendingSettlements.find(s => 
      s.fromUserId === fromUserId && s.toUserId === toUserId
    );
  };

  // Payment button logic is now handled inline for better clarity

  // Debug functionality removed

  // Group balances by net position
  const creditors = memberBalances.filter(member => member.netBalance > 0);
  const debtors = memberBalances.filter(member => member.netBalance < 0);
  const settled = memberBalances.filter(member => member.netBalance === 0);

  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <IndianRupee className="w-5 h-5 text-primary" />
              Balance Summary
            </CardTitle>
            <div className="flex items-center gap-2">
              {/* Real-time update button with tooltip and loading state */}
              <Button
                size="sm"
                variant="ghost"
                onClick={requestBalanceUpdate}
                disabled={!isConnected}
                className={`text-white/70 hover:text-white hover:bg-white/10 relative group ${isRefreshing ? 'animate-spin' : ''}`}
                title="Refresh balance data"
              >
                <RefreshCw className="w-4 h-4" />
                {isConnected && (
                  <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    Refresh
                  </span>
                )}
              </Button>
            </div>
          </div>
          {lastUpdate && (
            <p className="text-xs text-white/50">
              Last updated: {new Date(lastUpdate).toLocaleTimeString()}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {memberBalances.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-white/60">No balance information available</p>
            </div>
          ) : (
            <>
              {creditors.map((member) => {
                const isCurrentUser = user && user._id === member.user._id;
                
                return (
                  <div key={member.user._id} className="border-b border-white/10 pb-4 last:border-0">
                    <div 
                      className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-lg cursor-pointer hover:bg-white/10 transition-colors gap-2 ${
                        isCurrentUser ? 'bg-green-500/10 border border-green-500/20' : 'bg-white/5'
                      }`}
                      onClick={() => toggleExpand(member.user._id)}
                    >
                    <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                      <Avatar className="w-8 h-8 sm:w-10 sm:h-10 shrink-0">
                        <AvatarImage src={member.user.avatar?.url} />
                        <AvatarFallback className="bg-gradient-primary text-white text-xs sm:text-sm">
                          {member.user.firstName?.charAt(0)}{member.user.lastName?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-white flex items-center gap-2 text-sm sm:text-base">
                          <span className="truncate">{member.user.firstName} {member.user.lastName}</span>
                          {isCurrentUser && (
                            <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30 text-xs px-1.5 py-0.5 sm:px-2 sm:py-1 shrink-0">
                              You
                            </Badge>
                          )}
                        </h4>
                        <p className="text-xs sm:text-sm text-green-400">
                          {isCurrentUser ? 'You will get' : 'will get'} {formatCurrency(member.netBalance)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                      <span className="text-green-400 font-bold text-base sm:text-lg">
                        +{formatCurrency(member.netBalance)}
                      </span>
                      {expandedUser === member.user._id ? (
                        <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-white/60" />
                      ) : (
                        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-white/60" />
                      )}
                    </div>
                  </div>
                  
                  {expandedUser === member.user._id && (
                    <div className="mt-3 pl-4 sm:pl-12 space-y-2 animate-fade-in">
                      <div className="text-xs sm:text-sm text-white/80">Will get from:</div>
                      {member.owedBy.map((owed, index) => {
                        // Check if the person who owes money has any pending settlements
                        const settlement = getSettlementStatus(owed.user._id, member.user._id);
                        
                        return (
                          <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs sm:text-sm p-2 rounded-lg bg-white/5 border border-green-500/10 gap-2">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <Avatar className="w-5 h-5 sm:w-6 sm:h-6 shrink-0">
                                <AvatarImage src={owed.user.avatar?.url} />
                                <AvatarFallback className="bg-green-500/20 text-green-400 text-xs">
                                  {owed.user.firstName?.charAt(0)}{owed.user.lastName?.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-white/80 truncate">{owed.user.firstName}</span>
                            </div>
                            
                            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end">
                              <span className="text-green-400 font-medium">
                                +{formatCurrency(owed.amount)}
                              </span>
                              
                              {settlement && (
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs flex items-center gap-1 px-2 py-1 ${
                                    settlement.status === 'processing' ? 'border-yellow-500/30 text-yellow-400 bg-yellow-500/10 animate-pulse' :
                                    settlement.status === 'completed' ? 'border-green-500/30 text-green-400 bg-green-500/10' :
                                    settlement.status === 'failed' ? 'border-red-500/30 text-red-400 bg-red-500/10' :
                                    'border-white/30 text-white/60 bg-white/5'
                                  }`}
                                >
                                  {settlement.status === 'processing' && <Clock className="w-3 h-3" />}
                                  {settlement.status === 'completed' && <CheckCircle className="w-3 h-3" />}
                                  {settlement.status === 'failed' && <X className="w-3 h-3" />}
                                  {settlement.status === 'processing' ? 'Processing' : 
                                   settlement.status === 'completed' ? 'Paid' :
                                   settlement.status === 'failed' ? 'Failed' : 'Pending'}
                                </Badge>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  </div>
                );
              })}
              
              {/* Helpful separator message */}
              {creditors.length > 0 && debtors.length > 0 && (
                <div className="flex items-center gap-4 py-4">
                  <div className="flex-1 border-t border-white/10"></div>
                  <div className="text-xs text-white/40 bg-white/5 px-3 py-1 rounded-full">
                    Payment buttons appear in debtor cards below
                  </div>
                  <div className="flex-1 border-t border-white/10"></div>
                </div>
              )}
              
              {debtors.map((member) => {
                const isCurrentUser = user && user._id === member.user._id;
                
                return (
                  <div key={member.user._id} className="border-b border-white/10 pb-4 last:border-0">
                    <div 
                      className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-lg cursor-pointer hover:bg-white/10 transition-colors gap-2 ${
                        isCurrentUser ? 'bg-red-500/10 border border-red-500/20' : 'bg-white/5'
                      }`}
                      onClick={() => toggleExpand(member.user._id)}
                    >
                    <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                      <Avatar className="w-8 h-8 sm:w-10 sm:h-10 shrink-0">
                        <AvatarImage src={member.user.avatar?.url} />
                        <AvatarFallback className="bg-gradient-primary text-white text-xs sm:text-sm">
                          {member.user.firstName?.charAt(0)}{member.user.lastName?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-white flex items-center gap-2 text-sm sm:text-base">
                          <span className="truncate">{member.user.firstName} {member.user.lastName}</span>
                          {isCurrentUser && (
                            <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/30 text-xs px-1.5 py-0.5 sm:px-2 sm:py-1 shrink-0">
                              You
                            </Badge>
                          )}
                        </h4>
                        <p className="text-xs sm:text-sm text-red-400">
                          {isCurrentUser ? 'You have to give' : 'has to give'} {formatCurrency(Math.abs(member.netBalance))}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                      <span className="text-red-400 font-bold text-base sm:text-lg">
                        -{formatCurrency(Math.abs(member.netBalance))}
                      </span>
                      {expandedUser === member.user._id ? (
                        <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-white/60" />
                      ) : (
                        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-white/60" />
                      )}
                    </div>
                  </div>
                  
                  {expandedUser === member.user._id && (
                    <div className="mt-3 pl-12 space-y-2 animate-fade-in">
                      <div className="text-sm text-white/80">
                        {isCurrentUser ? 'You have to pay:' : `${member.user.firstName} has to give to:`}
                      </div>
                      {isCurrentUser && (
                        <div className="text-xs text-green-400 bg-green-500/10 p-2 rounded border border-green-500/20">
                          💳 You can make payments using the "Pay Now" buttons below
                        </div>
                      )}
                      {member.owesTo.map((owe, index) => {
                        const settlement = getSettlementStatus(member.user._id, owe.user._id);
                        // IMPORTANT: Payment button should show ONLY when:
                        // 1. The current logged-in user is the debtor (member.user)
                        // 2. No settlement is in progress
                        const isCurrentUserTheDebtor = user && user._id === member.user._id;
                        const canShowPayButton = isCurrentUserTheDebtor && !settlement;
                        
                        console.log('Payment Button Logic Debug:', {
                          currentUserId: user?._id,
                          debtorId: member.user._id,
                          debtorName: `${member.user.firstName} ${member.user.lastName}`,
                          creditorName: `${owe.user.firstName} ${owe.user.lastName}`,
                          isCurrentUserTheDebtor,
                          hasSettlement: !!settlement,
                          canShowPayButton
                        });
                        
                        return (
                          <div key={index} className="flex items-center justify-between text-sm p-2 rounded-lg bg-white/5 border border-white/10">
                            <div className="flex items-center gap-2">
                              <Avatar className="w-6 h-6">
                                <AvatarImage src={owe.user.avatar?.url} />
                                <AvatarFallback className="bg-red-500/20 text-red-400 text-xs">
                                  {owe.user.firstName?.charAt(0)}{owe.user.lastName?.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-white/80">{owe.user.firstName}</span>
                            </div>
                            
                            <div className="flex items-center justify-between w-full">
                              <span className="text-red-400 font-medium">
                                -{formatCurrency(owe.amount)}
                              </span>
                              
                              <div className="flex items-center gap-2">
                                {settlement ? (
                                  <Badge 
                                    variant="outline" 
                                    className={`text-xs flex items-center gap-1 px-3 py-1 ${
                                      settlement.status === 'processing' ? 'border-yellow-500/30 text-yellow-400 bg-yellow-500/10 animate-pulse' :
                                      settlement.status === 'completed' ? 'border-green-500/30 text-green-400 bg-green-500/10' :
                                      settlement.status === 'failed' ? 'border-red-500/30 text-red-400 bg-red-500/10' :
                                      'border-white/30 text-white/60 bg-white/5'
                                    }`}
                                  >
                                    {settlement.status === 'processing' && <Clock className="w-3 h-3" />}
                                    {settlement.status === 'completed' && <CheckCircle className="w-3 h-3" />}
                                    {settlement.status === 'failed' && <X className="w-3 h-3" />}
                                    {settlement.status === 'processing' ? 'Processing' : 
                                     settlement.status === 'completed' ? 'Paid' :
                                     settlement.status === 'failed' ? 'Failed' : 'Pending'}
                                  </Badge>
                                ) : canShowPayButton ? (
                                  <Button
                                    size="sm"
                                    className="bg-gradient-to-r from-primary to-secondary text-white hover:from-primary/80 hover:to-secondary/80 transition-all duration-300 hover:scale-105 shadow-lg"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handlePaymentInitiate(member.user, owe.user, owe.amount);
                                    }}
                                  >
                                    <Send className="w-3 h-3 mr-1" />
                                    Pay Now
                                  </Button>
                                ) : isCurrentUserTheDebtor ? (
                                  <Badge variant="outline" className="text-xs text-yellow-400 border-yellow-500/20 bg-yellow-500/10">
                                    Payment Processing
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-xs text-white/40 border-white/20">
                                    Awaiting Payment
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  </div>
                );
              })}
              
              {settled.map((member) => (
                <div 
                  key={member.user._id} 
                  className="flex items-center justify-between p-3 rounded-lg bg-white/5"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={member.user.avatar?.url} />
                      <AvatarFallback className="bg-gradient-primary text-white">
                        {member.user.firstName?.charAt(0)}{member.user.lastName?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-medium text-white">
                        {member.user.firstName} {member.user.lastName}
                      </h4>
                      <p className="text-sm text-gray-400">Settled up</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-gray-500/20 text-gray-400 border-gray-500/30">
                    Settled
                  </Badge>
                </div>
              ))}
            </>
          )}
        </CardContent>
      </Card>
      
      {/* Offline message */}
      {!isConnected && (
        <div className="text-sm text-yellow-400 bg-yellow-500/10 p-2 rounded border border-yellow-500/20 ml-4">
          <span className="flex items-center gap-1">
            <X className="w-3 h-3" />
            Some features may be limited while offline
          </span>
        </div>
      )}
      
      {/* Settlement Payment Modal */}
      <SettlementPaymentModal
        isOpen={showSettlementPaymentModal}
        onClose={() => {
          setShowSettlementPaymentModal(false);
          setSelectedSettlement(null);
        }}
        settlement={selectedSettlement}
        onPaymentComplete={handlePaymentComplete}
      />
    </div>
  );
};

export default EnhancedBalanceSection;