import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface SettlementRecord {
  id: string;
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
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  paymentMethod: string;
  transactionId: string;
  paymentReference?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  notes?: string;
  description?: string;
  failureReason?: string;
}

interface SettlementHistoryResponse {
  success: boolean;
  message: string;
  data: {
    settlements: SettlementRecord[];
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
      failedCount: number;
    };
  };
}

interface UseSettlementHistoryParams {
  groupId: string;
  page?: number;
  limit?: number;
  enabled?: boolean;
}

export const useSettlementHistory = ({ 
  groupId, 
  page = 1, 
  limit = 20,
  enabled = true 
}: UseSettlementHistoryParams) => {
  return useQuery<SettlementHistoryResponse>({
    queryKey: ['settlementHistory', groupId, page, limit],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_BASE_URL}/api/settlements/group/${groupId}`,
        {
          params: { page, limit },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    },
    enabled: !!groupId && enabled,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
  });
};

interface RetrySettlementParams {
  settlementId: string;
  groupId: string;
}

export const useRetrySettlement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ settlementId, groupId }: RetrySettlementParams) => {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/api/settlements/${settlementId}/retry`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch settlement history
      queryClient.invalidateQueries({ queryKey: ['settlementHistory', variables.groupId] });
    },
  });
};

interface CancelSettlementParams {
  settlementId: string;
  groupId: string;
}

export const useCancelSettlement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ settlementId, groupId }: CancelSettlementParams) => {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/api/settlements/${settlementId}/cancel`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch settlement history
      queryClient.invalidateQueries({ queryKey: ['settlementHistory', variables.groupId] });
    },
  });
};

export type { SettlementRecord, SettlementHistoryResponse };
