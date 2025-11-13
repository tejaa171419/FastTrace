import { useState, useCallback } from 'react';
import { WalletAPI } from '@/lib/walletAPI';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { triggerWalletUpdate } from './useWalletBalance';
import { triggerTransactionUpdate } from './useWalletTransactions';

// Razorpay types
declare global {
  interface Window {
    Razorpay: any;
  }
}

export interface TopupData {
  amount: number;
  method: 'upi' | 'card' | 'netbanking';
  description?: string;
}

export interface TopupResult {
  payment: {
    _id: string;
    amount: number;
    status: string;
    razorpayOrderId?: string;
  };
  newBalance: number;
  message: string;
}

interface UseWalletTopupReturn {
  topup: (data: TopupData) => Promise<TopupResult | null>;
  loading: boolean;
  error: string | null;
  success: boolean;
  reset: () => void;
}

/**
 * Custom hook for wallet topup/recharge
 * Integrates with Razorpay payment gateway
 */
export const useWalletTopup = (): UseWalletTopupReturn => {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const walletAPI = WalletAPI.getInstance();

  /**
   * Load Razorpay script dynamically
   */
  const loadRazorpayScript = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }, []);

  /**
   * Display Razorpay payment modal
   */
  const displayRazorpay = useCallback(async (
    orderId: string,
    amount: number,
    paymentId: string
  ): Promise<any> => {
    const res = await loadRazorpayScript();

    if (!res) {
      throw new Error('Razorpay SDK failed to load. Please check your internet connection.');
    }

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID || '',
      amount: amount * 100, // Amount in paise
      currency: 'INR',
      name: 'ZenithWallet',
      description: 'Wallet Topup',
      order_id: orderId,
      handler: async function (response: any) {
        try {
          // Verify payment
          const verificationData = {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            payment_id: paymentId
          };

          await walletAPI.verifyPayment(verificationData);
          
          return response;
        } catch (verifyError) {
          console.error('Payment verification failed:', verifyError);
          throw verifyError;
        }
      },
      prefill: {
        name: user?.fullName || `${user?.firstName} ${user?.lastName}`,
        email: user?.email || '',
        contact: user?.phone || ''
      },
      theme: {
        color: '#3b82f6'
      },
      modal: {
        ondismiss: function () {
          throw new Error('Payment cancelled by user');
        }
      }
    };

    const paymentObject = new window.Razorpay(options);
    paymentObject.open();

    return new Promise((resolve, reject) => {
      paymentObject.on('payment.success', resolve);
      paymentObject.on('payment.error', reject);
    });
  }, [user, walletAPI, loadRazorpayScript]);

  /**
   * Topup wallet
   */
  const topup = useCallback(async (data: TopupData): Promise<TopupResult | null> => {
    if (!isAuthenticated) {
      const errorMsg = 'Please login to add money';
      setError(errorMsg);
      toast({
        title: 'Authentication Required',
        description: errorMsg,
        variant: 'destructive'
      });
      return null;
    }

    // Validation
    if (!data.amount || data.amount < 1) {
      const errorMsg = 'Please enter a valid amount (minimum ₹1)';
      setError(errorMsg);
      toast({
        title: 'Invalid Amount',
        description: errorMsg,
        variant: 'destructive'
      });
      return null;
    }

    if (data.amount > 100000) {
      const errorMsg = 'Maximum topup amount is ₹1,00,000';
      setError(errorMsg);
      toast({
        title: 'Amount Too High',
        description: errorMsg,
        variant: 'destructive'
      });
      return null;
    }

    if (!data.method) {
      const errorMsg = 'Please select a payment method';
      setError(errorMsg);
      toast({
        title: 'Invalid Payment Method',
        description: errorMsg,
        variant: 'destructive'
      });
      return null;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Step 1: Create topup order
      const orderData = {
        amount: data.amount,
        method: data.method,
        description: data.description || 'Wallet topup'
      };

      const order = await walletAPI.createTopupOrder(
        orderData.amount,
        orderData.method,
        orderData.description
      );

      if (!order || !order.razorpayOrderId) {
        throw new Error('Failed to create payment order');
      }

      // Step 2: Open Razorpay payment modal
      const paymentResponse = await displayRazorpay(
        order.razorpayOrderId,
        data.amount,
        order._id
      );

      // Step 3: Payment successful
      setSuccess(true);
      setLoading(false);

      // Show success toast
      toast({
        title: 'Topup Successful! 🎉',
        description: `₹${data.amount.toLocaleString('en-IN')} added to your wallet`,
        variant: 'default'
      });

      // Trigger updates
      triggerWalletUpdate();
      triggerTransactionUpdate();

      // Return result
      return {
        payment: {
          _id: order._id,
          amount: data.amount,
          status: 'completed',
          razorpayOrderId: order.razorpayOrderId
        },
        newBalance: 0, // Will be updated by wallet refresh
        message: 'Topup successful'
      };
    } catch (err: any) {
      console.error('Topup failed:', err);
      const errorMessage = err.message || 'Topup failed. Please try again.';
      
      setError(errorMessage);
      setLoading(false);
      setSuccess(false);

      // Show error toast
      toast({
        title: 'Topup Failed',
        description: errorMessage,
        variant: 'destructive'
      });

      return null;
    }
  }, [isAuthenticated, user, walletAPI, toast, displayRazorpay]);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setError(null);
    setSuccess(false);
    setLoading(false);
  }, []);

  return {
    topup,
    loading,
    error,
    success,
    reset
  };
};

export default useWalletTopup;