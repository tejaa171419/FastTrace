import { useState, useCallback } from 'react';
import { WalletAPI } from '@/lib/walletAPI';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { triggerWalletUpdate } from './useWalletBalance';
import { triggerTransactionUpdate } from './useWalletTransactions';

export interface TransferData {
  toUserId: string;
  amount: number;
  pin: string;
  description?: string;
}

export interface TransferResult {
  payment: {
    _id: string;
    type: string;
    amount: number;
    status: string;
    from: string;
    to: string;
  };
  fromBalance: number;
  toBalance: number;
  message: string;
}

interface UseWalletTransferReturn {
  transfer: (data: TransferData) => Promise<TransferResult | null>;
  loading: boolean;
  error: string | null;
  success: boolean;
  reset: () => void;
}

/**
 * Custom hook for wallet money transfers
 * Handles PIN verification, validation, and balance updates
 */
export const useWalletTransfer = (): UseWalletTransferReturn => {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const walletAPI = WalletAPI.getInstance();

  /**
   * Transfer money to another user
   */
  const transfer = useCallback(async (data: TransferData): Promise<TransferResult | null> => {
    if (!isAuthenticated) {
      const errorMsg = 'Please login to transfer money';
      setError(errorMsg);
      toast({
        title: 'Authentication Required',
        description: errorMsg,
        variant: 'destructive'
      });
      return null;
    }

    // Validation
    if (!data.toUserId) {
      const errorMsg = 'Please select a recipient';
      setError(errorMsg);
      toast({
        title: 'Invalid Input',
        description: errorMsg,
        variant: 'destructive'
      });
      return null;
    }

    if (!data.amount || data.amount <= 0) {
      const errorMsg = 'Please enter a valid amount';
      setError(errorMsg);
      toast({
        title: 'Invalid Amount',
        description: errorMsg,
        variant: 'destructive'
      });
      return null;
    }

    if (!data.pin || data.pin.length < 4) {
      const errorMsg = 'Please enter your 4-6 digit PIN';
      setError(errorMsg);
      toast({
        title: 'Invalid PIN',
        description: errorMsg,
        variant: 'destructive'
      });
      return null;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Step 1: Verify PIN
      const pinVerification = await walletAPI.verifyWalletPin(data.pin, 'transfer');
      
      if (!pinVerification.verified) {
        throw new Error('Invalid PIN. Please try again.');
      }

      // Step 2: Transfer money
      const transferData = {
        toUserId: data.toUserId,
        amount: data.amount,
        pin: data.pin,
        description: data.description || 'Wallet transfer'
      };

      const result = await walletAPI.transferMoney(transferData);

      // Success
      setSuccess(true);
      setLoading(false);

      // Show success toast
      toast({
        title: 'Transfer Successful! 🎉',
        description: `₹${data.amount.toLocaleString('en-IN')} transferred successfully`,
        variant: 'default'
      });

      // Trigger updates
      triggerWalletUpdate();
      triggerTransactionUpdate();

      return result;
    } catch (err: any) {
      console.error('Transfer failed:', err);
      const errorMessage = err.message || 'Transfer failed. Please try again.';
      
      setError(errorMessage);
      setLoading(false);
      setSuccess(false);

      // Show error toast
      toast({
        title: 'Transfer Failed',
        description: errorMessage,
        variant: 'destructive'
      });

      return null;
    }
  }, [isAuthenticated, walletAPI, toast]);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setError(null);
    setSuccess(false);
    setLoading(false);
  }, []);

  return {
    transfer,
    loading,
    error,
    success,
    reset
  };
};

export default useWalletTransfer;