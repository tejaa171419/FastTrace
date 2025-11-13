import { apiClient } from '@/lib/api';
import type {
  WalletData,
  PaymentOrder,
  PaymentVerification,
  PaymentResult,
  WalletTransfer,
  TransferResult,
  UPIPayment,
  PaymentHistoryFilters,
  PaymentHistoryResponse,
  WalletAnalytics,
  PinSetup,
  WalletError
} from '@/types/wallet';

// Enhanced Wallet API service with comprehensive backend connectivity
export class WalletAPI {
  private static instance: WalletAPI;
  private isInitialized = false;

  // Singleton pattern for global wallet API access
  public static getInstance(): WalletAPI {
    if (!WalletAPI.instance) {
      WalletAPI.instance = new WalletAPI();
    }
    return WalletAPI.instance;
  }

  // Initialize API with authentication
  public initialize(token?: string) {
    if (token) {
      apiClient.setToken(token);
    }
    this.isInitialized = true;
  }

  // Error handler with wallet-specific error mapping
  private handleError(error: any): WalletError {
    const walletError: WalletError = {
      code: error.response?.code || 'UNKNOWN_ERROR',
      message: error.message || 'An unexpected error occurred',
      details: error.response?.details || {}
    };

    // Map specific backend errors to user-friendly messages
    if (error.statusCode === 403 && error.response?.kycRequired) {
      walletError.code = 'KYC_REQUIRED';
      walletError.message = 'KYC verification required for this transaction amount';
    } else if (error.statusCode === 400 && error.message.includes('limit')) {
      walletError.code = 'LIMIT_EXCEEDED';
      walletError.message = 'Transaction limit exceeded';
    } else if (error.statusCode === 401) {
      walletError.code = 'AUTHENTICATION_REQUIRED';
      walletError.message = 'Please log in to access your wallet';
    } else if (error.statusCode === 409) {
      walletError.code = 'WALLET_CONFLICT';
      walletError.message = 'Wallet operation conflict detected';
    }

    throw walletError;
  }

  // ================================
  // WALLET OPERATIONS
  // ================================

