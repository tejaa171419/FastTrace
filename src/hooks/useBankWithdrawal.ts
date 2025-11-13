import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api';

export interface BankAccount {
  _id?: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  accountHolderName: string;
  accountType?: string;
  isPrimary?: boolean;
  isVerified?: boolean;
}

export interface WithdrawalParams {
  amount: number;
  bankAccountId: string;
  pin: string;
  description?: string;
}

export interface WithdrawalResult {
  success: boolean;
  payment?: any;
  wallet?: any;
  bankAccount?: BankAccount;
}

interface UseBankWithdrawalReturn {
  loading: boolean;
  error: string | null;
  success: boolean;
  result: WithdrawalResult | null;
  withdraw: (params: WithdrawalParams) => Promise<WithdrawalResult>;
  reset: () => void;
}

/**
 * Hook to withdraw money to bank account
 */
export const useBankWithdrawal = (): UseBankWithdrawalReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [result, setResult] = useState<WithdrawalResult | null>(null);

  const withdraw = useCallback(async (params: WithdrawalParams): Promise<WithdrawalResult> => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);
      setResult(null);

      // Validate parameters
      if (!params.bankAccountId) {
        throw new Error('Bank account is required');
      }
      if (!params.amount || params.amount <= 0) {
        throw new Error('Valid amount is required');
      }
      if (!params.pin) {
        throw new Error('PIN is required');
      }

      const response = await apiClient.post('/api/payments/withdraw', {
        bankAccountId: params.bankAccountId,
        amount: params.amount,
        description: params.description || 'Withdrawal to bank account',
        pin: params.pin,
      });

      if (response.success) {
        const withdrawalResult: WithdrawalResult = {
          success: true,
          payment: response.data.payment,
          wallet: response.data.wallet,
          bankAccount: response.data.bankAccount,
        };

        setSuccess(true);
        setResult(withdrawalResult);

        // Dispatch wallet update event
        window.dispatchEvent(new CustomEvent('wallet-updated', {
          detail: { timestamp: new Date().toISOString() }
        }));

        return withdrawalResult;
      } else {
        throw new Error(response.message || 'Withdrawal failed');
      }
    } catch (err: any) {
      console.error('Withdrawal error:', err);
      const errorMessage = err.message || err.data?.message || 'Withdrawal failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setSuccess(false);
    setResult(null);
  }, []);

  return {
    loading,
    error,
    success,
    result,
    withdraw,
    reset,
  };
};

export default useBankWithdrawal;