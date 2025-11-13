import { useEffect, useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useWebSocket } from './useWebSocket';
import { toast } from 'react-hot-toast';

interface BalanceUpdate {
  groupId: string;
  userId: string;
  targetUserId: string;
  amount: number;
  previousAmount: number;
  reason: string;
  timestamp: string;
}

interface ExpenseUpdate {
  groupId: string;
  expenseId: string;
  action: 'created' | 'updated' | 'deleted';
  expense: any;
  addedBy: {
    id: string;
    name: string;
  };
  timestamp: string;
}

interface SettlementUpdate {
  groupId: string;
  payerId: string;
  payerName: string;
  receiverId: string;
  receiverName: string;
  amount: number;
  timestamp: string;
}

interface GroupActivityUpdate {
  groupId: string;
  type: 'member_joined' | 'member_left' | 'member_added' | 'member_removed';
  user: {
    id: string;
    name: string;
  };
  actorId?: string;
  actorName?: string;
  timestamp: string;
}

export const useRealTimeBalanceUpdates = (groupId?: string) => {
  const queryClient = useQueryClient();
  const { socket, isConnected, on, off, emit } = useWebSocket();
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Join group room when groupId is provided and socket is connected
  useEffect(() => {
    if (isConnected && socket && groupId) {
      emit('join_group', { groupId });
      
      return () => {
        emit('leave_group', { groupId });
      };
    }
  }, [isConnected, socket, groupId, emit]);

  // Handle balance updates
  const handleBalanceUpdate = useCallback((data: BalanceUpdate) => {
    console.log('Balance update received:', data);
    
    // Invalidate and refetch balance queries
    queryClient.invalidateQueries({ queryKey: ['balances'] });
    queryClient.invalidateQueries({ queryKey: ['group-balances', data.groupId] });
    queryClient.invalidateQueries({ queryKey: ['balance-suggestions', data.groupId] });
    
    // Show notification for balance changes
    const changeAmount = data.amount - data.previousAmount;
    const isIncrease = changeAmount > 0;
    
    toast.success(
      `Balance ${isIncrease ? 'increased' : 'decreased'} by ₹${Math.abs(changeAmount).toFixed(2)}`,
      {
        duration: 4000,
        icon: isIncrease ? '📈' : '📉'
      }
    );
    
    setLastUpdate(data.timestamp);
  }, [queryClient]);

  // Handle expense updates
  const handleExpenseUpdate = useCallback((data: ExpenseUpdate) => {
    console.log('Expense update received:', data);
    
    // Invalidate relevant queries
    queryClient.invalidateQueries({ queryKey: ['expenses'] });
    queryClient.invalidateQueries({ queryKey: ['group-expenses', data.groupId] });
    queryClient.invalidateQueries({ queryKey: ['balances'] });
    queryClient.invalidateQueries({ queryKey: ['group-balances', data.groupId] });
    queryClient.invalidateQueries({ queryKey: ['balance-suggestions', data.groupId] });
    
    // Show notification based on action
    let message = '';
    let icon = '';
    
    switch (data.action) {
      case 'created':
        message = `New expense added by ${data.addedBy.name}`;
        icon = '💸';
        break;
      case 'updated':
        message = `Expense updated by ${data.addedBy.name}`;
        icon = '✏️';
        break;
      case 'deleted':
        message = `Expense deleted by ${data.addedBy.name}`;
        icon = '🗑️';
        break;
    }
    
    toast.success(message, {
      duration: 4000,
      icon
    });
    
    setLastUpdate(data.timestamp);
  }, [queryClient]);

  // Handle settlement updates
  const handleSettlementUpdate = useCallback((data: SettlementUpdate) => {
    console.log('Settlement update received:', data);
    
    // Invalidate balance-related queries
    queryClient.invalidateQueries({ queryKey: ['balances'] });
    queryClient.invalidateQueries({ queryKey: ['group-balances', data.groupId] });
    queryClient.invalidateQueries({ queryKey: ['balance-suggestions', data.groupId] });
    queryClient.invalidateQueries({ queryKey: ['payment-history'] });
    
    // Show settlement notification
    toast.success(
      `${data.payerName} paid ₹${data.amount.toFixed(2)} to ${data.receiverName}`,
      {
        duration: 5000,
        icon: '💳'
      }
    );
    
    setLastUpdate(data.timestamp);
  }, [queryClient]);

  // Handle group activity updates
  const handleGroupActivity = useCallback((data: GroupActivityUpdate) => {
    console.log('Group activity received:', data);
    
    // Invalidate group-related queries
    queryClient.invalidateQueries({ queryKey: ['groups'] });
    queryClient.invalidateQueries({ queryKey: ['group', data.groupId] });
    queryClient.invalidateQueries({ queryKey: ['group-members', data.groupId] });
    
    // Show activity notification
    let message = '';
    let icon = '';
    
    switch (data.type) {
      case 'member_joined':
        message = `${data.user.name} joined the group`;
        icon = '👋';
        break;
      case 'member_left':
        message = `${data.user.name} left the group`;
        icon = '👋';
        break;
      case 'member_added':
        message = `${data.user.name} was added to the group`;
        icon = '➕';
        break;
      case 'member_removed':
        message = `${data.user.name} was removed from the group`;
        icon = '➖';
        break;
    }
    
    toast.success(message, {
      duration: 4000,
      icon
    });
    
    setLastUpdate(data.timestamp);
  }, [queryClient]);

  // Set up event listeners
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Register event handlers
    on('balance_updated', handleBalanceUpdate);
    on('expense_updated', handleExpenseUpdate);
    on('settlement_completed', handleSettlementUpdate);
    on('group_activity', handleGroupActivity);

    // Cleanup event listeners
    return () => {
      off('balance_updated', handleBalanceUpdate);
      off('expense_updated', handleExpenseUpdate);
      off('settlement_completed', handleSettlementUpdate);
      off('group_activity', handleGroupActivity);
    };
  }, [
    socket,
    isConnected,
    on,
    off,
    handleBalanceUpdate,
    handleExpenseUpdate,
    handleSettlementUpdate,
    handleGroupActivity
  ]);

  // Request latest balance updates when component mounts
  useEffect(() => {
    if (isConnected && socket && groupId) {
      emit('request_balance_update', { groupId });
    }
  }, [isConnected, socket, groupId, emit]);

  return {
    isConnected,
    lastUpdate,
    isRefreshing,
    // Utility functions to manually trigger updates
    requestBalanceUpdate: useCallback(() => {
      if (groupId) {
        setIsRefreshing(true);
        emit('request_balance_update', { groupId });
        // Automatically turn off refreshing after 2 seconds
        setTimeout(() => setIsRefreshing(false), 2000);
      }
    }, [groupId, emit, setIsRefreshing]),
    
    requestExpenseUpdate: useCallback(() => {
      if (groupId) {
        setIsRefreshing(true);
        emit('request_expense_update', { groupId });
        // Automatically turn off refreshing after 2 seconds
        setTimeout(() => setIsRefreshing(false), 2000);
      }
    }, [groupId, emit, setIsRefreshing])
  };
};

export default useRealTimeBalanceUpdates;