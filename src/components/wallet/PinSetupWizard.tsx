import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { PinInput } from "@/components/PinInput";
import { PinStrengthIndicator } from "@/components/PinStrengthIndicator";
import { 
  Lock, 
  Shield, 
  CheckCircle, 
  AlertCircle, 
  ArrowRight, 
  ArrowLeft,
  KeyRound 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";

interface PinSetupWizardProps {
  onComplete?: () => void;
  onCancel?: () => void;
}

type Step = "choose-length" | "enter-pin" | "confirm-pin" | "success";

export const PinSetupWizard = ({ onComplete, onCancel }: PinSetupWizardProps) => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<Step>("choose-length");
  const [pinLength, setPinLength] = useState<4 | 6>(4);
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const steps: Step[] = ["choose-length", "enter-pin", "confirm-pin", "success"];
  const currentStepIndex = steps.indexOf(currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const validatePin = (value: string): boolean => {
    // Check if it's all digits
    if (!/^\d+$/.test(value)) {
      setError("PIN must contain only numbers");
      return false;
    }

    // Check length
    if (value.length !== pinLength) {
      setError(`PIN must be exactly ${pinLength} digits`);
      return false;
    }

    // Check for sequential numbers (1234, 4321, etc.)
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

    // Check for repeated digits (1111, 2222, etc.)
    if (/^(\d)\1+$/.test(value)) {
      setError("PIN cannot be all same digits (e.g., 1111)");
      return false;
    }

    setError("");
    return true;
  };

  const calculatePinStrength = (value: string): number => {
    if (value.length < pinLength) return 0;

    let strength = 0;
    const digits = value.split("");
    const uniqueDigits = new Set(digits).size;

    // More unique digits = stronger
    strength += (uniqueDigits / pinLength) * 40;

    // No sequential patterns = stronger
    const hasSequential = /012|123|234|345|456|567|678|789|987|876|765|654|543|432|321|210/.test(value);
    if (!hasSequential) strength += 30;

    // No repeated pairs = stronger  
    const hasRepeatedPairs = /(\d)\1/.test(value);
    if (!hasRepeatedPairs) strength += 30;

    return Math.min(strength, 100);
  };

  const handleNextStep = () => {
    if (currentStep === "choose-length") {
      setCurrentStep("enter-pin");
    } else if (currentStep === "enter-pin") {
      if (pin.length === pinLength && validatePin(pin)) {
        setCurrentStep("confirm-pin");
      }
    } else if (currentStep === "confirm-pin") {
      if (confirmPin === pin) {
        handleSubmitPin();
      } else {
        setError("PINs do not match. Please try again.");
      }
    }
  };

  const handlePreviousStep = () => {
    if (currentStep === "confirm-pin") {
      setConfirmPin("");
      setError("");
      setCurrentStep("enter-pin");
    } else if (currentStep === "enter-pin") {
      setPin("");
      setError("");
      setCurrentStep("choose-length");
    }
  };

  const handleSubmitPin = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await apiClient.post('/api/payments/wallet/pin', {
        pin,
        confirmPin: pin,
        pinLength
      });

      if (response.success) {
        setCurrentStep("success");
        toast({
          title: "Success!",
          description: "Your transaction PIN has been set successfully.",
        });

        // Auto-complete after 2 seconds
        setTimeout(() => {
          onComplete?.();
        }, 2000);
      }
    } catch (error: any) {
      console.error('PIN setup error:', error);
      setError(error.message || "Failed to set PIN. Please try again.");
      toast({
        title: "Error",
        description: error.message || "Failed to set PIN",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case "choose-length":
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <KeyRound className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Choose PIN Length</h3>
              <p className="text-sm text-muted-foreground">
                Select how many digits you want for your transaction PIN
              </p>
            </div>

            <RadioGroup
              value={pinLength.toString()}
              onValueChange={(value) => setPinLength(parseInt(value) as 4 | 6)}
              className="space-y-3"
            >
              <div className="flex items-center space-x-3 p-4 rounded-lg border border-primary/20 hover:border-primary/40 transition-colors cursor-pointer">
                <RadioGroupItem value="4" id="4-digit" />
                <Label htmlFor="4-digit" className="flex-1 cursor-pointer">
                  <div className="font-medium">4-Digit PIN</div>
                  <div className="text-sm text-muted-foreground">Quick and easy to remember</div>
                </Label>
                <div className="text-sm text-muted-foreground">e.g., 1234</div>
              </div>

              <div className="flex items-center space-x-3 p-4 rounded-lg border border-primary/20 hover:border-primary/40 transition-colors cursor-pointer">
                <RadioGroupItem value="6" id="6-digit" />
                <Label htmlFor="6-digit" className="flex-1 cursor-pointer">
                  <div className="font-medium">6-Digit PIN</div>
                  <div className="text-sm text-muted-foreground">More secure, recommended</div>
                </Label>
                <div className="text-sm text-muted-foreground">e.g., 123456</div>
              </div>
            </RadioGroup>

            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Your PIN will be required for all wallet transactions to ensure security.
              </AlertDescription>
            </Alert>
          </div>
        );

      case "enter-pin":
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Lock className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Enter Your PIN</h3>
              <p className="text-sm text-muted-foreground">
                Create a {pinLength}-digit PIN for your wallet
              </p>
            </div>

            <div className="space-y-4">
              <PinInput
                length={pinLength}
                value={pin}
                onChange={(value) => {
                  setPin(value);
                  setError("");
                }}
                onComplete={(value) => {
                  setPin(value);
                  validatePin(value);
                }}
                autoFocus
              />

              {pin.length === pinLength && (
                <PinStrengthIndicator
                  pin={pin}
                  strength={calculatePinStrength(pin)}
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
                PIN Security Tips
              </h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Avoid sequential numbers (1234, 4321)</li>
                <li>• Don't use all same digits (1111, 2222)</li>
                <li>• Choose a unique combination</li>
                <li>• Don't use your birth date or phone number</li>
              </ul>
            </div>
          </div>
        );

      case "confirm-pin":
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Confirm Your PIN</h3>
              <p className="text-sm text-muted-foreground">
                Enter your {pinLength}-digit PIN again to confirm
              </p>
            </div>

            <div className="space-y-4">
              <PinInput
                length={pinLength}
                value={confirmPin}
                onChange={(value) => {
                  setConfirmPin(value);
                  setError("");
                }}
                onComplete={(value) => {
                  setConfirmPin(value);
                  if (value !== pin) {
                    setError("PINs do not match");
                  }
                }}
                autoFocus
              />

              {confirmPin.length === pinLength && confirmPin !== pin && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    PINs do not match. Please try again.
                  </AlertDescription>
                </Alert>
              )}

              {confirmPin.length === pinLength && confirmPin === pin && (
                <Alert>
                  <CheckCircle className="h-4 w-4 text-success" />
                  <AlertDescription className="text-xs text-success">
                    PINs match! Click Next to complete setup.
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
              <h3 className="text-2xl font-bold">PIN Set Successfully!</h3>
              <p className="text-muted-foreground">
                Your {pinLength}-digit transaction PIN has been created.
              </p>
            </div>
            <div className="bg-success/10 p-4 rounded-lg">
              <p className="text-sm text-success">
                🎉 You can now use your wallet securely!
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
          <CardTitle className="text-lg">Setup Transaction PIN</CardTitle>
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
            {currentStep !== "choose-length" && (
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
                (currentStep === "enter-pin" && pin.length !== pinLength) ||
                (currentStep === "confirm-pin" && confirmPin.length !== pinLength) ||
                !!error
              }
              className="flex-1"
            >
              {loading ? (
                "Setting up..."
              ) : currentStep === "confirm-pin" ? (
                "Complete Setup"
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
