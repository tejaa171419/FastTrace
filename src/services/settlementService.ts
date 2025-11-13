import { apiClient } from './api';

export interface CreateSettlementRequest {
  groupId: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  transactionId?: string;
  notes?: string;
}

export interface UpdateSettlementRequest {
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  paymentReference?: string;
  failureReason?: string;
  completedAt?: Date;
  metadata?: Record<string, any>;
}

export interface SettlementRecord {
  _id: string;
  groupId: string;
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
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  paymentMethod: string;
  transactionId: string;
  paymentReference?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  notes?: string;
  failureReason?: string;
  metadata?: Record<string, any>;
}

export interface PartialSettlementRequest {
  settlementId: string;
  partialAmount: number;
  paymentMethod: string;
  transactionId: string;
  notes?: string;
}

export interface SimplifySettlementsRequest {
  groupId: string;
  memberIds: string[];
}

export interface OptimizedSettlement {
  fromUserId: string;
  toUserId: string;
  amount: number;
  reason: string;
  savings: {
    reducedTransactions: number;
    simplifiedAmount: number;
  };
}

export interface SettlementSummary {
  totalSettlements: number;
  completedSettlements: number;
  pendingSettlements: number;
  failedSettlements: number;
  totalAmount: number;
  recentSettlements: SettlementRecord[];
}

class SettlementService {
  private baseURL = '/api/settlements';

