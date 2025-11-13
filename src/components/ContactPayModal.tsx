import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Users, 
  Search, 
  Send, 
  Phone, 
  Mail, 
  Star,
  Plus,
  Zap,
  Smartphone,
  CreditCard,
  Clock,
  ArrowRight,
  UserPlus,
  Contact,
  MessageCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface Contact {
  id: number;
  name: string;
  phone: string;
  email: string;
  upiId: string;
  avatar: string;
  lastTransaction: string;
  isFrequent: boolean;
  isFavorite: boolean;
}

interface ContactPayModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaymentComplete?: (data: any) => void;
}

const mockContacts: Contact[] = [
  {
    id: 1,
    name: 'Alice Johnson',
    phone: '+91 98765-43210',
    email: 'alice@email.com',
    upiId: 'alice@paytm',
    avatar: '',
    lastTransaction: '₹2,125',
    isFrequent: true,
    isFavorite: true
  },
  {
    id: 2,
    name: 'Bob Wilson',
    phone: '+91 87654-32109',
    email: 'bob@email.com',
    upiId: 'bob@gpay',
    avatar: '',
    lastTransaction: '₹845',
    isFrequent: true,
    isFavorite: false
  },
  {
    id: 3,
    name: 'Carol Smith',
    phone: '+91 76543-21098',
    email: 'carol@email.com',
    upiId: 'carol@phonepe',
    avatar: '',
    lastTransaction: '₹500',
    isFrequent: false,
    isFavorite: true
  },
  {
    id: 4,
    name: 'David Brown',
    phone: '+91 65432-10987',
    email: 'david@email.com',
    upiId: 'david@paytm',
    avatar: '',
    lastTransaction: '₹1,200',
    isFrequent: true,
    isFavorite: false
  },
  {
    id: 5,
    name: 'Eva Davis',
    phone: '+91 54321-09876',
    email: 'eva@email.com',
    upiId: 'eva@upi',
    avatar: '',
    lastTransaction: '₹750',
    isFrequent: false,
    isFavorite: false
  }
];

