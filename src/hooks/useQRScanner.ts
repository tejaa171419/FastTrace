import { useState, useCallback, useRef, useEffect } from 'react';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';
import { useToast } from '@/hooks/use-toast';

export interface QRScanResult {
  decodedText: string;
  decodedResult: any;
}

export interface QRPaymentData {
  upiId?: string;
  amount?: number;
  name?: string;
  merchantCode?: string;
  transactionNote?: string;
  type?: 'upi' | 'merchant' | 'wallet' | 'payment_link';
}

interface UseQRScannerReturn {
  isScanning: boolean;
  scanResult: QRScanResult | null;
  paymentData: QRPaymentData | null;
  error: string | null;
  startScanning: (elementId: string) => Promise<void>;
  stopScanning: () => Promise<void>;
  resetScanner: () => void;
  parseQRData: (qrText: string) => QRPaymentData | null;
}

/**
 * Custom hook for QR code scanning with payment data parsing
 */
export const useQRScanner = (): UseQRScannerReturn => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<QRScanResult | null>(null);
  const [paymentData, setPaymentData] = useState<QRPaymentData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const { toast } = useToast();

  /**
   * Parse UPI QR code format
   * Format: upi://pay?pa=merchant@bank&pn=MerchantName&am=100&cu=INR&tn=Note
   */
  const parseUPIQR = (upiString: string): QRPaymentData | null => {
    try {
      const url = new URL(upiString);
      
      if (!url.protocol.includes('upi')) {
        return null;
      }

      const params = new URLSearchParams(url.search);
      
      return {
        type: 'upi',
        upiId: params.get('pa') || undefined,
        name: params.get('pn') || undefined,
        amount: params.get('am') ? parseFloat(params.get('am')!) : undefined,
        merchantCode: params.get('mc') || undefined,
        transactionNote: params.get('tn') || undefined,
      };
    } catch (error) {
      return null;
    }
  };

  /**
   * Parse custom wallet QR format (JSON)
   * Format: {"type":"wallet","userId":"123","amount":100}
   */
  const parseWalletQR = (qrText: string): QRPaymentData | null => {
    try {
      const data = JSON.parse(qrText);
      
      if (data.type === 'wallet' || data.type === 'payment_link') {
        return {
          type: data.type,
          upiId: data.upiId,
          amount: data.amount,
          name: data.name || data.merchantName,
          merchantCode: data.userId || data.merchantId,
          transactionNote: data.note || data.description,
        };
      }
      
      return null;
    } catch (error) {
      return null;
    }
  };

  /**
   * Parse QR code data - supports UPI and custom wallet formats
   */
  const parseQRData = useCallback((qrText: string): QRPaymentData | null => {
    // Try UPI format first
    if (qrText.startsWith('upi://')) {
      return parseUPIQR(qrText);
    }
    
    // Try JSON format
    if (qrText.startsWith('{')) {
      return parseWalletQR(qrText);
    }
    
    // Try as plain UPI ID
    if (qrText.includes('@') && !qrText.includes(' ')) {
      return {
        type: 'upi',
        upiId: qrText,
      };
    }
    
    return null;
  }, []);

  /**
   * Handle successful QR scan
   */
  const onScanSuccess = useCallback((decodedText: string, decodedResult: any) => {
    console.log('QR Scanned:', decodedText);
    
    setScanResult({ decodedText, decodedResult });
    
    // Parse payment data
    const parsed = parseQRData(decodedText);
    setPaymentData(parsed);
    
    if (parsed) {
      toast({
        title: 'QR Code Detected',
        description: `Found ${parsed.type?.toUpperCase()} payment code`,
      });
    } else {
      toast({
        title: 'QR Code Scanned',
        description: 'Processing payment information...',
      });
    }
    
    // Auto-stop scanning after successful scan
    stopScanning();
  }, [parseQRData, toast]);

  /**
   * Handle scan errors
   */
  const onScanError = useCallback((errorMessage: string) => {
    // Ignore common scanning errors (these happen continuously)
    if (errorMessage.includes('NotFoundException') || 
        errorMessage.includes('No MultiFormat Readers')) {
      return;
    }
    
    console.warn('QR Scan Error:', errorMessage);
  }, []);

  /**
   * Start QR code scanning
   */
  const startScanning = useCallback(async (elementId: string): Promise<void> => {
    try {
      setError(null);
      setIsScanning(true);

      // Initialize scanner if not already initialized
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(elementId);
      }

      // Request camera permission and start scanning
      const config = {
        fps: 10, // Frames per second
        qrbox: { width: 250, height: 250 }, // Scanning box size
        aspectRatio: 1.0,
        formatsToSupport: [0, 1, 2, 3], // Support multiple QR formats
      };

      await scannerRef.current.start(
        { facingMode: 'environment' }, // Use back camera
        config,
        onScanSuccess,
        onScanError
      );

    } catch (err: any) {
      const errorMsg = err.message || 'Failed to start camera';
      setError(errorMsg);
      setIsScanning(false);
      
      toast({
        title: 'Camera Error',
        description: errorMsg,
        variant: 'destructive',
      });
      
      throw err;
    }
  }, [onScanSuccess, onScanError, toast]);

  /**
   * Stop QR code scanning
   */
  const stopScanning = useCallback(async (): Promise<void> => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        setIsScanning(false);
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
  }, [isScanning]);

  /**
   * Reset scanner state
   */
  const resetScanner = useCallback(() => {
    setScanResult(null);
    setPaymentData(null);
    setError(null);
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error);
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, []);

  return {
    isScanning,
    scanResult,
    paymentData,
    error,
    startScanning,
    stopScanning,
    resetScanner,
    parseQRData,
  };
};

export default useQRScanner;
