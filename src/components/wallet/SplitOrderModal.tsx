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
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Users,
  Plus,
  Minus,
  DollarSign,
  Calculator,
  Share2,
  Check,
  X,
  User,
  Phone,
  Mail,
  Copy,
  Send,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowRight,
  Shield,
  Receipt,
  Clock,
  UserPlus
} from 'lucide-react';

interface Participant {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  amount: number;
  hasPaid: boolean;
  paymentDate?: string;
  isCurrentUser?: boolean;
}

interface SplitItem {
  id: string;
  name: string;
  amount: number;
  participants: string[]; // participant IDs
}

interface SplitOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SplitOrderModal: React.FC<SplitOrderModalProps> = ({ isOpen, onClose }) => {
  const [splitStep, setSplitStep] = useState<'setup' | 'items' | 'participants' | 'review' | 'payment' | 'pin' | 'processing' | 'success' | 'failed'>('setup');
  const [splitMethod, setSplitMethod] = useState<'equal' | 'custom' | 'by-item'>('equal');
  const [totalAmount, setTotalAmount] = useState('');
  const [description, setDescription] = useState('');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [splitItems, setSplitItems] = useState<SplitItem[]>([]);
  const [newParticipantName, setNewParticipantName] = useState('');
  const [newParticipantPhone, setNewParticipantPhone] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [newItemAmount, setNewItemAmount] = useState('');
  const [pin, setPin] = useState('');
  const [splitShareLink, setSplitShareLink] = useState('');
  const [currentUserPayment, setCurrentUserPayment] = useState(0);

  useEffect(() => {
    if (isOpen) {
      // Initialize with current user
      setParticipants([
        {
          id: 'user1',
          name: 'You',
          amount: 0,
          hasPaid: false,
          isCurrentUser: true
        }
      ]);
    }
  }, [isOpen]);

