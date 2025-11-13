import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { walletAPI } from '@/lib/walletAPI';
import type { WalletData } from '@/types/wallet';
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
  X,
  ArrowLeft
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

const MobilePayPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  
  // States
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);
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
  const [error, setError] = useState('');

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
  }, [isAuthenticated, user]);

  // Mock contacts data
  useEffect(() => {
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
  }, []);

  const resetPage = () => {
    setPaymentStep('method');
    setSelectedMethod('upi');
    setRecipient('');
    setAmount('');
    setMessage('');
    setPin('');
    setSearchQuery('');
    setSelectedContact(null);
    setError('');
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
      setError('Please enter recipient and valid amount');
      return false;
    }
    
    if (selectedMethod === 'upi' && !recipient.includes('@')) {
      setError('Please enter a valid UPI ID (e.g., user@paytm)');
      return false;
    }
    
    if (selectedMethod === 'mobile' && !/^\+?\d{10,15}$/.test(recipient.replace(/[-\s]/g, ''))) {
      setError('Please enter a valid mobile number');
      return false;
    }
    
    // Check if amount exceeds limit
    if (wallet && parseFloat(amount) > wallet.limits.perTransaction) {
      setError(`Amount exceeds transaction limit of ₹${wallet.limits.perTransaction}`);
      return false;
    }
    
    setError('');
    return true;
  };

  const handleProceedToPin = () => {
    if (validatePaymentDetails()) {
      setPaymentStep('pin');
    }
  };

  const handlePayment = async () => {
    if (pin.length !== 4) {
      setError('Please enter a 4-digit PIN');
      return;
    }
    
    if (!wallet) {
      setError('Wallet data not loaded');
      return;
    }
    
    setPaymentStep('processing');
    setError('');
    
    // Simulate payment processing
    try {
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Simulate random success/failure
      const isSuccess = Math.random() > 0.2;
      
      if (isSuccess) {
        setPaymentStep('success');
        toast({
          title: 'Payment Successful',
          description: `₹${amount} sent successfully to ${selectedContact?.name || recipient}`,
        });
      } else {
        setPaymentStep('failed');
        setError('Payment failed. Please try again.');
      }
    } catch (err) {
      setPaymentStep('failed');
      setError('Payment failed. Please try again.');
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
      className="glass-card border border-white/20 p-3 rounded-xl cursor-pointer hover:bg-accent/10 transition-colors"
      onClick={() => handleContactSelect(contact)}
    >
      <CardContent className="p-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
            <User className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-foreground truncate">{contact.name}</h4>
              {contact.isFrequent && <Star className="w-3 h-3 text-yellow-400 fill-current" />}
            </div>
            <p className="text-xs text-muted-foreground truncate">{contact.upiId || contact.phone}</p>
            {contact.lastTransactionDate && (
              <p className="text-xs text-muted-foreground/70">Last: {contact.lastTransactionDate}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Auth Error State
  if (authError || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center max-w-md text-white">
          <AlertCircle className="w-16 h-16 mx-auto mb-6 text-red-400" />
          <h2 className="text-3xl font-bold mb-4">Authentication Required</h2>
          <p className="text-gray-300 mb-6 leading-relaxed">
            Please log in to access mobile pay and make payments.
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
            onClick={() => {
              if (paymentStep === 'method') {
                navigate('/wallet');
              } else {
                resetPage();
              }
            }}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {paymentStep === 'method' ? 'Back' : 'Cancel'}
          </Button>
          <h1 className="text-xl font-bold text-foreground">Mobile Pay</h1>
          <div className="w-10"></div> {/* Spacer for alignment */}
        </div>

        {/* Method Selection Step */}
        {paymentStep === 'method' && (
          <div className="space-y-6">
            <div className="text-center mb-2">
              <h2 className="text-lg font-semibold text-foreground mb-1">Choose Payment Method</h2>
              <p className="text-muted-foreground text-sm">
                Select how you'd like to send money
              </p>
            </div>
            
            <Card className="glass-card border border-white/20 rounded-2xl">
              <CardContent className="p-6">
                <div className="grid gap-4">
                  <Button
                    variant="outline"
                    className="h-16 flex items-center justify-between p-4 bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary rounded-xl transition-all"
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
                    className="h-16 flex items-center justify-between p-4 bg-secondary/10 hover:bg-secondary/20 border border-secondary/30 text-secondary rounded-xl transition-all"
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
                    className="h-16 flex items-center justify-between p-4 bg-accent/10 hover:bg-accent/20 border border-accent/30 text-accent rounded-xl transition-all"
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
              </CardContent>
            </Card>
          </div>
        )}

        {/* Contact Selection Step */}
        {paymentStep === 'details' && selectedMethod === 'contact' && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-foreground mb-1">Select Contact</h2>
              <p className="text-muted-foreground text-sm">
                Choose a contact to send money to
              </p>
            </div>

            <Card className="glass-card border border-white/20 rounded-2xl">
              <CardContent className="p-6">
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search contacts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-input border-border text-foreground rounded-xl"
                  />
                </div>

                {isLoadingContacts ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    <span className="ml-2 text-muted-foreground">Loading contacts...</span>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {filteredFrequentContacts.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
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
                        <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
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
                      <div className="text-center py-8 text-muted-foreground">
                        <Contact className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No contacts found</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Payment Details Step (UPI/Mobile) */}
        {paymentStep === 'details' && selectedMethod !== 'contact' && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-foreground mb-1">Payment Details</h2>
              <p className="text-muted-foreground text-sm">
                Enter payment information
              </p>
            </div>

            <Card className="glass-card border border-white/20 rounded-2xl">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-foreground">
                      {selectedMethod === 'upi' ? 'UPI ID' : 'Mobile Number'}
                    </Label>
                    <Input
                      placeholder={selectedMethod === 'upi' ? 'user@paytm' : '+1-234-567-8900'}
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      className="mt-2 bg-input border-border text-foreground rounded-xl"
                    />
                  </div>

                  <div>
                    <Label className="text-foreground">Amount (₹)</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="mt-2 bg-input border-border text-foreground rounded-xl"
                      max={wallet?.limits?.perTransaction || 50000}
                    />
                  </div>

                  <div>
                    <Label className="text-foreground">Message (Optional)</Label>
                    <Input
                      placeholder="Payment for..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="mt-2 bg-input border-border text-foreground rounded-xl"
                    />
                  </div>

                  {error && (
                    <div className="text-destructive text-sm">{error}</div>
                  )}

                  <Button
                    onClick={handleProceedToPin}
                    disabled={!recipient || !amount}
                    className="w-full rounded-xl h-12"
                  >
                    Proceed to Pay ₹{amount || '0.00'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Payment Details Step (Contact) */}
        {paymentStep === 'details' && selectedContact && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-foreground mb-1">Payment Details</h2>
              <p className="text-muted-foreground text-sm">
                Enter payment information
              </p>
            </div>

            <Card className="glass-card border border-white/20 rounded-2xl">
              <CardContent className="p-6">
                <Card className="bg-card/80 border border-white/20 mb-6 rounded-xl">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center">
                        <User className="w-6 h-6 text-primary-foreground" />
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground">{selectedContact.name}</h4>
                        <p className="text-sm text-muted-foreground">{selectedContact.upiId || selectedContact.phone}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-4">
                  <div>
                    <Label className="text-foreground">Amount (₹)</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="mt-2 bg-input border-border text-foreground rounded-xl"
                      max={wallet?.limits?.perTransaction || 50000}
                    />
                  </div>

                  <div>
                    <Label className="text-foreground">Message (Optional)</Label>
                    <Input
                      placeholder="Payment for..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="mt-2 bg-input border-border text-foreground rounded-xl"
                    />
                  </div>

                  {error && (
                    <div className="text-destructive text-sm">{error}</div>
                  )}

                  <Button
                    onClick={handleProceedToPin}
                    disabled={!amount}
                    className="w-full rounded-xl h-12"
                  >
                    Proceed to Pay ₹{amount || '0.00'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* PIN Entry Step */}
        {paymentStep === 'pin' && (
          <div className="space-y-6">
            <Card className="glass-card border border-white/20 rounded-2xl">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <Shield className="w-12 h-12 mx-auto mb-3 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground mb-1">Enter PIN</h2>
                  <p className="text-muted-foreground">Confirm payment of ₹{amount}</p>
                  {selectedContact && (
                    <p className="text-sm text-muted-foreground/70">to {selectedContact.name}</p>
                  )}
                </div>

                <div className="flex justify-center gap-2 mb-6">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center ${
                        i < pin.length ? 'border-primary bg-primary/20' : 'border-border bg-input'
                      }`}
                    >
                      {i < pin.length && <div className="w-3 h-3 rounded-full bg-primary" />}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-3 mb-6">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '⌫'].map((num, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="h-12 text-lg bg-input border-border hover:bg-accent/50 rounded-xl"
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

                {error && (
                  <div className="text-destructive text-center mb-4">{error}</div>
                )}

                <Button
                  onClick={handlePayment}
                  disabled={pin.length !== 4}
                  className="w-full rounded-xl h-12"
                >
                  Confirm Payment
                  <Shield className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Processing Step */}
        {paymentStep === 'processing' && (
          <div className="flex items-center justify-center min-h-[70vh]">
            <div className="text-center space-y-6">
              <Loader2 className="w-16 h-16 mx-auto animate-spin text-primary" />
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
        {paymentStep === 'success' && (
          <div className="flex items-center justify-center min-h-[70vh]">
            <div className="text-center space-y-6">
              <CheckCircle className="w-16 h-16 mx-auto text-success" />
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Payment Successful!</h3>
                <p className="text-muted-foreground">
                  ₹{amount} sent successfully
                </p>
                {selectedContact && (
                  <p className="text-sm text-muted-foreground/70">to {selectedContact.name}</p>
                )}
              </div>
              <Button 
                onClick={() => navigate('/wallet')}
                className="rounded-xl h-12"
              >
                Back to Wallet
              </Button>
            </div>
          </div>
        )}

        {/* Failed Step */}
        {paymentStep === 'failed' && (
          <div className="flex items-center justify-center min-h-[70vh]">
            <div className="text-center space-y-6">
              <AlertCircle className="w-16 h-16 mx-auto text-destructive" />
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Payment Failed</h3>
                <p className="text-muted-foreground mb-4">{error || 'Unable to process your payment. Please try again.'}</p>
                <div className="flex gap-3">
                  <Button
                    onClick={() => setPaymentStep('pin')}
                    variant="outline"
                    className="flex-1 rounded-xl h-12"
                  >
                    Retry
                  </Button>
                  <Button 
                    onClick={() => navigate('/wallet')}
                    className="flex-1 rounded-xl h-12"
                  >
                    Back to Wallet
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobilePayPage;