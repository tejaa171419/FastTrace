import { useEffect, useCallback } from 'react';
import { useWebSocket } from './useWebSocket';
import { toast } from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';

interface ExpenseNotification {
  groupId: string;
  expenseId: string;
  action: 'created' | 'updated' | 'deleted';
  expense: {
    _id: string;
    title: string;
    amount: number;
    currency: string;
    category: string;
    date: string;
    paidBy: any;
    splitBetween: any[];
  };
  addedBy: {
    id: string;
    name: string;
  };
  timestamp: string;
}

interface UseExpenseNotificationsOptions {
  groupId?: string;
  showToasts?: boolean;
  onExpenseUpdate?: (notification: ExpenseNotification) => void;
}

export const useExpenseNotifications = (options: UseExpenseNotificationsOptions = {}) => {
  const { groupId, showToasts = true, onExpenseUpdate } = options;
  const { socket, isConnected, on, off } = useWebSocket();
  const queryClient = useQueryClient();

  // Handle expense update notifications
  const handleExpenseUpdate = useCallback((data: ExpenseNotification) => {
    // Invalidate relevant queries to refresh data
    queryClient.invalidateQueries({ queryKey: ['expenses'] });
    queryClient.invalidateQueries({ queryKey: ['group-expenses', data.groupId] });
    
    // Show toast notification if enabled
    if (showToasts) {
      let message = '';
      let icon = '';
      
      switch (data.action) {
        case 'created':
          message = `${data.addedBy.name} added "${data.expense.title}" (₹${data.expense.amount.toFixed(2)})`;
          icon = '💸';
          break;
        case 'updated':
          message = `${data.addedBy.name} updated "${data.expense.title}"`;
          icon = '✏️';
          break;
        case 'deleted':
          message = `${data.addedBy.name} deleted "${data.expense.title}"`;
          icon = '🗑️';
          break;
      }
      
      toast.success(message, {
        duration: 4000,
        icon,
        position: 'top-right',
        style: {
          background: 'rgba(34, 197, 94, 0.1)',
          border: '1px solid rgba(34, 197, 94, 0.2)',
          color: '#ffffff',
        },
      });
    }
    
    // Call custom handler if provided
    if (onExpenseUpdate) {
      onExpenseUpdate(data);
    }
  }, [queryClient, showToasts, onExpenseUpdate]);

  // Handle balance update needed notifications
  const handleBalanceUpdateNeeded = useCallback((data: any) => {
    // Invalidate balance queries to trigger refresh
    queryClient.invalidateQueries({ queryKey: ['balances'] });
    queryClient.invalidateQueries({ queryKey: ['group-balances', data.groupId] });
    queryClient.invalidateQueries({ queryKey: ['balance-suggestions', data.groupId] });
  }, [queryClient]);

  // Set up event listeners
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Register event handlers
    on('expense_updated', handleExpenseUpdate);
    on('balance_update_needed', handleBalanceUpdateNeeded);

    return () => {
      // Cleanup event listeners
      off('expense_updated', handleExpenseUpdate);
      off('balance_update_needed', handleBalanceUpdateNeeded);
    };
  }, [socket, isConnected, on, off, handleExpenseUpdate, handleBalanceUpdateNeeded]);

  return {
    isConnected,
  };
};

export default useExpenseNotifications;