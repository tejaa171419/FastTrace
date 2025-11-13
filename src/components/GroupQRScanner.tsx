import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Eye,
  EyeOff,
  ArrowLeft,
  Users,
  User,
  Loader2,
  CreditCard,
  Wallet,
  Receipt,
  X
} from 'lucide-react';
import { qrScannerAPI } from '@/lib/qrScannerAPI';
import { apiClient } from '@/lib/api';
import jsQR from 'jsqr';

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

interface GroupMember {
  id: string;
  name: string;
  avatar?: string;
}

interface GroupQRScannerProps {
  groupId: string;
  groupName: string;
  groupMembers: GroupMember[];
  onClose: () => void;
}

const GroupQRScanner: React.FC<GroupQRScannerProps> = ({ groupId, groupName, groupMembers, onClose }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // States
  const [isScanning, setIsScanning] = useState(false);
  const [scannedData, setScannedData] = useState<QRData | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [flashlightOn, setFlashlightOn] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [showMemberSelection, setShowMemberSelection] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
  const [orderId, setOrderId] = useState<string | null>(null);
  const [razorpayKeyId, setRazorpayKeyId] = useState<string | null>(null);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pre-select all members by default for group payments
  useEffect(() => {
    const allMemberIds = groupMembers.map(member => member.id);
    setSelectedMembers(allMemberIds);
  }, [groupMembers]);

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
    
    // Use jsQR to detect QR codes
    const code = jsQR(imageData.data, imageData.width, imageData.height);
    
    if (code) {
      handleQRDetection({ raw: code.data, type: 'unknown' });
    }
  };

  // Process QR data with backend API
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
        amount: parseFloat(paymentAmount) || 0,
        note: paymentNote
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
      setPaymentAmount(result.amount?.toString() || '');
      setPaymentNote(result.note || '');
      
      // If it's a UPI or merchant payment, store order details for payment processing
      if ((result.type === 'upi' || result.type === 'merchant') && result.orderId) {
        setOrderId(result.orderId);
        setRazorpayKeyId(result.razorpayKeyId || null);
      }
      
      toast({
        title: 'QR Code Scanned',
        description: 'Payment details detected successfully!',
      });
    } catch (err: any) {
      console.error('QR processing failed:', err);
      setError(err.message || 'Failed to process QR code. Please try again.');
    } finally {
      setIsProcessing(false);
    }
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

  // Member Selection
  const toggleMemberSelection = (memberId: string) => {
    setSelectedMembers(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId) 
        : [...prev, memberId]
    );
  };

  const selectAllMembers = () => {
    const allMemberIds = groupMembers.map(member => member.id);
    setSelectedMembers(allMemberIds);
  };

  const deselectAllMembers = () => {
    setSelectedMembers([]);
  };

  // Payment Processing
  const processPayment = async () => {
    if (!scannedData || !paymentAmount) {
      setError('Please enter payment amount');
      return;
    }

    // For group payments, ensure members are selected
    if (selectedMembers.length === 0) {
      setError('Please select at least one member to split the expense with');
      return;
    }

    try {
      setIsProcessing(true);
      setError('');
      setPaymentStatus('processing');
      
      // Process group expense split through backend API
      const result = await qrScannerAPI.processGroupExpenseSplit({
        groupId: groupId,
        amount: parseFloat(paymentAmount),
        note: paymentNote,
        selectedMembers: selectedMembers,
        splitMethod: 'equal'
      });
      
      console.log('Group expense split processed:', result);
      
      // Calculate split amount per person
      const splitAmount = parseFloat(paymentAmount) / selectedMembers.length;
      toast({
        title: 'Group Expense Split',
        description: `₹${splitAmount.toFixed(2)} per person for ${selectedMembers.length} members`,
      });
      
      setPaymentStatus('success');
      
      toast({
        title: 'Payment Successful',
        description: `₹${paymentAmount} sent successfully!`,
      });
      
    } catch (err: any) {
      console.error('Payment processing failed:', err);
      setError(err.message || 'Payment failed. Please try again.');
      setPaymentStatus('failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // Parse QR data type
  const getQRTypeInfo = (data: QRData) => {
    switch (data.type) {
      case 'upi':
        return {
          icon: QrCode,
          label: 'UPI Payment',
          color: 'text-blue-400 bg-blue-500/20'
        };
      case 'merchant':
        return {
          icon: QrCode,
          label: 'Merchant Payment',
          color: 'text-green-400 bg-green-500/20'
        };
      case 'expense_split':
        return {
          icon: Users,
          label: 'Group Expense Split',
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            className="text-white hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-xl font-bold text-white">Group Payment</h1>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            className="text-white hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* QR Scan Screen */}
        {!scannedData && (
          <Card className="glass-card border border-white/20 rounded-2xl overflow-hidden">
            <CardHeader className="text-center">
              <CardTitle className="flex flex-col items-center gap-2">
                <QrCode className="w-8 h-8 text-primary" />
                Point Camera at QR Code
              </CardTitle>
              <p className="text-muted-foreground text-sm">
                Scan a QR code to make a payment to this group
              </p>
            </CardHeader>
            <CardContent>
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
        )}

        {/* Payment Form Screen */}
        {scannedData && paymentStatus === 'idle' && (
          <Card className="glass-card border border-white/20 rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-primary" />
                Confirm Payment
              </CardTitle>
              <p className="text-muted-foreground text-sm">
                Review payment details and enter amount
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Payment Details */}
              <Card className="bg-card/80 border border-white/20">
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

              {/* Amount Input with Big Font */}
              <div>
                <Label htmlFor="amount" className="text-foreground font-medium text-sm">
                  Amount
                </Label>
                <div className="mt-2 relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground text-2xl">₹</span>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="pl-10 pr-4 py-6 text-3xl font-bold bg-input border-border text-foreground rounded-xl text-right"
                    min="1"
                  />
                </div>
              </div>

              {/* Selected Group Display */}
              <div className="bg-accent/10 rounded-lg p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {groupName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selectedMembers.length} of {groupMembers.length} members selected
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowMemberSelection(true)}
                    className="h-8 text-xs"
                  >
                    Edit Members
                  </Button>
                </div>
              </div>

              {error && (
                <Alert className="border-destructive/50 bg-destructive/10 rounded-xl">
                  <AlertTriangle className="w-4 h-4" />
                  <AlertDescription className="text-destructive">{error}</AlertDescription>
                </Alert>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 border-border hover:bg-accent/50 rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => setShowMemberSelection(true)}
                  disabled={!paymentAmount}
                  className="flex-1 rounded-xl"
                >
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Member Selection Screen (Overlay) */}
        {showMemberSelection && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    Select Members to Split
                  </span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowMemberSelection(false)}
                  >
                    ✕
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Select All/Deselect All */}
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={selectAllMembers}
                    className="flex-1"
                  >
                    Select All
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={deselectAllMembers}
                    className="flex-1"
                  >
                    Deselect All
                  </Button>
                </div>

                {/* Member List */}
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {groupMembers.map((member) => (
                    <div
                      key={member.id}
                      className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                        selectedMembers.includes(member.id)
                          ? 'bg-primary/10 border border-primary/20'
                          : 'bg-card border border-border hover:bg-accent/50'
                      }`}
                      onClick={() => toggleMemberSelection(member.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-foreground">{member.name}</p>
                        </div>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selectedMembers.includes(member.id)
                            ? 'bg-primary border-primary'
                            : 'border-muted-foreground'
                        }`}
                      >
                        {selectedMembers.includes(member.id) && (
                          <div className="w-2 h-2 rounded-full bg-white"></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowMemberSelection(false)}
                    className="flex-1 border-border hover:bg-accent/50 rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      setShowMemberSelection(false);
                      if (selectedMembers.length > 0) {
                        processPayment();
                      }
                    }}
                    disabled={selectedMembers.length === 0}
                    className="flex-1 rounded-xl"
                  >
                    Pay Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Payment Processing Screen */}
        {paymentStatus === 'processing' && (
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
                <div className="flex justify-center mt-4">
                  <div className="flex gap-2">
                    <CreditCard className="w-6 h-6 text-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                    <Wallet className="w-6 h-6 text-primary animate-bounce" style={{ animationDelay: '100ms' }} />
                    <QrCode className="w-6 h-6 text-primary animate-bounce" style={{ animationDelay: '200ms' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment Success Screen */}
        {paymentStatus === 'success' && (
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
                <p className="text-sm text-primary mt-2">
                  Expense split among {selectedMembers.length} members
                </p>
              </div>
              
              <div className="flex flex-col gap-3 pt-4">
                <Button className="rounded-xl">
                  <Receipt className="w-4 h-4 mr-2" />
                  View Receipt
                </Button>
                <Button 
                  variant="outline" 
                  onClick={onClose}
                  className="rounded-xl border-border hover:bg-accent/50"
                >
                  Back to Group
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Payment Failure Screen */}
        {paymentStatus === 'failed' && (
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
                  onClick={() => {
                    setPaymentStatus('idle');
                  }}
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

export default GroupQRScanner;