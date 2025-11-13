import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { walletAPI } from '@/lib/walletAPI';
import { usePinVerification } from '@/hooks/usePinVerification';
import type { WalletData, WalletError, WalletTransfer } from '@/types/wallet';
import {
  Send,
  Search,
  User,
  Shield,
  AlertTriangle,
  CheckCircle,
  X,
  Loader2,
  Lock,
  Eye,
  EyeOff,
  Users,
  Zap
} from 'lucide-react';

interface TransferMoneyModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallet: WalletData;
  onSuccess: () => void;
  onError: (error: WalletError) => void;
}

const TransferMoneyModal: React.FC<TransferMoneyModalProps> = ({
  isOpen,
  onClose,
  wallet,
  onSuccess,
  onError
}) => {
  const [step, setStep] = useState<'input' | 'confirm' | 'processing' | 'success' | 'failed'>('input');
  const [amount, setAmount] = useState('');
  const [recipientSearch, setRecipientSearch] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState<any>(null);
  const [description, setDescription] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  // Initialize PIN verification hook
  const { requestVerification, PinDialog, isVerifying } = usePinVerification({
    title: "Authorize Transfer",
    description: amount && selectedRecipient 
      ? `You are about to transfer ₹${parseFloat(amount).toLocaleString()} to ${selectedRecipient.name}. Enter your PIN to continue.`
      : "Enter your PIN to authorize this transfer",
    onCancel: () => {
      setLoading(false);
    }
  });

  // Recent recipients (mock data - would come from API in real app)
  const recentRecipients = [
    {
      id: 'user2', 
      name: 'Jane Smith',
      email: 'jane@example.com',
      avatar: null,
      lastTransfer: '1 week ago'
    },
    {
      id: 'user3',
      name: 'Alex Johnson', 
      email: 'alex@example.com',
      avatar: null,
      lastTransfer: '2 weeks ago'
    }
  ];

  // Reset modal state when opening
  useEffect(() => {
    if (isOpen) {
      setStep('input');
      setAmount('');
      setRecipientSearch('');
      setSelectedRecipient(null);
      setDescription('');
      setSearchResults([]);
      setError('');
      setValidationErrors({});
    }
  }, [isOpen]);

  // Search for users
  useEffect(() => {
    const searchUsers = async () => {
      if (recipientSearch.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      try {
        setSearching(true);
        const results = await walletAPI.searchUsers(recipientSearch);
        setSearchResults(results);
      } catch (error) {
        console.error('User search failed:', error);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    };

    const debounceTimer = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounceTimer);
  }, [recipientSearch]);

  // Validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!amount || parseFloat(amount) <= 0) {
      errors.amount = 'Please enter a valid amount';
    } else if (parseFloat(amount) < 1) {
      errors.amount = 'Minimum transfer amount is ₹1';
    } else if (parseFloat(amount) > wallet.balance) {
      errors.amount = 'Insufficient wallet balance';
    } else if (parseFloat(amount) > wallet.limits.perTransaction) {
      errors.amount = `Maximum per transaction limit is ₹${wallet.limits.perTransaction.toLocaleString()}`;
    }

    if (!selectedRecipient) {
      errors.recipient = 'Please select a recipient';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };


  // Handle transfer steps
  const handleContinue = () => {
    if (!validateForm()) return;
    setStep('confirm');
  };

  const handleConfirm = () => {
    if (!wallet.security.pinSet) {
      setError('Please set up a transaction PIN first');
      return;
    }
    
    // Request PIN verification before processing transfer
    requestVerification(async () => {
      await processTransfer();
    });
  };

  const processTransfer = async () => {
    try {
      setLoading(true);
      setStep('processing');
      setError('');

      // Note: PIN is now verified by the backend through our PIN verification endpoint
      // The backend will handle PIN validation
      const transferData: WalletTransfer = {
        toUserId: selectedRecipient.id,
        amount: parseFloat(amount),
        description: description || `Transfer to ${selectedRecipient.name}`,
        pin: '' // PIN already verified through usePinVerification hook
      };

      const result = await walletAPI.transferMoney(transferData);
      
      setStep('success');
      onSuccess();
      
      // Auto-close after 3 seconds
      setTimeout(() => {
        onClose();
      }, 3000);

    } catch (error: any) {
      console.error('Transfer failed:', error);
      setError(error.message || 'Transfer failed');
      setStep('failed');
      onError(error);
    } finally {
      setLoading(false);
    }
  };

  // Render recipient card
  const renderRecipientCard = (recipient: any, isRecent = false) => {
    const isSelected = selectedRecipient?.id === recipient.id;

    return (
      <Card 
        key={recipient.id}
        className={`cursor-pointer transition-all duration-200 ${
          isSelected 
            ? 'border-blue-500 bg-blue-500/10' 
            : 'border-gray-700 hover:border-gray-600 bg-gray-800/30'
        }`}
        onClick={() => setSelectedRecipient(recipient)}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={recipient.avatar} />
              <AvatarFallback className="bg-gray-700 text-white">
                {recipient.name.split(' ').map((n: string) => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className={`font-semibold ${isSelected ? 'text-blue-300' : 'text-white'}`}>
                {recipient.name}
              </p>
              <p className="text-sm text-gray-400">{recipient.email}</p>
              {isRecent && (
                <p className="text-xs text-gray-500">Last transfer: {recipient.lastTransfer}</p>
              )}
            </div>
            {isSelected && (
              <CheckCircle className="w-5 h-5 text-blue-400" />
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Render step content
  const renderStepContent = () => {
    switch (step) {
      case 'input':
        return (
          <div className="space-y-6">
            {/* Amount Input */}
            <div>
              <Label htmlFor="amount" className="text-white font-medium">Amount</Label>
              <div className="mt-2">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">₹</span>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Enter amount"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      setValidationErrors({});
                    }}
                    className="pl-8 bg-gray-900/50 border-gray-700 text-white text-lg font-semibold"
                    min="1"
                    max={wallet.balance}
                  />
                </div>
                {validationErrors.amount && (
                  <p className="text-red-400 text-sm mt-1">{validationErrors.amount}</p>
                )}
                <p className="text-sm text-gray-400 mt-1">
                  Available balance: ₹{wallet.balance.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Recipient Search */}
            <div>
              <Label className="text-white font-medium">Send to</Label>
              <div className="mt-2 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by name or email"
                  value={recipientSearch}
                  onChange={(e) => setRecipientSearch(e.target.value)}
                  className="pl-10 bg-gray-900/50 border-gray-700 text-white"
                />
                {searching && (
                  <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
                )}
              </div>
              {validationErrors.recipient && (
                <p className="text-red-400 text-sm mt-1">{validationErrors.recipient}</p>
              )}
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div>
                <p className="text-sm text-gray-400 mb-2">Search Results</p>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {searchResults.map(user => renderRecipientCard(user))}
                </div>
              </div>
            )}

            {/* Recent Recipients */}
            {recentRecipients.length > 0 && !recipientSearch && (
              <div>
                <p className="text-sm text-gray-400 mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Recent Recipients
                </p>
                <div className="space-y-2">
                  {recentRecipients.map(user => renderRecipientCard(user, true))}
                </div>
              </div>
            )}

            {/* Description */}
            <div>
              <Label htmlFor="description" className="text-white font-medium">
                Message <span className="text-gray-400">(Optional)</span>
              </Label>
              <Input
                id="description"
                placeholder="Add a message for this transfer"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-2 bg-gray-900/50 border-gray-700 text-white"
                maxLength={500}
              />
            </div>

            {error && (
              <Alert className="border-red-500/50 bg-red-500/10">
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription className="text-red-100">{error}</AlertDescription>
              </Alert>
            )}
          </div>
        );

      case 'confirm':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-white mb-2">Confirm Transfer</h3>
              <p className="text-gray-400">Please review the transfer details</p>
            </div>

            <Card className="bg-gray-800/30 border-gray-700">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={selectedRecipient?.avatar} />
                      <AvatarFallback className="bg-gray-700 text-white">
                        {selectedRecipient?.name.split(' ').map((n: string) => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-white">{selectedRecipient?.name}</p>
                      <p className="text-sm text-gray-400">{selectedRecipient?.email}</p>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-700 pt-4">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Amount</span>
                      <span className="text-2xl font-bold text-white">₹{parseFloat(amount).toLocaleString()}</span>
                    </div>
                    {description && (
                      <div className="flex justify-between mt-2">
                        <span className="text-gray-400">Message</span>
                        <span className="text-white">{description}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {!wallet.security.pinSet && (
              <Alert className="border-yellow-500/50 bg-yellow-500/10">
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription className="text-yellow-100">
                  You need to set up a transaction PIN first to complete transfers.
                </AlertDescription>
              </Alert>
            )}
          </div>
        );


      case 'processing':
        return (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Processing Transfer</h3>
            <p className="text-gray-400">Please wait while we process your transfer</p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Transfer Successful!</h3>
            <p className="text-gray-400 mb-4">
              ₹{amount} has been transferred to {selectedRecipient?.name}
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-green-400">
              <Zap className="w-4 h-4" />
              <span>Transfer completed instantly</span>
            </div>
          </div>
        );

      case 'failed':
        return (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center">
              <X className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Transfer Failed</h3>
            <p className="text-gray-400 mb-4">{error || 'Something went wrong with your transfer'}</p>
            <Button
              onClick={() => setStep('input')}
              className="bg-blue-500 hover:bg-blue-600"
            >
              Try Again
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  // Render action buttons
  const renderActionButtons = () => {
    switch (step) {
      case 'input':
        return (
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleContinue}
              disabled={!amount || !selectedRecipient || parseFloat(amount) <= 0}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              Continue
            </Button>
          </div>
        );

      case 'confirm':
        return (
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setStep('input')}
              className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Back
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!wallet.security.pinSet}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              <Shield className="w-4 h-4 mr-2" />
              {wallet.security.pinSet ? 'Authorize Transfer' : 'Set PIN First'}
            </Button>
          </div>
        );


      default:
        return null;
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-gradient-to-br from-gray-900 to-black border border-gray-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
                <Send className="w-5 h-5" />
              </div>
              Transfer Money
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {step === 'input' && 'Send money instantly to other ZenithWallet users'}
              {step === 'confirm' && 'Review your transfer details before proceeding'}
              {step === 'processing' && 'Your transfer is being processed securely'}
              {step === 'success' && 'Transfer completed successfully'}
              {step === 'failed' && 'Transfer could not be completed'}
            </DialogDescription>
          </DialogHeader>

          {renderStepContent()}
          {renderActionButtons()}
        </DialogContent>
      </Dialog>
      
      {/* PIN Verification Dialog */}
      <PinDialog />
    </>
  );
};

export default TransferMoneyModal;