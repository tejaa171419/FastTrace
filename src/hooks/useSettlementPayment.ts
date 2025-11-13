import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  settlementPaymentService, 
  SettlementPaymentData, 
  PaymentVerification,
  PaymentResult 
} from '@/lib/services/settlementPaymentService';
import { useToast } from '@/hooks/use-toast';

// Query keys for settlement payments
export const settlementPaymentKeys = {
  all: ['settlement-payments'] as const,
  history: (groupId: string) => [...settlementPaymentKeys.all, 'history', groupId] as const,
  suggestions: (groupId: string) => [...settlementPaymentKeys.all, 'suggestions', groupId] as const,
};

/**
 * Hook to initiate settlement payment
 */
export const useInitiateSettlementPayment = () => {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: (data: SettlementPaymentData) => settlementPaymentService.initiatePayment(data),
    onSuccess: (paymentOrder) => {
      toast({
        title: "Payment Initiated",
        description: `Settlement payment of ₹${(paymentOrder.amount / 100).toFixed(2)} initiated successfully.`,
      });
    },
    onError: (error: Error) => {
      console.error('Settlement payment initiation error:', error);
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });
};

/**
 * Hook to verify settlement payment
 */
export const useVerifySettlementPayment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: (data: PaymentVerification) => settlementPaymentService.verifyPayment(data),
    onSuccess: (result: PaymentResult) => {
      // Invalidate balance queries to refresh UI
      queryClient.invalidateQueries({ queryKey: ['balances'] });
      queryClient.invalidateQueries({ queryKey: ['balances', result.groupId] });
      queryClient.invalidateQueries({ queryKey: ['groups', 'detail', result.groupId] });
      queryClient.invalidateQueries({ queryKey: settlementPaymentKeys.history(result.groupId) });
      queryClient.invalidateQueries({ queryKey: settlementPaymentKeys.suggestions(result.groupId) });
      
      // Show success message
      toast({
        title: "Payment Successful!",
        description: `Settlement of ₹${result.payment.amount.toFixed(2)} completed successfully.`,
      });
    },
    onError: (error: Error) => {
      console.error('Settlement payment verification error:', error);
      toast({
        title: "Payment Verification Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });
};

/**
 * Hook to get settlement payment history for a group
 */
export const useSettlementPaymentHistory = (groupId: string, page: number = 1, limit: number = 20) => {
  return useQuery({
    queryKey: [...settlementPaymentKeys.history(groupId), page, limit],
    queryFn: () => settlementPaymentService.getPaymentHistory(groupId, page, limit),
    enabled: !!groupId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Hook to get settlement suggestions for a group
 */
export const useSettlementSuggestions = (groupId: string) => {
  return useQuery({
    queryKey: settlementPaymentKeys.suggestions(groupId),
    queryFn: () => settlementPaymentService.getSettlementSuggestions(groupId),
    enabled: !!groupId,
    staleTime: 2 * 60 * 1000, // 2 minutes (more frequent refresh for suggestions)
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to refresh settlement data after payment
 */
export const useRefreshSettlementData = () => {
  const queryClient = useQueryClient();
  
  return (groupId: string) => {
    // Invalidate all settlement-related queries for the group
    queryClient.invalidateQueries({ queryKey: settlementPaymentKeys.history(groupId) });
    queryClient.invalidateQueries({ queryKey: settlementPaymentKeys.suggestions(groupId) });
    queryClient.invalidateQueries({ queryKey: ['balances', groupId] });
    queryClient.invalidateQueries({ queryKey: ['groups', 'detail', groupId] });
  };
};