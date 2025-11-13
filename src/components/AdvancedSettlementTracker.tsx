import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { 
  DollarSign, 
  Users, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Send, 
  Receipt, 
  Calculator,
  ArrowUpRight,
  ArrowDownLeft,
  BarChart3,
  PieChart,
  Calendar,
  Filter,
  RefreshCw,
  Download,
  Eye,
  EyeOff,
  Plus,
  Minus,
  Edit3,
  Trash2,
  Settings,
  Bell,
  CreditCard,
  Smartphone,
  Building2
} from "lucide-react";
import { toast } from "sonner";

interface Settlement {
  id: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  amount: number;
  totalAmount: number;
  remainingAmount: number;
  status: 'pending' | 'partial' | 'completed' | 'overdue';
  dueDate?: Date;
  createdAt: Date;
  lastPayment?: Date;
  paymentMethod?: string;
  description: string;
  expenseIds: string[];
  payments: PartialPayment[];
  reminders: number;
  notes?: string;
}

interface PartialPayment {
  id: string;
  amount: number;
  paymentDate: Date;
  method: string;
  reference: string;
  note?: string;
  verifiedBy?: string;
  status: 'pending' | 'verified' | 'disputed';
}

interface ExpenseShare {
  id: string;
  expenseTitle: string;
  totalAmount: number;
  userShare: number;
  paidBy: string;
  category: string;
  date: Date;
  isSettled: boolean;
}

interface SettlementStats {
  totalPending: number;
  totalOwed: number;
  totalToReceive: number;
  overdueCount: number;
  completedThisMonth: number;
  averageSettlementTime: number;
}

