import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { walletAPI } from '@/lib/walletAPI';
import { useAuth } from '@/contexts/AuthContext';

export interface PinContextState {
  pinSet: boolean;
  isLocked: boolean;
  attemptsRemaining: number;
  lockTimeRemaining?: number;
  loading: boolean;
  error: string | null;
}

export interface PinContextActions {
  checkPinStatus: () => Promise<void>;
  verifyPin: (pin: string, action?: string) => Promise<boolean>;
  updatePin: (pinData: { pin: string; confirmPin: string; currentPin?: string }) => Promise<boolean>;
  clearError: () => void;
  refreshStatus: () => Promise<void>;
}

export interface PinContextValue extends PinContextState, PinContextActions {}

const PinContext = createContext<PinContextValue | undefined>(undefined);

interface PinProviderProps {
  children: React.ReactNode;
}

/**
 * PIN Management Context Provider
 * Manages PIN state and operations across the application
 * Provides centralized PIN management with error handling and status tracking
 */
export const PinProvider: React.FC<PinProviderProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  
  // State
  const [state, setState] = useState<PinContextState>({
    pinSet: false,
    isLocked: false,
    attemptsRemaining: 3,
    lockTimeRemaining: undefined,
    loading: false,
    error: null
  });

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Check PIN status
  const checkPinStatus = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const status = await walletAPI.getPinStatus();
      
      setState(prev => ({
        ...prev,
        pinSet: status.pinSet,
        isLocked: status.isLocked,
        attemptsRemaining: status.attemptsRemaining,
        lockTimeRemaining: status.lockTimeRemaining,
        loading: false
      }));
    } catch (error: any) {
      console.error('Failed to check PIN status:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to check PIN status'
      }));
    }
  }, [isAuthenticated]);

  // Verify PIN
  const verifyPin = useCallback(async (pin: string, action?: string): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      await walletAPI.verifyWalletPin(pin, action);
      
      // Refresh status after successful verification
      await checkPinStatus();
      
      setState(prev => ({ ...prev, loading: false }));
      return true;
    } catch (error: any) {
      console.error('PIN verification failed:', error);
      
      // Update attempts remaining if provided in error
      const errorMessage = error.message || 'PIN verification failed';
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
      
      // Refresh status to get updated attempt count
      await checkPinStatus();
      
      return false;
    }
  }, [checkPinStatus]);

  // Update PIN
  const updatePin = useCallback(async (pinData: { 
    pin: string; 
    confirmPin: string; 
    currentPin?: string 
  }): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      await walletAPI.setWalletPin(pinData);
      
      // Refresh status after successful update
      await checkPinStatus();
      
      setState(prev => ({ ...prev, loading: false }));
      return true;
    } catch (error: any) {
      console.error('PIN update failed:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to update PIN'
      }));
      return false;
    }
  }, [checkPinStatus]);

  // Refresh status (alias for checkPinStatus)
  const refreshStatus = useCallback(() => checkPinStatus(), [checkPinStatus]);

  // Auto-check PIN status on mount and user change
  useEffect(() => {
    if (isAuthenticated && user) {
      checkPinStatus();
    }
  }, [isAuthenticated, user, checkPinStatus]);

  // Auto-clear errors after 5 seconds
  useEffect(() => {
    if (state.error) {
      const timer = setTimeout(() => {
        clearError();
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [state.error, clearError]);

  // Auto-refresh status when lock expires
  useEffect(() => {
    if (state.isLocked && state.lockTimeRemaining) {
      const timer = setTimeout(() => {
        checkPinStatus();
      }, state.lockTimeRemaining * 60 * 1000); // Convert minutes to milliseconds
      
      return () => clearTimeout(timer);
    }
  }, [state.isLocked, state.lockTimeRemaining, checkPinStatus]);

  const contextValue: PinContextValue = {
    ...state,
    checkPinStatus,
    verifyPin,
    updatePin,
    clearError,
    refreshStatus
  };

  return (
    <PinContext.Provider value={contextValue}>
      {children}
    </PinContext.Provider>
  );
};

/**
 * Hook to use PIN context
 * Provides access to PIN state and operations
 */
export const usePin = (): PinContextValue => {
  const context = useContext(PinContext);
  
  if (context === undefined) {
    throw new Error('usePin must be used within a PinProvider');
  }
  
  return context;
};

/**
 * Hook for PIN verification with enhanced UX
 * Provides streamlined PIN verification flow
 */
export const usePinVerification = () => {
  const { verifyPin, isLocked, attemptsRemaining, error, loading } = usePin();
  const [verificationState, setVerificationState] = useState<{
    isVerifying: boolean;
    lastError: string | null;
    successfulVerification: boolean;
  }>({
    isVerifying: false,
    lastError: null,
    successfulVerification: false
  });

  const verify = useCallback(async (pin: string, action?: string): Promise<boolean> => {
    setVerificationState(prev => ({ 
      ...prev, 
      isVerifying: true, 
      lastError: null,
      successfulVerification: false
    }));
    
    try {
      const success = await verifyPin(pin, action);
      
      setVerificationState(prev => ({
        ...prev,
        isVerifying: false,
        successfulVerification: success,
        lastError: success ? null : (error || 'Verification failed')
      }));
      
      return success;
    } catch (err: any) {
      setVerificationState(prev => ({
        ...prev,
        isVerifying: false,
        lastError: err.message || 'Verification failed'
      }));
      return false;
    }
  }, [verifyPin, error]);

  const reset = useCallback(() => {
    setVerificationState({
      isVerifying: false,
      lastError: null,
      successfulVerification: false
    });
  }, []);

  return {
    verify,
    reset,
    isVerifying: verificationState.isVerifying || loading,
    lastError: verificationState.lastError,
    successfulVerification: verificationState.successfulVerification,
    isLocked,
    attemptsRemaining,
    canAttempt: !isLocked && attemptsRemaining > 0
  };
};

export default PinContext;