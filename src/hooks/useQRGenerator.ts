import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export interface GenerateQROptions {
  amount?: number;
  note?: string;
  type?: 'wallet' | 'upi' | 'payment_link';
  expiresIn?: number; // minutes
}

export interface QRCodeData {
  qrText: string;
  qrType: 'wallet' | 'upi' | 'payment_link';
  userId: string;
  userName: string;
  amount?: number;
  note?: string;
  expiresAt?: Date;
  createdAt: Date;
}

interface UseQRGeneratorReturn {
  qrData: QRCodeData | null;
  isGenerating: boolean;
  error: string | null;
  generateQR: (options?: GenerateQROptions) => Promise<QRCodeData>;
  resetQR: () => void;
}

/**
 * Custom hook for generating QR codes for receiving payments
 */
export const useQRGenerator = (): UseQRGeneratorReturn => {
  const { user } = useAuth();
  const [qrData, setQrData] = useState<QRCodeData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Generate UPI format QR code
   */
  const generateUPIQR = useCallback((
    upiId: string,
    name: string,
    options: GenerateQROptions
  ): string => {
    const params = new URLSearchParams({
      pa: upiId, // Payee address (UPI ID)
      pn: name,  // Payee name
      cu: 'INR', // Currency
    });

    if (options.amount) {
      params.append('am', options.amount.toString());
    }

    if (options.note) {
      params.append('tn', options.note); // Transaction note
    }

    return `upi://pay?${params.toString()}`;
  }, []);

  /**
   * Generate custom wallet QR code (JSON format)
   */
  const generateWalletQR = useCallback((
    userId: string,
    userName: string,
    options: GenerateQROptions
  ): string => {
    const data: any = {
      type: options.type || 'wallet',
      userId,
      name: userName,
      timestamp: new Date().toISOString(),
    };

    if (options.amount) {
      data.amount = options.amount;
    }

    if (options.note) {
      data.note = options.note;
    }

    if (options.expiresIn) {
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + options.expiresIn);
      data.expiresAt = expiresAt.toISOString();
    }

    return JSON.stringify(data);
  }, []);

  /**
   * Generate QR code for receiving payments
   */
  const generateQR = useCallback(async (
    options: GenerateQROptions = {}
  ): Promise<QRCodeData> => {
    try {
      setIsGenerating(true);
      setError(null);

      if (!user) {
        throw new Error('User not authenticated');
      }

      const userName = user.fullName || `${user.firstName} ${user.lastName}`;
      const userId = user._id || user.id;

      // Determine QR type
      const qrType = options.type || 'wallet';
      let qrText: string;

      // Generate QR based on type
      if (qrType === 'upi' && user.upiId) {
        qrText = generateUPIQR(user.upiId, userName, options);
      } else {
        qrText = generateWalletQR(userId, userName, options);
      }

      // Calculate expiry
      let expiresAt: Date | undefined;
      if (options.expiresIn) {
        expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + options.expiresIn);
      }

      const qrCodeData: QRCodeData = {
        qrText,
        qrType,
        userId,
        userName,
        amount: options.amount,
        note: options.note,
        expiresAt,
        createdAt: new Date(),
      };

      setQrData(qrCodeData);
      setIsGenerating(false);

      return qrCodeData;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to generate QR code';
      setError(errorMsg);
      setIsGenerating(false);
      throw err;
    }
  }, [user, generateUPIQR, generateWalletQR]);

  /**
   * Reset QR generator state
   */
  const resetQR = useCallback(() => {
    setQrData(null);
    setError(null);
  }, []);

  return {
    qrData,
    isGenerating,
    error,
    generateQR,
    resetQR,
  };
};

export default useQRGenerator;
