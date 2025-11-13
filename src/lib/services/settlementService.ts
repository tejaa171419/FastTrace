// Simple mock API response type
interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
}

// Mock delay function
const mockDelay = (ms: number = 1000) => new Promise(resolve => setTimeout(resolve, ms));

// Mock data store
const mockSettlements: SettlementRecord[] = [];

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
  async createSettlement(settlement: CreateSettlementRequest): Promise<ApiResponse<SettlementRecord>> {
    await mockDelay(500);
    
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
    
    mockSettlements.push(newSettlement);
    
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
  ): Promise<ApiResponse<SettlementRecord>> {
    await mockDelay(300);
    
    const settlement = mockSettlements.find(s => s._id === settlementId);
    if (settlement) {
      settlement.status = updates.status;
      settlement.updatedAt = new Date();
      if (updates.paymentReference) settlement.paymentReference = updates.paymentReference;
      if (updates.failureReason) settlement.failureReason = updates.failureReason;
      if (updates.completedAt) settlement.completedAt = updates.completedAt;
    }
    
    return {
      data: settlement!,
      status: 200,
      statusText: 'OK'
    };
  }

  /**
   * Get settlement by ID
   */
  async getSettlement(settlementId: string): Promise<AxiosResponse<SettlementRecord>> {
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
  ): Promise<AxiosResponse<{
    settlements: SettlementRecord[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalRecords: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }>> {
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
  ): Promise<AxiosResponse<{
    settlements: SettlementRecord[];
    pagination: any;
  }>> {
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
  ): Promise<AxiosResponse<SettlementRecord>> {
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
  ): Promise<AxiosResponse<SettlementRecord>> {
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
  ): Promise<AxiosResponse<SettlementRecord>> {
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
  ): Promise<AxiosResponse<{
    newSettlement: SettlementRecord;
    remainingSettlement: SettlementRecord;
    originalSettlement: SettlementRecord;
  }>> {
    return await apiClient.post<any>(`${this.baseURL}/partial`, partial);
  }

  /**
   * Get optimized settlement suggestions for a group
   */
  async getOptimizedSettlements(
    groupId: string,
    memberIds: string[]
  ): Promise<AxiosResponse<{
    currentSettlements: Array<{
      fromUserId: string;
      toUserId: string;
      amount: number;
    }>;
    optimizedSettlements: OptimizedSettlement[];
    savings: {
      transactionReduction: number;
      complexityReduction: number;
      totalSavings: number;
    };
  }>> {
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
  ): Promise<AxiosResponse<{
    appliedSettlements: SettlementRecord[];
    cancelledSettlements: string[];
    summary: {
      newTransactions: number;
      eliminatedTransactions: number;
      netSavings: number;
    };
  }>> {
    return await apiClient.post<any>(`${this.baseURL}/simplify`, request);
  }

  /**
   * Get settlement summary and analytics for a group
   */
  async getSettlementSummary(groupId: string): Promise<AxiosResponse<SettlementSummary>> {
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
  ): Promise<AxiosResponse<Blob>> {
    const params = new URLSearchParams({
      format,
      ...(dateFrom && { dateFrom: dateFrom.toISOString() }),
      ...(dateTo && { dateTo: dateTo.toISOString() }),
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
  ): Promise<AxiosResponse<{
    totalVolume: number;
    transactionCount: number;
    averageTransaction: number;
    successRate: number;
    popularPaymentMethods: Array<{
      method: string;
      count: number;
      percentage: number;
    }>;
    timeSeriesData: Array<{
      date: string;
      volume: number;
      count: number;
    }>;
    userActivity: Array<{
      userId: string;
      userName: string;
      sentCount: number;
      receivedCount: number;
      totalVolume: number;
    }>;
  }>> {
    return await apiClient.get<any>(`${this.baseURL}/group/${groupId}/stats?period=${period}`);
  }

  /**
   * Verify payment status with payment provider
   */
  async verifyPaymentStatus(
    settlementId: string,
    paymentReference: string
  ): Promise<AxiosResponse<{
    isVerified: boolean;
    paymentStatus: string;
    providerResponse: Record<string, any>;
    recommendedAction: 'complete' | 'retry' | 'cancel' | 'investigate';
  }>> {
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
  ): Promise<AxiosResponse<Array<{
    id: string;
    type: 'settlement_initiated' | 'settlement_completed' | 'settlement_failed' | 'settlement_cancelled';
    settlementId: string;
    message: string;
    isRead: boolean;
    createdAt: Date;
    metadata: Record<string, any>;
  }>>> {
    const params = unreadOnly ? '?unreadOnly=true' : '';
    return await apiClient.get<any>(`${this.baseURL}/notifications/${userId}${params}`);
  }

  /**
   * Mark settlement notifications as read
   */
  async markNotificationsRead(
    userId: string,
    notificationIds: string[]
  ): Promise<AxiosResponse<{ updated: number }>> {
    return await apiClient.post<{ updated: number }>(`${this.baseURL}/notifications/${userId}/read`, {
      notificationIds
    });
  }

  /**
   * Update balance after settlement completion
   */
  async updateBalancesAfterSettlement(
    settlementId: string
  ): Promise<AxiosResponse<{
    updatedBalances: Array<{
      userId: string;
      oldBalance: number;
      newBalance: number;
      change: number;
    }>;
    groupBalance: {
      totalExpenses: number;
      totalSettlements: number;
      netBalance: number;
    };
  }>> {
    return await apiClient.post<any>(`${this.baseURL}/${settlementId}/update-balances`);
  }

  /**
   * Batch process multiple settlements
   */
  async batchProcessSettlements(
    settlements: CreateSettlementRequest[]
  ): Promise<AxiosResponse<{
    successful: SettlementRecord[];
    failed: Array<{
      settlement: CreateSettlementRequest;
      error: string;
    }>;
    summary: {
      total: number;
      successful: number;
      failed: number;
    };
  }>> {
    return await apiClient.post<any>(`${this.baseURL}/batch`, {
      settlements
    });
  }
}

// Create and export singleton instance
const settlementService = new SettlementService();
export default settlementService;