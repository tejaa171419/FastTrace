import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PinInput } from '@/components/PinInput';
import { usePinVerification } from '@/contexts/PinContext';
import {
  Shield,
  AlertTriangle,
  Lock,
  X,
  Timer,
  Info
} from 'lucide-react';

interface PinVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  action?: string;
  title?: string;
  description?: string;
  amount?: number;
  recipientName?: string;
}

/**
 * PIN Verification Modal
 * 
 * Features:
 * - Secure PIN entry with masked input
 * - Real-time verification
 * - Attempt tracking with lockout
 * - Context-aware messaging
 * - Biometric fallback option
 * - Auto-focus and keyboard shortcuts
 */
export const PinVerificationModal: React.FC<PinVerificationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  action = 'general',
  title = 'Verify Transaction PIN',
  description = 'Enter your PIN to authorize this transaction',
  amount,
  recipientName
}) => {
  const {
    verify,
    reset,
    isVerifying,
    lastError,
    successfulVerification,
    isLocked,
    attemptsRemaining,
    canAttempt
  } = usePinVerification();

  // Local state
  const [pin, setPin] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const [lockTimeRemaining, setLockTimeRemaining] = useState(0);

  // Handle successful verification
  useEffect(() => {
    if (successfulVerification) {
      onSuccess();
      handleClose();
    }
  }, [successfulVerification, onSuccess]);

  // Handle modal open/close
  useEffect(() => {
    if (isOpen) {
      setPin('');
      reset();
    }
  }, [isOpen, reset]);

  // Lock timer countdown
  useEffect(() => {
    if (isLocked && lockTimeRemaining > 0) {
      const timer = setInterval(() => {
        setLockTimeRemaining(prev => {
          if (prev <= 1) {
            window.location.reload(); // Refresh to check lock status
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isLocked, lockTimeRemaining]);

  const handleClose = () => {
    setPin('');
    reset();
    onClose();
  };

  const handleVerify = async () => {
    if (pin.length < 4) return;
    
    try {
      await verify(pin, action);
    } catch (error) {
      console.error('PIN verification error:', error);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isOpen) return;
    
    if (e.key === 'Escape') {
      handleClose();
    } else if (e.key === 'Enter' && pin.length >= 4) {
      handleVerify();
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, pin]);

  // Format lock time remaining
  const formatLockTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <Card className="w-full max-w-md border border-white/20 shadow-2xl bg-gray-800/95 backdrop-blur-xl animate-slide-up">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">{title}</h3>
                <p className="text-sm text-gray-400">Secure verification required</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="text-gray-400 hover:text-white hover:bg-white/10 rounded-lg p-2"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Transaction Details */}
          {(amount || recipientName) && (
            <Card className="border-blue-500/30 bg-blue-500/10 p-4 mb-6">
              <div className="space-y-2">
                <h4 className="text-blue-400 font-medium text-sm">Transaction Details</h4>
                {amount && (
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-300">Amount:</span>
                    <span className="text-white font-semibold">₹{amount.toLocaleString()}</span>
                  </div>
                )}
                {recipientName && (
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-300">To:</span>
                    <span className="text-white">{recipientName}</span>
                  </div>
                )}
                {action && action !== 'general' && (
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-300">Action:</span>
                    <span className="text-white capitalize">{action.replace('_', ' ')}</span>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Error Display */}
          {lastError && (
            <Alert className="border-red-500/50 bg-red-500/10 mb-6">
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription className="text-red-300">
                {lastError}
              </AlertDescription>
            </Alert>
          )}

          {/* Lock Status */}
          {isLocked && (
            <Alert className="border-orange-500/50 bg-orange-500/10 mb-6">
              <Timer className="w-4 h-4" />
              <AlertDescription className="text-orange-300">
                <div className="flex items-center justify-between">
                  <span>PIN locked due to failed attempts</span>
                  {lockTimeRemaining > 0 && (
                    <span className="font-mono font-semibold">
                      {formatLockTime(lockTimeRemaining)}
                    </span>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Main Content */}
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-gray-300 mb-4">{description}</p>
              
              {attemptsRemaining < 3 && !isLocked && (
                <div className="flex items-center gap-2 justify-center text-sm text-orange-400 mb-4">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{attemptsRemaining} attempt(s) remaining</span>
                </div>
              )}
            </div>

            {/* PIN Input */}
            <PinInput
              value={pin}
              onChange={setPin}
              disabled={isVerifying || isLocked || !canAttempt}
              autoFocus={isOpen}
              onEnter={handleVerify}
              error={lastError ? undefined : undefined}
              className="mb-6"
            />

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={handleVerify}
                disabled={pin.length < 4 || isVerifying || isLocked || !canAttempt}
                className="w-full bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-white rounded-xl py-3 font-medium"
              >
                {isVerifying ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Verifying...
                  </div>
                ) : isLocked ? (
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    PIN Locked
                  </div>
                ) : (
                  'Verify PIN'
                )}
              </Button>

              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isVerifying}
                className="w-full border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white rounded-xl py-3"
              >
                Cancel
              </Button>
            </div>

            {/* Additional Options */}
            {!isLocked && (
              <div className="pt-4 border-t border-gray-700">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetails(!showDetails)}
                  className="w-full text-gray-400 hover:text-gray-300 text-sm"
                >
                  {showDetails ? 'Hide' : 'Show'} Security Options
                </Button>

                {showDetails && (
                  <Card className="border-gray-600 bg-gray-700/30 p-4 mt-3 space-y-3">
                    <div className="flex items-start gap-3">
                      <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-gray-300 space-y-2">
                        <p>• PIN is required for all secure transactions</p>
                        <p>• Your PIN is encrypted and never stored in plain text</p>
                        <p>• After 3 failed attempts, PIN will be locked for 30 minutes</p>
                        <p>• Contact support if you've forgotten your PIN</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          handleClose();
                          // Navigate to PIN reset or support
                        }}
                        className="text-xs border-gray-600 text-gray-400 hover:text-white"
                      >
                        Forgot PIN?
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Implement biometric authentication if available
                        }}
                        className="text-xs border-gray-600 text-gray-400 hover:text-white"
                        disabled
                      >
                        Use Biometric
                      </Button>
                    </div>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PinVerificationModal;