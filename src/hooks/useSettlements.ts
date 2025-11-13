import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Settlement {
  _id: string;
  groupId: string;
  fromUser: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: { url?: string };
  };
  toUser: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: { url?: string };
  };
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'disputed';
  paymentMethod?: string;
  transactionId?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  metadata?: {
    upiTransactionId?: string;
    paymentGatewayRef?: string;
    confirmationCode?: string;
  };
}

export interface CreateSettlementRequest {
  groupId: string;
  toUserId: string;
  amount: number;
  currency: string;
  description?: string;
  paymentMethod?: string;
}

export interface UpdateSettlementRequest {
  settlementId: string;
  status?: Settlement['status'];
  transactionId?: string;
  paymentMethod?: string;
  metadata?: Settlement['metadata'];
}

// Get settlements for a group
export const useGroupSettlements = (groupId: string) => {
  return useQuery({
    queryKey: ['settlements', 'group', groupId],
    queryFn: async () => {
      const response = await api.get(`/settlements/group/${groupId}`);
      return response.data;
    },
    enabled: !!groupId,
  });
};

// Get settlement history for a user
export const useUserSettlements = (userId?: string) => {
  return useQuery({
    queryKey: ['settlements', 'user', userId],
    queryFn: async () => {
      const response = await api.get(`/settlements/user/${userId}`);
      return response.data;
    },
    enabled: !!userId,
  });
};

// Create a new settlement
export const useCreateSettlement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateSettlementRequest) => {
      const response = await api.post('/settlements', data);
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['settlements', 'group', data.settlement.groupId] });
      queryClient.invalidateQueries({ queryKey: ['balances', 'group', data.settlement.groupId] });
      queryClient.invalidateQueries({ queryKey: ['settlements', 'user'] });
    },
  });
};

// Update settlement status
export const useUpdateSettlement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateSettlementRequest) => {
      const { settlementId, ...updateData } = data;
      const response = await api.patch(`/settlements/${settlementId}`, updateData);
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['settlements', 'group', data.settlement.groupId] });
      queryClient.invalidateQueries({ queryKey: ['balances', 'group', data.settlement.groupId] });
      queryClient.invalidateQueries({ queryKey: ['settlements', 'user'] });
    },
  });
};

// Confirm settlement completion
export const useConfirmSettlement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ settlementId, confirmationCode }: { settlementId: string; confirmationCode?: string }) => {
      const response = await api.post(`/settlements/${settlementId}/confirm`, { confirmationCode });
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['settlements', 'group', data.settlement.groupId] });
      queryClient.invalidateQueries({ queryKey: ['balances', 'group', data.settlement.groupId] });
      queryClient.invalidateQueries({ queryKey: ['settlements', 'user'] });
    },
  });
};

// Dispute a settlement
export const useDisputeSettlement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ settlementId, reason }: { settlementId: string; reason: string }) => {
      const response = await api.post(`/settlements/${settlementId}/dispute`, { reason });
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['settlements', 'group', data.settlement.groupId] });
      queryClient.invalidateQueries({ queryKey: ['settlements', 'user'] });
    },
  });
};

// Utility functions for settlement management
export const getSettlementStatusColor = (status: Settlement['status']) => {
  switch (status) {
    case 'pending':
      return { color: 'text-yellow-400', bgColor: 'bg-yellow-500/10', borderColor: 'border-yellow-500/30' };
    case 'processing':
      return { color: 'text-blue-400', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/30' };
    case 'completed':
      return { color: 'text-green-400', bgColor: 'bg-green-500/10', borderColor: 'border-green-500/30' };
    case 'failed':
      return { color: 'text-red-400', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/30' };
    case 'disputed':
      return { color: 'text-orange-400', bgColor: 'bg-orange-500/10', borderColor: 'border-orange-500/30' };
    default:
      return { color: 'text-gray-400', bgColor: 'bg-gray-500/10', borderColor: 'border-gray-500/30' };
  }
};

export const generateUPIPaymentLink = (settlement: Settlement) => {
  // This would typically use the receiver's actual UPI ID from their profile
  const receiverUPI = `${settlement.toUser.firstName.toLowerCase()}.${settlement.toUser.lastName.toLowerCase()}@paytm`;
  const amount = settlement.amount;
  const note = `Settlement payment for group expense`;
  const transactionRef = settlement.transactionId || settlement._id;

  // UPI Intent format
  const upiIntent = `upi://pay?pa=${receiverUPI}&am=${amount}&cu=${settlement.currency}&tn=${encodeURIComponent(note)}&tr=${transactionRef}`;
  
  return upiIntent;
};

export const formatSettlementDescription = (settlement: Settlement) => {
  return `${settlement.fromUser.firstName} ${settlement.fromUser.lastName} paying ${settlement.amount} ${settlement.currency} to ${settlement.toUser.firstName} ${settlement.toUser.lastName}`;
};