  /**
   * Get comprehensive wallet details including balance, limits, and recent transactions
   */
  public async getWalletDetails(): Promise<WalletData> {
    try {
      const response = await apiClient.get<{ success: boolean; data: { wallet: WalletData } }>(
        '/api/payments/wallet'
      );
      
      if (!response.success) {
        throw new Error('Failed to fetch wallet details');
      }

      const wallet = response.data.wallet;
      
      // Enhance wallet data with computed fields
      return {
        ...wallet,
        availableBalance: wallet.balance - (wallet.pendingAmount || 0),
        formattedBalance: `₹${wallet.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        recentTransactions: this.enhanceTransactions(wallet.recentTransactions)
      };
    } catch (error) {
      this.handleError(error);
      throw error; // This will never execute due to handleError throwing
    }
  }

  /**
   * Set or update wallet PIN for secure transactions
   */
  public async setWalletPin(pinData: PinSetup): Promise<{ pinSet: boolean; message: string }> {
    try {
      const response = await apiClient.post<{ success: boolean; data: { pinSet: boolean; message: string } }>(
        '/api/payments/wallet/pin',
        pinData
      );
      
      if (!response.success) {
        throw new Error('Failed to set wallet PIN');
      }

      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Verify wallet PIN for transactions
   */
  public async verifyWalletPin(pin: string, action?: string): Promise<{ verified: boolean; action: string }> {
    try {
      const response = await apiClient.post<{ success: boolean; data: { verified: boolean; action: string } }>(
        '/api/payments/wallet/pin/verify',
        { pin, action }
      );
      
      if (!response.success) {
        throw new Error('PIN verification failed');
      }

      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Get PIN status and security information
   */
  public async getPinStatus(): Promise<{
    pinSet: boolean;
    isLocked: boolean;
    attemptsRemaining: number;
    lockTimeRemaining?: number;
  }> {
    try {
      const response = await apiClient.get<{ 
        success: boolean; 
        data: {
          pinSet: boolean;
          isLocked: boolean;
          attemptsRemaining: number;
          lockTimeRemaining?: number;
        } 
      }>(
        '/api/payments/wallet/pin/status'
      );
      
      if (!response.success) {
        throw new Error('Failed to get PIN status');
      }

      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  // ================================
  // PAYMENT OPERATIONS
  // ================================

  /**
   * Create a payment order for wallet top-up
   */
  public async createTopupOrder(
    amount: number,
    method: 'upi' | 'card' | 'netbanking',
    description?: string
  ): Promise<PaymentOrder> {
    try {
      const response = await apiClient.post<{ success: boolean; data: PaymentOrder }>(
        '/api/payments/topup/create-order',
        { amount, method, description }
      );
      
      if (!response.success) {
        throw new Error('Failed to create payment order');
      }

      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Verify payment after successful Razorpay transaction
   */
  public async verifyPayment(verificationData: PaymentVerification): Promise<PaymentResult> {
    try {
      const response = await apiClient.post<{ success: boolean; data: PaymentResult }>(
        '/api/payments/verify',
        verificationData
      );
      
      if (!response.success) {
        throw new Error('Payment verification failed');
      }

      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  // ================================
  // TRANSFER OPERATIONS
  // ================================

  /**
   * Transfer money between wallets
   */
  public async transferMoney(transferData: WalletTransfer): Promise<TransferResult> {
    try {
      const response = await apiClient.post<{ success: boolean; data: TransferResult }>(
        '/api/payments/transfer',
        transferData
      );
      
      if (!response.success) {
        throw new Error('Transfer failed');
      }

      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Send UPI payment to external UPI ID
   */
  public async sendUPIPayment(upiData: UPIPayment): Promise<PaymentResult> {
    try {
      const response = await apiClient.post<{ success: boolean; data: PaymentResult }>(
        '/api/payments/upi',
        upiData
      );
      
      if (!response.success) {
        throw new Error('UPI payment failed');
      }

      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  // ================================
  // TRANSACTION HISTORY
  // ================================

  /**
   * Get paginated payment history with filters
   */
  public async getPaymentHistory(filters: PaymentHistoryFilters = {}): Promise<PaymentHistoryResponse> {
    try {
      const response = await apiClient.get<{ success: boolean; data: PaymentHistoryResponse }>(
        '/api/payments/history',
        filters
      );
      
      if (!response.success) {
        throw new Error('Failed to fetch payment history');
      }

      // Enhance payment data with formatted amounts and status colors
      const enhancedPayments = response.data.payments.map(payment => ({
        ...payment,
        formattedAmount: `₹${payment.amount.toLocaleString('en-IN')}`,
        statusColor: this.getStatusColor(payment.status),
        typeIcon: this.getTransactionIcon(payment.type)
      }));

      return {
        ...response.data,
        payments: enhancedPayments
      };
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Get specific payment details by ID
   */
  public async getPaymentDetails(paymentId: string): Promise<any> {
    try {
      const response = await apiClient.get<{ success: boolean; data: { payment: any } }>(
        `/api/payments/${paymentId}`
      );
      
      if (!response.success) {
        throw new Error('Failed to fetch payment details');
      }

      return response.data.payment;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  // ================================
  // ANALYTICS AND INSIGHTS
  // ================================

  /**
   * Get wallet analytics and statistics
   */
  public async getWalletAnalytics(period: 'week' | 'month' | 'year' = 'month'): Promise<WalletAnalytics> {
    try {
      const response = await apiClient.get<{ success: boolean; data: WalletAnalytics }>(
        '/api/payments/analytics/stats',
        { period }
      );
      
      if (!response.success) {
        throw new Error('Failed to fetch wallet analytics');
      }

      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Get monthly spending trends
   */
  public async getMonthlyTrends(): Promise<any> {
    try {
      const response = await apiClient.get<{ success: boolean; data: any }>(
        '/api/payments/analytics/monthly-trend'
      );
      
      if (!response.success) {
        throw new Error('Failed to fetch monthly trends');
      }

      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  // ================================
  // REFUND OPERATIONS
  // ================================

  /**
   * Request refund for a payment
   */
  public async requestRefund(
    paymentId: string,
    reason: string,
    amount?: number
  ): Promise<{ payment: any; refundAmount: number }> {
    try {
      const response = await apiClient.post<{ 
        success: boolean; 
        data: { payment: any; refundAmount: number } 
      }>(
        `/api/payments/${paymentId}/refund`,
        { reason, amount }
      );
      
      if (!response.success) {
        throw new Error('Refund request failed');
      }

      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  // ================================
  // UTILITY METHODS
  // ================================

  /**
   * Search users for wallet transfers
   */
  public async searchUsers(query: string): Promise<Array<{
    id: string;
    name: string;
    email: string;
    avatar?: string;
  }>> {
    try {
      const response = await apiClient.get<{ 
        success: boolean; 
        data: { users: Array<any> } 
      }>(
        '/api/users/search',
        { query, limit: 10 }
      );
      
      if (!response.success) {
        throw new Error('User search failed');
      }

      return response.data.users.map(user => ({
        id: user._id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        avatar: user.avatar
      }));
    } catch (error) {
      console.warn('User search error:', error);
      return [];
    }
  }

  /**
   * Validate UPI ID format
   */
  public validateUPIId(upiId: string): boolean {
    const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
    return upiRegex.test(upiId);
  }

  /**
   * Validate PIN format
   */
  public validatePIN(pin: string): boolean {
    return /^\d{4,6}$/.test(pin);
  }

  /**
   * Format currency amount
   */
  public formatCurrency(amount: number, currency: string = 'INR'): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount);
  }

  /**
   * Calculate cashback for transaction
   */
  public calculateCashback(amount: number, category: string, tier: string): number {
    const cashbackRates: Record<string, Record<string, number>> = {
      basic: { default: 0.005, food: 0.01, travel: 0.008 },
      silver: { default: 0.008, food: 0.015, travel: 0.012 },
      gold: { default: 0.012, food: 0.02, travel: 0.018 },
      platinum: { default: 0.015, food: 0.025, travel: 0.022 }
    };

    const tierRates = cashbackRates[tier] || cashbackRates.basic;
    const rate = tierRates[category] || tierRates.default;
    
    return Math.round(amount * rate * 100) / 100;
  }

  // ================================
  // PRIVATE HELPER METHODS
  // ================================

  /**
   * Enhance transaction data with UI-friendly properties
   */
  private enhanceTransactions(transactions: any[]): any[] {
    return transactions.map(transaction => ({
      ...transaction,
      formattedAmount: this.formatCurrency(transaction.amount),
      statusColor: this.getStatusColor(transaction.type),
      icon: this.getTransactionIcon(transaction.type),
      timeAgo: this.getTimeAgo(transaction.timestamp)
    }));
  }

  /**
   * Get status color for transaction type
   */
  private getStatusColor(type: string): string {
    const colorMap: Record<string, string> = {
      credit: 'text-green-400',
      debit: 'text-red-400',
      transfer_in: 'text-blue-400',
      transfer_out: 'text-orange-400',
      refund: 'text-purple-400',
      cashback: 'text-green-400',
      completed: 'text-green-400',
      pending: 'text-yellow-400',
      failed: 'text-red-400',
      cancelled: 'text-gray-400'
    };
    return colorMap[type] || 'text-gray-400';
  }

  /**
   * Get icon for transaction type
   */
  private getTransactionIcon(type: string): string {
    const iconMap: Record<string, string> = {
      credit: 'ArrowDownLeft',
      debit: 'ArrowUpRight',
      transfer_in: 'ArrowDownLeft',
      transfer_out: 'ArrowUpRight',
      refund: 'RefreshCw',
      cashback: 'Gift',
      wallet_topup: 'Plus',
      wallet_transfer: 'Send',
      upi: 'Smartphone'
    };
    return iconMap[type] || 'DollarSign';
  }

  /**
   * Get human-readable time ago
   */
  private getTimeAgo(timestamp: string): string {
    const now = new Date();
    const past = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return past.toLocaleDateString();
  }
}

// Export singleton instance
export const walletAPI = WalletAPI.getInstance();

// Auto-initialize if token is available
if (typeof window !== 'undefined') {
  const token = localStorage.getItem('authToken');
  if (token) {
    walletAPI.initialize(token);
  }
}

// Helper functions for external use
export const walletUtils = {
  formatCurrency: (amount: number, currency = 'INR') => 
    walletAPI.formatCurrency(amount, currency),
  
  validateUPI: (upiId: string) => 
    walletAPI.validateUPIId(upiId),
  
  validatePIN: (pin: string) => 
    walletAPI.validatePIN(pin),
  
  calculateCashback: (amount: number, category: string, tier: string) =>
    walletAPI.calculateCashback(amount, category, tier),
  
  getTransactionIcon: (type: string) => {
    const iconMap: Record<string, string> = {
      credit: 'ArrowDownLeft',
      debit: 'ArrowUpRight',
      transfer_in: 'ArrowDownLeft',
      transfer_out: 'ArrowUpRight',
      refund: 'RefreshCw',
      cashback: 'Gift'
    };
    return iconMap[type] || 'DollarSign';
  },
  
  getStatusColor: (status: string) => {
    const colorMap: Record<string, string> = {
      completed: 'text-green-400',
      pending: 'text-yellow-400',
      failed: 'text-red-400',
      cancelled: 'text-gray-400'
    };
    return colorMap[status] || 'text-gray-400';
  }
};