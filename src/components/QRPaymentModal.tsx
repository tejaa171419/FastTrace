import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Camera, 
  X, 
  Send, 
  QrCode, 
  Flashlight, 
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Smartphone,
  CreditCard,
  Zap,
  Copy,
  Share
} from 'lucide-react';
import { toast } from 'sonner';

interface QRPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaymentComplete?: (data: any) => void;
}

const QRPaymentModal = ({ open, onOpenChange, onPaymentComplete }: QRPaymentModalProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedData, setScannedData] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [flashlightOn, setFlashlightOn] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [isProcessing, setIsProcessing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Mock QR data for demo
  const mockQRData = {
    type: 'upi',
    merchantName: 'Coffee House',
    upiId: 'coffeehouse@paytm',
    amount: '250.00',
    description: 'Coffee and snacks',
    merchantCode: 'MERCHANT123',
    verified: true
  };

  const startScanning = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: cameraFacing,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsScanning(true);
        
        // Simulate QR detection after 3 seconds for demo
        setTimeout(() => {
          if (isScanning) {
            setScannedData(mockQRData);
            setPaymentAmount(mockQRData.amount);
            stopScanning();
          }
        }, 3000);
      }
    } catch (error) {
      toast.error('Camera access denied. Please allow camera access to scan QR codes.');
      console.error('Error accessing camera:', error);
    }
  };

  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setIsScanning(false);
  };

  const toggleFlashlight = async () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack && 'torch' in videoTrack.getCapabilities()) {
        try {
          await videoTrack.applyConstraints({
            advanced: [{ torch: !flashlightOn }] as any
          });
          setFlashlightOn(!flashlightOn);
        } catch (error) {
          toast.error('Flashlight not supported on this device');
        }
      }
    }
  };

  const switchCamera = () => {
    setCameraFacing(cameraFacing === 'environment' ? 'user' : 'environment');
    if (isScanning) {
      stopScanning();
      setTimeout(startScanning, 100);
    }
  };

  const handlePayment = async () => {
    if (!paymentAmount || !scannedData) {
      toast.error('Please enter payment amount');
      return;
    }

    setIsProcessing(true);
    
    // Simulate payment processing
    setTimeout(() => {
      const paymentData = {
        amount: parseFloat(paymentAmount),
        recipient: scannedData.merchantName,
        upiId: scannedData.upiId,
        note: paymentNote,
        method: 'QR Code',
        timestamp: new Date().toISOString()
      };

      onPaymentComplete?.(paymentData);
      toast.success(`₹${paymentAmount} payment initiated successfully!`);
      
      // Reset form
      setPaymentAmount('');
      setPaymentNote('');
      setScannedData(null);
      setIsProcessing(false);
      onOpenChange(false);
    }, 2000);
  };

  const resetScanner = () => {
    setScannedData(null);
    setPaymentAmount('');
    setPaymentNote('');
    stopScanning();
  };

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-black/95 backdrop-blur-xl border border-white/20">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <QrCode className="w-5 h-5 text-blue-400" />
            QR Code Payment
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {!scannedData ? (
            // QR Scanner View
            <div className="space-y-4">
              {isScanning ? (
                <div className="relative rounded-lg overflow-hidden">
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    className="w-full h-80 object-cover bg-black rounded-lg"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  
                  {/* Scanner Overlay */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-4 border-2 border-blue-500 rounded-lg">
                      <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-400 rounded-tl-lg"></div>
                      <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-400 rounded-tr-lg"></div>
                      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-400 rounded-bl-lg"></div>
                      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-400 rounded-br-lg"></div>
                    </div>
                    
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center bg-black/60 rounded-lg p-4">
                        <p className="text-white text-sm">Position QR code within the frame</p>
                        <div className="flex items-center justify-center gap-2 mt-2">
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                          <span className="text-white/70 text-xs">Scanning...</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Camera Controls */}
                  <div className="absolute bottom-4 left-4 right-4 flex justify-between">
                    <Button
                      onClick={toggleFlashlight}
                      size="sm"
                      variant="secondary"
                      className="bg-black/60 hover:bg-black/80 text-white border-white/20"
                    >
                      <Flashlight className={`w-4 h-4 ${flashlightOn ? 'text-yellow-400' : ''}`} />
                    </Button>
                    
                    <Button
                      onClick={switchCamera}
                      size="sm"
                      variant="secondary"
                      className="bg-black/60 hover:bg-black/80 text-white border-white/20"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      onClick={stopScanning}
                      size="sm"
                      variant="destructive"
                      className="bg-red-500/60 hover:bg-red-500/80 text-white"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="h-80 bg-white/5 rounded-lg flex items-center justify-center border-2 border-dashed border-white/20">
                  <div className="text-center">
                    <QrCode className="h-16 w-16 mx-auto mb-4 text-white/40" />
                    <p className="text-white/80 mb-4">Ready to scan QR code</p>
                    <Button 
                      onClick={startScanning} 
                      className="bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Start Scanning
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Payment Details View
            <div className="space-y-6">
              {/* Merchant Info */}
              <Card className="bg-white/5 border-white/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <Smartphone className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-white">{scannedData.merchantName}</h3>
                        {scannedData.verified && (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                      <p className="text-white/60 text-sm">{scannedData.upiId}</p>
                      <p className="text-white/50 text-xs">Merchant ID: {scannedData.merchantCode}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Form */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-white font-medium">Payment Amount</Label>
                  <Input 
                    type="number" 
                    placeholder="Enter amount" 
                    value={paymentAmount} 
                    onChange={e => setPaymentAmount(e.target.value)}
                    className="bg-white/10 border-white/30 text-white text-lg font-semibold placeholder:text-white/50"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-white font-medium">Payment Note (Optional)</Label>
                  <Input 
                    placeholder="Add a note for this payment" 
                    value={paymentNote} 
                    onChange={e => setPaymentNote(e.target.value)}
                    className="bg-white/10 border-white/30 text-white placeholder:text-white/50"
                  />
                </div>

                {/* Payment Summary */}
                <Card className="bg-white/5 border-white/20">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/70">Payment Method:</span>
                      <div className="flex items-center gap-1 text-purple-400">
                        <Zap className="w-4 h-4" />
                        <span>UPI Payment</span>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/70">Transaction Fee:</span>
                      <span className="text-green-400">Free</span>
                    </div>
                    <Separator className="bg-white/20" />
                    <div className="flex justify-between font-semibold">
                      <span className="text-white">Total Amount:</span>
                      <span className="text-white text-lg">₹{paymentAmount || '0.00'}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button 
                    onClick={resetScanner} 
                    variant="outline" 
                    className="flex-1 border-white/30 text-white hover:bg-white/10"
                  >
                    <QrCode className="w-4 h-4 mr-2" />
                    Scan Again
                  </Button>
                  <Button 
                    onClick={handlePayment} 
                    disabled={!paymentAmount || isProcessing}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                  >
                    {isProcessing ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Processing...
                      </div>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Pay ₹{paymentAmount || '0'}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QRPaymentModal;