import { useState, useCallback } from "react";
import { PinVerificationDialog } from "@/components/wallet/PinVerificationDialog";

interface UsePinVerificationOptions {
  pinLength?: number;
  title?: string;
  description?: string;
  onVerified?: () => void;
  onCancel?: () => void;
}

export const usePinVerification = (options: UsePinVerificationOptions = {}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [verifyCallback, setVerifyCallback] = useState<(() => void) | null>(null);

  const requestVerification = useCallback((callback?: () => void) => {
    setVerifyCallback(() => callback || null);
    setIsOpen(true);
  }, []);

  const handleVerified = useCallback(() => {
    if (verifyCallback) {
      verifyCallback();
    }
    if (options.onVerified) {
      options.onVerified();
    }
    setIsOpen(false);
    setVerifyCallback(null);
  }, [verifyCallback, options]);

  const handleCancel = useCallback(() => {
    if (options.onCancel) {
      options.onCancel();
    }
    setIsOpen(false);
    setVerifyCallback(null);
  }, [options]);

  const PinDialog = () => (
    <PinVerificationDialog
      open={isOpen}
      onOpenChange={setIsOpen}
      onVerified={handleVerified}
      onCancel={handleCancel}
      title={options.title}
      description={options.description}
      pinLength={options.pinLength}
    />
  );

  return {
    requestVerification,
    PinDialog,
    isVerifying: isOpen,
  };
};