const ContactPayModal = ({ open, onOpenChange, onPaymentComplete }: ContactPayModalProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('contacts');

  const filteredContacts = mockContacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.phone.includes(searchQuery) ||
    contact.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const favoriteContacts = filteredContacts.filter(contact => contact.isFavorite);
  const frequentContacts = filteredContacts.filter(contact => contact.isFrequent);
  const allContacts = filteredContacts;

  const handleContactSelect = (contact: Contact) => {
    setSelectedContact(contact);
  };

  const handlePayment = async () => {
    if (!selectedContact || !paymentAmount) {
      toast.error('Please select a contact and enter amount');
      return;
    }

    setIsProcessing(true);

    // Simulate payment processing
    setTimeout(() => {
      const paymentData = {
        amount: parseFloat(paymentAmount),
        recipient: selectedContact.name,
        recipientId: paymentMethod === 'upi' ? selectedContact.upiId : selectedContact.phone,
        note: paymentNote,
        method: paymentMethod === 'upi' ? 'UPI' : 'Mobile Pay',
        timestamp: new Date().toISOString()
      };

      onPaymentComplete?.(paymentData);
      toast.success(`₹${paymentAmount} sent to ${selectedContact.name}!`);
      
      // Reset form
      setSelectedContact(null);
      setPaymentAmount('');
      setPaymentNote('');
      setIsProcessing(false);
      onOpenChange(false);
    }, 2000);
  };

  const getContactInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const resetForm = () => {
    setSelectedContact(null);
    setPaymentAmount('');
    setPaymentNote('');
    setSearchQuery('');
  };

  const ContactCard = ({ contact, onClick }: { contact: Contact; onClick: () => void }) => (
    <Card 
      className="bg-white/5 border-white/20 hover:bg-white/10 cursor-pointer transition-all duration-200 hover:scale-[1.02]"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="w-12 h-12">
              <AvatarImage src={contact.avatar} alt={contact.name} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                {getContactInitials(contact.name)}
              </AvatarFallback>
            </Avatar>
            {contact.isFavorite && (
              <Star className="w-4 h-4 text-yellow-400 absolute -top-1 -right-1 fill-current" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium text-white truncate">{contact.name}</p>
              {contact.isFrequent && (
                <Badge variant="outline" className="border-green-500/50 text-green-400 text-xs">
                  <Clock className="w-3 h-3 mr-1" />
                  Frequent
                </Badge>
              )}
            </div>
            <p className="text-white/60 text-sm truncate">{contact.phone}</p>
            <p className="text-white/50 text-xs truncate">{contact.upiId}</p>
          </div>
          <div className="text-right">
            <p className="text-white/80 text-sm font-medium">{contact.lastTransaction}</p>
            <ArrowRight className="w-4 h-4 text-white/40 ml-auto mt-1" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl bg-black/95 backdrop-blur-xl border border-white/20 max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            Send to Contacts
          </DialogTitle>
        </DialogHeader>

        {!selectedContact ? (
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Search Bar */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-4 h-4" />
              <Input
                placeholder="Search contacts by name, phone, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/10 border-white/30 text-white placeholder:text-white/50"
              />
            </div>

            {/* Contact Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              <TabsList className="grid w-full grid-cols-3 bg-white/10 border border-white/20 mb-4">
                <TabsTrigger value="favorites" className="data-[state=active]:bg-white/20 text-white">
                  <Star className="w-4 h-4 mr-2" />
                  Favorites ({favoriteContacts.length})
                </TabsTrigger>
                <TabsTrigger value="frequent" className="data-[state=active]:bg-white/20 text-white">
                  <Clock className="w-4 h-4 mr-2" />
                  Frequent ({frequentContacts.length})
                </TabsTrigger>
                <TabsTrigger value="contacts" className="data-[state=active]:bg-white/20 text-white">
                  <Contact className="w-4 h-4 mr-2" />
                  All Contacts ({allContacts.length})
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-auto">
                <TabsContent value="favorites" className="mt-0 space-y-3">
                  {favoriteContacts.length > 0 ? (
                    favoriteContacts.map(contact => (
                      <ContactCard 
                        key={contact.id} 
                        contact={contact} 
                        onClick={() => handleContactSelect(contact)} 
                      />
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Star className="w-12 h-12 text-white/30 mx-auto mb-4" />
                      <p className="text-white/60">No favorite contacts found</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="frequent" className="mt-0 space-y-3">
                  {frequentContacts.length > 0 ? (
                    frequentContacts.map(contact => (
                      <ContactCard 
                        key={contact.id} 
                        contact={contact} 
                        onClick={() => handleContactSelect(contact)} 
                      />
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Clock className="w-12 h-12 text-white/30 mx-auto mb-4" />
                      <p className="text-white/60">No frequent contacts found</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="contacts" className="mt-0 space-y-3">
                  {allContacts.length > 0 ? (
                    allContacts.map(contact => (
                      <ContactCard 
                        key={contact.id} 
                        contact={contact} 
                        onClick={() => handleContactSelect(contact)} 
                      />
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Contact className="w-12 h-12 text-white/30 mx-auto mb-4" />
                      <p className="text-white/60">No contacts found</p>
                    </div>
                  )}
                </TabsContent>
              </div>
            </Tabs>

            {/* Add New Contact Button */}
            <Button 
              variant="outline" 
              className="w-full mt-4 border-white/30 text-white hover:bg-white/10"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Add New Contact
            </Button>
          </div>
        ) : (
          // Payment Form
          <div className="space-y-6">
            {/* Selected Contact Info */}
            <Card className="bg-white/5 border-white/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={selectedContact.avatar} alt={selectedContact.name} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-lg">
                      {getContactInitials(selectedContact.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white text-lg">{selectedContact.name}</h3>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-white/60 text-sm">
                        <Phone className="w-4 h-4" />
                        <span>{selectedContact.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-white/60 text-sm">
                        <Mail className="w-4 h-4" />
                        <span>{selectedContact.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-white/60 text-sm">
                        <Zap className="w-4 h-4" />
                        <span>{selectedContact.upiId}</span>
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={resetForm}
                    className="border-white/30 text-white hover:bg-white/10"
                  >
                    Change
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method Selection */}
            <div className="space-y-3">
              <Label className="text-white font-medium">Payment Method</Label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant={paymentMethod === 'upi' ? 'default' : 'outline'}
                  onClick={() => setPaymentMethod('upi')}
                  className={paymentMethod === 'upi' 
                    ? 'bg-purple-500 hover:bg-purple-600 text-white' 
                    : 'border-white/30 text-white hover:bg-white/10'
                  }
                >
                  <Zap className="w-4 h-4 mr-2" />
                  UPI Payment
                </Button>
                <Button
                  variant={paymentMethod === 'mobile' ? 'default' : 'outline'}
                  onClick={() => setPaymentMethod('mobile')}
                  className={paymentMethod === 'mobile' 
                    ? 'bg-green-500 hover:bg-green-600 text-white' 
                    : 'border-white/30 text-white hover:bg-white/10'
                  }
                >
                  <Smartphone className="w-4 h-4 mr-2" />
                  Mobile Pay
                </Button>
              </div>
            </div>

            {/* Payment Amount */}
            <div className="space-y-2">
              <Label className="text-white font-medium">Amount</Label>
              <Input
                type="number"
                placeholder="₹ 0.00"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="bg-white/10 border-white/30 text-white text-lg font-semibold placeholder:text-white/50"
              />
            </div>

            {/* Payment Note */}
            <div className="space-y-2">
              <Label className="text-white font-medium">Note (Optional)</Label>
              <Input
                placeholder="Add a note for this payment"
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
                className="bg-white/10 border-white/30 text-white placeholder:text-white/50"
              />
            </div>

            {/* Quick Amount Buttons */}
            <div className="space-y-2">
              <Label className="text-white font-medium">Quick Amounts</Label>
              <div className="grid grid-cols-4 gap-2">
                {['100', '500', '1000', '2000'].map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    size="sm"
                    onClick={() => setPaymentAmount(amount)}
                    className="border-white/30 text-white hover:bg-white/10"
                  >
                    ₹{amount}
                  </Button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button 
                onClick={resetForm} 
                variant="outline" 
                className="flex-1 border-white/30 text-white hover:bg-white/10"
              >
                Back to Contacts
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
                    Send ₹{paymentAmount || '0'}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ContactPayModal;