import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PinSetupWizard } from "./PinSetupWizard";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface PinSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

export const PinSetupDialog = ({ open, onOpenChange, onComplete }: PinSetupDialogProps) => {
  const { toast } = useToast();
  const [pinStatus, setPinStatus] = useState<{
    pinSetup: boolean;
    pinEnabled: boolean;
    pinLength: number | null;
  } | null>(null);

  useEffect(() => {
    if (open) {
      checkPinStatus();
    }
  }, [open]);

  const checkPinStatus = async () => {
    try {
      const response = await apiClient.get('/api/payments/wallet/pin/status');
      if (response.success) {
        setPinStatus(response.data);
      }
    } catch (error: any) {
      console.error('Failed to check PIN status:', error);
    }
  };

  const handleComplete = () => {
    onOpenChange(false);
    onComplete?.();
    toast({
      title: "Success!",
      description: "Your transaction PIN has been set up successfully.",
    });
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 border-primary/20">
        <DialogHeader className="sr-only">
          <DialogTitle>Setup Transaction PIN</DialogTitle>
          <DialogDescription>
            Create a secure PIN for your wallet transactions
          </DialogDescription>
        </DialogHeader>
        
        <PinSetupWizard onComplete={handleComplete} onCancel={handleCancel} />
      </DialogContent>
    </Dialog>
  );
};