  const resetModal = () => {
    setSplitStep('setup');
    setSplitMethod('equal');
    setTotalAmount('');
    setDescription('');
    setParticipants([{
      id: 'user1',
      name: 'You',
      amount: 0,
      hasPaid: false,
      isCurrentUser: true
    }]);
    setSplitItems([]);
    setNewParticipantName('');
    setNewParticipantPhone('');
    setNewItemName('');
    setNewItemAmount('');
    setPin('');
    setSplitShareLink('');
    setCurrentUserPayment(0);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const addParticipant = () => {
    if (!newParticipantName) return;
    
    const newParticipant: Participant = {
      id: `participant_${Date.now()}`,
      name: newParticipantName,
      phone: newParticipantPhone,
      amount: 0,
      hasPaid: false
    };
    
    setParticipants([...participants, newParticipant]);
    setNewParticipantName('');
    setNewParticipantPhone('');
  };

  const removeParticipant = (participantId: string) => {
    setParticipants(participants.filter(p => p.id !== participantId));
  };

  const addSplitItem = () => {
    if (!newItemName || !newItemAmount) return;
    
    const newItem: SplitItem = {
      id: `item_${Date.now()}`,
      name: newItemName,
      amount: parseFloat(newItemAmount),
      participants: [participants[0].id] // Default to current user
    };
    
    setSplitItems([...splitItems, newItem]);
    setNewItemName('');
    setNewItemAmount('');
  };

  const removeSplitItem = (itemId: string) => {
    setSplitItems(splitItems.filter(item => item.id !== itemId));
  };

  const toggleItemParticipant = (itemId: string, participantId: string) => {
    setSplitItems(splitItems.map(item => {
      if (item.id === itemId) {
        const newParticipants = item.participants.includes(participantId)
          ? item.participants.filter(id => id !== participantId)
          : [...item.participants, participantId];
        return { ...item, participants: newParticipants };
      }
      return item;
    }));
  };

  const updateParticipantAmount = (participantId: string, amount: number) => {
    setParticipants(participants.map(p => 
      p.id === participantId ? { ...p, amount } : p
    ));
  };

  const calculateSplit = () => {
    const total = parseFloat(totalAmount) || 0;
    
    if (splitMethod === 'equal') {
      const amountPerPerson = total / participants.length;
      setParticipants(participants.map(p => ({ ...p, amount: amountPerPerson })));
    } else if (splitMethod === 'by-item') {
      const participantAmounts: { [key: string]: number } = {};
      
      // Initialize amounts
      participants.forEach(p => {
        participantAmounts[p.id] = 0;
      });
      
      // Calculate amounts based on items
      splitItems.forEach(item => {
        const amountPerPerson = item.amount / item.participants.length;
        item.participants.forEach(participantId => {
          participantAmounts[participantId] += amountPerPerson;
        });
      });
      
      setParticipants(participants.map(p => ({
        ...p,
        amount: participantAmounts[p.id] || 0
      })));
    }
  };

  const generateShareLink = () => {
    const splitData = {
      description,
      totalAmount,
      participants: participants.map(p => ({ name: p.name, amount: p.amount })),
      timestamp: Date.now()
    };
    
    const encodedData = btoa(JSON.stringify(splitData));
    const shareLink = `${window.location.origin}/split/${encodedData}`;
    setSplitShareLink(shareLink);
    return shareLink;
  };

  const copyShareLink = () => {
    const link = generateShareLink();
    navigator.clipboard.writeText(link);
  };

  const sendSplitRequest = () => {
    // Simulate sending split request
    const link = generateShareLink();
    
    // In a real app, this would send notifications/emails/SMS
    console.log('Sending split request:', link);
    setSplitStep('payment');
  };

  const handlePayment = async () => {
    if (pin.length !== 4) return;
    
    setSplitStep('processing');
    
    try {
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Simulate random success/failure
      const isSuccess = Math.random() > 0.1;
      
      if (isSuccess) {
        setSplitStep('success');
      } else {
        setSplitStep('failed');
      }
    } catch (error) {
      setSplitStep('failed');
    }
  };

  const currentUserAmount = participants.find(p => p.isCurrentUser)?.amount || 0;
  const totalCalculated = participants.reduce((sum, p) => sum + p.amount, 0);

  const ParticipantCard: React.FC<{ participant: Participant; canEdit?: boolean }> = ({ participant, canEdit = false }) => (
    <Card className="glass-card border border-white/20 p-3">
      <CardContent className="p-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-cyber flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-medium text-white">{participant.name}</h4>
              {participant.phone && (
                <p className="text-xs text-gray-400">{participant.phone}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canEdit && splitMethod === 'custom' ? (
              <Input
                type="number"
                value={participant.amount}
                onChange={(e) => updateParticipantAmount(participant.id, parseFloat(e.target.value) || 0)}
                className="w-20 h-8 text-right bg-background/20 border-white/20 text-white"
              />
            ) : (
              <span className="text-primary font-semibold">₹{participant.amount.toFixed(2)}</span>
            )}
            {participant.hasPaid && (
              <Check className="w-4 h-4 text-green-400" />
            )}
            {!participant.isCurrentUser && canEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeParticipant(participant.id)}
                className="w-6 h-6 p-0 text-red-400 hover:text-red-300"
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const SplitItemCard: React.FC<{ item: SplitItem }> = ({ item }) => (
    <Card className="glass-card border border-white/20 p-3">
      <CardContent className="p-0">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium text-white">{item.name}</h4>
          <div className="flex items-center gap-2">
            <span className="text-primary font-semibold">₹{item.amount.toFixed(2)}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeSplitItem(item.id)}
              className="w-6 h-6 p-0 text-red-400 hover:text-red-300"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-1">
          {participants.map(participant => (
            <Badge
              key={participant.id}
              variant={item.participants.includes(participant.id) ? "default" : "outline"}
              className={`cursor-pointer text-xs ${
                item.participants.includes(participant.id)
                  ? 'bg-primary/20 text-primary border-primary/30'
                  : 'bg-background/20 text-gray-400 border-white/20'
              }`}
              onClick={() => toggleItemParticipant(item.id, participant.id)}
            >
              {participant.name}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="glass-card-premium border border-white/20 shadow-wallet-card max-w-lg mx-auto">
        <DialogHeader className="bg-gradient-cyber p-4 -m-6 mb-0 rounded-t-lg">
          <DialogTitle className="text-gradient-cyber flex items-center gap-2">
            <Users className="w-5 h-5" />
            Split Order
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 pt-4">
          {splitStep === 'setup' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">Setup Split</h3>
              
              <div>
                <Label className="text-gray-300">Description</Label>
                <Input
                  placeholder="Dinner at restaurant, Trip expenses, etc."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="bg-background/20 border-white/20 text-white placeholder:text-gray-400"
                />
              </div>

              <div>
                <Label className="text-gray-300">Total Amount (₹)</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  className="bg-background/20 border-white/20 text-white placeholder:text-gray-400"
                />
              </div>

              <div>
                <Label className="text-gray-300">Split Method</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <Button
                    variant={splitMethod === 'equal' ? 'default' : 'outline'}
                    onClick={() => setSplitMethod('equal')}
                    className="h-12 flex-col gap-1 text-xs"
                  >
                    <Calculator className="w-4 h-4" />
                    Equal
                  </Button>
                  <Button
                    variant={splitMethod === 'custom' ? 'default' : 'outline'}
                    onClick={() => setSplitMethod('custom')}
                    className="h-12 flex-col gap-1 text-xs"
                  >
                    <DollarSign className="w-4 h-4" />
                    Custom
                  </Button>
                  <Button
                    variant={splitMethod === 'by-item' ? 'default' : 'outline'}
                    onClick={() => setSplitMethod('by-item')}
                    className="h-12 flex-col gap-1 text-xs"
                  >
                    <Receipt className="w-4 h-4" />
                    By Item
                  </Button>
                </div>
              </div>

              <Button
                onClick={() => setSplitStep(splitMethod === 'by-item' ? 'items' : 'participants')}
                disabled={!description || !totalAmount}
                className="w-full btn-cyber h-12"
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {splitStep === 'items' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Add Items</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSplitStep('setup')}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <Card className="glass-card border border-white/20 p-4">
                <CardHeader className="p-0 mb-3">
                  <h4 className="font-medium text-white">Add New Item</h4>
                </CardHeader>
                <CardContent className="p-0 space-y-3">
                  <Input
                    placeholder="Item name"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    className="bg-background/20 border-white/20 text-white placeholder:text-gray-400"
                  />
                  <Input
                    type="number"
                    placeholder="Amount"
                    value={newItemAmount}
                    onChange={(e) => setNewItemAmount(e.target.value)}
                    className="bg-background/20 border-white/20 text-white placeholder:text-gray-400"
                  />
                  <Button
                    onClick={addSplitItem}
                    disabled={!newItemName || !newItemAmount}
                    className="w-full btn-cyber"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Item
                  </Button>
                </CardContent>
              </Card>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {splitItems.map(item => (
                  <SplitItemCard key={item.id} item={item} />
                ))}
              </div>

              <div className="flex justify-between items-center p-3 bg-background/20 rounded-lg">
                <span className="text-white">Items Total:</span>
                <span className="text-primary font-semibold">
                  ₹{splitItems.reduce((sum, item) => sum + item.amount, 0).toFixed(2)}
                </span>
              </div>

              <Button
                onClick={() => setSplitStep('participants')}
                disabled={splitItems.length === 0}
                className="w-full btn-cyber h-12"
              >
                Add Participants
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {splitStep === 'participants' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Add Participants</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSplitStep(splitMethod === 'by-item' ? 'items' : 'setup')}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <Card className="glass-card border border-white/20 p-4">
                <CardHeader className="p-0 mb-3">
                  <h4 className="font-medium text-white">Add Participant</h4>
                </CardHeader>
                <CardContent className="p-0 space-y-3">
                  <Input
                    placeholder="Participant name"
                    value={newParticipantName}
                    onChange={(e) => setNewParticipantName(e.target.value)}
                    className="bg-background/20 border-white/20 text-white placeholder:text-gray-400"
                  />
                  <Input
                    placeholder="Phone number (optional)"
                    value={newParticipantPhone}
                    onChange={(e) => setNewParticipantPhone(e.target.value)}
                    className="bg-background/20 border-white/20 text-white placeholder:text-gray-400"
                  />
                  <Button
                    onClick={addParticipant}
                    disabled={!newParticipantName}
                    className="w-full btn-cyber"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Participant
                  </Button>
                </CardContent>
              </Card>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {participants.map(participant => (
                  <ParticipantCard key={participant.id} participant={participant} canEdit={true} />
                ))}
              </div>

              <Button
                onClick={() => setSplitStep('review')}
                disabled={participants.length < 2}
                className="w-full btn-cyber h-12"
              >
                Review Split
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {splitStep === 'review' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Review Split</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSplitStep('participants')}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <Card className="glass-card border border-white/20 p-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Description:</span>
                    <span className="text-white">{description}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Amount:</span>
                    <span className="text-white">₹{totalAmount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Split Method:</span>
                    <span className="text-white capitalize">{splitMethod.replace('-', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Participants:</span>
                    <span className="text-white">{participants.length}</span>
                  </div>
                </div>
              </Card>

              <Button
                onClick={calculateSplit}
                className="w-full btn-secondary h-12"
              >
                <Calculator className="w-4 h-4 mr-2" />
                Calculate Split
              </Button>

              <div className="space-y-2">
                <h4 className="font-medium text-white">Split Breakdown:</h4>
                {participants.map(participant => (
                  <ParticipantCard key={participant.id} participant={participant} />
                ))}
              </div>

              <div className="flex justify-between items-center p-3 bg-background/20 rounded-lg">
                <span className="text-white">Your Share:</span>
                <span className="text-primary font-bold text-lg">₹{currentUserAmount.toFixed(2)}</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={copyShareLink}
                  variant="outline"
                  className="h-12"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Link
                </Button>
                <Button
                  onClick={sendSplitRequest}
                  className="btn-cyber h-12"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send Request
                </Button>
              </div>
            </div>
          )}

          {splitStep === 'payment' && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-white mb-2">Pay Your Share</h3>
                <p className="text-gray-400">Split requests sent to participants</p>
              </div>

              <Card className="glass-card border border-white/20 p-4">
                <div className="text-center space-y-2">
                  <div className="text-3xl font-bold text-primary">₹{currentUserAmount.toFixed(2)}</div>
                  <div className="text-gray-400">Your share for: {description}</div>
                </div>
              </Card>

              <Button
                onClick={() => setSplitStep('pin')}
                className="w-full btn-cyber h-12"
              >
                Pay Now
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>

              <Button
                onClick={handleClose}
                variant="outline"
                className="w-full h-12"
              >
                Pay Later
              </Button>
            </div>
          )}

          {splitStep === 'pin' && (
            <div className="space-y-6">
              <div className="text-center">
                <Shield className="w-12 h-12 mx-auto mb-3 text-primary" />
                <h3 className="text-lg font-semibold text-white mb-2">Enter PIN</h3>
                <p className="text-gray-400">Confirm payment of ₹{currentUserAmount.toFixed(2)}</p>
                <p className="text-sm text-gray-500">for {description}</p>
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

          {splitStep === 'processing' && (
            <div className="text-center space-y-6 py-8">
              <Loader2 className="w-16 h-16 mx-auto animate-spin text-primary" />
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Processing Payment</h3>
                <p className="text-gray-400">Please wait while we process your split payment...</p>
              </div>
            </div>
          )}

          {splitStep === 'success' && (
            <div className="text-center space-y-6 py-8">
              <CheckCircle className="w-16 h-16 mx-auto text-green-400" />
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Payment Successful!</h3>
                <p className="text-gray-400">₹{currentUserAmount.toFixed(2)} paid for {description}</p>
                <p className="text-sm text-gray-500">Other participants will be notified</p>
              </div>
              <Button onClick={handleClose} className="w-full btn-cyber h-12">
                Done
              </Button>
            </div>
          )}

          {splitStep === 'failed' && (
            <div className="text-center space-y-6 py-8">
              <AlertCircle className="w-16 h-16 mx-auto text-red-400" />
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Payment Failed</h3>
                <p className="text-gray-400">Unable to process your split payment. Please try again.</p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setSplitStep('pin')}
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

export default SplitOrderModal;