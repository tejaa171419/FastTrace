// Simplified settlement service with mock implementations for testing

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
}

export interface SettlementSummary {
  totalSettlements: number;
  completedSettlements: number;
  pendingSettlements: number;
  failedSettlements: number;
  totalAmount: number;
  recentSettlements: SettlementRecord[];
}

// Simple API response type
interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
}

// Mock delay function
const mockDelay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms));

// Mock data store
const mockSettlements: SettlementRecord[] = [
  {
    _id: 'settlement_001',
    groupId: 'group1',
    fromUser: {
      _id: 'user1',
      firstName: 'Raj',
      lastName: 'Patel',
      avatar: { url: '' }
    },
    toUser: {
      _id: 'user2',
      firstName: 'Priya',
      lastName: 'Sharma',
      avatar: { url: '' }
    },
    amount: 2500,
    currency: 'INR',
    status: 'completed',
    paymentMethod: 'gpay',
    transactionId: 'TXN1704123456789',
    paymentReference: 'UPI/245678912345',
    createdAt: new Date('2024-01-15T10:30:00'),
    updatedAt: new Date('2024-01-15T10:32:00'),
    completedAt: new Date('2024-01-15T10:32:00'),
    notes: 'Settlement for dinner expenses'
  }
];

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
   * Get settlement summary for a group
   */
  async getSettlementSummary(groupId: string): Promise<ApiResponse<SettlementSummary>> {
    await mockDelay(300);
    
    const groupSettlements = mockSettlements.filter(s => s.groupId === groupId);
    
    const summary: SettlementSummary = {
      totalSettlements: groupSettlements.length,
      completedSettlements: groupSettlements.filter(s => s.status === 'completed').length,
      pendingSettlements: groupSettlements.filter(s => s.status === 'pending' || s.status === 'processing').length,
      failedSettlements: groupSettlements.filter(s => s.status === 'failed').length,
      totalAmount: groupSettlements.reduce((sum, s) => sum + s.amount, 0),
      recentSettlements: groupSettlements.slice(-5)
    };
    
    return {
      data: summary,
      status: 200,
      statusText: 'OK'
    };
  }

  /**
   * Get settlement notifications for a user
   */
  async getSettlementNotifications(
    userId: string,
    unreadOnly: boolean = false
  ): Promise<ApiResponse<Array<{
    id: string;
    type: 'settlement_initiated' | 'settlement_completed' | 'settlement_failed' | 'settlement_cancelled';
    settlementId: string;
    message: string;
    isRead: boolean;
    createdAt: Date;
    metadata: {
      fromUser: any;
      toUser: any;
      amount: number;
      currency: string;
      paymentMethod?: string;
      transactionId?: string;
    };
  }>>> {
    await mockDelay(200);
    
    // Mock notifications
    const notifications = [
      {
        id: 'notif_1',
        type: 'settlement_completed' as const,
        settlementId: 'settlement_001',
        message: 'Payment received successfully',
        isRead: false,
        createdAt: new Date(),
        metadata: {
          fromUser: { _id: 'user1', firstName: 'Raj', lastName: 'Patel' },
          toUser: { _id: 'user2', firstName: 'Priya', lastName: 'Sharma' },
          amount: 2500,
          currency: 'INR',
          paymentMethod: 'gpay',
          transactionId: 'TXN1704123456789'
        }
      }
    ];
    
    return {
      data: unreadOnly ? notifications.filter(n => !n.isRead) : notifications,
      status: 200,
      statusText: 'OK'
    };
  }

  /**
   * Mark notifications as read
   */
  async markNotificationsRead(
    userId: string,
    notificationIds: string[]
  ): Promise<ApiResponse<{ updated: number }>> {
    await mockDelay(200);
    
    return {
      data: { updated: notificationIds.length },
      status: 200,
      statusText: 'OK'
    };
  }

  /**
   * Apply simplified settlements to group
   */
  async applySimplifiedSettlements(
    request: { groupId: string; memberIds: string[] }
  ): Promise<ApiResponse<{
    appliedSettlements: SettlementRecord[];
    cancelledSettlements: string[];
    summary: {
      newTransactions: number;
      eliminatedTransactions: number;
      netSavings: number;
    };
  }>> {
    await mockDelay(1500);
    
    const result = {
      appliedSettlements: [],
      cancelledSettlements: [],
      summary: {
        newTransactions: 2,
        eliminatedTransactions: 5,
        netSavings: 3
      }
    };
    
    return {
      data: result,
      status: 200,
      statusText: 'OK'
    };
  }
}

// Create and export singleton instance
const settlementService = new SettlementService();
export default settlementService;