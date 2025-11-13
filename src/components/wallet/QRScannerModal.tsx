import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { walletAPI } from '@/lib/walletAPI';
import type { WalletData, WalletError } from '@/types/wallet';
import { 
  Camera, 
  X, 
  Send, 
  QrCode, 
  Flashlight, 
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  Smartphone,
  CreditCard,
  Zap,
  Copy,
  Share,
  Upload,
  Image as ImageIcon,
  Loader2,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from 'sonner';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallet?: WalletData;
  onSuccess?: () => void;
  onError?: (error: WalletError) => void;
}

interface QRData {
  type: 'upi' | 'merchant' | 'person' | 'unknown';
  upiId?: string;
  merchantName?: string;
  merchantId?: string;
  amount?: number;
  note?: string;
  transactionId?: string;
  raw: string;
}

const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  wallet: walletProp,
  onSuccess = () => {},
  onError = () => {}
}) => {
  // Default wallet object for when no wallet is provided
  const defaultWallet = {
    id: '',
    balance: 0,
    formattedBalance: '₹0.00',
    currency: 'INR',
    status: 'active' as const,
    limits: {
      daily: { limit: 0, used: 0, remaining: 0 },
      monthly: { limit: 0, used: 0, remaining: 0 },
      perTransaction: 0
    },
    security: {
      pinSet: false,
      biometricEnabled: false,
      twoFactorEnabled: false
    },
    kyc: {
      status: 'not_started' as const,
      verificationLevel: 'basic' as const
    },
    rewards: {
      totalCashback: 0,
      pendingCashback: 0,
      loyaltyPoints: 0,
      tier: 'basic' as const
    },
    recentTransactions: [],
    statistics: {
      totalCredits: 0,
      totalDebits: 0,
      transactionCount: 0
    },
    createdAt: new Date().toISOString(),
    lastActivity: new Date().toISOString()
  };

  // Use provided wallet or default
  const wallet = walletProp || defaultWallet;
  // States
  const [step, setStep] = useState<'scan' | 'payment' | 'processing' | 'success' | 'failed'>('scan');
  const [isScanning, setIsScanning] = useState(false);
  const [scannedData, setScannedData] = useState<QRData | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [flashlightOn, setFlashlightOn] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset states when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep('scan');
      setScannedData(null);
      setPaymentAmount('');
      setPaymentNote('');
      setPin('');
      setError('');
      setIsProcessing(false);
    } else {
      stopCamera();
    }
  }, [isOpen]);

  // Camera Management
  const startCamera = async () => {
    try {
      setIsScanning(true);
      setError('');

      const constraints = {
        video: {
          facingMode: cameraFacing,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        
        // Start QR scanning
        startQRDetection();
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setError(err.name === 'NotAllowedError' 
        ? 'Camera permission denied. Please allow camera access to scan QR codes.' 
        : 'Failed to access camera. Please check your camera permissions.'
      );
      setIsScanning(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsScanning(false);
    setFlashlightOn(false);
  };

  const toggleFlashlight = async () => {
    if (streamRef.current) {
      const track = streamRef.current.getVideoTracks()[0];
      if (track && 'torch' in track.getCapabilities()) {
        try {
          await track.applyConstraints({
            advanced: [{ torch: !flashlightOn } as any]
          });
          setFlashlightOn(!flashlightOn);
        } catch (err) {
          console.error('Flashlight toggle failed:', err);
        }
      }
    }
  };

  const switchCamera = async () => {
    stopCamera();
    setCameraFacing(cameraFacing === 'environment' ? 'user' : 'environment');
    setTimeout(() => startCamera(), 100);
  };

  // QR Code Detection
  const startQRDetection = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      detectQRCode();
    }, 500);
  };

  const detectQRCode = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx || video.readyState !== 4) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // Simple QR detection simulation (in production, use a library like jsQR)
    // For demo purposes, we'll simulate QR detection
    if (Math.random() > 0.98) { // Simulate rare detection
      simulateQRDetection();
    }
  };

  // Simulated QR detection (replace with actual QR library)
  const simulateQRDetection = () => {
    const mockQRData: QRData = {
      type: 'upi',
      upiId: 'merchant@paytm',
      merchantName: 'Coffee Shop',
      amount: 150,
      note: 'Coffee order #123',
      raw: 'upi://pay?pa=merchant@paytm&pn=Coffee Shop&am=150&tn=Coffee order #123'
    };

    handleQRDetection(mockQRData);
  };

  const handleQRDetection = (qrData: QRData) => {
    stopCamera();
    setScannedData(qrData);
    setPaymentAmount(qrData.amount?.toString() || '');
    setPaymentNote(qrData.note || '');
    setStep('payment');
    
    toast.success('QR Code scanned successfully!');
  };

  // File Upload for QR Images
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target?.result as string;
      // Process uploaded QR image (would use QR detection library)
      // For demo, simulate detection
      setTimeout(() => {
        simulateQRDetection();
      }, 1000);
    };
    reader.readAsDataURL(file);
  };

  // Payment Processing
  const processPayment = async () => {
    if (!scannedData || !paymentAmount || !pin) {
      setError('Please fill all required fields');
      return;
    }

    try {
      setIsProcessing(true);
      setError('');
      setStep('processing');

      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      const paymentData = {
        type: 'qr_payment',
        recipient: scannedData.upiId || scannedData.merchantId,
        amount: parseFloat(paymentAmount),
        note: paymentNote,
        pin: pin,
        qrData: scannedData.raw
      };

      // In production, call actual payment API
      // const result = await walletAPI.processQRPayment(paymentData);

      setStep('success');
      onSuccess();
      
      toast.success(`Payment of ₹${paymentAmount} sent successfully!`);
      
      // Close modal after delay
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (err: any) {
      console.error('Payment processing failed:', err);
      setError(err.message || 'Payment failed. Please try again.');
      setStep('failed');
      onError(err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Parse QR data type
  const getQRTypeInfo = (data: QRData) => {
    switch (data.type) {
      case 'upi':
        return {
          icon: Smartphone,
          label: 'UPI Payment',
          color: 'text-blue-400 bg-blue-500/20'
        };
      case 'merchant':
        return {
          icon: CreditCard,
          label: 'Merchant Payment',
          color: 'text-green-400 bg-green-500/20'
        };
      case 'person':
        return {
          icon: Send,
          label: 'Person Payment',
          color: 'text-purple-400 bg-purple-500/20'
        };
      default:
        return {
          icon: QrCode,
          label: 'QR Payment',
          color: 'text-gray-400 bg-gray-500/20'
        };
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (step) {
      case 'scan':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-foreground mb-2">Scan QR Code</h3>
              <p className="text-muted-foreground">Point your camera at a QR code to make a payment</p>
            </div>

            {/* Camera View */}
            <div className="relative bg-card rounded-2xl overflow-hidden">
              {error ? (
                <div className="flex flex-col items-center justify-center h-64 space-y-4">
                  <AlertTriangle className="w-12 h-12 text-destructive" />
                  <p className="text-destructive text-center px-4">{error}</p>
                  <Button onClick={startCamera} className="wallet-card-clickable">
                    <Camera className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <video
                    ref={videoRef}
                    className="w-full h-64 object-cover"
                    playsInline
                    muted
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  
                  {/* Scanning Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-48 h-48 border-2 border-primary rounded-xl relative">
                      <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-lg"></div>
                      <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-lg"></div>
                      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-lg"></div>
                      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-lg"></div>
                      
                      {isScanning && (
                        <div className="absolute inset-x-0 top-1/2 h-0.5 bg-primary opacity-75 animate-pulse"></div>
                      )}
                    </div>
                  </div>
                  
                  {/* Camera Controls */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={toggleFlashlight}
                      className={`wallet-card-clickable ${flashlightOn ? 'bg-yellow-500/20 text-yellow-400' : ''}`}
                    >
                      <Flashlight className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={switchCamera}
                      className="wallet-card-clickable"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col space-y-3">
              {!isScanning && !error && (
                <Button onClick={startCamera} className="wallet-card-clickable w-full">
                  <Camera className="w-4 h-4 mr-2" />
                  Start Camera
                </Button>
              )}
              
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-border hover:bg-accent/50 wallet-card-clickable"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload QR Image
              </Button>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>
        );

      case 'payment':
        if (!scannedData) return null;
        
        const typeInfo = getQRTypeInfo(scannedData);
        const TypeIcon = typeInfo.icon;

        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-foreground mb-2">Confirm Payment</h3>
              <p className="text-muted-foreground">Review payment details and enter your PIN</p>
            </div>

            {/* Payment Details */}
            <Card className="glass-card border border-white/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className={`p-3 rounded-xl ${typeInfo.color}`}>
                    <TypeIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-foreground font-semibold">
                      {scannedData.merchantName || scannedData.upiId || 'Payment Recipient'}
                    </h4>
                    <Badge className="bg-accent/20 text-accent-foreground text-xs">
                      {typeInfo.label}
                    </Badge>
                  </div>
                </div>
                
                {scannedData.upiId && (
                  <div className="text-sm text-muted-foreground mb-4">
                    UPI ID: {scannedData.upiId}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Form */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="amount" className="text-foreground font-medium">
                  Amount
                </Label>
                <div className="mt-2 relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">₹</span>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Enter amount"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="pl-8 bg-input border-border text-foreground"
                    min="1"
                    max="50000"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="note" className="text-foreground font-medium">
                  Note <span className="text-muted-foreground">(Optional)</span>
                </Label>
                <Input
                  id="note"
                  placeholder="Payment note"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  className="mt-2 bg-input border-border text-foreground"
                />
              </div>

              <div>
                <Label htmlFor="pin" className="text-foreground font-medium">
                  Transaction PIN
                </Label>
                <div className="mt-2 relative">
                  <Input
                    id="pin"
                    type={showPin ? 'text' : 'password'}
                    placeholder="Enter your 4-digit PIN"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="bg-input border-border text-foreground"
                    maxLength={4}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPin ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </div>

            {error && (
              <Alert className="border-destructive/50 bg-destructive/10">
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription className="text-destructive">{error}</AlertDescription>
              </Alert>
            )}
          </div>
        );

      case 'processing':
        return (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center animate-pulse-glow">
                <Loader2 className="w-8 h-8 text-primary-foreground animate-spin" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Processing Payment</h3>
              <p className="text-muted-foreground">Please wait while we process your payment...</p>
            </div>
          </div>
        );

      case 'success':
        return (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-gradient-success flex items-center justify-center animate-bounce-in">
                <CheckCircle className="w-8 h-8 text-success-foreground" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Payment Successful!</h3>
              <p className="text-muted-foreground">
                ₹{paymentAmount} has been sent successfully
              </p>
            </div>
          </div>
        );

      case 'failed':
        return (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Payment Failed</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => setStep('payment')} className="wallet-card-clickable">
                Try Again
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-card-premium border border-white/20 shadow-large max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-foreground">
            <div className="p-2 rounded-lg bg-gradient-primary">
              <QrCode className="w-5 h-5 text-primary-foreground" />
            </div>
            QR Payment
          </DialogTitle>
        </DialogHeader>

        {renderStepContent()}

        {step === 'payment' && (
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setStep('scan')}
              className="flex-1 border-border hover:bg-accent/50 wallet-card-clickable"
            >
              Back
            </Button>
            <Button
              onClick={processPayment}
              disabled={!paymentAmount || !pin || isProcessing}
              className="wallet-card-clickable flex-1"
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Pay ₹{paymentAmount}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default QRScannerModal;