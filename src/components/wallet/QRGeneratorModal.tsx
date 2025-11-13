import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  QrCode,
  Download,
  Share2,
  Copy,
  CheckCircle,
  AlertCircle,
  IndianRupee,
  User,
  Clock,
  Loader2,
  Sparkles,
} from 'lucide-react';
import QRCode from 'qrcode.react';
import { useQRGenerator, type GenerateQROptions } from '@/hooks/useQRGenerator';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface QRGeneratorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const QRGeneratorModal: React.FC<QRGeneratorModalProps> = ({
  open,
  onOpenChange,
}) => {
  const { toast } = useToast();
  const { qrData, isGenerating, error, generateQR, resetQR } = useQRGenerator();
  const qrRef = useRef<HTMLDivElement>(null);

  // Form state
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [qrType, setQRType] = useState<'wallet' | 'upi'>('wallet');
  const [expiresIn, setExpiresIn] = useState<number>(30); // Default 30 minutes

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setAmount('');
      setNote('');
      resetQR();
    }
  }, [open, resetQR]);

  const handleGenerateQR = async () => {
    const options: GenerateQROptions = {
      type: qrType,
      expiresIn,
    };

    if (amount) {
      const amountNum = parseFloat(amount);
      if (amountNum <= 0) {
        toast({
          title: 'Invalid Amount',
          description: 'Please enter a valid amount',
          variant: 'destructive',
        });
        return;
      }
      options.amount = amountNum;
    }

    if (note) {
      options.note = note;
    }

    try {
      await generateQR(options);
      toast({
        title: 'QR Code Generated',
        description: 'Your payment QR code is ready',
      });
    } catch (error: any) {
      toast({
        title: 'Generation Failed',
        description: error.message || 'Failed to generate QR code',
        variant: 'destructive',
      });
    }
  };

  const handleDownloadQR = () => {
    if (!qrRef.current) return;

    const canvas = qrRef.current.querySelector('canvas');
    if (!canvas) return;

    try {
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `payment-qr-${Date.now()}.png`;
      link.href = url;
      link.click();

      toast({
        title: 'QR Code Downloaded',
        description: 'QR code saved to your device',
      });
    } catch (error) {
      toast({
        title: 'Download Failed',
        description: 'Failed to download QR code',
        variant: 'destructive',
      });
    }
  };

  const handleShareQR = async () => {
    if (!qrRef.current) return;

    const canvas = qrRef.current.querySelector('canvas');
    if (!canvas) return;

    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return;

        if (navigator.share) {
          const file = new File([blob], 'payment-qr.png', { type: 'image/png' });
          await navigator.share({
            title: 'Payment QR Code',
            text: `Scan to pay ${amount ? `₹${amount}` : 'me'}`,
            files: [file],
          });
        } else {
          // Fallback: Copy to clipboard
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob }),
          ]);
          toast({
            title: 'QR Code Copied',
            description: 'QR code copied to clipboard',
          });
        }
      });
    } catch (error) {
      toast({
        title: 'Share Failed',
        description: 'Failed to share QR code',
        variant: 'destructive',
      });
    }
  };

  const handleCopyQRData = async () => {
    if (!qrData) return;

    try {
      await navigator.clipboard.writeText(qrData.qrText);
      toast({
        title: 'Copied',
        description: 'QR code data copied to clipboard',
      });
    } catch (error) {
      toast({
        title: 'Copy Failed',
        description: 'Failed to copy QR code data',
        variant: 'destructive',
      });
    }
  };

  const getTimeRemaining = () => {
    if (!qrData?.expiresAt) return null;

    const now = new Date();
    const expiry = new Date(qrData.expiresAt);
    const diff = expiry.getTime() - now.getTime();

    if (diff <= 0) return 'Expired';

    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-primary/20 max-w-md sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-primary" />
            Receive Money via QR
          </DialogTitle>
          <DialogDescription>
            Generate a QR code to receive payments instantly
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!qrData ? (
            /* QR Generation Form */
            <>
              {/* QR Type Selection */}
              <div className="space-y-2">
                <Label>QR Code Type</Label>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant={qrType === 'wallet' ? 'default' : 'outline'}
                    className={cn(
                      "h-auto py-3 flex-col gap-2",
                      qrType === 'wallet' && "bg-gradient-primary"
                    )}
                    onClick={() => setQRType('wallet')}
                  >
                    <QrCode className="w-5 h-5" />
                    <span className="text-sm">Wallet QR</span>
                  </Button>
                  <Button
                    type="button"
                    variant={qrType === 'upi' ? 'default' : 'outline'}
                    className={cn(
                      "h-auto py-3 flex-col gap-2",
                      qrType === 'upi' && "bg-gradient-primary"
                    )}
                    onClick={() => setQRType('upi')}
                  >
                    <IndianRupee className="w-5 h-5" />
                    <span className="text-sm">UPI QR</span>
                  </Button>
                </div>
              </div>

              {/* Amount Input */}
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (Optional)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    ₹
                  </span>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-8 glass-card border-white/20"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Leave empty for flexible amount
                </p>
              </div>

              {/* Note Input */}
              <div className="space-y-2">
                <Label htmlFor="note">Note (Optional)</Label>
                <Input
                  id="note"
                  placeholder="Payment for..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="glass-card border-white/20"
                  maxLength={100}
                />
              </div>

              {/* Expiry Time */}
              <div className="space-y-2">
                <Label>QR Code Valid For</Label>
                <div className="grid grid-cols-3 gap-2">
                  {[15, 30, 60].map((mins) => (
                    <Button
                      key={mins}
                      type="button"
                      variant={expiresIn === mins ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setExpiresIn(mins)}
                      className={cn(
                        expiresIn === mins && "bg-gradient-primary"
                      )}
                    >
                      {mins} min
                    </Button>
                  ))}
                </div>
              </div>

              {/* Error Alert */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Generate Button */}
              <Button
                onClick={handleGenerateQR}
                disabled={isGenerating}
                className="w-full bg-gradient-primary shadow-glow"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate QR Code
                  </>
                )}
              </Button>
            </>
          ) : (
            /* QR Code Display */
            <>
              {/* QR Code */}
              <Card className="glass-card border-primary/20">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* QR Image */}
                    <div
                      ref={qrRef}
                      className="flex justify-center p-6 bg-white rounded-xl"
                    >
                      <QRCode
                        value={qrData.qrText}
                        size={240}
                        level="H"
                        includeMargin
                        renderAs="canvas"
                      />
                    </div>

                    {/* QR Info */}
                    <div className="space-y-2">
                      {/* User Info */}
                      <div className="flex items-center gap-2 p-3 rounded-lg glass-card border-white/10">
                        <User className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium">{qrData.userName}</span>
                        <Badge variant="outline" className="ml-auto">
                          {qrData.qrType.toUpperCase()}
                        </Badge>
                      </div>

                      {/* Amount */}
                      {qrData.amount && (
                        <div className="flex items-center gap-2 p-3 rounded-lg glass-card border-white/10">
                          <IndianRupee className="w-4 h-4 text-green-400" />
                          <span className="text-sm font-medium">
                            ₹{qrData.amount.toLocaleString('en-IN')}
                          </span>
                        </div>
                      )}

                      {/* Expiry */}
                      {qrData.expiresAt && (
                        <div className="flex items-center gap-2 p-3 rounded-lg glass-card border-yellow-500/30 bg-yellow-500/10">
                          <Clock className="w-4 h-4 text-yellow-400" />
                          <span className="text-sm text-yellow-200">
                            Expires in: {getTimeRemaining()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownloadQR}
                        className="glass-card border-white/20"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleShareQR}
                        className="glass-card border-white/20"
                      >
                        <Share2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopyQRData}
                        className="glass-card border-white/20"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Generate New */}
                    <Button
                      variant="outline"
                      onClick={() => resetQR()}
                      className="w-full glass-card border-white/20"
                    >
                      Generate New QR Code
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Instructions */}
              <Alert className="border-blue-500/30 bg-blue-500/10">
                <CheckCircle className="h-4 w-4 text-blue-400" />
                <AlertDescription className="text-blue-200 text-xs">
                  Share this QR code with anyone to receive payment. They can scan it using any UPI app or wallet scanner.
                </AlertDescription>
              </Alert>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QRGeneratorModal;
