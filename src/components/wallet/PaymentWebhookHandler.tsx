import { useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useSocket } from '@/hooks/useSocket';
import { CheckCircle2, XCircle, AlertCircle, DollarSign } from 'lucide-react';

interface PaymentStatusUpdate {
  paymentId: string;
  status: 'completed' | 'failed' | 'processing' | 'refunded';
  amount: number;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  error?: string;
  message: string;
  timestamp: string;
}

interface WebhookHandlerProps {
  onPaymentStatusChange?: (update: PaymentStatusUpdate) => void;
  onBalanceUpdate?: () => void;
  userId?: string;
}

/**
 * PaymentWebhookHandler - Listens to real-time payment status updates via WebSocket
 * and displays toast notifications to the user
 */
export const PaymentWebhookHandler: React.FC<WebhookHandlerProps> = ({
  onPaymentStatusChange,
  onBalanceUpdate,
  userId
}) => {
  const socket = useSocket();

  // Handle payment status update event
  const handlePaymentStatusUpdate = useCallback((data: PaymentStatusUpdate) => {
    console.log('📡 Payment status update received:', data);

    // Call callback if provided
    onPaymentStatusChange?.(data);

    // Show appropriate toast based on status
    switch (data.status) {
      case 'completed':
        toast.success('Payment Successful!', {
          description: `₹${data.amount.toLocaleString('en-IN')} - ${data.message}`,
          icon: <CheckCircle2 className="w-5 h-5 text-green-500" />,
          duration: 5000,
        });
        // Trigger balance refresh
        onBalanceUpdate?.();
        break;

      case 'failed':
        toast.error('Payment Failed', {
          description: data.error || data.message || 'Transaction could not be completed',
          icon: <XCircle className="w-5 h-5 text-red-500" />,
          duration: 6000,
        });
        break;

      case 'processing':
        toast.info('Payment Processing', {
          description: data.message || 'Your payment is being processed...',
          icon: <AlertCircle className="w-5 h-5 text-blue-500" />,
          duration: 4000,
        });
        break;

      case 'refunded':
        toast.success('Refund Processed', {
          description: `₹${data.amount.toLocaleString('en-IN')} has been refunded`,
          icon: <DollarSign className="w-5 h-5 text-green-500" />,
          duration: 5000,
        });
        // Trigger balance refresh
        onBalanceUpdate?.();
        break;

      default:
        console.warn('Unknown payment status:', data.status);
    }
  }, [onPaymentStatusChange, onBalanceUpdate]);

  // Handle wallet balance update event
  const handleWalletBalanceUpdate = useCallback((data: any) => {
    console.log('💰 Wallet balance update received:', data);
    
    // Trigger balance refresh
    onBalanceUpdate?.();

    // Show toast for significant balance changes
    if (data.type === 'credit' && data.amount > 0) {
      toast.success('Wallet Credited', {
        description: `+₹${data.amount.toLocaleString('en-IN')} added to your wallet`,
        duration: 4000,
      });
    }
  }, [onBalanceUpdate]);

  // Handle transaction completed event
  const handleTransactionCompleted = useCallback((data: any) => {
    console.log('✅ Transaction completed:', data);
    
    // Trigger balance refresh
    onBalanceUpdate?.();
  }, [onBalanceUpdate]);

  // Setup WebSocket event listeners
  useEffect(() => {
    if (!socket) {
      console.log('⚠️ Socket not available for payment webhook handler');
      return;
    }

    console.log('🔌 Setting up payment webhook handlers');

    // Listen to payment status updates
    socket.on('payment_status_update', handlePaymentStatusUpdate);
    socket.on('wallet_balance_update', handleWalletBalanceUpdate);
    socket.on('transaction_completed', handleTransactionCompleted);

    // Cleanup listeners on unmount
    return () => {
      console.log('🔌 Cleaning up payment webhook handlers');
      socket.off('payment_status_update', handlePaymentStatusUpdate);
      socket.off('wallet_balance_update', handleWalletBalanceUpdate);
      socket.off('transaction_completed', handleTransactionCompleted);
    };
  }, [socket, handlePaymentStatusUpdate, handleWalletBalanceUpdate, handleTransactionCompleted]);

  // Join user's payment channel
  useEffect(() => {
    if (!socket || !userId) return;

    console.log(`📡 Joining payment channel for user: ${userId}`);
    socket.emit('join_payment_channel', { userId });

    return () => {
      console.log(`📡 Leaving payment channel for user: ${userId}`);
      socket.emit('leave_payment_channel', { userId });
    };
  }, [socket, userId]);

  // This component doesn't render anything
  return null;
};

/**
 * Hook version for easier integration
 */
export const usePaymentWebhook = (
  userId?: string,
  options: {
    onPaymentStatusChange?: (update: PaymentStatusUpdate) => void;
    onBalanceUpdate?: () => void;
  } = {}
) => {
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handlePaymentStatusUpdate = (data: PaymentStatusUpdate) => {
      console.log('📡 Payment status update:', data);
      options.onPaymentStatusChange?.(data);

      // Auto toast notifications
      switch (data.status) {
        case 'completed':
          toast.success('Payment Successful!', {
            description: `₹${data.amount.toLocaleString('en-IN')}`,
          });
          options.onBalanceUpdate?.();
          break;

        case 'failed':
          toast.error('Payment Failed', {
            description: data.error || 'Transaction failed',
          });
          break;

        case 'processing':
          toast.info('Processing Payment', {
            description: 'Your payment is being processed...',
          });
          break;

        case 'refunded':
          toast.success('Refund Processed', {
            description: `₹${data.amount.toLocaleString('en-IN')}`,
          });
          options.onBalanceUpdate?.();
          break;
      }
    };

    socket.on('payment_status_update', handlePaymentStatusUpdate);

    if (userId) {
      socket.emit('join_payment_channel', { userId });
    }

    return () => {
      socket.off('payment_status_update', handlePaymentStatusUpdate);
      if (userId) {
        socket.emit('leave_payment_channel', { userId });
      }
    };
  }, [socket, userId, options]);
};
