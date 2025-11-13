import { useState, useCallback, useEffect } from 'react';
import { walletAPI } from '@/lib/walletAPI';

export interface PinStrengthResult {
  score: number;
  feedback: string[];
  color: 'red' | 'yellow' | 'blue' | 'green';
  label: 'Weak' | 'Fair' | 'Good' | 'Strong';
}

export interface PinStatus {
  pinSet: boolean;
  isLocked: boolean;
  attemptsRemaining: number;
  lockTimeRemaining?: number;
}

export interface UsePinSetupOptions {
  onSuccess?: (isChangingPin: boolean) => void;
  onError?: (error: string) => void;
  validateStrength?: boolean;
  minStrengthScore?: number;
}

export interface UsePinSetupReturn {
  // State
  pin: string;
  confirmPin: string;
  currentPin: string;
  loading: boolean;
  error: string;
  pinStatus: PinStatus | null;
  isChangingPin: boolean;
  
  // Computed
  pinStrength: PinStrengthResult;
  canProceed: boolean;
  
  // Actions
  setPin: (value: string) => void;
  setConfirmPin: (value: string) => void;
  setCurrentPin: (value: string) => void;
  clearError: () => void;
  validatePin: () => boolean;
  submitPin: () => Promise<boolean>;
  resetForm: () => void;
  
  // API Actions
  checkPinStatus: () => Promise<void>;
  verifyCurrentPin: () => Promise<boolean>;
}

/**
 * Custom hook for managing PIN setup and validation
 * Provides comprehensive PIN management functionality including:
 * - PIN strength validation
 * - Current PIN verification for changes
 * - Form state management
 * - API integration
 * - Error handling
 */
export const usePinSetup = (options: UsePinSetupOptions = {}): UsePinSetupReturn => {
  const {
    onSuccess,
    onError,
    validateStrength = true,
    minStrengthScore = 40
  } = options;

  // Form state
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [currentPin, setCurrentPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pinStatus, setPinStatus] = useState<PinStatus | null>(null);
  const [isChangingPin, setIsChangingPin] = useState(false);

  // Calculate PIN strength
  const calculatePinStrength = useCallback((pinValue: string): PinStrengthResult => {
    let score = 0;
    const feedback: string[] = [];
    
    // Length scoring
    if (pinValue.length >= 4) score += 20;
    if (pinValue.length >= 6) score += 10;
    
    // Check for repeated digits (1111, 2222, etc.)
    if (/^(\\d)\\1+$/.test(pinValue)) {
      feedback.push('Avoid repeated digits');
    } else {
      score += 25;
    }
    
    // Check for sequential digits (1234, 4321, etc.)
    const digits = pinValue.split('').map(Number);
    let isSequential = true;
    let isReverseSequential = true;
    
    for (let i = 1; i < digits.length; i++) {
      if (digits[i] !== digits[i - 1] + 1) {
        isSequential = false;
      }
      if (digits[i] !== digits[i - 1] - 1) {
        isReverseSequential = false;
      }
    }
    
    if ((isSequential || isReverseSequential) && pinValue.length > 2) {
      feedback.push('Avoid sequential digits');
    } else {
      score += 25;
    }
    
    // Check for common weak PINs
    const weakPins = [
      '1234', '4321', '1111', '2222', '3333', '4444', '5555', 
      '6666', '7777', '8888', '9999', '0000', '1122', '2211',
      '1212', '2121', '1010', '0101'
    ];
    
    if (weakPins.includes(pinValue)) {
      feedback.push('This is a commonly used PIN');
      score = Math.min(score, 30);
    } else {
      score += 20;
    }
    
    // Determine color and label based on score
    let color: PinStrengthResult['color'] = 'red';
    let label: PinStrengthResult['label'] = 'Weak';
    
    if (score >= 80) {
      color = 'green';
      label = 'Strong';
    } else if (score >= 60) {
      color = 'blue';
      label = 'Good';
    } else if (score >= 40) {
      color = 'yellow';
      label = 'Fair';
    }
    
    return { score, feedback, color, label };
  }, []);

  const pinStrength = calculatePinStrength(pin);

  // Form validation
  const validatePin = useCallback((): boolean => {
    setError('');
    
    if (!pin || !confirmPin) {
      setError('Please enter PIN and confirmation');
      return false;
    }

    if (pin !== confirmPin) {
      setError('PIN and confirmation do not match');
      return false;
    }

    if (!/^\\d{4,6}$/.test(pin)) {
      setError('PIN must be 4-6 digits');
      return false;
    }

    if (validateStrength && pinStrength.score < minStrengthScore) {
      setError('Please choose a stronger PIN for better security');
      return false;
    }

    if (isChangingPin && !currentPin) {
      setError('Please enter your current PIN');
      return false;
    }

    return true;
  }, [pin, confirmPin, currentPin, isChangingPin, pinStrength.score, validateStrength, minStrengthScore]);

  // Check if form can proceed
  const canProceed = pin.length >= 4 && 
                    (!validateStrength || pinStrength.score >= minStrengthScore) &&
                    (!isChangingPin || currentPin.length >= 4);

  // API Actions
  const checkPinStatus = useCallback(async (): Promise<void> => {
    try {
      const status = await walletAPI.getPinStatus();
      setPinStatus(status);
      setIsChangingPin(status.pinSet);
    } catch (error: any) {
      console.error('Failed to check PIN status:', error);
      onError?.(error.message || 'Failed to check PIN status');
    }
  }, [onError]);

  const verifyCurrentPin = useCallback(async (): Promise<boolean> => {
    if (!currentPin) return false;
    
    try {
      setLoading(true);
      await walletAPI.verifyWalletPin(currentPin, 'settings');
      return true;
    } catch (error: any) {
      setError(error.message || 'Current PIN verification failed');
      onError?.(error.message || 'Current PIN verification failed');
      return false;
    } finally {
      setLoading(false);
    }
  }, [currentPin, onError]);

  const submitPin = useCallback(async (): Promise<boolean> => {
    if (!validatePin()) {
      return false;
    }

    try {
      setLoading(true);
      setError('');
      
      const pinData: any = { pin, confirmPin };
      if (isChangingPin && currentPin) {
        pinData.currentPin = currentPin;
      }
      
      const result = await walletAPI.setWalletPin(pinData);
      onSuccess?.(isChangingPin);
      return true;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to set PIN';
      setError(errorMessage);
      onError?.(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [pin, confirmPin, currentPin, isChangingPin, validatePin, onSuccess, onError]);

  // Helper actions
  const clearError = useCallback(() => setError(''), []);
  
  const resetForm = useCallback(() => {
    setPin('');
    setConfirmPin('');
    setCurrentPin('');
    setError('');
  }, []);

  // Auto-clear errors when user types
  useEffect(() => {
    if (error && (pin || confirmPin || currentPin)) {
      const timer = setTimeout(() => setError(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [pin, confirmPin, currentPin, error]);

  return {
    // State
    pin,
    confirmPin,
    currentPin,
    loading,
    error,
    pinStatus,
    isChangingPin,
    
    // Computed
    pinStrength,
    canProceed,
    
    // Actions
    setPin,
    setConfirmPin,
    setCurrentPin,
    clearError,
    validatePin,
    submitPin,
    resetForm,
    
    // API Actions
    checkPinStatus,
    verifyCurrentPin
  };
};