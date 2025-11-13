import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Calendar, 
  CreditCard, 
  Tag, 
  MapPin, 
  Receipt, 
  FileText,
  DollarSign,
  RefreshCw,
  Download,
  Edit,
  Trash2
} from "lucide-react";
import { getCategoryConfig, getCategoryIcon } from "./categoryConfig";
import { format } from "date-fns";

interface ExpenseDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense: any;
  onEdit?: (expense: any) => void;
  onDelete?: (expenseId: string) => void;
}

export const ExpenseDetailsDialog = ({
  open,
  onOpenChange,
  expense,
  onEdit,
  onDelete,
}: ExpenseDetailsDialogProps) => {
  if (!expense) return null;

  const config = getCategoryConfig(expense.category);
  const Icon = getCategoryIcon(expense.category);

  const handleEdit = () => {
    onEdit?.(expense);
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      onDelete?.(expense._id);
      onOpenChange(false);
    }
  };

  const handleDownloadReceipt = () => {
    if (expense.receipt) {
      window.open(expense.receipt, '_blank');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] glass-card border-primary/20 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gradient-cyber flex items-center gap-3">
            <div className={`p-3 rounded-xl ${config.bgColor}`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            Expense Details
          </DialogTitle>
          <DialogDescription>
            Complete information about this expense transaction
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Title and Amount */}
          <div className="space-y-2">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-foreground">{expense.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{config.name}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-red-400">₹{expense.amount.toLocaleString()}</p>
              </div>
            </div>
            {expense.description && (
              <p className="text-sm text-muted-foreground mt-2">{expense.description}</p>
            )}
          </div>

          <Separator />

          {/* Transaction Details */}
          <div className="grid grid-cols-2 gap-4">
            {/* Date */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Calendar className="w-4 h-4" />
                <span>Date</span>
              </div>
              <p className="font-medium">
                {format(new Date(expense.date), 'PPP')}
              </p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(expense.date), 'p')}
              </p>
            </div>

            {/* Payment Method */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <CreditCard className="w-4 h-4" />
                <span>Payment Method</span>
              </div>
              <p className="font-medium">{expense.paymentMethod || 'Not specified'}</p>
            </div>

            {/* Merchant */}
            {expense.merchant && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <MapPin className="w-4 h-4" />
                  <span>Merchant</span>
                </div>
                <p className="font-medium">{expense.merchant}</p>
              </div>
            )}

            {/* Location */}
            {expense.location && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <MapPin className="w-4 h-4" />
                  <span>Location</span>
                </div>
                <p className="font-medium">{expense.location}</p>
              </div>
            )}
          </div>

          {/* Tags */}
          {expense.tags && expense.tags.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Tag className="w-4 h-4" />
                  <span>Tags</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {expense.tags.map((tag: string) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Additional Info */}
          <Separator />
          <div className="grid grid-cols-2 gap-4">
            {/* Recurring */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <RefreshCw className="w-4 h-4" />
                <span>Recurring</span>
              </div>
              <div>
                {expense.recurring ? (
                  <Badge variant="outline" className="border-primary/30 text-primary">
                    Yes
                  </Badge>
                ) : (
                  <p className="text-sm text-muted-foreground">No</p>
                )}
              </div>
            </div>

            {/* Receipt */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Receipt className="w-4 h-4" />
                <span>Receipt</span>
              </div>
              <div>
                {expense.receipt ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadReceipt}
                    className="h-7 text-xs"
                  >
                    <Download className="w-3 h-3 mr-1" />
                    View Receipt
                  </Button>
                ) : (
                  <p className="text-sm text-muted-foreground">No receipt</p>
                )}
              </div>
            </div>
          </div>

          {/* Notes */}
          {expense.notes && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <FileText className="w-4 h-4" />
                  <span>Notes</span>
                </div>
                <p className="text-sm bg-muted/30 p-3 rounded-lg">{expense.notes}</p>
              </div>
            </>
          )}

          {/* Metadata */}
          <Separator />
          <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
            <div>
              <p>Created: {format(new Date(expense.createdAt || expense.date), 'PPp')}</p>
            </div>
            {expense.updatedAt && (
              <div>
                <p>Updated: {format(new Date(expense.updatedAt), 'PPp')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="glass-card border-white/20"
          >
            Close
          </Button>
          {onEdit && (
            <Button
              variant="outline"
              onClick={handleEdit}
              className="glass-card border-white/20"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          )}
          {onDelete && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="bg-red-500/20 hover:bg-red-500/30 text-red-400"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExpenseDetailsDialog;
