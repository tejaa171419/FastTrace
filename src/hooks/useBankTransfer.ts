import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api';

export interface BankAccount {
  _id: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  accountHolderName: string;
  accountType: 'savings' | 'current' | 'salary' | 'nri';
  isPrimary: boolean;
  isVerified: boolean;
  status: 'active' | 'inactive' | 'blocked' | 'closed';
  bankDetails?: {
    city?: string;
    district?: string;
    state?: string;
    branch?: string;
  };
}

export interface IFSCDetails {
  bankName: string;
  branch: string;
  city: string;
  district: string;
  state: string;
  address: string;
  contact?: string;
  micr?: string;
  swift?: string;
  ifscCode: string;
}

export interface BankTransfer {
  _id: string;
  transferId: string;
  transferType: 'wallet_to_bank' | 'bank_to_wallet' | 'bank_to_bank' | 'wallet_to_upi' | 'bank_to_upi';
  amount: number;
  currency: string;
  description: string;
  status: 'initiated' | 'pending' | 'processing' | 'queued' | 'completed' | 'failed' | 'cancelled' | 'reversed' | 'on_hold';
  source: {
    type: 'wallet' | 'bank' | 'upi';
    bankAccountId?: string;
    accountNumber?: string;
    ifscCode?: string;
    bankName?: string;
    balanceBefore?: number;
    balanceAfter?: number;
  };
  destination: {
    type: 'wallet' | 'bank' | 'upi';
    bankAccountId?: string;
    accountNumber?: string;
    ifscCode?: string;
    bankName?: string;
    accountHolderName?: string;
    upiId?: string;
  };
  fees: {
    processingFee: number;
    gatewayFee: number;
    gst: number;
    total: number;
  };
  totalAmount: number;
  processing: {
    startedAt?: string;
    completedAt?: string;
    estimatedCompletionAt?: string;
  };
  createdAt: string;
  completedAt?: string;
}

export interface InitiateTransferParams {
  transferType: string;
  amount: number;
  description?: string;
  purpose?: string;
  pin: string;
  sourceType?: string;
  sourceBankAccountId?: string;
  destinationType?: string;
  destinationBankAccountId?: string;
  destinationUpiId?: string;
  destinationAccountNumber?: string;
  destinationIfscCode?: string;
  destinationBankName?: string;
  destinationAccountHolderName?: string;
}

export const useBankTransfer = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Lookup IFSC code
  const lookupIFSC = useCallback(async (ifscCode: string): Promise<IFSCDetails | null> => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get(`/api/bank-transfers/ifsc/${ifscCode.toUpperCase()}`);
      
      if (response.success) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to lookup IFSC code');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to lookup IFSC code';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Add bank account
  const addBankAccount = useCallback(async (accountData: {
    accountNumber: string;
    ifscCode: string;
    bankName: string;
    accountHolderName: string;
    accountType?: string;
    isPrimary?: boolean;
  }): Promise<BankAccount | null> => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.post('/api/bank-transfers/accounts', accountData);
      
      if (response.success) {
        return response.data.bankAccount;
      }
      
      throw new Error(response.message || 'Failed to add bank account');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to add bank account';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get bank accounts
  const getBankAccounts = useCallback(async (): Promise<BankAccount[]> => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get('/api/bank-transfers/accounts');
      
      if (response.success) {
        return response.data.accounts || [];
      }
      
      return [];
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch bank accounts';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Verify bank account
  const verifyBankAccount = useCallback(async (accountId: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.post(`/api/bank-transfers/accounts/${accountId}/verify`);
      
      if (response.success) {
        return true;
      }
      
      throw new Error(response.message || 'Failed to verify bank account');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to verify bank account';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initiate transfer
  const initiateTransfer = useCallback(async (transferData: InitiateTransferParams): Promise<BankTransfer | null> => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.post('/api/bank-transfers/transfers/initiate', transferData);
      
      if (response.success) {
        return response.data.transfer;
      }
      
      throw new Error(response.message || 'Failed to initiate transfer');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to initiate transfer';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get transfer history
  const getTransferHistory = useCallback(async (params?: {
    status?: string;
    transferType?: string;
    limit?: number;
    page?: number;
  }): Promise<{ transfers: BankTransfer[], pagination: any }> => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.transferType) queryParams.append('transferType', params.transferType);
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.page) queryParams.append('page', params.page.toString());

      const response = await apiClient.get(`/api/bank-transfers/transfers/history?${queryParams.toString()}`);
      
      if (response.success) {
        return response.data;
      }
      
      return { transfers: [], pagination: null };
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch transfer history';
      setError(errorMessage);
      return { transfers: [], pagination: null };
    } finally {
      setLoading(false);
    }
  }, []);

  // Get transfer details
  const getTransferDetails = useCallback(async (transferId: string): Promise<BankTransfer | null> => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get(`/api/bank-transfers/transfers/${transferId}`);
      
      if (response.success) {
        return response.data.transfer;
      }
      
      return null;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch transfer details';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get transfer statistics
  const getTransferStats = useCallback(async (period: 'week' | 'month' | 'year' = 'month') => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get(`/api/bank-transfers/transfers/stats/summary?period=${period}`);
      
      if (response.success) {
        return response.data;
      }
      
      return null;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch transfer statistics';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Cancel transfer
  const cancelTransfer = useCallback(async (transferId: string, reason?: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.post(`/api/bank-transfers/transfers/${transferId}/cancel`, { reason });
      
      if (response.success) {
        return true;
      }
      
      throw new Error(response.message || 'Failed to cancel transfer');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to cancel transfer';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Reset error
  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    lookupIFSC,
    addBankAccount,
    getBankAccounts,
    verifyBankAccount,
    initiateTransfer,
    getTransferHistory,
    getTransferDetails,
    getTransferStats,
    cancelTransfer,
    resetError
  };
};

export default useBankTransfer;
