import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  QrCode, 
  Download, 
  Share2, 
  Copy,
  Users,
  DollarSign,
  FileText,
  CheckCircle
} from 'lucide-react';

interface QRCodeGeneratorProps {
  groupId?: string;
  groupName?: string;
  prefilledAmount?: number;
  prefilledNote?: string;
  onClose?: () => void;
}

interface ExpenseQRData {
  type: 'expense_split';
  groupId: string;
  amount?: number;
  note?: string;
  timestamp: string;
  version: '1.0';
}

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({
  groupId,
  groupName,
  prefilledAmount,
  prefilledNote,
  onClose
}) => {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // States
  const [amount, setAmount] = useState(prefilledAmount?.toString() || '');
  const [note, setNote] = useState(prefilledNote || '');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [qrGenerated, setQrGenerated] = useState(false);

  // Generate QR code data
  const generateQRData = (): string => {
    if (!groupId) return '';

    const qrData: ExpenseQRData = {
      type: 'expense_split',
      groupId,
      amount: amount ? parseFloat(amount) : undefined,
      note: note || undefined,
      timestamp: new Date().toISOString(),
      version: '1.0'
    };

    // Create URL format that the QR scanner can parse
    const baseUrl = 'expense_split://' + groupId;
    const params = new URLSearchParams();
    
    if (qrData.amount) params.set('amount', qrData.amount.toString());
    if (qrData.note) params.set('note', qrData.note);
    params.set('timestamp', qrData.timestamp);
    params.set('version', qrData.version);

    return `${baseUrl}?${params.toString()}`;
  };

  // Generate QR code using API service
  const generateQRCode = async () => {
    if (!groupId) {
      toast({
        title: 'Error',
        description: 'Group ID is required to generate QR code',
        variant: 'destructive'
      });
      return;
    }

    setIsGenerating(true);
    try {
      const qrDataString = generateQRData();
      console.log('Generated QR data:', qrDataString);

      // Use QR Server API to generate QR code image
      const qrSize = 300;
      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent(qrDataString)}&format=png&margin=10&color=000000&bgcolor=FFFFFF&qzone=2&ecc=M`;
      
      setQrCodeUrl(qrApiUrl);
      setQrGenerated(true);

      toast({
        title: 'QR Code Generated',
        description: 'Share this QR code with group members to split expenses!',
      });

    } catch (error) {
      console.error('QR generation error:', error);
      toast({
        title: 'Generation Failed',
        description: 'Failed to generate QR code. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Copy QR data to clipboard
  const copyToClipboard = async () => {
    try {
      const qrData = generateQRData();
      await navigator.clipboard.writeText(qrData);
      
      toast({
        title: 'Copied!',
        description: 'QR code data copied to clipboard',
      });
    } catch (error) {
      console.error('Copy failed:', error);
      toast({
        title: 'Copy Failed',
        description: 'Failed to copy to clipboard',
        variant: 'destructive'
      });
    }
  };

  // Download QR code image
  const downloadQRCode = async () => {
    if (!qrCodeUrl) return;

    try {
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `expense-qr-${groupName || 'group'}-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(url);
      
      toast({
        title: 'Downloaded',
        description: 'QR code image saved to your device',
      });
    } catch (error) {
      console.error('Download failed:', error);
      toast({
        title: 'Download Failed',
        description: 'Failed to download QR code image',
        variant: 'destructive'
      });
    }
  };

  // Share QR code using Web Share API
  const shareQRCode = async () => {
    if (!qrCodeUrl) return;

    try {
      if (navigator.share) {
        // Use native sharing if available
        const response = await fetch(qrCodeUrl);
        const blob = await response.blob();
        const file = new File([blob], `expense-qr-${groupName || 'group'}.png`, { type: 'image/png' });
        
        await navigator.share({
          title: `${groupName || 'Group'} Expense Split`,
          text: `Scan this QR code to join our expense split${amount ? ` for $${amount}` : ''}!`,
          files: [file]
        });
        
        toast({
          title: 'Shared',
          description: 'QR code shared successfully',
        });
      } else {
        // Fallback to copying URL
        await copyToClipboard();
      }
    } catch (error) {
      console.error('Share failed:', error);
      toast({
        title: 'Share Failed',
        description: 'Failed to share QR code',
        variant: 'destructive'
      });
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto glass-card border border-white/20 rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-center">
          <QrCode className="w-5 h-5 text-primary" />
          Generate Expense QR Code
        </CardTitle>
        {groupName && (
          <Badge variant="secondary" className="text-center justify-center">
            <Users className="w-3 h-3 mr-1" />
            {groupName}
          </Badge>
        )}
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Input Fields */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="amount" className="text-sm font-medium">
              Amount (Optional)
            </Label>
            <div className="mt-2 relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-10 pr-4 bg-input border-border text-foreground rounded-xl"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="note" className="text-sm font-medium">
              Expense Description (Optional)
            </Label>
            <div className="mt-2 relative">
              <FileText className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                id="note"
                placeholder="What's this expense for?"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="pl-10 pr-4 bg-input border-border text-foreground rounded-xl"
                maxLength={100}
              />
            </div>
            {note.length > 80 && (
              <p className="text-xs text-muted-foreground mt-1">
                {100 - note.length} characters remaining
              </p>
            )}
          </div>
        </div>

        {/* Generate Button */}
        <Button
          onClick={generateQRCode}
          disabled={isGenerating || !groupId}
          className="w-full rounded-xl h-12"
        >
          {isGenerating ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Generating...
            </div>
          ) : qrGenerated ? (
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Regenerate QR Code
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <QrCode className="w-4 h-4" />
              Generate QR Code
            </div>
          )}
        </Button>

        {/* QR Code Display */}
        {qrGenerated && qrCodeUrl && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl border border-border flex justify-center">
              <img
                src={qrCodeUrl}
                alt="Expense Split QR Code"
                className="w-64 h-64 object-contain"
              />
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={downloadQRCode}
                className="rounded-xl border-border hover:bg-accent/50"
              >
                <Download className="w-4 h-4 mr-1" />
                Download
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={shareQRCode}
                className="rounded-xl border-border hover:bg-accent/50"
              >
                <Share2 className="w-4 h-4 mr-1" />
                Share
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
                className="rounded-xl border-border hover:bg-accent/50"
              >
                <Copy className="w-4 h-4 mr-1" />
                Copy
              </Button>
            </div>

            {/* Usage Instructions */}
            <div className="bg-accent/10 rounded-lg p-3">
              <p className="text-sm text-muted-foreground text-center">
                Share this QR code with group members. They can scan it with the FastTrace app to quickly join the expense split!
              </p>
            </div>
          </div>
        )}

        {/* Close Button */}
        {onClose && (
          <Button
            variant="ghost"
            onClick={onClose}
            className="w-full rounded-xl border-border hover:bg-accent/50"
          >
            Close
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default QRCodeGenerator;