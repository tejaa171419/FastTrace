import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  Camera, 
  QrCode, 
  Flashlight, 
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  Upload,
  X,
  Loader2
} from 'lucide-react';
import { qrScannerAPI } from '@/lib/qrScannerAPI';
import jsQR from 'jsqr';

interface QRScannerModalEmbeddedProps {
  isOpen: boolean;
  onClose: () => void;
  onScanComplete?: (data: any) => void;
  title?: string;
  description?: string;
  allowManualInput?: boolean;
}

interface QRData {
  type: 'upi' | 'merchant' | 'expense_split' | 'person' | 'unknown';
  upiId?: string;
  merchantName?: string;
  merchantId?: string;
  amount?: number;
  note?: string;
  groupId?: string;
  groupName?: string;
  raw?: string;
}

const QRScannerModalEmbedded: React.FC<QRScannerModalEmbeddedProps> = ({
  isOpen,
  onClose,
  onScanComplete,
  title = 'Scan QR Code',
  description = 'Point your camera at a QR code',
  allowManualInput = true
}) => {
  const { toast } = useToast();
  
  // States
  const [isScanning, setIsScanning] = useState(false);
  const [scannedData, setScannedData] = useState<QRData | null>(null);
  const [flashlightOn, setFlashlightOn] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [manualInput, setManualInput] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Camera Management
  const startCamera = async () => {
    try {
      setIsScanning(true);
      setError('');

      const constraints = {
        video: {
          facingMode: cameraFacing,
          width: { ideal: 640 },
          height: { ideal: 480 }
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
    }, 300);
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
    
    // Use jsQR to detect QR codes
    const code = jsQR(imageData.data, imageData.width, imageData.height);
    
    if (code) {
      handleQRDetection({ raw: code.data, type: 'unknown' });
    }
  };

  // Process QR data
  const handleQRDetection = async (qrData: QRData) => {
    stopCamera();
    
    if (!qrData.raw) {
      setError('Invalid QR code detected');
      return;
    }

    try {
      setIsProcessing(true);
      setError('');
      
      // Process QR scan with backend API
      const result = await qrScannerAPI.processQRScan({
        qrData: qrData.raw,
        amount: 0,
        note: ''
      });
      
      // Convert backend result to frontend QRData format
      const processedQRData: QRData = {
        type: result.type,
        upiId: result.upiId,
        merchantName: result.merchantName,
        merchantId: result.merchantId,
        groupId: result.groupId,
        groupName: result.groupName,
        amount: result.amount,
        note: result.note,
        raw: result.raw
      };
      
      setScannedData(processedQRData);
      
      toast({
        title: 'QR Code Scanned',
        description: 'QR code detected successfully!',
      });

      // Call onScanComplete callback
      onScanComplete?.(processedQRData);
      
    } catch (err: any) {
      console.error('QR processing failed:', err);
      setError(err.message || 'Failed to process QR code. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle manual input
  const handleManualInput = async () => {
    if (!manualInput.trim()) {
      setError('Please enter QR code data');
      return;
    }

    await handleQRDetection({ raw: manualInput.trim(), type: 'unknown' });
  };

  // File Upload for QR Images
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const imageData = e.target?.result as string;
      if (!imageData) return;
      
      // Create image element to get dimensions
      const img = new Image();
      img.onload = async () => {
        // Create canvas to process image
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0, img.width, img.height);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        
        if (code) {
          handleQRDetection({ raw: code.data, type: 'unknown' });
        } else {
          setError('No QR code found in the image');
          toast({
            title: 'No QR Code Found',
            description: 'Please upload an image containing a valid QR code.',
            variant: 'destructive'
          });
        }
      };
      img.src = imageData;
    };
    reader.readAsDataURL(file);
  };

  // Cleanup on modal close
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setScannedData(null);
      setError('');
      setManualInput('');
      setShowManualInput(false);
    }
  }, [isOpen]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto glass-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-primary" />
            {title}
          </DialogTitle>
          <p className="text-muted-foreground text-sm">{description}</p>
        </DialogHeader>

        <div className="space-y-4">
          {/* Manual Input Option */}
          {allowManualInput && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowManualInput(!showManualInput)}
                className="text-xs"
              >
                {showManualInput ? 'Hide Manual Input' : 'Manual Input'}
              </Button>
            </div>
          )}

          {/* Manual Input Field */}
          {showManualInput && (
            <div className="space-y-2">
              <Label htmlFor="manual-input">Enter QR Code Data</Label>
              <div className="flex gap-2">
                <Input
                  id="manual-input"
                  placeholder="Paste QR code data here..."
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleManualInput} size="sm" disabled={isProcessing}>
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Scan'}
                </Button>
              </div>
            </div>
          )}

          {/* Camera View */}
          {!showManualInput && (
            <div className="space-y-4">
              <div className="relative bg-card rounded-xl overflow-hidden">
                {error ? (
                  <div className="flex flex-col items-center justify-center h-64 space-y-4">
                    <AlertTriangle className="w-12 h-12 text-destructive" />
                    <p className="text-destructive text-center px-4">{error}</p>
                    <Button onClick={startCamera} size="sm">
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
                  <Button onClick={startCamera} className="w-full">
                    <Camera className="w-4 h-4 mr-2" />
                    Start Camera
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
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
          )}

          {/* Scanned Data Display */}
          {scannedData && (
            <div className="bg-accent/10 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="font-medium">QR Code Detected</span>
              </div>
              <Badge className="text-xs">
                {scannedData.type.toUpperCase()}
              </Badge>
              {scannedData.merchantName && (
                <p className="text-sm mt-1">Merchant: {scannedData.merchantName}</p>
              )}
              {scannedData.upiId && (
                <p className="text-sm mt-1">UPI ID: {scannedData.upiId}</p>
              )}
              {scannedData.groupName && (
                <p className="text-sm mt-1">Group: {scannedData.groupName}</p>
              )}
              {scannedData.amount && (
                <p className="text-sm mt-1">Amount: ₹{scannedData.amount}</p>
              )}
            </div>
          )}

          {/* Error Display */}
          {error && (
            <Alert className="border-destructive/50 bg-destructive/10">
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription className="text-destructive">{error}</AlertDescription>
            </Alert>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex gap-2 pt-4">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Close
          </Button>
          {scannedData && (
            <Button 
              onClick={() => {
                onScanComplete?.(scannedData);
                onClose();
              }} 
              className="flex-1"
            >
              Use QR Data
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QRScannerModalEmbedded;