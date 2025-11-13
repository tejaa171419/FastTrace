import { apiClient } from './api';
import type {
  Balance,
  RecordSettlementRequest,
  GetBalancesResponse,
  GetSettlementSuggestionsResponse
} from '@/lib/types';

export const balanceService = {
  // Get user's balances across all groups
  async getBalances(params?: { groupId?: string }) {
    return apiClient.get<GetBalancesResponse>('/api/balances', params);
  },

  // Get balances within specific group
  async getGroupBalances(groupId: string) {
    return apiClient.get<{ data: any }>('/api/balances/group/' + groupId);
  },

  // Get balance details between two users
  async getUserBalance(userId: string, groupId: string) {
    return apiClient.get<{ data: { balance: any } }>('/api/balances/' + userId, { groupId });
  },

  // Get settlement suggestions for a group
  async getSettlementSuggestions(groupId: string) {
    return apiClient.get<GetSettlementSuggestionsResponse>('/api/balances/group/' + groupId + '/suggestions');
  },

  // Record a settlement between two users
  async recordSettlement(settlementData: RecordSettlementRequest) {
    return apiClient.post<{ data: any }>('/api/balances/settle', settlementData);
  }
};