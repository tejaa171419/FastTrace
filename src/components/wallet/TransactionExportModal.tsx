import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Download, 
  FileText, 
  FileSpreadsheet, 
  Calendar as CalendarIcon,
  Loader2,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useTransactionExport, type ExportFormat, type ExportFilters } from '@/hooks/useTransactionExport';

interface TransactionExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const TransactionExportModal: React.FC<TransactionExportModalProps> = ({
  open,
  onOpenChange,
}) => {
  const { isExporting, exportTransactions, error } = useTransactionExport();
  
  // Export settings state
  const [exportFormat, setExportFormat] = useState<ExportFormat>('csv');
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [transactionType, setTransactionType] = useState<string>('all');
  const [transactionStatus, setTransactionStatus] = useState<string>('all');
  
  // Date picker states
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);

  const handleExport = async () => {
    const filters: ExportFilters = {};
    
    if (startDate) {
      filters.startDate = format(startDate, 'yyyy-MM-dd');
    }
    
    if (endDate) {
      filters.endDate = format(endDate, 'yyyy-MM-dd');
    }
    
    if (transactionType !== 'all') {
      filters.type = transactionType;
    }
    
    if (transactionStatus !== 'all') {
      filters.status = transactionStatus;
    }

    try {
      await exportTransactions(exportFormat, filters);
      // Close modal on success
      setTimeout(() => {
        onOpenChange(false);
        // Reset form
        setStartDate(undefined);
        setEndDate(undefined);
        setTransactionType('all');
        setTransactionStatus('all');
      }, 1000);
    } catch (error) {
      // Error is handled by the hook
      console.error('Export failed:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-primary/20 max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5 text-primary" />
            Export Transactions
          </DialogTitle>
          <DialogDescription>
            Download your transaction history in CSV or PDF format
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Export Format Selection */}
          <div className="space-y-2">
            <Label>Export Format</Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant={exportFormat === 'csv' ? 'default' : 'outline'}
                className={cn(
                  "h-auto py-4 flex-col gap-2",
                  exportFormat === 'csv' && "bg-gradient-primary"
                )}
                onClick={() => setExportFormat('csv')}
              >
                <FileSpreadsheet className="w-6 h-6" />
                <span className="text-sm font-medium">CSV</span>
              </Button>
              <Button
                type="button"
                variant={exportFormat === 'pdf' ? 'default' : 'outline'}
                className={cn(
                  "h-auto py-4 flex-col gap-2",
                  exportFormat === 'pdf' && "bg-gradient-primary"
                )}
                onClick={() => setExportFormat('pdf')}
              >
                <FileText className="w-6 h-6" />
                <span className="text-sm font-medium">PDF</span>
              </Button>
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-3">
            {/* Start Date */}
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal glass-card border-white/20",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, 'PPP') : 'Select date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 glass-card border-primary/20" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => {
                      setStartDate(date);
                      setStartDateOpen(false);
                    }}
                    disabled={(date) => date > new Date() || (endDate && date > endDate)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* End Date */}
            <div className="space-y-2">
              <Label>End Date</Label>
              <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal glass-card border-white/20",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, 'PPP') : 'Select date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 glass-card border-primary/20" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => {
                      setEndDate(date);
                      setEndDateOpen(false);
                    }}
                    disabled={(date) => date > new Date() || (startDate && date < startDate)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Transaction Type Filter */}
          <div className="space-y-2">
            <Label>Transaction Type</Label>
            <Select value={transactionType} onValueChange={setTransactionType}>
              <SelectTrigger className="glass-card border-white/20">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent className="glass-card border-primary/20">
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="wallet_topup">Top-up</SelectItem>
                <SelectItem value="wallet_transfer">Transfer</SelectItem>
                <SelectItem value="settlement">Settlement</SelectItem>
                <SelectItem value="expense_payment">Expense Payment</SelectItem>
                <SelectItem value="withdrawal">Withdrawal</SelectItem>
                <SelectItem value="refund">Refund</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Transaction Status Filter */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={transactionStatus} onValueChange={setTransactionStatus}>
              <SelectTrigger className="glass-card border-white/20">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent className="glass-card border-primary/20">
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Info Alert */}
          <Alert className="border-blue-500/30 bg-blue-500/10">
            <CheckCircle className="h-4 w-4 text-blue-400" />
            <AlertDescription className="text-blue-200 text-xs">
              {exportFormat === 'csv' 
                ? 'CSV files can be opened in Excel, Google Sheets, or any spreadsheet application.'
                : 'PDF format is ideal for printing or sharing formatted reports.'}
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isExporting}
            className="glass-card border-white/20"
          >
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="bg-gradient-primary"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Export {exportFormat.toUpperCase()}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionExportModal;
