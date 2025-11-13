import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { walletAPI } from '@/lib/walletAPI';
import type { WalletData, WalletError } from '@/types/wallet';
import { 
  Camera, 
  QrCode, 
  Flashlight, 
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  Smartphone,
  CreditCard,
  Upload,
  Image as ImageIcon,
  Loader2,
  Eye,
  EyeOff,
  ArrowLeft
} from 'lucide-react';

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

const ScanQRPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  
  // States
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
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
  const [authError, setAuthError] = useState(false);

  // Refs
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Load wallet data
  useEffect(() => {
    const loadWalletData = async () => {
      if (!isAuthenticated || !user) {
        setAuthError(true);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setAuthError(false);
        
        const walletData = await walletAPI.getWalletDetails();
        setWallet(walletData);
      } catch (err: any) {
        console.error('Failed to load wallet data:', err);
        setAuthError(true);
        setError('Failed to load wallet data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadWalletData();

    return () => {
      stopCamera();
    };
  }, [isAuthenticated, user]);

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
    
    toast({
      title: 'QR Code Scanned',
      description: 'Payment details detected successfully!',
    });
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

    if (!wallet) {
      setError('Wallet data not loaded');
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
      
      toast({
        title: 'Payment Successful',
        description: `₹${paymentAmount} sent successfully!`,
      });
      
      // Navigate back to wallet after delay
      setTimeout(() => {
        navigate('/wallet');
      }, 2000);

    } catch (err: any) {
      console.error('Payment processing failed:', err);
      setError(err.message || 'Payment failed. Please try again.');
      setStep('failed');
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
          icon: QrCode,
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

  // Auth Error State
  if (authError || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center max-w-md text-white">
          <AlertTriangle className="w-16 h-16 mx-auto mb-6 text-red-400" />
          <h2 className="text-3xl font-bold mb-4">Authentication Required</h2>
          <p className="text-gray-300 mb-6 leading-relaxed">
            Please log in to access the QR scanner and make payments.
          </p>
          <Button 
            onClick={() => navigate('/login')}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 rounded-xl px-8 py-3"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center text-white">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-lg">Loading wallet data...</p>
        </div>
      </div>
    );
  }

  // Main Render
  return (
    <div className="min-h-screen bg-gradient-background p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pt-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/wallet')}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-xl font-bold text-foreground">Scan QR Code</h1>
          <div className="w-10"></div> {/* Spacer for alignment */}
        </div>

        {/* Scan Step */}
        {step === 'scan' && (
          <div className="space-y-6">
            <Card className="glass-card border border-white/20 rounded-2xl overflow-hidden">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <h2 className="text-lg font-semibold text-foreground mb-2">Point Camera at QR Code</h2>
                  <p className="text-muted-foreground text-sm">
                    Align the QR code within the frame to scan
                  </p>
                </div>

                {/* Camera View */}
                <div className="relative bg-card rounded-xl overflow-hidden mb-6">
                  {error ? (
                    <div className="flex flex-col items-center justify-center h-64 space-y-4">
                      <AlertTriangle className="w-12 h-12 text-destructive" />
                      <p className="text-destructive text-center px-4">{error}</p>
                      <Button onClick={startCamera} className="rounded-xl">
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
                          className={`rounded-full ${flashlightOn ? 'bg-yellow-500/20 text-yellow-400' : ''}`}
                        >
                          <Flashlight className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={switchCamera}
                          className="rounded-full"
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
                    <Button onClick={startCamera} className="rounded-xl w-full">
                      <Camera className="w-4 h-4 mr-2" />
                      Start Camera
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-border hover:bg-accent/50 rounded-xl"
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
              </CardContent>
            </Card>
          </div>
        )}

        {/* Payment Step */}
        {step === 'payment' && scannedData && (
          <div className="space-y-6">
            <Card className="glass-card border border-white/20 rounded-2xl">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <h2 className="text-lg font-semibold text-foreground mb-2">Confirm Payment</h2>
                  <p className="text-muted-foreground text-sm">
                    Review payment details and enter your PIN
                  </p>
                </div>

                {/* Payment Details */}
                <Card className="bg-card/80 border border-white/20 mb-6">
                  <CardContent className="p-4">
                    {(() => {
                      const typeInfo = getQRTypeInfo(scannedData);
                      const TypeIcon = typeInfo.icon;
                      
                      return (
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-xl ${typeInfo.color}`}>
                            <TypeIcon className="w-6 h-6" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-foreground font-semibold">
                              {scannedData.merchantName || scannedData.upiId || 'Payment Recipient'}
                            </h3>
                            <Badge className="bg-accent/20 text-accent-foreground text-xs mt-1">
                              {typeInfo.label}
                            </Badge>
                            {scannedData.upiId && (
                              <p className="text-muted-foreground text-xs mt-1">
                                UPI ID: {scannedData.upiId}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>

                {/* Payment Form */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="amount" className="text-foreground font-medium text-sm">
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
                        className="pl-8 bg-input border-border text-foreground rounded-xl"
                        min="1"
                        max={wallet?.limits?.perTransaction || 50000}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="note" className="text-foreground font-medium text-sm">
                      Note <span className="text-muted-foreground">(Optional)</span>
                    </Label>
                    <Input
                      id="note"
                      placeholder="Payment note"
                      value={paymentNote}
                      onChange={(e) => setPaymentNote(e.target.value)}
                      className="mt-2 bg-input border-border text-foreground rounded-xl"
                    />
                  </div>

                  <div>
                    <Label htmlFor="pin" className="text-foreground font-medium text-sm">
                      Transaction PIN
                    </Label>
                    <div className="mt-2 relative">
                      <Input
                        id="pin"
                        type={showPin ? 'text' : 'password'}
                        placeholder="Enter your 4-digit PIN"
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        className="bg-input border-border text-foreground rounded-xl"
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
                  <Alert className="border-destructive/50 bg-destructive/10 rounded-xl mt-4">
                    <AlertTriangle className="w-4 h-4" />
                    <AlertDescription className="text-destructive">{error}</AlertDescription>
                  </Alert>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-6">
                  <Button
                    variant="outline"
                    onClick={() => setStep('scan')}
                    className="flex-1 border-border hover:bg-accent/50 rounded-xl"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={processPayment}
                    disabled={!paymentAmount || !pin || isProcessing}
                    className="flex-1 rounded-xl"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <QrCode className="w-4 h-4 mr-2" />
                    )}
                    Pay ₹{paymentAmount || '0'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Processing Step */}
        {step === 'processing' && (
          <div className="flex items-center justify-center min-h-[70vh]">
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center animate-pulse-glow">
                  <Loader2 className="w-8 h-8 text-primary-foreground animate-spin" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Processing Payment</h3>
                <p className="text-muted-foreground">
                  Please wait while we process your payment...
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Success Step */}
        {step === 'success' && (
          <div className="flex items-center justify-center min-h-[70vh]">
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
          </div>
        )}

        {/* Failed Step */}
        {step === 'failed' && (
          <div className="flex items-center justify-center min-h-[70vh]">
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8 text-destructive" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Payment Failed</h3>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button 
                  onClick={() => setStep('payment')}
                  className="rounded-xl"
                >
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScanQRPage;