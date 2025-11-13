import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Smartphone,
  User,
  Phone,
  Search,
  Star,
  Clock,
  Shield,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Loader2,
  Contact,
  QrCode,
  Users,
  X
} from 'lucide-react';

interface Contact {
  id: string;
  name: string;
  phone: string;
  upiId?: string;
  avatar?: string;
  isFrequent: boolean;
  lastTransactionDate?: string;
}

interface MobilePayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobilePayModal: React.FC<MobilePayModalProps> = ({ isOpen, onClose }) => {
  const [paymentStep, setPaymentStep] = useState<'method' | 'details' | 'pin' | 'processing' | 'success' | 'failed'>('method');
  const [selectedMethod, setSelectedMethod] = useState<'upi' | 'mobile' | 'contact'>('upi');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [pin, setPin] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [recentContacts, setRecentContacts] = useState<Contact[]>([]);
  const [frequentContacts, setFrequentContacts] = useState<Contact[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);

  // Mock contacts data
  useEffect(() => {
    if (isOpen) {
      setIsLoadingContacts(true);
      // Simulate API call
      setTimeout(() => {
        setRecentContacts([
          {
            id: '1',
            name: 'Alice Johnson',
            phone: '+1-234-567-8901',
            upiId: 'alice@paytm',
            isFrequent: true,
            lastTransactionDate: '2024-01-15'
          },
          {
            id: '2',
            name: 'Bob Smith',
            phone: '+1-234-567-8902',
            upiId: 'bob@phonepe',
            isFrequent: false,
            lastTransactionDate: '2024-01-14'
          },
          {
            id: '3',
            name: 'Carol Davis',
            phone: '+1-234-567-8903',
            upiId: 'carol@gpay',
            isFrequent: true,
            lastTransactionDate: '2024-01-13'
          }
        ]);
        setFrequentContacts([
          {
            id: '4',
            name: 'David Wilson',
            phone: '+1-234-567-8904',
            upiId: 'david@paytm',
            isFrequent: true,
            lastTransactionDate: '2024-01-12'
          },
          {
            id: '5',
            name: 'Emma Brown',
            phone: '+1-234-567-8905',
            upiId: 'emma@phonepe',
            isFrequent: true,
            lastTransactionDate: '2024-01-11'
          }
        ]);
        setIsLoadingContacts(false);
      }, 1000);
    }
  }, [isOpen]);

  const resetModal = () => {
    setPaymentStep('method');
    setSelectedMethod('upi');
    setRecipient('');
    setAmount('');
    setMessage('');
    setPin('');
    setSearchQuery('');
    setSelectedContact(null);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const handleMethodSelect = (method: 'upi' | 'mobile' | 'contact') => {
    setSelectedMethod(method);
    setPaymentStep('details');
  };

  const handleContactSelect = (contact: Contact) => {
    setSelectedContact(contact);
    setRecipient(contact.upiId || contact.phone);
    setSelectedMethod('contact');
    setPaymentStep('details');
  };

  const validatePaymentDetails = () => {
    if (!recipient || !amount || parseFloat(amount) <= 0) {
      return false;
    }
    
    if (selectedMethod === 'upi' && !recipient.includes('@')) {
      return false;
    }
    
    if (selectedMethod === 'mobile' && !/^\+?\d{10,15}$/.test(recipient.replace(/[-\s]/g, ''))) {
      return false;
    }
    
    return true;
  };

  const handleProceedToPin = () => {
    if (validatePaymentDetails()) {
      setPaymentStep('pin');
    }
  };

  const handlePayment = async () => {
    if (pin.length !== 4) return;
    
    setPaymentStep('processing');
    
    // Simulate payment processing
    try {
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Simulate random success/failure
      const isSuccess = Math.random() > 0.2;
      
      if (isSuccess) {
        setPaymentStep('success');
      } else {
        setPaymentStep('failed');
      }
    } catch (error) {
      setPaymentStep('failed');
    }
  };

  const filteredRecentContacts = recentContacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.phone.includes(searchQuery) ||
    (contact.upiId && contact.upiId.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredFrequentContacts = frequentContacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.phone.includes(searchQuery) ||
    (contact.upiId && contact.upiId.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const ContactCard: React.FC<{ contact: Contact }> = ({ contact }) => (
    <Card 
      className="glass-card-premium border border-white/20 p-3 wallet-card-clickable"
      onClick={() => handleContactSelect(contact)}
    >
      <CardContent className="p-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-cyber flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-white truncate">{contact.name}</h4>
              {contact.isFrequent && <Star className="w-3 h-3 text-yellow-400 fill-current" />}
            </div>
            <p className="text-xs text-gray-400 truncate">{contact.upiId || contact.phone}</p>
            {contact.lastTransactionDate && (
              <p className="text-xs text-gray-500">Last: {contact.lastTransactionDate}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="glass-card-premium border border-white/20 shadow-wallet-card max-w-md mx-auto">
        <DialogHeader className="bg-gradient-cyber p-4 -m-6 mb-0 rounded-t-lg">
          <DialogTitle className="text-gradient-cyber flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            Mobile Pay
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 pt-4">
          {paymentStep === 'method' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">Choose Payment Method</h3>
              
              <div className="grid gap-3">
                <Button
                  variant="outline"
                  className="h-16 flex items-center justify-between p-4 bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary hover:text-primary-foreground rounded-xl transition-all duration-300 wallet-card-clickable"
                  onClick={() => handleMethodSelect('upi')}
                >
                  <div className="flex items-center gap-3">
                    <QrCode className="w-6 h-6" />
                    <div className="text-left">
                      <div className="font-medium">UPI ID</div>
                      <div className="text-xs opacity-70">Send via UPI ID</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4" />
                </Button>

                <Button
                  variant="outline"
                  className="h-16 flex items-center justify-between p-4 bg-secondary/10 hover:bg-secondary/20 border border-secondary/30 text-secondary hover:text-secondary-foreground rounded-xl transition-all duration-300 wallet-card-clickable"
                  onClick={() => handleMethodSelect('mobile')}
                >
                  <div className="flex items-center gap-3">
                    <Phone className="w-6 h-6" />
                    <div className="text-left">
                      <div className="font-medium">Mobile Number</div>
                      <div className="text-xs opacity-70">Send via phone number</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4" />
                </Button>

                <Button
                  variant="outline"
                  className="h-16 flex items-center justify-between p-4 bg-accent/10 hover:bg-accent/20 border border-accent/30 text-accent hover:text-accent-foreground rounded-xl transition-all duration-300 wallet-card-clickable"
                  onClick={() => handleMethodSelect('contact')}
                >
                  <div className="flex items-center gap-3">
                    <Users className="w-6 h-6" />
                    <div className="text-left">
                      <div className="font-medium">From Contacts</div>
                      <div className="text-xs opacity-70">Choose from saved contacts</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {paymentStep === 'details' && selectedMethod === 'contact' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Select Contact</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPaymentStep('method')}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search contacts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-background/20 border-white/20 text-white placeholder:text-gray-400"
                />
              </div>

              {isLoadingContacts ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <span className="ml-2 text-gray-400">Loading contacts...</span>
                </div>
              ) : (
                <div className="space-y-4 max-h-80 overflow-y-auto">
                  {filteredFrequentContacts.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                        <Star className="w-4 h-4 text-yellow-400" />
                        Frequent Contacts
                      </h4>
                      <div className="space-y-2">
                        {filteredFrequentContacts.map(contact => (
                          <ContactCard key={contact.id} contact={contact} />
                        ))}
                      </div>
                    </div>
                  )}

                  {filteredRecentContacts.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-400" />
                        Recent Contacts
                      </h4>
                      <div className="space-y-2">
                        {filteredRecentContacts.map(contact => (
                          <ContactCard key={contact.id} contact={contact} />
                        ))}
                      </div>
                    </div>
                  )}

                  {filteredRecentContacts.length === 0 && filteredFrequentContacts.length === 0 && searchQuery && (
                    <div className="text-center py-8 text-gray-400">
                      <Contact className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No contacts found</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {paymentStep === 'details' && selectedMethod !== 'contact' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Payment Details</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPaymentStep('method')}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-gray-300">
                    {selectedMethod === 'upi' ? 'UPI ID' : 'Mobile Number'}
                  </Label>
                  <Input
                    placeholder={selectedMethod === 'upi' ? 'user@paytm' : '+1-234-567-8900'}
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    className="bg-background/20 border-white/20 text-white placeholder:text-gray-400"
                  />
                </div>

                <div>
                  <Label className="text-gray-300">Amount (₹)</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="bg-background/20 border-white/20 text-white placeholder:text-gray-400"
                  />
                </div>

                <div>
                  <Label className="text-gray-300">Message (Optional)</Label>
                  <Input
                    placeholder="Payment for..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="bg-background/20 border-white/20 text-white placeholder:text-gray-400"
                  />
                </div>

                <Button
                  onClick={handleProceedToPin}
                  disabled={!validatePaymentDetails()}
                  className="w-full btn-cyber h-12"
                >
                  Proceed to Pay ₹{amount || '0.00'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {paymentStep === 'details' && selectedContact && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Payment Details</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPaymentStep('method')}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <Card className="glass-card border border-white/20 p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-cyber flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-medium text-white">{selectedContact.name}</h4>
                    <p className="text-sm text-gray-400">{selectedContact.upiId || selectedContact.phone}</p>
                  </div>
                </div>
              </Card>

              <div className="space-y-4">
                <div>
                  <Label className="text-gray-300">Amount (₹)</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="bg-background/20 border-white/20 text-white placeholder:text-gray-400"
                  />
                </div>

                <div>
                  <Label className="text-gray-300">Message (Optional)</Label>
                  <Input
                    placeholder="Payment for..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="bg-background/20 border-white/20 text-white placeholder:text-gray-400"
                  />
                </div>

                <Button
                  onClick={handleProceedToPin}
                  disabled={!validatePaymentDetails()}
                  className="w-full btn-cyber h-12"
                >
                  Proceed to Pay ₹{amount || '0.00'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {paymentStep === 'pin' && (
            <div className="space-y-6">
              <div className="text-center">
                <Shield className="w-12 h-12 mx-auto mb-3 text-primary" />
                <h3 className="text-lg font-semibold text-white mb-2">Enter PIN</h3>
                <p className="text-gray-400">Confirm payment of ₹{amount}</p>
                {selectedContact && (
                  <p className="text-sm text-gray-500">to {selectedContact.name}</p>
                )}
              </div>

              <div className="flex justify-center gap-2">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center ${
                      i < pin.length ? 'border-primary bg-primary/20' : 'border-white/20 bg-background/20'
                    }`}
                  >
                    {i < pin.length && <div className="w-3 h-3 rounded-full bg-primary" />}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '⌫'].map((num, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="h-12 text-lg bg-background/20 border-white/20 hover:bg-primary/20 hover:border-primary/30"
                    onClick={() => {
                      if (num === '⌫') {
                        setPin(prev => prev.slice(0, -1));
                      } else if (num !== '' && pin.length < 4) {
                        setPin(prev => prev + num.toString());
                      }
                    }}
                    disabled={num === ''}
                  >
                    {num}
                  </Button>
                ))}
              </div>

              <Button
                onClick={handlePayment}
                disabled={pin.length !== 4}
                className="w-full btn-cyber h-12"
              >
                Confirm Payment
                <Shield className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {paymentStep === 'processing' && (
            <div className="text-center space-y-6 py-8">
              <Loader2 className="w-16 h-16 mx-auto animate-spin text-primary" />
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Processing Payment</h3>
                <p className="text-gray-400">Please wait while we process your payment...</p>
              </div>
            </div>
          )}

          {paymentStep === 'success' && (
            <div className="text-center space-y-6 py-8">
              <CheckCircle className="w-16 h-16 mx-auto text-green-400" />
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Payment Successful!</h3>
                <p className="text-gray-400">₹{amount} sent successfully</p>
                {selectedContact && (
                  <p className="text-sm text-gray-500">to {selectedContact.name}</p>
                )}
              </div>
              <Button onClick={handleClose} className="w-full btn-cyber h-12">
                Done
              </Button>
            </div>
          )}

          {paymentStep === 'failed' && (
            <div className="text-center space-y-6 py-8">
              <AlertCircle className="w-16 h-16 mx-auto text-red-400" />
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Payment Failed</h3>
                <p className="text-gray-400">Unable to process your payment. Please try again.</p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setPaymentStep('pin')}
                  variant="outline"
                  className="flex-1 h-12"
                >
                  Retry
                </Button>
                <Button onClick={handleClose} className="flex-1 btn-cyber h-12">
                  Close
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MobilePayModal;