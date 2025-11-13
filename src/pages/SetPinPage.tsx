import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { PinInput } from '@/components/PinInput';
import { PinStrengthIndicator } from '@/components/PinStrengthIndicator';
import { usePin } from '@/contexts/PinContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  Shield,
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  Lock,
  Eye,
  EyeOff,
  Info
} from 'lucide-react';

type SetupStep = 'enter' | 'confirm' | 'current' | 'success';

interface SetPinPageProps {
  isUpdate?: boolean;
}

/**
 * Set PIN Page Component
 * 
 * Features:
 * - New PIN setup flow
 * - PIN update with current PIN verification
 * - Real-time PIN strength validation
 * - Step-by-step guided process
 * - Security recommendations
 * - Animated transitions
 */
export const SetPinPage: React.FC<SetPinPageProps> = ({ 
  isUpdate = false 
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { updatePin, loading, error, clearError, pinSet } = usePin();
  
  // State
  const [currentStep, setCurrentStep] = useState<SetupStep>(
    isUpdate ? 'current' : 'enter'
  );
  const [pins, setPins] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [showPinTips, setShowPinTips] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Redirect if PIN is already set and not updating
  useEffect(() => {
    if (pinSet && !isUpdate) {
      navigate('/wallet', { replace: true });
    }
  }, [pinSet, isUpdate, navigate]);

  // Step configuration
  const steps = isUpdate
    ? [
        { key: 'current' as SetupStep, title: 'Current PIN', progress: 25 },
        { key: 'enter' as SetupStep, title: 'New PIN', progress: 50 },
        { key: 'confirm' as SetupStep, title: 'Confirm PIN', progress: 75 },
        { key: 'success' as SetupStep, title: 'Complete', progress: 100 }
      ]
    : [
        { key: 'enter' as SetupStep, title: 'Create PIN', progress: 33 },
        { key: 'confirm' as SetupStep, title: 'Confirm PIN', progress: 66 },
        { key: 'success' as SetupStep, title: 'Complete', progress: 100 }
      ];

  const currentStepConfig = steps.find(s => s.key === currentStep);

  // Handlers
  const handlePinChange = (field: keyof typeof pins, value: string) => {
    setPins(prev => ({ ...prev, [field]: value }));
    
    // Clear errors when user starts typing
    if (error) {
      clearError();
    }
  };

  const handleContinue = async () => {
    try {
      setIsProcessing(true);
      
      switch (currentStep) {
        case 'current':
          if (pins.current.length < 4) {
            throw new Error('Please enter your current PIN');
          }
          setCurrentStep('enter');
          break;
          
        case 'enter':
          if (pins.new.length < 4) {
            throw new Error('Please enter a PIN of at least 4 digits');
          }
          if (isPinWeak(pins.new)) {
            throw new Error('PIN is too weak. Please choose a stronger PIN.');
          }
          setCurrentStep('confirm');
          break;
          
        case 'confirm':
          if (pins.confirm !== pins.new) {
            throw new Error('PINs do not match. Please try again.');
          }
          
          // Submit PIN
          const pinData = {
            pin: pins.new,
            confirmPin: pins.confirm,
            ...(isUpdate && { currentPin: pins.current })
          };
          
          const success = await updatePin(pinData);
          if (success) {
            setCurrentStep('success');
          }
          break;
          
        default:
          break;
      }
    } catch (err: any) {
      console.error('PIN setup error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBack = () => {
    if (currentStep === 'success') return;
    
    const currentIndex = steps.findIndex(s => s.key === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].key);
    } else {
      navigate('/wallet');
    }
  };

  // PIN strength validation
  const getPinStrength = (pin: string): { score: number; feedback: string[] } => {
    const feedback: string[] = [];
    let score = 0;

    if (pin.length >= 6) {
      score += 25;
      feedback.push('Good length');
    } else if (pin.length >= 4) {
      score += 15;
      feedback.push('Minimum length met');
    } else {
      feedback.push('PIN too short');
    }

    // Check for variety
    const hasVariety = new Set(pin.split('')).size >= 3;
    if (hasVariety) {
      score += 25;
      feedback.push('Good digit variety');
    } else {
      feedback.push('Use more different digits');
    }

    // Check for weak patterns
    if (!isPinWeak(pin)) {
      score += 50;
      feedback.push('No weak patterns detected');
    } else {
      feedback.push('Avoid sequential or repeated digits');
    }

    return { score, feedback };
  };

  const isPinWeak = (pin: string): boolean => {
    // Repeated digits
    if (/^(\d)\1+$/.test(pin)) return true;
    
    // Sequential digits
    const digits = pin.split('').map(Number);
    let isSequential = true;
    for (let i = 1; i < digits.length; i++) {
      if (digits[i] !== digits[i - 1] + 1) {
        isSequential = false;
        break;
      }
    }
    if (isSequential) return true;
    
    // Reverse sequential
    let isReverseSequential = true;
    for (let i = 1; i < digits.length; i++) {
      if (digits[i] !== digits[i - 1] - 1) {
        isReverseSequential = false;
        break;
      }
    }
    if (isReverseSequential) return true;
    
    // Common weak PINs
    const weakPins = ['0000', '1234', '4321', '1111', '2222', '3333', '4444', 
                      '5555', '6666', '7777', '8888', '9999', '1122', '2211'];
    if (weakPins.includes(pin)) return true;
    
    return false;
  };

  const renderStepContent = () => {
    const commonProps = {
      className: "mb-6",
      autoFocus: true,
      disabled: isProcessing || loading
    };

    switch (currentStep) {
      case 'current':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-warning/20 rounded-full flex items-center justify-center mx-auto">
                <Lock className="w-8 h-8 text-warning" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Enter Current PIN
                </h2>
                <p className="text-gray-300">
                  Please verify your current transaction PIN to continue
                </p>
              </div>
            </div>
            
            <PinInput
              value={pins.current}
              onChange={(value) => handlePinChange('current', value)}
              label="Current PIN"
              placeholder="Enter your current 4-6 digit PIN"
              showToggle={true}
              onEnter={handleContinue}
              {...commonProps}
            />
          </div>
        );
        
      case 'enter':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  {isUpdate ? 'Create New PIN' : 'Create Your PIN'}
                </h2>
                <p className="text-gray-300">
                  Choose a secure 4-6 digit PIN for your wallet transactions
                </p>
              </div>
            </div>
            
            <PinInput
              value={pins.new}
              onChange={(value) => handlePinChange('new', value)}
              label="New PIN"
              placeholder="Enter a secure 4-6 digit PIN"
              showToggle={true}
              onEnter={handleContinue}
              {...commonProps}
            />
            
            {pins.new.length > 0 && (
              <PinStrengthIndicator 
                pin={pins.new}
                strength={(() => {
                  const { score, feedback } = getPinStrength(pins.new);
                  let color: 'red' | 'yellow' | 'blue' | 'green' = 'red';
                  let label: 'Weak' | 'Fair' | 'Good' | 'Strong' = 'Weak';
                  if (score >= 80) { color = 'green'; label = 'Strong'; }
                  else if (score >= 60) { color = 'blue'; label = 'Good'; }
                  else if (score >= 40) { color = 'yellow'; label = 'Fair'; }
                  return { score, feedback, color, label };
                })()}
                className="mt-4"
                showDetails
              />
            )}
            
            {/* PIN Tips */}
            <Card className="border-blue-500/30 bg-blue-500/10 p-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-blue-400 font-medium mb-2">PIN Security Tips</h4>
                  <ul className="text-blue-300 text-sm space-y-1">
                    <li>• Use at least 4 digits, preferably 6</li>
                    <li>• Avoid repeated digits (1111, 2222)</li>
                    <li>• Avoid sequential patterns (1234, 4321)</li>
                    <li>• Don't use common PINs or personal dates</li>
                    <li>• Keep your PIN confidential and secure</li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        );
        
      case 'confirm':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-success" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Confirm Your PIN
                </h2>
                <p className="text-gray-300">
                  Re-enter your PIN to confirm and activate security
                </p>
              </div>
            </div>
            
            <PinInput
              value={pins.confirm}
              onChange={(value) => handlePinChange('confirm', value)}
              label="Confirm PIN"
              placeholder="Re-enter your PIN to confirm"
              showToggle={true}
              onEnter={handleContinue}
              {...commonProps}
            />
            
            {pins.confirm.length > 0 && pins.confirm !== pins.new && (
              <Alert className="border-red-500/50 bg-red-500/10">
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription className="text-red-300">
                  PINs do not match. Please try again.
                </AlertDescription>
              </Alert>
            )}
          </div>
        );
        
      case 'success':
        return (
          <div className="space-y-6 text-center">
            <div className="space-y-4">
              <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-10 h-10 text-success" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-success mb-2">
                  PIN {isUpdate ? 'Updated' : 'Created'} Successfully!
                </h2>
                <p className="text-gray-300">
                  Your wallet is now secured with a transaction PIN. 
                  You can now make payments and transfers safely.
                </p>
              </div>
            </div>
            
            <Card className="border-success/30 bg-success/10 p-6">
              <div className="space-y-4">
                <h3 className="text-success font-semibold">Security Activated</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-success">
                    <CheckCircle className="w-4 h-4" />
                    <span>Transaction PIN Set</span>
                  </div>
                  <div className="flex items-center gap-2 text-success">
                    <CheckCircle className="w-4 h-4" />
                    <span>Secure Payments</span>
                  </div>
                  <div className="flex items-center gap-2 text-success">
                    <CheckCircle className="w-4 h-4" />
                    <span>Transfer Protection</span>
                  </div>
                  <div className="flex items-center gap-2 text-success">
                    <CheckCircle className="w-4 h-4" />
                    <span>Account Security</span>
                  </div>
                </div>
              </div>
            </Card>
            
            <div className="space-y-3">
              <Button
                onClick={() => navigate('/wallet')}
                className="w-full bg-gradient-to-r from-success to-success-dark hover:from-success-dark hover:to-success text-white rounded-xl py-3"
              >
                Go to Wallet
              </Button>
              
              <Button
                variant="outline"
                onClick={() => navigate('/wallet/security')}
                className="w-full border-gray-600 text-gray-300 hover:bg-gray-800 rounded-xl py-3"
              >
                Security Settings
              </Button>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            disabled={currentStep === 'success'}
            className="text-gray-300 hover:text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          {currentStepConfig && (
            <div className="text-center">
              <h1 className="text-lg font-semibold text-white">
                {currentStepConfig.title}
              </h1>
              <p className="text-sm text-gray-400">
                Step {steps.findIndex(s => s.key === currentStep) + 1} of {steps.length}
              </p>
            </div>
          )}
          
          <div className="w-16" /> {/* Spacer */}
        </div>
        
        {/* Progress Bar */}
        {currentStepConfig && (
          <div className="mb-8">
            <Progress 
              value={currentStepConfig.progress} 
              className="h-2 mb-2"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>Progress</span>
              <span>{currentStepConfig.progress}%</span>
            </div>
          </div>
        )}
        
        {/* Main Card */}
        <Card className="border border-white/20 shadow-2xl bg-gray-800/50 backdrop-blur-xl">
          <div className="p-6">
            {/* Error Display */}
            {error && (
              <Alert className="border-red-500/50 bg-red-500/10 mb-6">
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription className="text-red-300">
                  {error}
                </AlertDescription>
              </Alert>
            )}
            
            {/* Step Content */}
            {renderStepContent()}
            
            {/* Action Buttons */}
            {currentStep !== 'success' && (
              <div className="space-y-3 mt-8">
                <Button
                  onClick={handleContinue}
                  disabled={
                    isProcessing || 
                    loading ||
                    (currentStep === 'current' && pins.current.length < 4) ||
                    (currentStep === 'enter' && pins.new.length < 4) ||
                    (currentStep === 'confirm' && pins.confirm.length < 4)
                  }
                  className="w-full bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-white rounded-xl py-3 font-medium"
                >
                  {isProcessing || loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing...
                    </div>
                  ) : currentStep === 'confirm' ? 'Set PIN' : 'Continue'}
                </Button>
                
                <Button
                  variant="ghost"
                  onClick={() => navigate('/wallet')}
                  disabled={isProcessing || loading}
                  className="w-full text-gray-400 hover:text-white hover:bg-white/10 rounded-xl py-3"
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </Card>
        
        {/* Footer */}
        <div className="text-center mt-6 text-xs text-gray-500">
          <p>
            🔐 Your PIN is encrypted and stored securely
          </p>
        </div>
      </div>
    </div>
  );
};

export default SetPinPage;