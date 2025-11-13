import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PinInput } from "@/components/PinInput";
import { Shield, AlertCircle, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";

interface PinVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVerified?: () => void;
  onCancel?: () => void;
  title?: string;
  description?: string;
  pinLength?: number;
}

export const PinVerificationDialog = ({
  open,
  onOpenChange,
  onVerified,
  onCancel,
  title = "Verify Your PIN",
  description = "Enter your transaction PIN to continue",
  pinLength = 4,
}: PinVerificationDialogProps) => {
  const { toast } = useToast();
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setPin("");
      setError("");
      setAttemptsRemaining(null);
    }
  }, [open]);

  const handleVerify = async () => {
    if (pin.length !== pinLength) {
      setError(`Please enter a ${pinLength}-digit PIN`);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await apiClient.post('/api/payments/wallet/pin/verify', {
        pin
      });

      if (response.success) {
        toast({
          title: "Success",
          description: "PIN verified successfully",
        });
        onVerified?.();
        onOpenChange(false);
      }
    } catch (error: any) {
      console.error('PIN verification error:', error);
      
      // Handle locked PIN
      if (error.message?.includes("locked")) {
        setError(error.message);
        toast({
          title: "PIN Locked",
          description: error.message,
          variant: "destructive",
        });
        // Auto-close dialog if PIN is locked
        setTimeout(() => {
          onOpenChange(false);
          onCancel?.();
        }, 2000);
        return;
      }

      // Handle incorrect PIN with attempts remaining
      if (error.attemptsRemaining !== undefined) {
        setAttemptsRemaining(error.attemptsRemaining);
        setError(`Incorrect PIN. ${error.attemptsRemaining} attempts remaining.`);
      } else {
        setError(error.message || "Incorrect PIN. Please try again.");
      }

      // Clear PIN input for retry
      setPin("");

      toast({
        title: "Verification Failed",
        description: error.message || "Incorrect PIN",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setPin("");
    setError("");
    setAttemptsRemaining(null);
    onOpenChange(false);
    onCancel?.();
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="sm:max-w-[425px] glass-card border-primary/20">
        <DialogHeader>
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <DialogTitle className="text-center text-xl">{title}</DialogTitle>
          <DialogDescription className="text-center">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
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
              }}
              autoFocus
              disabled={loading}
            />

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  {error}
                  {attemptsRemaining !== null && attemptsRemaining === 0 && (
                    <div className="mt-2 font-semibold">
                      ⚠️ Your PIN will be locked after the next failed attempt!
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </div>

          <Alert>
            <Lock className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Your PIN is required to authorize this transaction securely.
            </AlertDescription>
          </Alert>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleVerify}
              disabled={loading || pin.length !== pinLength}
              className="flex-1"
            >
              {loading ? "Verifying..." : "Verify PIN"}
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Forgot your PIN?{" "}
            <button
              className="text-primary hover:underline"
              onClick={() => {
                toast({
                  title: "PIN Recovery",
                  description: "Please contact support to reset your PIN.",
                });
              }}
            >
              Get help
            </button>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
