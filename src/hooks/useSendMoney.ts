import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api';

export interface SendMoneyParams {
  toUserId: string;
  amount: number;
  description?: string;
  pin: string;
}

export interface SendMoneyResult {
  success: boolean;
  payment?: any;
  fromWallet?: any;
  toWallet?: any;
  recipient?: {
    id: string;
    name: string;
    email: string;
  };
}

interface UseSendMoneyReturn {
  loading: boolean;
  error: string | null;
  success: boolean;
  result: SendMoneyResult | null;
  sendMoney: (params: SendMoneyParams) => Promise<SendMoneyResult>;
  reset: () => void;
}

/**
 * Hook to send money to another user
 */
export const useSendMoney = (): UseSendMoneyReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [result, setResult] = useState<SendMoneyResult | null>(null);

  const sendMoney = useCallback(async (params: SendMoneyParams): Promise<SendMoneyResult> => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);
      setResult(null);

      // Validate parameters
      if (!params.toUserId) {
        throw new Error('Recipient is required');
      }
      if (!params.amount || params.amount <= 0) {
        throw new Error('Valid amount is required');
      }
      if (!params.pin) {
        throw new Error('PIN is required');
      }

      const response = await apiClient.post('/api/payments/transfer', {
        toUserId: params.toUserId,
        amount: params.amount,
        description: params.description || '',
        pin: params.pin,
      });

      if (response.success) {
        const transferResult: SendMoneyResult = {
          success: true,
          payment: response.data.payment,
          fromWallet: response.data.fromWallet,
          toWallet: response.data.toWallet,
          recipient: response.data.recipient,
        };

        setSuccess(true);
        setResult(transferResult);

        // Dispatch wallet update event
        window.dispatchEvent(new CustomEvent('wallet-updated', {
          detail: { timestamp: new Date().toISOString() }
        }));
        
        // Dispatch transaction completed event
        window.dispatchEvent(new CustomEvent('transaction-completed', {
          detail: { timestamp: new Date().toISOString() }
        }));

        return transferResult;
      } else {
        throw new Error(response.message || 'Transfer failed');
      }
    } catch (err: any) {
      console.error('Send money error:', err);
      const errorMessage = err.message || err.data?.message || 'Transfer failed';
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
    sendMoney,
    reset,
  };
};

export default useSendMoney;