const AdvancedSettlementTracker = () => {
  const [settlements, setSettlements] = useState<Settlement[]>([
    {
      id: 'set_001',
      fromUserId: 'user_2',
      fromUserName: 'Alice Johnson',
      toUserId: 'user_1',
      toUserName: 'You',
      amount: 850,
      totalAmount: 1250,
      remainingAmount: 400,
      status: 'partial',
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      lastPayment: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      paymentMethod: 'UPI',
      description: 'Weekend trip expenses',
      expenseIds: ['exp_001', 'exp_002'],
      payments: [
        {
          id: 'pay_001',
          amount: 850,
          paymentDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          method: 'UPI',
          reference: 'UPI2024001',
          note: 'Partial payment for trip',
          status: 'verified'
        }
      ],
      reminders: 1
    },
    {
      id: 'set_002',
      fromUserId: 'user_1',
      fromUserName: 'You',
      toUserId: 'user_3',
      toUserName: 'Bob Smith',
      amount: 0,
      totalAmount: 675,
      remainingAmount: 675,
      status: 'pending',
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      description: 'Dinner and movie night',
      expenseIds: ['exp_003', 'exp_004'],
      payments: [],
      reminders: 0
    },
    {
      id: 'set_003',
      fromUserId: 'user_4',
      fromUserName: 'Carol Wilson',
      toUserId: 'user_1',
      toUserName: 'You',
      amount: 320,
      totalAmount: 320,
      remainingAmount: 0,
      status: 'completed',
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      lastPayment: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      paymentMethod: 'Bank Transfer',
      description: 'Grocery shopping',
      expenseIds: ['exp_005'],
      payments: [
        {
          id: 'pay_002',
          amount: 320,
          paymentDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          method: 'Bank Transfer',
          reference: 'TXN789123',
          status: 'verified'
        }
      ],
      reminders: 2
    }
  ]);

  const [expenseShares] = useState<ExpenseShare[]>([
    {
      id: 'exp_001',
      expenseTitle: 'Hotel Booking',
      totalAmount: 8000,
      userShare: 2000,
      paidBy: 'Alice Johnson',
      category: 'Accommodation',
      date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      isSettled: false
    },
    {
      id: 'exp_002',
      expenseTitle: 'Car Rental',
      totalAmount: 3000,
      userShare: 750,
      paidBy: 'Alice Johnson',
      category: 'Transportation',
      date: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
      isSettled: false
    }
  ]);

  const [stats, setStats] = useState<SettlementStats>({
    totalPending: 1075,
    totalOwed: 675,
    totalToReceive: 400,
    overdueCount: 0,
    completedThisMonth: 3,
    averageSettlementTime: 5.2
  });

  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'partial' | 'completed' | 'overdue'>('all');
  const [sortBy, setSortBy] = useState<'amount' | 'date' | 'status'>('date');
  const [showDetails, setShowDetails] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSettlement, setSelectedSettlement] = useState<Settlement | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [paymentNote, setPaymentNote] = useState('');

  // Calculate dynamic stats
  useEffect(() => {
    const pending = settlements.filter(s => s.status === 'pending' || s.status === 'partial');
    const needsToPay = settlements.filter(s => s.fromUserId === 'user_1').reduce((sum, s) => sum + s.remainingAmount, 0);
    const toReceive = settlements.filter(s => s.toUserId === 'user_1').reduce((sum, s) => sum + s.remainingAmount, 0);
    const overdue = settlements.filter(s => s.dueDate && s.dueDate < new Date() && s.status !== 'completed').length;
    
    setStats(prev => ({
      ...prev,
      totalPending: pending.reduce((sum, s) => sum + s.remainingAmount, 0),
      totalNeedsToPay: needsToPay,
      totalToReceive: toReceive,
      overdueCount: overdue
    }));
  }, [settlements]);

  const filteredSettlements = settlements.filter(settlement => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'overdue') {
      return settlement.dueDate && settlement.dueDate < new Date() && settlement.status !== 'completed';
    }
    return settlement.status === filterStatus;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'amount':
        return b.remainingAmount - a.remainingAmount;
      case 'status':
        return a.status.localeCompare(b.status);
      default:
        return b.createdAt.getTime() - a.createdAt.getTime();
    }
  });

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-success';
      case 'partial': return 'text-warning';
      case 'overdue': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-success/10 text-success border-success/20';
      case 'partial': return 'bg-warning/10 text-warning border-warning/20';
      case 'overdue': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-muted/10 text-muted-foreground border-muted/20';
    }
  };

  const recordPartialPayment = async () => {
    if (!selectedSettlement || !paymentAmount) {
      toast.error("Please enter a valid payment amount");
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (amount <= 0 || amount > selectedSettlement.remainingAmount) {
      toast.error("Invalid payment amount");
      return;
    }

    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      const newPayment: PartialPayment = {
        id: `pay_${Date.now()}`,
        amount: amount,
        paymentDate: new Date(),
        method: paymentMethod,
        reference: `TXN${Date.now()}`,
        note: paymentNote,
        status: 'verified'
      };

      setSettlements(prev => prev.map(settlement => {
        if (settlement.id === selectedSettlement.id) {
          const newPaidAmount = settlement.amount + amount;
          const newRemainingAmount = settlement.totalAmount - newPaidAmount;
          const newStatus = newRemainingAmount <= 0 ? 'completed' : 'partial';

          return {
            ...settlement,
            amount: newPaidAmount,
            remainingAmount: newRemainingAmount,
            status: newStatus,
            lastPayment: new Date(),
            paymentMethod: paymentMethod,
            payments: [...settlement.payments, newPayment]
          };
        }
        return settlement;
      }));

      toast.success(`Payment of ${formatCurrency(amount)} recorded successfully! 🎉`);
      
      setSelectedSettlement(null);
      setPaymentAmount('');
      setPaymentNote('');
      
    } catch (error) {
      toast.error("Failed to record payment. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const sendReminder = async (settlementId: string) => {
    setIsLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSettlements(prev => prev.map(settlement => 
        settlement.id === settlementId 
          ? { ...settlement, reminders: settlement.reminders + 1 }
          : settlement
      ));
      
      toast.success("Reminder sent successfully! 📲");
    } catch (error) {
      toast.error("Failed to send reminder");
    } finally {
      setIsLoading(false);
    }
  };

  const markAsSettled = async (settlementId: string) => {
    setIsLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSettlements(prev => prev.map(settlement => {
        if (settlement.id === settlementId) {
          return {
            ...settlement,
            amount: settlement.totalAmount,
            remainingAmount: 0,
            status: 'completed',
            lastPayment: new Date()
          };
        }
        return settlement;
      }));
      
      toast.success("Settlement marked as completed! ✅");
    } catch (error) {
      toast.error("Failed to update settlement");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Pending</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalPending)}</p>
              </div>
              <div className="p-3 rounded-full bg-warning/20">
                <Clock className="w-5 h-5 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">You Owe</p>
                <p className="text-2xl font-bold text-destructive">{formatCurrency(stats.totalOwed)}</p>
              </div>
              <div className="p-3 rounded-full bg-destructive/20">
                <ArrowUpRight className="w-5 h-5 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">You'll Receive</p>
                <p className="text-2xl font-bold text-success">{formatCurrency(stats.totalToReceive)}</p>
              </div>
              <div className="p-3 rounded-full bg-success/20">
                <ArrowDownLeft className="w-5 h-5 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed This Month</p>
                <p className="text-2xl font-bold text-primary">{stats.completedThisMonth}</p>
              </div>
              <div className="p-3 rounded-full bg-primary/20">
                <CheckCircle className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Controls */}
      <Card className="glass-card">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex gap-4 items-center">
              <div className="space-y-1">
                <Label htmlFor="status-filter" className="text-sm">Filter by Status</Label>
                <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Settlements</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="sort-by" className="text-sm">Sort by</Label>
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="amount">Amount</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settlements List */}
      <div className="space-y-4">
        {filteredSettlements.map(settlement => (
          <Card key={settlement.id} className="glass-card hover:shadow-glow transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-primary/10">
                      {settlement.fromUserId === 'user_1' ? settlement.toUserName.charAt(0) : settlement.fromUserName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">
                        {settlement.fromUserId === 'user_1' 
                          ? `You need to pay ${settlement.toUserName}`
                          : `${settlement.fromUserName} needs to pay you`
                        }
                      </h3>
                      <Badge variant="outline" className={getStatusBadgeColor(settlement.status)}>
                        {settlement.status}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-2">{settlement.description}</p>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Created: {settlement.createdAt.toLocaleDateString()}</span>
                      {settlement.dueDate && (
                        <span>Due: {settlement.dueDate.toLocaleDateString()}</span>
                      )}
                      <span>{settlement.expenseIds.length} expense{settlement.expenseIds.length > 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right space-y-2">
                  <div>
                    <p className="text-2xl font-bold">
                      {formatCurrency(settlement.remainingAmount)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      of {formatCurrency(settlement.totalAmount)}
                    </p>
                  </div>
                  
                  {settlement.status !== 'completed' && (
                    <div className="space-y-1">
                      <Progress 
                        value={(settlement.amount / settlement.totalAmount) * 100} 
                        className="h-1 w-24"
                      />
                      <p className="text-xs text-muted-foreground">
                        {((settlement.amount / settlement.totalAmount) * 100).toFixed(0)}% paid
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex justify-between items-center mt-4 pt-4 border-t">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowDetails(showDetails === settlement.id ? null : settlement.id)}
                >
                  {showDetails === settlement.id ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                  {showDetails === settlement.id ? 'Hide' : 'Show'} Details
                </Button>
                
                <div className="flex gap-2">
                  {settlement.status !== 'completed' && (
                    <>
                      {settlement.fromUserId === 'user_1' ? (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              size="sm" 
                              onClick={() => setSelectedSettlement(settlement)}
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Pay
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Record Payment</DialogTitle>
                              <DialogDescription>
                                Record a partial or full payment for this settlement
                              </DialogDescription>
                            </DialogHeader>
                            
                            <div className="space-y-4">
                              <div className="p-4 bg-muted/50 rounded-lg">
                                <p className="font-semibold">Settlement Details</p>
                                <p className="text-sm text-muted-foreground">
                                  {settlement.description}
                                </p>
                                <p className="text-sm">
                                  Remaining: <span className="font-semibold">{formatCurrency(settlement.remainingAmount)}</span>
                                </p>
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor="payment-amount">Payment Amount</Label>
                                <Input
                                  id="payment-amount"
                                  type="number"
                                  placeholder="Enter amount"
                                  value={paymentAmount}
                                  onChange={(e) => setPaymentAmount(e.target.value)}
                                  max={selectedSettlement?.remainingAmount}
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor="payment-method">Payment Method</Label>
                                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="upi">UPI</SelectItem>
                                    <SelectItem value="bank">Bank Transfer</SelectItem>
                                    <SelectItem value="cash">Cash</SelectItem>
                                    <SelectItem value="card">Card</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor="payment-note">Note (Optional)</Label>
                                <Textarea
                                  id="payment-note"
                                  placeholder="Add a note about this payment"
                                  value={paymentNote}
                                  onChange={(e) => setPaymentNote(e.target.value)}
                                />
                              </div>
                              
                              <Button 
                                onClick={recordPartialPayment} 
                                className="w-full"
                                disabled={isLoading || !paymentAmount}
                              >
                                {isLoading ? (
                                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                )}
                                Record Payment
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      ) : (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => sendReminder(settlement.id)}
                            disabled={isLoading}
                          >
                            <Bell className="w-4 h-4 mr-2" />
                            Remind
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => markAsSettled(settlement.id)}
                            disabled={isLoading}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Mark Settled
                          </Button>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
              
              {/* Expanded Details */}
              {showDetails === settlement.id && (
                <div className="mt-4 pt-4 border-t space-y-4">
                  {/* Payment History */}
                  {settlement.payments.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Payment History</h4>
                      <div className="space-y-2">
                        {settlement.payments.map(payment => (
                          <div key={payment.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div>
                              <p className="font-medium">{formatCurrency(payment.amount)}</p>
                              <p className="text-sm text-muted-foreground">
                                {payment.paymentDate.toLocaleDateString()} • {payment.method}
                              </p>
                              {payment.note && (
                                <p className="text-xs text-muted-foreground">{payment.note}</p>
                              )}
                            </div>
                            <Badge variant="outline" className="bg-success/10 text-success">
                              {payment.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Related Expenses */}
                  <div>
                    <h4 className="font-semibold mb-2">Related Expenses</h4>
                    <div className="space-y-2">
                      {expenseShares
                        .filter(expense => settlement.expenseIds.includes(expense.id))
                        .map(expense => (
                        <div key={expense.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div>
                            <p className="font-medium">{expense.expenseTitle}</p>
                            <p className="text-sm text-muted-foreground">
                              {expense.category} • {expense.date.toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{formatCurrency(expense.userShare)}</p>
                            <p className="text-sm text-muted-foreground">
                              of {formatCurrency(expense.totalAmount)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSettlements.length === 0 && (
        <Card className="glass-card">
          <CardContent className="p-12 text-center">
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                <Receipt className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">No settlements found</h3>
                <p className="text-muted-foreground">
                  {filterStatus === 'all' 
                    ? "You're all caught up! No pending settlements."
                    : `No ${filterStatus} settlements found.`
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdvancedSettlementTracker;