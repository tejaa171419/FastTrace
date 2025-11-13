import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertCircle, CheckCircle2, RefreshCw, XCircle } from 'lucide-react';
import { walletAPI } from '@/lib/walletAPI';
import { toast } from 'sonner';

interface RefundModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: {
    _id: string;
    amount: number;
    currency: string;
    type: string;
    method: string;
    description: string;
    status: string;
    createdAt: string;
    canRefund?: boolean;
  };
  onRefundSuccess?: () => void;
}

const REFUND_REASONS = [
  { value: 'accidental_payment', label: 'Accidental Payment' },
  { value: 'duplicate_payment', label: 'Duplicate Payment' },
  { value: 'incorrect_amount', label: 'Incorrect Amount' },
  { value: 'service_not_provided', label: 'Service Not Provided' },
  { value: 'product_not_received', label: 'Product Not Received' },
  { value: 'quality_issues', label: 'Quality Issues' },
  { value: 'changed_mind', label: 'Changed Mind' },
  { value: 'other', label: 'Other' }
];

export const RefundModal: React.FC<RefundModalProps> = ({
  open,
  onOpenChange,
  payment,
  onRefundSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [selectedReason, setSelectedReason] = useState('');
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [error, setError] = useState('');
  const [refundStatus, setRefundStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');

  const handleRefundRequest = async () => {
    if (!selectedReason) {
      setError('Please select a refund reason');
      return;
    }

    if (selectedReason === 'other' && !additionalDetails.trim()) {
      setError('Please provide additional details for your refund request');
      return;
    }

    setLoading(true);
    setError('');
    setRefundStatus('processing');

    try {
      const reasonText = selectedReason === 'other' 
        ? additionalDetails 
        : REFUND_REASONS.find(r => r.value === selectedReason)?.label || selectedReason;

      const result = await walletAPI.requestRefund(
        payment._id,
        reasonText,
        payment.amount // Full refund
      );

      setRefundStatus('success');
      toast.success('Refund Processed', {
        description: `₹${result.refundAmount.toLocaleString('en-IN')} will be refunded to your wallet`,
      });

      // Call success callback after a short delay
      setTimeout(() => {
        onRefundSuccess?.();
        onOpenChange(false);
        // Reset state
        setSelectedReason('');
        setAdditionalDetails('');
        setRefundStatus('idle');
      }, 2000);

    } catch (err: any) {
      console.error('Refund request error:', err);
      setRefundStatus('error');
      setError(err.message || 'Failed to process refund. Please try again.');
      toast.error('Refund Failed', {
        description: err.message || 'Unable to process your refund request',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = () => {
    switch (refundStatus) {
      case 'processing':
        return <Loader2 className="w-6 h-6 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle2 className="w-6 h-6 text-green-500" />;
      case 'error':
        return <XCircle className="w-6 h-6 text-red-500" />;
      default:
        return <RefreshCw className="w-6 h-6 text-muted-foreground" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] glass-card border-primary/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getStatusIcon()}
            {refundStatus === 'idle' ? 'Request Refund' : 
             refundStatus === 'processing' ? 'Processing Refund...' :
             refundStatus === 'success' ? 'Refund Successful' :
             'Refund Failed'}
          </DialogTitle>
          <DialogDescription>
            {refundStatus === 'idle' && 'Please provide a reason for your refund request'}
            {refundStatus === 'processing' && 'Your refund is being processed. Please wait...'}
            {refundStatus === 'success' && 'Your refund has been processed successfully'}
            {refundStatus === 'error' && 'There was an issue processing your refund'}
          </DialogDescription>
        </DialogHeader>

        {refundStatus === 'idle' && (
          <div className="space-y-6">
            {/* Payment Details */}
            <div className="p-4 rounded-lg bg-white/5 border border-white/10 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-muted-foreground">Transaction Amount</p>
                  <p className="text-2xl font-bold text-primary">
                    ₹{payment.amount.toLocaleString('en-IN')}
                  </p>
                </div>
                <Badge variant="outline" className="glass-card">
                  {payment.method?.toUpperCase()}
                </Badge>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Description:</span>
                  <span className="font-medium">{payment.description}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date:</span>
                  <span className="font-medium">{formatDate(payment.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <Badge variant="secondary">{payment.type.replace('_', ' ')}</Badge>
                </div>
              </div>
            </div>

            {/* Refund Reason Selection */}
            <div className="space-y-3">
              <Label>Select Refund Reason *</Label>
              <RadioGroup value={selectedReason} onValueChange={setSelectedReason}>
                <div className="space-y-2">
                  {REFUND_REASONS.map((reason) => (
                    <div key={reason.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={reason.value} id={reason.value} />
                      <Label 
                        htmlFor={reason.value} 
                        className="cursor-pointer font-normal flex-1"
                      >
                        {reason.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </div>

            {/* Additional Details */}
            {selectedReason && (
              <div className="space-y-2">
                <Label htmlFor="details">
                  Additional Details {selectedReason === 'other' && '*'}
                </Label>
                <Textarea
                  id="details"
                  placeholder="Please provide more information about your refund request..."
                  value={additionalDetails}
                  onChange={(e) => setAdditionalDetails(e.target.value)}
                  rows={4}
                  className="glass-card border-white/20"
                />
                <p className="text-xs text-muted-foreground">
                  {additionalDetails.length}/500 characters
                </p>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Refund Policy Notice */}
            <Alert className="glass-card border-primary/20">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <strong>Refund Policy:</strong> Refunds are processed within 5-7 business days. 
                The amount will be credited to your wallet or original payment method based on the transaction type.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {refundStatus === 'processing' && (
          <div className="py-8 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-16 h-16 animate-spin text-primary" />
            <p className="text-muted-foreground">Processing your refund request...</p>
          </div>
        )}

        {refundStatus === 'success' && (
          <div className="py-8 flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold">Refund Initiated Successfully!</p>
              <p className="text-muted-foreground mt-2">
                ₹{payment.amount.toLocaleString('en-IN')} will be refunded soon
              </p>
            </div>
          </div>
        )}

        {refundStatus === 'error' && (
          <div className="py-8 flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
              <XCircle className="w-10 h-10 text-red-500" />
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold">Refund Request Failed</p>
              <p className="text-muted-foreground mt-2">{error}</p>
            </div>
          </div>
        )}

        {refundStatus === 'idle' && (
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="glass-card border-white/20"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRefundRequest}
              disabled={!selectedReason || loading}
              className="bg-gradient-to-r from-primary to-accent"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Request Refund
                </>
              )}
            </Button>
          </DialogFooter>
        )}

        {refundStatus === 'error' && (
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRefundStatus('idle');
                setError('');
              }}
              className="glass-card border-white/20"
            >
              Try Again
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};
