import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { FinancialGoal } from "@/lib/services/personalDashboardService";

interface FinancialGoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal?: FinancialGoal | null;
  onSave: (goal: Partial<FinancialGoal>) => Promise<void>;
}

const colorOptions = [
  { value: '#3b82f6', label: 'Blue' },
  { value: '#10b981', label: 'Green' },
  { value: '#f59e0b', label: 'Orange' },
  { value: '#8b5cf6', label: 'Purple' },
  { value: '#ec4899', label: 'Pink' },
  { value: '#06b6d4', label: 'Cyan' },
];

export const FinancialGoalDialog = ({
  open,
  onOpenChange,
  goal,
  onSave,
}: FinancialGoalDialogProps) => {
  const [formData, setFormData] = useState({
    name: '',
    targetAmount: '',
    currentAmount: '',
    deadline: undefined as Date | undefined,
    color: '#3b82f6',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (goal) {
      setFormData({
        name: goal.name,
        targetAmount: goal.targetAmount.toString(),
        currentAmount: goal.currentAmount.toString(),
        deadline: goal.deadline ? new Date(goal.deadline) : undefined,
        color: goal.color || '#3b82f6',
      });
    } else {
      setFormData({
        name: '',
        targetAmount: '',
        currentAmount: '0',
        deadline: undefined,
        color: '#3b82f6',
      });
    }
  }, [goal, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.targetAmount) {
      return;
    }

    setLoading(true);
    try {
      await onSave({
        name: formData.name,
        targetAmount: parseFloat(formData.targetAmount),
        currentAmount: parseFloat(formData.currentAmount) || 0,
        deadline: formData.deadline?.toISOString(),
        color: formData.color,
      });
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] glass-card border-primary/20">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gradient-cyber">
            {goal ? 'Edit Financial Goal' : 'Create Financial Goal'}
          </DialogTitle>
          <DialogDescription>
            Set a target amount and deadline for your financial goal.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Goal Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Goal Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Emergency Fund, Vacation"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="glass-card border-white/20"
              />
            </div>

            {/* Target Amount */}
            <div className="space-y-2">
              <Label htmlFor="targetAmount">Target Amount (₹) *</Label>
              <Input
                id="targetAmount"
                type="number"
                placeholder="50000"
                min="0"
                step="100"
                value={formData.targetAmount}
                onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                required
                className="glass-card border-white/20"
              />
            </div>

            {/* Current Amount */}
            <div className="space-y-2">
              <Label htmlFor="currentAmount">Current Amount (₹)</Label>
              <Input
                id="currentAmount"
                type="number"
                placeholder="0"
                min="0"
                step="100"
                value={formData.currentAmount}
                onChange={(e) => setFormData({ ...formData, currentAmount: e.target.value })}
                className="glass-card border-white/20"
              />
            </div>

            {/* Deadline */}
            <div className="space-y-2">
              <Label>Target Deadline (Optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal glass-card border-white/20"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.deadline ? format(formData.deadline, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 glass-card border-primary/20">
                  <Calendar
                    mode="single"
                    selected={formData.deadline}
                    onSelect={(date) => setFormData({ ...formData, deadline: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Color Picker */}
            <div className="space-y-2">
              <Label>Color Theme</Label>
              <div className="flex gap-2">
                {colorOptions.map((colorOption) => (
                  <button
                    key={colorOption.value}
                    type="button"
                    className={`w-10 h-10 rounded-full border-2 transition-all duration-300 hover:scale-110 ${
                      formData.color === colorOption.value
                        ? 'border-white shadow-glow'
                        : 'border-transparent'
                    }`}
                    style={{ backgroundColor: colorOption.value }}
                    onClick={() => setFormData({ ...formData, color: colorOption.value })}
                    title={colorOption.label}
                  />
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="glass-card border-white/20"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.name || !formData.targetAmount}
              className="bg-gradient-primary shadow-glow"
            >
              {loading ? 'Saving...' : goal ? 'Update Goal' : 'Create Goal'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default FinancialGoalDialog;
