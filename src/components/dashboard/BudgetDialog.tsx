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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BudgetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: string;
  amount?: number;
  onSave: (category: string, amount: number) => Promise<void>;
}

const expenseCategories = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Bills & Utilities',
  'Healthcare',
  'Travel',
  'Education',
  'Groceries',
  'Personal Care',
  'Home & Garden',
  'Gifts & Donations',
  'Business',
  'Other',
];

export const BudgetDialog = ({
  open,
  onOpenChange,
  category,
  amount,
  onSave,
}: BudgetDialogProps) => {
  const [formData, setFormData] = useState({
    category: '',
    amount: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (category && amount) {
      setFormData({
        category,
        amount: amount.toString(),
      });
    } else {
      setFormData({
        category: '',
        amount: '',
      });
    }
  }, [category, amount, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.category || !formData.amount) {
      return;
    }

    setLoading(true);
    try {
      await onSave(formData.category, parseFloat(formData.amount));
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] glass-card border-primary/20">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gradient-cyber">
            {category ? 'Edit Budget' : 'Set Budget'}
          </DialogTitle>
          <DialogDescription>
            Set a monthly spending limit for this category.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
                disabled={!!category}
              >
                <SelectTrigger className="glass-card border-white/20">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent className="glass-card border-primary/20">
                  {expenseCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Monthly Budget (₹) *</Label>
              <Input
                id="amount"
                type="number"
                placeholder="5000"
                min="0"
                step="100"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
                className="glass-card border-white/20"
              />
              <p className="text-xs text-muted-foreground">
                This is the maximum amount you plan to spend on this category each month.
              </p>
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
              disabled={loading || !formData.category || !formData.amount}
              className="bg-gradient-primary shadow-glow"
            >
              {loading ? 'Saving...' : category ? 'Update Budget' : 'Set Budget'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BudgetDialog;
