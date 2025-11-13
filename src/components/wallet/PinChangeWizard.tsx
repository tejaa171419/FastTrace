import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { PinInput } from "@/components/PinInput";
import { PinStrengthIndicator } from "@/components/PinStrengthIndicator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { 
  Lock, 
  Shield, 
  CheckCircle, 
  AlertCircle, 
  ArrowRight, 
  ArrowLeft,
  RefreshCw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";

interface PinChangeWizardProps {
  currentPinLength: number;
  onComplete?: () => void;
  onCancel?: () => void;
}

type Step = "verify-current" | "choose-length" | "enter-new" | "confirm-new" | "success";

export const PinChangeWizard = ({ currentPinLength, onComplete, onCancel }: PinChangeWizardProps) => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<Step>("verify-current");
  const [currentPin, setCurrentPin] = useState("");
  const [newPinLength, setNewPinLength] = useState<4 | 6>(currentPinLength as 4 | 6);
  const [newPin, setNewPin] = useState("");
  const [confirmNewPin, setConfirmNewPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const steps: Step[] = ["verify-current", "choose-length", "enter-new", "confirm-new", "success"];
  const currentStepIndex = steps.indexOf(currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const validatePin = (value: string, length: number): boolean => {
    if (!/^\d+$/.test(value)) {
      setError("PIN must contain only numbers");
      return false;
    }

    if (value.length !== length) {
      setError(`PIN must be exactly ${length} digits`);
      return false;
    }

    const isSequential = (str: string) => {
      for (let i = 0; i < str.length - 1; i++) {
        const diff = parseInt(str[i + 1]) - parseInt(str[i]);
        if (Math.abs(diff) !== 1) return false;
      }
      return true;
    };

    if (isSequential(value)) {
      setError("PIN cannot be sequential numbers (e.g., 1234)");
      return false;
    }

    if (/^(\d)\1+$/.test(value)) {
      setError("PIN cannot be all same digits (e.g., 1111)");
      return false;
    }

    setError("");
    return true;
  };

  const calculatePinStrength = (value: string, length: number): number => {
    if (value.length < length) return 0;

    let strength = 0;
    const digits = value.split("");
    const uniqueDigits = new Set(digits).size;

    strength += (uniqueDigits / length) * 40;

    const hasSequential = /012|123|234|345|456|567|678|789|987|876|765|654|543|432|321|210/.test(value);
    if (!hasSequential) strength += 30;

    const hasRepeatedPairs = /(\d)\1/.test(value);
    if (!hasRepeatedPairs) strength += 30;

    return Math.min(strength, 100);
  };

  const verifyCurrentPin = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await apiClient.post('/api/payments/wallet/pin/verify', {
        pin: currentPin
      });

      if (response.success) {
        setCurrentStep("choose-length");
      }
    } catch (error: any) {
      console.error('PIN verification error:', error);
      setError(error.message || "Invalid PIN. Please try again.");
      setCurrentPin("");
      
      if (error.attemptsRemaining !== undefined) {
        setError(`Invalid PIN. ${error.attemptsRemaining} attempts remaining.`);
      }
      
      if (error.message?.includes("locked")) {
        toast({
          title: "PIN Locked",
          description: error.message,
          variant: "destructive",
        });
        onCancel?.();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNextStep = () => {
    if (currentStep === "verify-current") {
      if (currentPin.length === currentPinLength) {
        verifyCurrentPin();
      }
    } else if (currentStep === "choose-length") {
      setCurrentStep("enter-new");
    } else if (currentStep === "enter-new") {
      if (newPin.length === newPinLength && validatePin(newPin, newPinLength)) {
        if (newPin === currentPin) {
          setError("New PIN must be different from current PIN");
          return;
        }
        setCurrentStep("confirm-new");
      }
    } else if (currentStep === "confirm-new") {
      if (confirmNewPin === newPin) {
        handleSubmitPinChange();
      } else {
        setError("PINs do not match. Please try again.");
      }
    }
  };

  const handlePreviousStep = () => {
    if (currentStep === "confirm-new") {
      setConfirmNewPin("");
      setError("");
      setCurrentStep("enter-new");
    } else if (currentStep === "enter-new") {
      setNewPin("");
      setError("");
      setCurrentStep("choose-length");
    } else if (currentStep === "choose-length") {
      setError("");
      setCurrentStep("verify-current");
    }
  };

  const handleSubmitPinChange = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await apiClient.put('/api/payments/wallet/pin', {
        currentPin,
        newPin,
        confirmNewPin: newPin,
        pinLength: newPinLength
      });

      if (response.success) {
        setCurrentStep("success");
        toast({
          title: "Success!",
          description: "Your PIN has been changed successfully.",
        });

        setTimeout(() => {
          onComplete?.();
        }, 2000);
      }
    } catch (error: any) {
      console.error('PIN change error:', error);
      setError(error.message || "Failed to change PIN. Please try again.");
      toast({
        title: "Error",
        description: error.message || "Failed to change PIN",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case "verify-current":
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Verify Current PIN</h3>
              <p className="text-sm text-muted-foreground">
                Enter your current {currentPinLength}-digit PIN to continue
              </p>
            </div>

            <div className="space-y-4">
              <PinInput
                length={currentPinLength}
                value={currentPin}
                onChange={(value) => {
                  setCurrentPin(value);
                  setError("");
                }}
                onComplete={(value) => {
                  setCurrentPin(value);
                }}
                autoFocus
              />

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">{error}</AlertDescription>
                </Alert>
              )}
            </div>

            <Alert>
              <Lock className="h-4 w-4" />
              <AlertDescription className="text-xs">
                For your security, we need to verify your current PIN before making changes.
              </AlertDescription>
            </Alert>
          </div>
        );

      case "choose-length":
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <RefreshCw className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Choose New PIN Length</h3>
              <p className="text-sm text-muted-foreground">
                Select the length for your new PIN
              </p>
            </div>

            <RadioGroup
              value={newPinLength.toString()}
              onValueChange={(value) => setNewPinLength(parseInt(value) as 4 | 6)}
              className="space-y-3"
            >
              <div className="flex items-center space-x-3 p-4 rounded-lg border border-primary/20 hover:border-primary/40 transition-colors cursor-pointer">
                <RadioGroupItem value="4" id="new-4-digit" />
                <Label htmlFor="new-4-digit" className="flex-1 cursor-pointer">
                  <div className="font-medium">4-Digit PIN</div>
                  <div className="text-sm text-muted-foreground">Quick and easy</div>
                </Label>
              </div>

              <div className="flex items-center space-x-3 p-4 rounded-lg border border-primary/20 hover:border-primary/40 transition-colors cursor-pointer">
                <RadioGroupItem value="6" id="new-6-digit" />
                <Label htmlFor="new-6-digit" className="flex-1 cursor-pointer">
                  <div className="font-medium">6-Digit PIN</div>
                  <div className="text-sm text-muted-foreground">More secure (recommended)</div>
                </Label>
              </div>
            </RadioGroup>
          </div>
        );

      case "enter-new":
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Lock className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Enter New PIN</h3>
              <p className="text-sm text-muted-foreground">
                Create your new {newPinLength}-digit PIN
              </p>
            </div>

            <div className="space-y-4">
              <PinInput
                length={newPinLength}
                value={newPin}
                onChange={(value) => {
                  setNewPin(value);
                  setError("");
                }}
                onComplete={(value) => {
                  setNewPin(value);
                  validatePin(value, newPinLength);
                }}
                autoFocus
              />

              {newPin.length === newPinLength && (
                <PinStrengthIndicator
                  pin={newPin}
                  strength={calculatePinStrength(newPin, newPinLength)}
                />
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">{error}</AlertDescription>
                </Alert>
              )}
            </div>

            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Security Tips
              </h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Use a different PIN from your current one</li>
                <li>• Avoid sequential numbers (1234, 4321)</li>
                <li>• Don't use all same digits (1111, 2222)</li>
                <li>• Choose a unique combination</li>
              </ul>
            </div>
          </div>
        );

      case "confirm-new":
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Confirm New PIN</h3>
              <p className="text-sm text-muted-foreground">
                Enter your new {newPinLength}-digit PIN again
              </p>
            </div>

            <div className="space-y-4">
              <PinInput
                length={newPinLength}
                value={confirmNewPin}
                onChange={(value) => {
                  setConfirmNewPin(value);
                  setError("");
                }}
                onComplete={(value) => {
                  setConfirmNewPin(value);
                  if (value !== newPin) {
                    setError("PINs do not match");
                  }
                }}
                autoFocus
              />

              {confirmNewPin.length === newPinLength && confirmNewPin !== newPin && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    PINs do not match. Please try again.
                  </AlertDescription>
                </Alert>
              )}

              {confirmNewPin.length === newPinLength && confirmNewPin === newPin && (
                <Alert>
                  <CheckCircle className="h-4 w-4 text-success" />
                  <AlertDescription className="text-xs text-success">
                    PINs match! Click Next to change your PIN.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        );

      case "success":
        return (
          <div className="text-center space-y-6 py-8">
            <div className="mx-auto w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mb-4 animate-in zoom-in duration-500">
              <CheckCircle className="w-10 h-10 text-success" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold">PIN Changed Successfully!</h3>
              <p className="text-muted-foreground">
                Your new {newPinLength}-digit PIN has been set.
              </p>
            </div>
            <div className="bg-success/10 p-4 rounded-lg">
              <p className="text-sm text-success">
                🔒 Your wallet is now secured with your new PIN
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto glass-card border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <CardTitle className="text-lg">Change PIN</CardTitle>
          {onCancel && currentStep !== "success" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
          )}
        </div>
        <CardDescription>
          Step {currentStepIndex + 1} of {steps.length}
        </CardDescription>
        <Progress value={progress} className="h-2" />
      </CardHeader>

      <CardContent className="space-y-6">
        {renderStepContent()}

        {currentStep !== "success" && (
          <div className="flex gap-3">
            {currentStep !== "verify-current" && (
              <Button
                variant="outline"
                onClick={handlePreviousStep}
                disabled={loading}
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}
            <Button
              onClick={handleNextStep}
              disabled={
                loading ||
                (currentStep === "verify-current" && currentPin.length !== currentPinLength) ||
                (currentStep === "enter-new" && newPin.length !== newPinLength) ||
                (currentStep === "confirm-new" && confirmNewPin.length !== newPinLength) ||
                !!error
              }
              className="flex-1"
            >
              {loading ? (
                "Processing..."
              ) : currentStep === "confirm-new" ? (
                "Change PIN"
              ) : (
                <>
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
