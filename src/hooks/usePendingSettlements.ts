import { useState, useEffect, useCallback } from 'react';
import { settlementPaymentService } from '../lib/services/settlementPaymentService';

export const usePendingSettlements = () => {
  const [pendingSettlements, setPendingSettlements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPendingSettlements = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const settlements = await settlementPaymentService.getPendingSettlements();
      setPendingSettlements(settlements);
    } catch (err: any) {
      console.error('Failed to fetch pending settlements:', err);
      setError(err.message || 'Failed to load pending settlements');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingSettlements();
    
    // Poll for new settlements every 30 seconds
    const interval = setInterval(fetchPendingSettlements, 30000);
    
    return () => clearInterval(interval);
  }, [fetchPendingSettlements]);

  const confirmSettlement = useCallback(async (paymentId: string, message?: string) => {
    try {
      await settlementPaymentService.confirmSettlement(paymentId, message);
      // Remove the confirmed settlement from the list
      setPendingSettlements(prev => prev.filter(s => s.id !== paymentId));
    } catch (err: any) {
      throw new Error(err.message || 'Failed to confirm settlement');
    }
  }, []);

  const rejectSettlement = useCallback(async (paymentId: string, reason: string) => {
    try {
      await settlementPaymentService.rejectSettlement(paymentId, reason);
      // Remove the rejected settlement from the list
      setPendingSettlements(prev => prev.filter(s => s.id !== paymentId));
    } catch (err: any) {
      throw new Error(err.message || 'Failed to reject settlement');
    }
  }, []);

  return {
    pendingSettlements,
    isLoading,
    error,
    refresh: fetchPendingSettlements,
    confirmSettlement,
    rejectSettlement
  };
};