  /**
   * Create a new settlement record
   */
  async createSettlement(settlement: CreateSettlementRequest): Promise<{ data: SettlementRecord; status: number; statusText: string }> {
    const newSettlement: SettlementRecord = {
      _id: `settlement_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      groupId: settlement.groupId,
      fromUser: {
        _id: settlement.fromUserId,
        firstName: 'User',
        lastName: 'Name',
      },
      toUser: {
        _id: settlement.toUserId,
        firstName: 'User',
        lastName: 'Name',
      },
      amount: settlement.amount,
      currency: settlement.currency,
      status: 'pending',
      paymentMethod: settlement.paymentMethod,
      transactionId: settlement.transactionId || `TXN${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      notes: settlement.notes,
    };
    
    return {
      data: newSettlement,
      status: 200,
      statusText: 'OK'
    };
  }

  /**
   * Update settlement status and details
   */
  async updateSettlement(
    settlementId: string, 
    updates: UpdateSettlementRequest
  ): Promise<{ data: SettlementRecord; status: number; statusText: string }> {
    // In a real implementation, this would make an API call
    // For now, we'll just return a success response
    return {
      data: {} as SettlementRecord,
      status: 200,
      statusText: 'OK'
    };
  }

  /**
   * Get settlement by ID
   */
  async getSettlement(settlementId: string): Promise<any> {
    return await apiClient.get<SettlementRecord>(`${this.baseURL}/${settlementId}`);
  }

  /**
   * Get all settlements for a group
   */
  async getGroupSettlements(
    groupId: string,
    page: number = 1,
    limit: number = 20,
    status?: string
  ): Promise<any> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(status && { status })
    });

    return await apiClient.get<any>(`${this.baseURL}/group/${groupId}?${params}`);
  }

  /**
   * Get settlements for a specific user in a group
   */
  async getUserSettlements(
    groupId: string,
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<any> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });

    return await apiClient.get<any>(`${this.baseURL}/group/${groupId}/user/${userId}?${params}`);
  }

  /**
   * Mark settlement as completed with payment confirmation
   */
  async confirmPayment(
    settlementId: string,
    paymentReference: string,
    metadata?: Record<string, any>
  ): Promise<any> {
    return await apiClient.post<SettlementRecord>(`${this.baseURL}/${settlementId}/confirm`, {
      paymentReference,
      metadata,
      completedAt: new Date()
    });
  }

  /**
   * Cancel a pending settlement
   */
  async cancelSettlement(
    settlementId: string,
    reason?: string
  ): Promise<any> {
    return await apiClient.post<SettlementRecord>(`${this.baseURL}/${settlementId}/cancel`, {
      reason,
      status: 'cancelled'
    });
  }

  /**
   * Retry a failed settlement
   */
  async retrySettlement(
    settlementId: string,
    newPaymentMethod?: string,
    newTransactionId?: string
  ): Promise<any> {
    return await apiClient.post<SettlementRecord>(`${this.baseURL}/${settlementId}/retry`, {
      paymentMethod: newPaymentMethod,
      transactionId: newTransactionId,
      status: 'pending'
    });
  }

  /**
   * Create partial settlement for large amounts
   */
  async createPartialSettlement(
    partial: PartialSettlementRequest
  ): Promise<any> {
    return await apiClient.post<any>(`${this.baseURL}/partial`, partial);
  }

  /**
   * Get optimized settlement suggestions for a group
   */
  async getOptimizedSettlements(
    groupId: string,
    memberIds: string[]
  ): Promise<any> {
    return await apiClient.post<any>(`${this.baseURL}/optimize`, {
      groupId,
      memberIds
    });
  }

  /**
   * Apply simplified settlements to group
   */
  async applySimplifiedSettlements(
    request: SimplifySettlementsRequest
  ): Promise<any> {
    return await apiClient.post<any>(`${this.baseURL}/simplify`, request);
  }

  /**
   * Get settlement summary and analytics for a group
   */
  async getSettlementSummary(groupId: string): Promise<any> {
    return await apiClient.get<SettlementSummary>(`${this.baseURL}/group/${groupId}/summary`);
  }

  /**
   * Export settlement history as CSV/PDF
   */
  async exportSettlementHistory(
    groupId: string,
    format: 'csv' | 'pdf' = 'csv',
    dateFrom?: Date,
    dateTo?: Date,
    status?: string
  ): Promise<any> {
    const params = new URLSearchParams({
      format,
      ...(dateFrom && { dateFrom: dateFrom.toISOString() }),
      ...(dateTo && { dateTo: toDateISOString() }),
      ...(status && { status })
    });

    return await apiClient.get<Blob>(`${this.baseURL}/group/${groupId}/export?${params}`, {
      responseType: 'blob'
    });
  }

  /**
   * Get settlement statistics for analytics
   */
  async getSettlementStats(
    groupId: string,
    period: 'week' | 'month' | 'quarter' | 'year' = 'month'
  ): Promise<any> {
    return await apiClient.get<any>(`${this.baseURL}/group/${groupId}/stats?period=${period}`);
  }

  /**
   * Verify payment status with payment provider
   */
  async verifyPaymentStatus(
    settlementId: string,
    paymentReference: string
  ): Promise<any> {
    return await apiClient.post<any>(`${this.baseURL}/${settlementId}/verify`, {
      paymentReference
    });
  }

  /**
   * Get settlement notifications for a user
   */
  async getSettlementNotifications(
    userId: string,
    unreadOnly: boolean = false
  ): Promise<any> {
    const params = unreadOnly ? '?unreadOnly=true' : '';
    return await apiClient.get<any>(`${this.baseURL}/notifications/${userId}${params}`);
  }

  /**
   * Mark settlement notifications as read
   */
  async markNotificationsRead(
    userId: string,
    notificationIds: string[]
  ): Promise<any> {
    return await apiClient.post<{ updated: number }>(`${this.baseURL}/notifications/${userId}/read`, {
      notificationIds
    });
  }

  /**
   * Update balance after settlement completion
   */
  async updateBalancesAfterSettlement(
    settlementId: string
  ): Promise<any> {
    return await apiClient.post<any>(`${this.baseURL}/${settlementId}/update-balances`);
  }

  /**
   * Batch process multiple settlements
   */
  async batchProcessSettlements(
    settlements: CreateSettlementRequest[]
  ): Promise<any> {
    return await apiClient.post<any>(`${this.baseURL}/batch`, {
      settlements
    });
  }
}

// Create and export singleton instance
const settlementService = new SettlementService();
export default settlementService;