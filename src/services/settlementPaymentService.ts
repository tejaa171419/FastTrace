import { apiClient } from './api';

export interface SettlementPaymentData {
  groupId: string;
  toUserId: string;
  amount: number;
  method: string;
  description?: string;
}

export interface PaymentOrder {
  paymentId: string;
  orderId: string;
  amount: number;
  currency: string;
  razorpayKeyId: string;
  groupId: string;
  recipient: {
    id: string;
    name: string;
    email: string;
  };
}

export interface PaymentVerification {
  paymentId: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface PaymentResult {
  payment: {
    id: string;
    status: string;
    amount: number;
    completedAt: string;
  };
  balanceUpdate: {
    previousAmount: number;
    newAmount: number;
    settled: boolean;
  };
  groupId: string;
  message: string;
}

export interface SettlementPayment {
  id: string;
  from: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: { url?: string };
  };
  to: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: { url?: string };
  };
  amount: number;
  currency: string;
  method: string;
  status: string;
  description: string;
  createdAt: string;
  completedAt?: string;
}

export interface SettlementHistory {
  settlements: SettlementPayment[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
  statistics: {
    totalAmount: number;
    completedCount: number;
    pendingCount: number;
  };
}

class SettlementPaymentService {
  /**
   * Initiate settlement payment
   */
  async initiatePayment(data: SettlementPaymentData): Promise<PaymentOrder> {
    try {
      console.log('💳 Initiating settlement payment:', data);
      const response = await apiClient.post('/api/settlements/pay', data);
      console.log('✅ Settlement payment response:', response);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to initiate payment');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('❌ Settlement payment initiation failed:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response,
        statusCode: error.statusCode
      });
      const errorMessage = error.response?.message || error.message || 'Failed to initiate payment';
      throw new Error(errorMessage);
    }
  }

  /**
   * Verify settlement payment
   */
  async verifyPayment(verificationData: PaymentVerification): Promise<PaymentResult> {
    try {
      console.log('🔍 Verifying settlement payment:', verificationData);
      const response = await apiClient.post('/api/settlements/verify', verificationData);
      console.log('✅ Payment verification response:', response);
      
      if (!response.success) {
        throw new Error(response.message || 'Payment verification failed');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('❌ Settlement payment verification failed:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response,
        statusCode: error.statusCode
      });
      const errorMessage = error.response?.message || error.message || 'Payment verification failed';
      throw new Error(errorMessage);
    }
  }

  /**
   * Get settlement payment history for a group
   */
  async getPaymentHistory(
    groupId: string, 
    page: number = 1, 
    limit: number = 20
  ): Promise<SettlementHistory> {
    try {
      console.log('📜 Getting payment history for group:', groupId);
      const response = await apiClient.get(`/api/settlements/group/${groupId}`, {
        params: { page, limit }
      });
      console.log('✅ Payment history response:', response);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to get payment history');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('❌ Get settlement history failed:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response,
        statusCode: error.statusCode
      });
      const errorMessage = error.response?.message || error.message || 'Failed to get payment history';
      throw new Error(errorMessage);
    }
  }

  /**
   * Get settlement suggestions for a group
   */
  async getSettlementSuggestions(groupId: string) {
    try {
      console.log('💡 Getting settlement suggestions for group:', groupId);
      const response = await apiClient.get(`/api/settlements/suggestions/${groupId}`);
      console.log('✅ Settlement suggestions response:', response);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to get settlement suggestions');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('❌ Get settlement suggestions failed:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response,
        statusCode: error.statusCode
      });
      const errorMessage = error.response?.message || error.message || 'Failed to get settlement suggestions';
      throw new Error(errorMessage);
    }
  }

  /**
   * Confirm settlement payment receipt
   */
  async confirmSettlement(paymentId: string, message?: string): Promise<any> {
    try {
      console.log('✅ Confirming settlement:', { paymentId, message });
      const response = await apiClient.post(`/api/settlements/${paymentId}/confirm`, { message });
      console.log('✅ Settlement confirmation response:', response);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to confirm settlement');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('❌ Settlement confirmation failed:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response,
        statusCode: error.statusCode
      });
      const errorMessage = error.response?.message || error.message || 'Failed to confirm settlement';
      throw new Error(errorMessage);
    }
  }

  /**
   * Reject settlement payment
   */
  async rejectSettlement(paymentId: string, reason: string): Promise<any> {
    try {
      console.log('❌ Rejecting settlement:', { paymentId, reason });
      const response = await apiClient.post(`/api/settlements/${paymentId}/reject`, { reason });
      console.log('✅ Settlement rejection response:', response);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to reject settlement');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('❌ Settlement rejection failed:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response,
        statusCode: error.statusCode
      });
      const errorMessage = error.response?.message || error.message || 'Failed to reject settlement';
      throw new Error(errorMessage);
    }
  }

  /**
   * Get pending settlements awaiting confirmation
   */
  async getPendingSettlements(): Promise<any[]> {
    try {
      console.log('📋 Getting pending settlements');
      const response = await apiClient.get('/api/settlements/pending');
      console.log('✅ Pending settlements response:', response);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to get pending settlements');
      }
      
      return response.data.settlements || [];
    } catch (error: any) {
      console.error('❌ Get pending settlements failed:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response,
        statusCode: error.statusCode
      });
      const errorMessage = error.response?.message || error.message || 'Failed to get pending settlements';
      throw new Error(errorMessage);
    }
  }
}

export const settlementPaymentService = new SettlementPaymentService();