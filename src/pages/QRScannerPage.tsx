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
  Receipt
} from 'lucide-react';
import { qrScannerAPI } from '@/lib/qrScannerAPI';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
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

interface Group {
  id: string;
  name: string;
  icon: string;
  members: GroupMember[];
}

interface GroupMember {
  id: string;
  name: string;
  avatar?: string;
}

const QRScannerPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  // States
  const [isScanning, setIsScanning] = useState(false);
  const [scannedData, setScannedData] = useState<QRData | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [flashlightOn, setFlashlightOn] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [paymentType, setPaymentType] = useState<'self' | 'group'>('self');
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [showGroupDropdown, setShowGroupDropdown] = useState(false);
  const [showMemberSelection, setShowMemberSelection] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
  const [orderId, setOrderId] = useState<string | null>(null);
  const [razorpayKeyId, setRazorpayKeyId] = useState<string | null>(null);
  const [showPaymentMethods, setShowPaymentMethods] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'wallet' | 'other' | null>(null);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load groups and Razorpay SDK when component mounts
  useEffect(() => {
    loadGroups();
    // Preload Razorpay SDK in the background
    loadRazorpay().catch(err => {
      console.warn('Failed to preload Razorpay SDK:', err);
    });
  }, []);

  const loadGroups = async () => {
    try {
      // Fetch user's groups from API
      const response = await apiClient.get('/api/groups');

      // Normalize backend response shape: { success, message, data: { groups, pagination } }
      const payload = response && response.data ? response.data : response;
      const rawGroups = Array.isArray(payload)
        ? payload
        : (payload?.groups || payload?.items || []);

      if (!Array.isArray(rawGroups)) {
        console.warn('Unexpected groups payload shape:', payload);
        setGroups([]);
        return;
      }

      const apiGroups = rawGroups.map((group: any) => ({
        id: group._id || group.id,
        name: group.name,
        icon: getGroupIcon(group.category || group.type),
        members: (group.members || [])
          .filter((member: any) => member.status ? member.status === 'active' : true)
          .map((member: any) => ({
            id: member.user?._id || member.user?.id || member.user,
            name: (member.user?.firstName && member.user?.lastName)
              ? `${member.user.firstName} ${member.user.lastName}`
              : (member.user?.name || member.name || 'Unknown User'),
            avatar: member.user?.avatar || member.avatar
          }))
      }));

      setGroups(apiGroups);
    } catch (err: any) {
      console.error('Failed to load groups:', err);
      setGroups([]);
      toast({
        title: 'Groups Loading Error',
        description: err.message || 'Failed to load groups. Please try again.',
        variant: 'destructive'
      });
    }
  };

  // Helper function to get group icon based on category
  const getGroupIcon = (category?: string) => {
    const icons: { [key: string]: string } = {
      'Travel': '🏖️',
      'Living': '🏠',
      'Work': '💼',
      'Entertainment': '🎮',
      'Food': '🍽️',
      'Shopping': '🛒',
      'Transport': '🚗',
      'Health': '🏥',
      'Education': '📚',
      'Bills': '📄',
      'Other': '👥'
    };
    return icons[category || 'Other'] || '👥';
  };

  // Load Razorpay SDK dynamically
  const loadRazorpay = () => {
    return new Promise((resolve, reject) => {
      // Check if already loading or loaded
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      
      const existingScript = document.querySelector('script[src*="checkout.razorpay.com"]');
      if (existingScript) {
        // Wait for existing script to load
        const checkLoaded = () => {
          if ((window as any).Razorpay) {
            resolve(true);
          } else {
            setTimeout(checkLoaded, 100);
          }
        };
        checkLoaded();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => {
        console.log('🔵 Razorpay SDK loaded successfully');
        resolve(true);
      };
      script.onerror = () => {
        console.error('🔴 Razorpay SDK failed to load');
        reject(new Error('Razorpay SDK failed to load. Please check your internet connection.'));
      };
      document.body.appendChild(script);
    });
  };

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

    const vw = video.videoWidth;
    const vh = video.videoHeight;
    canvas.width = vw;
    canvas.height = vh;
    
    // Type assertion to ensure we're using the correct context type
    if (ctx instanceof CanvasRenderingContext2D) {
      ctx.drawImage(video, 0, 0, vw, vh);
      const imageData = ctx.getImageData(0, 0, vw, vh);
      
      // Use jsQR to detect QR codes
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      
      if (code) {
        handleQRDetection({ raw: code.data, type: 'unknown' });
      }
    }
  };

  // Process QR data with backend API
  const handleQRDetection = async (qrData: QRData) => {
    stopCamera();
    
    if (!qrData.raw) {
      setError('Invalid QR code detected');
      return;
    }
    
    // Log QR data for debugging
    console.log('🔵 Frontend - QR Code detected:', {
      raw: qrData.raw,
      length: qrData.raw.length,
      first100: qrData.raw.substring(0, 100),
      isNumeric: /^[0-9]+$/.test(qrData.raw),
      hasUPI: qrData.raw.toLowerCase().includes('upi'),
      hasHTTP: qrData.raw.toLowerCase().startsWith('http')
    });

    try {
      setIsProcessing(true);
      setError('');
      
      // Process QR scan with backend API
      const payload: any = {
        qrData: qrData.raw,
        note: paymentNote
      };
      // Only include amount if user has already provided one
      const amt = parseFloat(paymentAmount);
      if (!isNaN(amt) && amt > 0) {
        payload.amount = amt;
      }

      const result = await qrScannerAPI.processQRScan(payload);
      
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
        raw: qrData.raw
      };
      
      setScannedData(processedQRData);
      setPaymentAmount(result.amount?.toString() || '');
      setPaymentNote(result.note || '');
      
      // If it's an expense split QR, pre-select group and members
      if (result.type === 'expense_split' && result.groupId) {
        setPaymentType('group');
        // Load group details from backend
        try {
          const groupDetails = await qrScannerAPI.getGroupDetails(result.groupId);
          const group: Group = {
            id: groupDetails.id,
            name: groupDetails.name,
            icon: groupDetails.icon || '👥',
            members: groupDetails.members || []
          };
          setSelectedGroup(group);
          setGroups(prev => {
            // Update groups list with the new group if not already present
            if (!prev.some(g => g.id === group.id)) {
              return [...prev, group];
            }
            return prev;
          });
          // Pre-select all members for expense split
          const allMemberIds = group.members.map(member => member.id);
          setSelectedMembers(allMemberIds);
        } catch (err) {
          console.error('Failed to load group details:', err);
          toast({
            title: 'Error',
            description: 'Failed to load group details. Please try again.',
            variant: 'destructive'
          });
        }
      }
      
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

  // Group and Member Selection
  const handleGroupSelect = (group: Group) => {
    setSelectedGroup(group);
    // For group payments, pre-select all members by default
    const allMemberIds = group.members.map(member => member.id);
    setSelectedMembers(allMemberIds);
    setShowGroupDropdown(false);
  };

  const toggleMemberSelection = (memberId: string) => {
    setSelectedMembers(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId) 
        : [...prev, memberId]
    );
  };

  const selectAllMembers = () => {
    if (selectedGroup) {
      const allMemberIds = selectedGroup.members.map(member => member.id);
      setSelectedMembers(allMemberIds);
    }
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
    if (paymentType === 'group' && selectedMembers.length === 0) {
      setError('Please select at least one member to split the expense with');
      return;
    }

    try {
      // If it's a group payment and we haven't selected a payment method yet, show payment method selection
      if (paymentType === 'group' && selectedGroup && !selectedPaymentMethod) {
        setShowPaymentMethods(true);
        return;
      }

      setIsProcessing(true);
      setError('');
      setPaymentStatus('processing');
      
      if (paymentType === 'group' && selectedGroup) {
        // Check if user selected wallet payment for group expense
        if (selectedPaymentMethod === 'wallet') {
          console.log('🔵 Processing group expense with wallet payment');
          // Simulate wallet payment processing for group expense
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Process group expense split through backend API
          const result = await qrScannerAPI.processGroupExpenseSplit({
            groupId: selectedGroup.id,
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
          
          // Set success status for group payments
          setPaymentStatus('success');
          return;
        }
        
        // For other payment methods (Razorpay), process payment through Razorpay
        console.log('🔵 Processing group expense with Razorpay payment');
        
        // Create Razorpay order for group payment
        if (!scannedData.raw) {
          throw new Error('Missing QR data for payment processing');
        }
        
        const orderResp = await qrScannerAPI.processQRScan({
          qrData: scannedData.raw,
          amount: parseFloat(paymentAmount),
          note: paymentNote
        });
        
        console.log('🔵 Group payment order created:', { 
          hasOrderId: !!orderResp.orderId, 
          hasKey: !!orderResp.razorpayKeyId
        });
        
        if (!orderResp.orderId || !orderResp.razorpayKeyId) {
          throw new Error('Failed to create payment order. Please try again.');
        }
        
        // Store group payment details for later processing
        const groupPaymentData = {
          groupId: selectedGroup.id,
          selectedMembers,
          splitMethod: 'equal',
          amount: parseFloat(paymentAmount),
          note: paymentNote
        };
        
        // Calculate split amount per person for display
        const splitAmount = parseFloat(paymentAmount) / selectedMembers.length;
        
        // Open Razorpay payment modal for group expense
        const options = {
          key: orderResp.razorpayKeyId,
          amount: parseFloat(paymentAmount) * 100, // Razorpay expects amount in paise
          currency: 'INR',
          name: 'ZenithWallet',
          description: `Group expense: ${paymentNote || selectedGroup.name} (₹${splitAmount.toFixed(2)} per person)`,
          order_id: orderResp.orderId,
          handler: async function (response: any) {
            try {
              console.log('🔵 Group payment Razorpay response:', response);
              
              // Show processing state
              setPaymentStatus('processing');
              toast({
                title: 'Verifying Payment',
                description: 'Please wait while we confirm your group payment...',
              });
              
              // Verify payment with backend
              const verificationPayload = {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                amount: parseFloat(paymentAmount),
                paymentType: 'group_expense',
                groupId: groupPaymentData.groupId,
                selectedMembers: groupPaymentData.selectedMembers,
                splitMethod: groupPaymentData.splitMethod,
                note: paymentNote
              };
              
              const verifyResponse = await apiClient.post('/api/payments/verify-group-payment', verificationPayload);
              
              if (verifyResponse.success) {
                console.log('✅ Group payment verified:', verifyResponse.data);
                setPaymentStatus('success');
                
                toast({
                  title: 'Group Payment Successful',
                  description: `Payment of ₹${paymentAmount} completed. Expense split created for ${selectedMembers.length} members (₹${splitAmount.toFixed(2)} each).`,
                });
                
                // Reset form after successful payment
                setTimeout(() => {
                  setScannedData(null);
                  setPaymentAmount('');
                  setPaymentNote('');
                  setSelectedPaymentMethod(null);
                  setOrderId(null);
                  setRazorpayKeyId(null);
                  setPaymentType('self');
                  setSelectedGroup(null);
                  setSelectedMembers([]);
                  setShowGroupDropdown(false);
                  setShowMemberSelection(false);
                  setShowPaymentMethods(false);
                }, 3000);
              } else {
                throw new Error(verifyResponse.message || 'Payment verification failed');
              }
            } catch (error: any) {
              console.error('🔴 Group payment verification error:', error);
              setPaymentStatus('failed');
              setError(error.message || 'Payment verification failed');
              toast({
                title: 'Payment Verification Failed',
                description: error.message || 'Unable to verify the payment. Please contact support.',
                variant: 'destructive'
              });
            }
          },
          prefill: {
            name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'User',
            email: user?.email || '',
            contact: user?.phone || ''
          },
          theme: {
            color: '#3B82F6'
          },
          modal: {
            ondismiss: function() {
              console.log('🟡 Group payment modal dismissed');
              setPaymentStatus('failed');
              setIsProcessing(false);
              toast({
                title: 'Payment Cancelled',
                description: 'You cancelled the group payment.',
                variant: 'destructive'
              });
            }
          }
        };
        
        console.log('🔵 Opening Razorpay for group payment with options:', options);
        
        // Ensure Razorpay SDK is loaded
        console.log('🔵 Checking Razorpay SDK for group payment:', { isLoaded: !!(window as any).Razorpay });
        if (!(window as any).Razorpay) {
          try {
            console.log('🔵 Loading Razorpay SDK for group payment...');
            await loadRazorpay();
            console.log('🔵 Razorpay SDK ready for group payment');
          } catch (err) {
            console.error('🔴 Razorpay SDK load failed for group payment:', err);
            setPaymentStatus('failed');
            throw new Error('Failed to load payment gateway. Please check your internet connection and try again.');
          }
        }
        
        // Create and open Razorpay checkout
        const rzp = new (window as any).Razorpay(options);
        console.log('🔵 Razorpay instance created for group payment, opening modal...');
        
        // Add a small delay to ensure UI is ready
        setTimeout(() => {
          rzp.open();
          console.log('🔵 Razorpay modal opened successfully for group payment');
        }, 100);
        
        return;
      } else if ((scannedData.type === 'upi' || scannedData.type === 'merchant')) {
        // Check if user selected wallet payment
        if (selectedPaymentMethod === 'wallet') {
          console.log('🔵 Processing wallet payment');
          // Simulate wallet payment processing
          await new Promise(resolve => setTimeout(resolve, 2000));
          setPaymentStatus('success');
          toast({
            title: 'Payment Successful',
            description: `₹${paymentAmount} paid from wallet successfully!`,
          });
          return;
        }
        
        console.log('🔵 Processing UPI/Merchant payment with Razorpay:', { 
          type: scannedData.type, 
          amount: paymentAmount, 
          selectedPaymentMethod,
          hasExistingOrder: !!orderId,
          hasExistingKey: !!razorpayKeyId 
        });

        // If we don't have an order yet, create one now using the entered amount
        let newOrderId: string | null = null;
        let newKeyId: string | null = null;
        if (!orderId || !razorpayKeyId) {
          console.log('🔵 Creating new order...');
          if (!scannedData.raw) {
            throw new Error('Missing QR data for payment processing');
          }
          const orderResp = await qrScannerAPI.processQRScan({
            qrData: scannedData.raw,
            amount: parseFloat(paymentAmount),
            note: paymentNote
          });
          console.log('🔵 Order creation response:', { 
            hasOrderId: !!orderResp.orderId, 
            hasKey: !!orderResp.razorpayKeyId,
            type: orderResp.type 
          });
          if (!orderResp.orderId || !orderResp.razorpayKeyId) {
            throw new Error('Failed to create payment order. Please try again.');
          }
          // Update local variables for immediate use
          newOrderId = orderResp.orderId;
          newKeyId = orderResp.razorpayKeyId;
          // Also update state for future renders
          setOrderId(orderResp.orderId);
          setRazorpayKeyId(orderResp.razorpayKeyId);
        }

        // Resolve final order/key values immediately (state setters are async)
        const finalOrderId = orderId || newOrderId;
        const finalKeyId = razorpayKeyId || newKeyId;

        console.log('🔵 Final payment values:', { finalOrderId, finalKeyId });

        if (!finalOrderId || !finalKeyId) {
          throw new Error('Payment order not ready. Please try again.');
        }

        // Process UPI or merchant payment through Razorpay
        const options = {
          key: finalKeyId,
          amount: parseFloat(paymentAmount) * 100, // Razorpay expects amount in paise
          currency: 'INR',
          name: 'ZenithWallet',
          description: paymentNote || (scannedData.type === 'upi' 
            ? `UPI payment to ${scannedData.upiId}` 
            : `Merchant payment to ${scannedData.merchantName}`),
          order_id: finalOrderId,
          handler: async function (response: any) {
            try {
              console.log('🔵 Razorpay response received:', response);
              
              // Show processing state while verifying
              setPaymentStatus('processing');
              toast({
                title: 'Verifying Payment',
                description: 'Please wait while we confirm your payment...',
              });
              
              // Verify payment with backend
              const verificationPayload = {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                amount: parseFloat(paymentAmount),
                paymentType: scannedData.type,
                upiId: scannedData.upiId,
                merchantName: scannedData.merchantName,
                note: paymentNote
              };
              
              console.log('🔵 Verifying payment with backend:', verificationPayload);
              
              // Call backend to verify and complete payment
              const verifyResponse = await apiClient.post('/api/payments/verify-qr-payment', verificationPayload);
              
              console.log('🔵 Payment verification response:', verifyResponse);
              
              if (verifyResponse.success) {
                // Payment verified successfully
                setPaymentStatus('success');
                toast({
                  title: 'Payment Verified',
                  description: `₹${paymentAmount} has been successfully paid!`,
                });
                
                // Clear payment data for next transaction
                setTimeout(() => {
                  setScannedData(null);
                  setPaymentAmount('');
                  setPaymentNote('');
                  setSelectedPaymentMethod(null);
                  setOrderId(null);
                  setRazorpayKeyId(null);
                }, 3000);
              } else {
                throw new Error(verifyResponse.message || 'Payment verification failed');
              }
            } catch (error: any) {
              console.error('🔴 Payment verification error:', error);
              setPaymentStatus('failed');
              setError(error.message || 'Payment verification failed. Please contact support.');
              
              toast({
                title: 'Payment Verification Failed',
                description: error.message || 'Unable to verify payment. Please contact support.',
                variant: 'destructive'
              });
            }
          },
          modal: {
            ondismiss: function () {
              console.log('🔵 Payment modal dismissed');
              // Payment cancelled or modal closed
              setPaymentStatus('idle');
              setIsProcessing(false);
              toast({
                title: 'Payment Cancelled',
                description: 'Payment was cancelled or interrupted.',
                variant: 'destructive'
              });
            }
          },
          prefill: {
            name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'User',
            email: user?.email || '',
            contact: user?.phone || ''
          },
          notes: {
            qrType: scannedData.type,
            upiId: scannedData.upiId,
            merchantId: scannedData.merchantId
          },
          theme: {
            color: '#3399cc'
          }
        };

        // Ensure Razorpay SDK is loaded
        console.log('🔵 Checking Razorpay SDK:', { isLoaded: !!(window as any).Razorpay });
        if (!(window as any).Razorpay) {
          try {
            console.log('🔵 Loading Razorpay SDK...');
            setPaymentStatus('processing'); // Show loading while SDK loads
            await loadRazorpay();
            console.log('🔵 Razorpay SDK ready');
          } catch (err) {
            console.error('🔴 Razorpay SDK load failed:', err);
            setPaymentStatus('failed');
            throw new Error('Failed to load payment gateway. Please check your internet connection and try again.');
          }
        }

        console.log('🔵 Opening Razorpay checkout with options:', {
          key: finalKeyId,
          order_id: finalOrderId,
          amount: options.amount,
          currency: options.currency
        });
        
        try {
          // Create and open Razorpay checkout
          const rzp = new (window as any).Razorpay(options);
          console.log('🔵 Razorpay instance created, opening modal...');
          
          // Add a small delay to ensure UI is ready
          setTimeout(() => {
            rzp.open();
            console.log('🔵 Razorpay modal opened successfully');
          }, 100);
          
          // Reset processing state since Razorpay is now handling the payment
          setIsProcessing(false);
          return;
        } catch (rzpError) {
          console.error('🔴 Razorpay initialization failed:', rzpError);
          throw new Error('Failed to initialize payment gateway. Please try again.');
        }
      } else {
        // For other individual payments, simulate processing
        await new Promise(resolve => setTimeout(resolve, 3000));
        setPaymentStatus('success');
      }
      
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

  // Main Render
  return (
    <div className="min-h-screen bg-gradient-background p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pt-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(-1)}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-xl font-bold text-foreground">Scan QR Code</h1>
          <div className="w-10"></div> {/* Spacer for alignment */}
        </div>

        {/* QR Scan Screen */}
        {!scannedData && (
          <div className="space-y-6">
            <Card className="glass-card border border-white/20 rounded-2xl overflow-hidden">
              <CardHeader className="text-center">
                <CardTitle className="flex flex-col items-center gap-2">
                  <QrCode className="w-8 h-8 text-primary" />
                  Point Camera at QR Code
                </CardTitle>
                <p className="text-muted-foreground text-sm">
                  Align the QR code within the frame to scan
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
          </div>
        )}

        {/* Payment Form Screen */}
        {scannedData && paymentStatus === 'idle' && (
          <div className="space-y-6">
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

                {/* Payment Type Toggle */}
                <div>
                  <Label className="text-foreground font-medium text-sm">
                    Payment Type
                  </Label>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <Button
                      variant={paymentType === 'self' ? 'default' : 'outline'}
                      onClick={() => {
                        setPaymentType('self');
                        setSelectedGroup(null);
                        setSelectedMembers([]);
                      }}
                      className={`rounded-xl h-12 text-lg ${paymentType === 'self' ? '' : 'border-border hover:bg-accent/50'}`}
                    >
                      <User className="w-5 h-5 mr-2" />
                      Self
                    </Button>
                    <Button
                      variant={paymentType === 'group' ? 'default' : 'outline'}
                      onClick={() => {
                        setPaymentType('group');
                        setShowGroupDropdown(true);
                      }}
                      className={`rounded-xl h-12 text-lg ${paymentType === 'group' ? '' : 'border-border hover:bg-accent/50'}`}
                    >
                      <Users className="w-5 h-5 mr-2" />
                      Group
                    </Button>
                  </div>
                </div>

                {/* Group Selection Dropdown */}
                {paymentType === 'group' && (
                  <div className="space-y-3">
                    <Label className="text-foreground font-medium text-sm">
                      Select Group
                    </Label>
                    <div className="relative">
                      <Button
                        variant="outline"
                        className="w-full justify-between rounded-xl h-12 text-left"
                        onClick={() => setShowGroupDropdown(!showGroupDropdown)}
                      >
                        <span>
                          {selectedGroup ? (
                            <span className="flex items-center gap-2">
                              <span className="text-lg">{selectedGroup.icon}</span>
                              {selectedGroup.name}
                            </span>
                          ) : (
                            "Select a group"
                          )}
                        </span>
                        <span>▼</span>
                      </Button>
                      
                      {showGroupDropdown && (
                        <Card className="absolute top-full left-0 right-0 mt-2 z-10 border border-white/20 rounded-xl max-h-60 overflow-y-auto">
                          <CardContent className="p-2">
                            {groups.map((group) => (
                              <Button
                                key={group.id}
                                variant="ghost"
                                className="w-full justify-start rounded-lg h-12 mb-1 hover:bg-accent/50"
                                onClick={() => handleGroupSelect(group)}
                              >
                                <span className="flex items-center gap-3">
                                  <span className="text-lg">{group.icon}</span>
                                  <span>{group.name}</span>
                                </span>
                              </Button>
                            ))}
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </div>
                )}

                {/* Selected Group Display */}
                {paymentType === 'group' && selectedGroup && (
                  <div className="bg-accent/10 rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {selectedGroup.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {selectedMembers.length} of {selectedGroup.members.length} members selected
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
                )}

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
                    onClick={() => {
                      setScannedData(null);
                      setPaymentAmount('');
                      setPaymentNote('');
                      setPaymentType('self');
                      setSelectedGroup(null);
                      setSelectedMembers([]);
                      setShowGroupDropdown(false);
                      setShowMemberSelection(false);
                      setShowPaymentMethods(false);
                      setSelectedPaymentMethod(null);
                      setOrderId(null);
                      setRazorpayKeyId(null);
                    }}
                    className="flex-1 border-border hover:bg-accent/50 rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      if (paymentType === 'group' && selectedGroup) {
                        setShowMemberSelection(true);
                      } else {
                        // Show payment method selection for individual payments
                        setShowPaymentMethods(true);
                      }
                    }}
                    disabled={!paymentAmount || (paymentType === 'group' && !selectedGroup)}
                    className="flex-1 rounded-xl"
                  >
                    Choose Payment Method
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Member Selection Screen (Overlay) */}
        {showMemberSelection && selectedGroup && (
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
                  {selectedGroup.members.map((member) => (
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
                        // Instead of directly processing payment, show payment method selection
                        setShowPaymentMethods(true);
                      }
                    }}
                    disabled={selectedMembers.length === 0}
                    className="flex-1 rounded-xl"
                  >
                    Choose Payment Method
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Payment Method Selection Modal */}
        {showPaymentMethods && scannedData && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-primary" />
                    Choose Payment Method
                  </span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setShowPaymentMethods(false);
                      setSelectedPaymentMethod(null);
                    }}
                  >
                    ✕
                  </Button>
                </CardTitle>
                <p className="text-muted-foreground text-sm">
                  Select your preferred payment method for ₹{paymentAmount}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Payment Method Options */}
                <div className="space-y-3">
                  {/* Wallet Option */}
                  <div
                    className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all border ${
                      selectedPaymentMethod === 'wallet'
                        ? 'bg-primary/10 border-primary/20 ring-2 ring-primary/20'
                        : 'bg-card border-border hover:bg-accent/50'
                    }`}
                    onClick={() => setSelectedPaymentMethod('wallet')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <Wallet className="w-5 h-5 text-blue-400" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-foreground">Wallet Balance</p>
                        <p className="text-xs text-muted-foreground">Pay from your wallet balance</p>
                      </div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedPaymentMethod === 'wallet'
                          ? 'bg-primary border-primary'
                          : 'border-muted-foreground'
                      }`}
                    >
                      {selectedPaymentMethod === 'wallet' && (
                        <div className="w-2 h-2 rounded-full bg-white"></div>
                      )}
                    </div>
                  </div>

                  {/* Other Payment Methods Option */}
                  <div
                    className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all border ${
                      selectedPaymentMethod === 'other'
                        ? 'bg-primary/10 border-primary/20 ring-2 ring-primary/20'
                        : 'bg-card border-border hover:bg-accent/50'
                    }`}
                    onClick={() => setSelectedPaymentMethod('other')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-green-400" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-foreground">Other Payment Methods</p>
                        <p className="text-xs text-muted-foreground">UPI, Cards, Net Banking via Razorpay</p>
                      </div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedPaymentMethod === 'other'
                          ? 'bg-primary border-primary'
                          : 'border-muted-foreground'
                      }`}
                    >
                      {selectedPaymentMethod === 'other' && (
                        <div className="w-2 h-2 rounded-full bg-white"></div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Payment Info */}
                <div className="bg-accent/10 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Payment to:</span>
                    <span className="text-sm font-medium text-foreground">
                      {scannedData.merchantName || scannedData.upiId || 'Recipient'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm text-muted-foreground">Amount:</span>
                    <span className="text-lg font-bold text-foreground">₹{paymentAmount}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowPaymentMethods(false);
                      setSelectedPaymentMethod(null);
                    }}
                    className="flex-1 border-border hover:bg-accent/50 rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      setShowPaymentMethods(false);
                      if (selectedPaymentMethod) {
                        processPayment();
                      }
                    }}
                    disabled={!selectedPaymentMethod}
                    className="flex-1 rounded-xl"
                  >
                    {selectedPaymentMethod === 'wallet' ? 'Pay from Wallet' : 'Continue to Pay'}
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
                {paymentType === 'group' && selectedGroup && (
                  <p className="text-sm text-primary mt-2">
                    Expense split among {selectedMembers.length} members
                  </p>
                )}
              </div>
              
              <div className="flex flex-col gap-3 pt-4">
                <Button className="rounded-xl">
                  <Receipt className="w-4 h-4 mr-2" />
                  View Receipt
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/group/' + (selectedGroup?.id || ''))}
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

export default QRScannerPage;