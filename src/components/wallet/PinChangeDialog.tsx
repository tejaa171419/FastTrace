import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PinChangeWizard } from "./PinChangeWizard";

interface PinChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPinLength: number;
  onComplete?: () => void;
}

export const PinChangeDialog = ({ open, onOpenChange, currentPinLength, onComplete }: PinChangeDialogProps) => {
  const handleComplete = () => {
    onOpenChange(false);
    onComplete?.();
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 border-primary/20">
        <DialogHeader className="sr-only">
          <DialogTitle>Change Transaction PIN</DialogTitle>
          <DialogDescription>
            Update your wallet transaction PIN
          </DialogDescription>
        </DialogHeader>
        
        <PinChangeWizard
          currentPinLength={currentPinLength}
          onComplete={handleComplete}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  );
};
