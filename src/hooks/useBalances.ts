import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { balanceService, RecordSettlementRequest } from '@/lib/services';

// Query keys
export const balanceKeys = {
  all: ['balances'] as const,
  lists: () => [...balanceKeys.all, 'list'] as const,
  list: (params?: any) => [...balanceKeys.lists(), params] as const,
  group: (groupId: string) => [...balanceKeys.all, 'group', groupId] as const,
  user: (userId: string, groupId: string) => [...balanceKeys.all, 'user', userId, groupId] as const,
  suggestions: (groupId: string) => [...balanceKeys.group(groupId), 'suggestions'] as const,
};

// Get user's balances across all groups
export const useBalances = (params?: { groupId?: string }) => {
  return useQuery({
    queryKey: balanceKeys.list(params),
    queryFn: () => balanceService.getBalances(params),
    select: (response) => {
      // API returns { success, message, data: { summary, balances } }
      const data = response.data || response;
      return {
        summary: data.summary || {},
        balances: data.balances || [],
      };
    },
    refetchInterval: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Get balances within specific group
export const useGroupBalances = (groupId: string) => {
  return useQuery({
    queryKey: balanceKeys.group(groupId),
    queryFn: () => balanceService.getGroupBalances(groupId),
    select: (data) => data,
    enabled: !!groupId,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get balance details between two users
export const useUserBalance = (userId: string, groupId: string) => {
  return useQuery({
    queryKey: balanceKeys.user(userId, groupId),
    queryFn: () => balanceService.getUserBalance(userId, groupId),
    select: (data) => data.data?.balance,
    enabled: !!userId && !!groupId,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get settlement suggestions for a group
export const useSettlementSuggestions = (groupId: string) => {
  return useQuery({
    queryKey: balanceKeys.suggestions(groupId),
    queryFn: () => balanceService.getSettlementSuggestions(groupId),
    select: (data) => data,
    enabled: !!groupId,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Record settlement mutation
export const useRecordSettlement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RecordSettlementRequest) => balanceService.recordSettlement(data),
    onSuccess: (data, variables) => {
      // Invalidate all balance-related queries
      queryClient.invalidateQueries({ queryKey: balanceKeys.all });
      
      // Also invalidate group details and expenses
      queryClient.invalidateQueries({ 
        queryKey: ['groups', 'detail', variables.groupId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['expenses'] 
      });
    },
  });
};