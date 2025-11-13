import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { 
  Plus, 
  Users, 
  Calendar, 
  TrendingUp, 
  TrendingDown,
  DollarSign, 
  Settings, 
  Share2, 
  Archive, 
  MoreVertical, 
  UserPlus, 
  UserMinus, 
  MessageSquare,
  Mail,
  Phone,
  Edit,
  Trash2,
  Shield,
  Check,
  X,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Edit2,
  Receipt,
  Bell,
  LogOut,
  Zap,
  CheckCircle,
  CreditCard,
  Send,
  QrCode
} from "lucide-react";
import EnhancedBalanceSection from "@/components/EnhancedBalanceSection";
import { transformMemberBalances } from "@/utils/balanceTransform";
import AddExpenseForm from "@/components/AddExpenseForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useGroup, useGroupMembers, useUpdateGroup, useInviteMember, useRemoveMember } from "@/hooks/useGroups";
import { useExpenses, useCreateExpense } from "@/hooks/useExpenses";
import { useGroupBalances, useSettlementSuggestions } from "@/hooks/useBalances";
import { useAuth } from "@/contexts/AuthContext";
import withLayout from "@/components/withLayout";
import InviteMembersModal from "@/components/InviteMembersModal";
import SettlementHistory from "@/components/groups/SettlementHistory";
import GroupQRScanner from "@/components/GroupQRScanner";

interface GroupMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  balance: number;
  isAdmin: boolean;
  isActive: boolean;
  joinedAt: string;
  lastActive: string;
}

interface GroupExpense {
  id: string;
  title: string;
  amount: number;
  category: string;
  paidBy: string;
  paidByName: string;
  splitAmong: string[];
  date: string;
  description?: string;
}

const GroupDetails = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showEditGroup, setShowEditGroup] = useState(false);
  const [showInviteMember, setShowInviteMember] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showExpenseDetail, setShowExpenseDetail] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    description: ''
  });
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [activeTab, setActiveTab] = useState('expenses');
  const [settlements, setSettlements] = useState<any[]>([]);
  const [settlementHistory, setSettlementHistory] = useState<any[]>([]);

  // API hooks
  const { data: groupData, isLoading: groupLoading, error: groupError } = useGroup(groupId!);
  const { data: membersData, isLoading: membersLoading } = useGroupMembers(groupId!);
  const { data: expensesData, isLoading: expensesLoading } = useExpenses({ groupId });
  const { data: balancesData, isLoading: balancesLoading } = useGroupBalances(groupId!);
  const { data: suggestionsData, isLoading: suggestionsLoading } = useSettlementSuggestions(groupId!);
  const updateGroupMutation = useUpdateGroup();
  const inviteMemberMutation = useInviteMember();
  const removeMemberMutation = useRemoveMember();
  const createExpenseMutation = useCreateExpense();

  // Extract data from API responses
  const group = groupData?.group;
  const balances = groupData?.balances || [];
  const members = membersData || [];
  const expenses = expensesData?.expenses || [];
  const groupBalances = balancesData?.data || {};
  const memberBalances = groupBalances?.memberBalances || [];
  const settlementSuggestions = suggestionsData?.suggestions || [];

  // Helper function to format currency
  const formatCurrency = (amount: number, currency: string = 'INR') => {
    const currencySymbols: Record<string, string> = {
      'USD': '$',
      'EUR': '€', 
      'GBP': '£',
      'INR': '₹',
      'CAD': 'C$',
      'AUD': 'A$'
    };
    const symbol = currencySymbols[currency] || '₹';
    return `${symbol}${Math.abs(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  // Check if current user is admin
  const isAdmin = user && group && (
    group.owner._id === user._id || 
    members.some(member => 
      (member.user._id === user._id) && 
      member.role === 'admin'
    )
  );

  // Handle navigation state for tab switching
  useEffect(() => {
    const state = location.state as { activeTab?: string };
    if (state?.activeTab) {
      setActiveTab(state.activeTab);
      // Clear the state to prevent issues on page refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Initialize edit form when group data loads
  useEffect(() => {
    if (group) {
      setEditForm({
        name: group.name || '',
        description: group.description || ''
      });
    }
  }, [group]);

  // Show loading state
  if (groupLoading || !groupId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-white/60">Loading group details...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (groupError || !group) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 mx-auto text-red-400" />
          <h2 className="text-xl font-bold text-white">Group not found</h2>
          <p className="text-white/60">The group you're looking for doesn't exist or you don't have access to it.</p>
          <Button onClick={() => navigate('/groups')} variant="outline">
            Back to Groups
          </Button>
        </div>
      </div>
    );
  }

  const getBalanceColor = (balance: number) => {
    if (balance > 0) return 'text-emerald-400';
    if (balance < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Food & Dining': 
      case 'Food': return '🍽️';
      case 'Transportation': return '🚗';
      case 'Accommodation': return '🏨';
      case 'Entertainment': return '🎭'; 
      case 'Travel': return '✈️';
      case 'Living': return '🏠';
      case 'Work': return '💼';
      case 'Shopping': return '🛍️';
      default: return '💰';
    }
  };

  // Handle expense detail view
  const handleExpenseClick = (expense: any) => {
    setSelectedExpense(expense);
    setShowExpenseDetail(true);
  };

  // Get member name by ID
  const getMemberNameById = (id: string) => {
    const member = members.find(m => 
      (m.user._id === id) || 
      (typeof m.user === 'string' && m.user === id)
    );
    return member ? 
      (member.user.firstName && member.user.lastName ? 
        `${member.user.firstName} ${member.user.lastName}` : 
        member.user.email) : 
      'Unknown';
  };

  // Calculate individual share for an expense
  const calculateIndividualShare = (expense: any) => {
    return expense.splitBetween ? expense.amount / expense.splitBetween.length : expense.amount;
  };

  // Calculate user's balance using real API data
  const calculateUserBalance = () => {
    if (!user || !memberBalances || memberBalances.length === 0) return 0;
    
    const userBalance = memberBalances.find(balance => 
      balance.user._id === user._id
    );
    
    return userBalance ? userBalance.netBalance : 0;
  };

  const userBalance = calculateUserBalance();

  // Get member balance by user ID
  const getMemberBalance = (userId: string) => {
    if (!memberBalances || memberBalances.length === 0) return 0;
    
    const memberBalance = memberBalances.find(balance => 
      balance.user._id === userId
    );
    
    return memberBalance ? memberBalance.netBalance : 0;
  };

  return (
    <div className="px-4 pb-20">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-6xl mx-auto space-y-8">
        {/* Enhanced Header - Mobile Responsive */}
          <div className="flex flex-col gap-4 animate-fade-in">
            {/* Top row: Back button and Group Info */}
            <div className="flex items-start gap-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/')}
                className="border-white/30 text-white hover:bg-white/10 hover:border-white/50 transition-all duration-300 hover:scale-105 shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="relative shrink-0">
                  <Avatar className="w-14 h-14 sm:w-20 sm:h-20 border-4 border-primary/30 shadow-lg animate-bounce-in">
                    <AvatarImage src={group.avatar?.url} />
                    <AvatarFallback className="bg-gradient-primary text-white text-lg sm:text-2xl font-bold">
                      {group.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {group.status === 'active' && (
                    <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-5 h-5 sm:w-6 sm:h-6 bg-success rounded-full animate-pulse-glow flex items-center justify-center">
                      <div className="w-2 h-2 sm:w-3 sm:h-3 bg-white rounded-full" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 space-y-1 sm:space-y-2 min-w-0">
                  <div className="flex flex-col gap-1 sm:gap-2">
                    <h1 className="text-xl sm:text-3xl lg:text-4xl font-bold text-gradient-cyber animate-slide-in-left truncate">{group.name}</h1>
                    <Badge className="bg-success/20 text-success border-success/30 px-2 py-0.5 sm:px-3 sm:py-1 animate-slide-in-right w-fit text-xs sm:text-sm">
                      {group.status}
                    </Badge>
                  </div>
                  <p className="text-white/70 text-sm sm:text-base lg:text-lg animate-slide-in-left line-clamp-2" style={{ animationDelay: '0.1s' }}>{group.description}</p>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-white/50 animate-slide-in-left" style={{ animationDelay: '0.2s' }}>
                    <span className="flex items-center gap-1 sm:gap-2 bg-white/5 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full w-fit">
                      <Users className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                      {group.memberCount || members.length} members
                    </span>
                    <span className="flex items-center gap-1 sm:gap-2 bg-white/5 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full w-fit">
                      <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                      <span className="hidden xs:inline">Created </span>{new Date(group.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons - Mobile Optimized */}
            <div className="flex flex-wrap gap-2 animate-slide-in-right">
              <Button 
                onClick={() => setShowAddExpense(true)}
                className="bg-gradient-primary text-white px-4 sm:px-6 hover:shadow-glow transition-all duration-300 hover:scale-105 flex-1 sm:flex-none text-sm"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-2" />
                <span className="hidden xs:inline">Add Expense</span>
              </Button>
              <Button
                onClick={() => setShowInviteMember(true)}
                variant="outline"
                size="sm"
                className="border-white/30 text-white hover:bg-white/10"
              >
                <UserPlus className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Invite</span>
              </Button>
              <Button
                onClick={() => setShowQRScanner(true)}
                variant="outline"
                size="sm"
                className="border-white/30 text-white hover:bg-white/10 hidden sm:flex"
              >
                <QrCode className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Scan QR</span>
              </Button>
              <Button 
                onClick={() => navigate(`/group/${groupId}/chat`)}
                variant="outline"
                size="sm" 
                className="border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/50 transition-all duration-300 hover:scale-105"
              >
                <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-1" />
                <span className="hidden sm:inline">Chat</span>
              </Button>
              
              {/* More Options Dropdown for Mobile */}
              <div className="flex gap-2 ml-auto">
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowEditGroup(true)}
                    className="text-white/60 hover:text-white hover:bg-white/10"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSettings(true)}
                  className="text-white/60 hover:text-white hover:bg-white/10"
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

        {/* Enhanced Quick Stats - Mobile Responsive & Compact */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mobile-lg:gap-3 md:gap-4">
          <Card className="glass-card hover-lift animate-slide-in-left stats-card border border-white/10">
            <CardContent className="p-3 mobile-lg:p-4 md:p-5 text-center space-y-1 mobile-lg:space-y-1.5 md:space-y-2">
              <div className="inline-flex items-center justify-center w-10 h-10 mobile-lg:w-12 mobile-lg:h-12 md:w-14 md:h-14 rounded-full bg-primary/20 mb-1">
                <DollarSign className="w-5 h-5 mobile-lg:w-6 mobile-lg:h-6 md:w-7 md:h-7 text-primary" />
              </div>
              <div className="text-base mobile-lg:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold text-white animate-bounce-in leading-tight">
                {formatCurrency(group.statistics?.totalAmount || 0, group.currency)}
              </div>
              <div className="text-[10px] mobile-lg:text-xs md:text-sm text-muted-foreground uppercase tracking-wide leading-tight">Total Expenses</div>
            </CardContent>
          </Card>
          
          <Card className="glass-card hover-lift animate-slide-in-left stats-card border border-white/10" style={{ animationDelay: '0.1s' }}>
            <CardContent className="p-3 sm:p-4 md:p-5 text-center space-y-1 sm:space-y-2">
              <div className={`inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full mb-1 ${
                userBalance > 0 ? 'bg-emerald-400/20' : userBalance < 0 ? 'bg-red-400/20' : 'bg-gray-400/20'
              }`}>
                {userBalance >= 0 ? (
                  <TrendingUp className={`w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 ${getBalanceColor(userBalance)}`} />
                ) : (
                  <TrendingDown className={`w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 ${getBalanceColor(userBalance)}`} />
                )}
              </div>
              <div className={`text-base sm:text-xl md:text-2xl lg:text-3xl font-bold animate-bounce-in leading-tight ${getBalanceColor(userBalance)}`}>
                {userBalance > 0 ? '+' : ''}{formatCurrency(userBalance, group.currency)}
              </div>
              <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground uppercase tracking-wide leading-tight">Your Balance</div>
            </CardContent>
          </Card>
          
          <Card className="glass-card hover-lift animate-slide-in-left stats-card border border-white/10" style={{ animationDelay: '0.2s' }}>
            <CardContent className="p-3 sm:p-4 md:p-5 text-center space-y-1 sm:space-y-2">
              <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-primary/20 mb-1">
                <Receipt className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-primary" />
              </div>
              <div className="text-base sm:text-xl md:text-2xl lg:text-3xl font-bold text-white animate-bounce-in leading-tight">{group.statistics?.totalExpenses || expenses.length}</div>
              <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground uppercase tracking-wide leading-tight">Expenses</div>
            </CardContent>
          </Card>
          
          <Card className="glass-card hover-lift animate-slide-in-left stats-card border border-white/10" style={{ animationDelay: '0.3s' }}>
            <CardContent className="p-3 sm:p-4 md:p-5 text-center space-y-1 sm:space-y-2">
              <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-primary/20 mb-1">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-primary" />
              </div>
              <div className="text-base sm:text-xl md:text-2xl lg:text-3xl font-bold text-white animate-bounce-in leading-tight">{group.memberCount || members.length}</div>
              <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground uppercase tracking-wide leading-tight">Members</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-4' : 'grid-cols-3'} bg-black/20 border border-white/10`}>
            <TabsTrigger value="expenses" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              Expenses
            </TabsTrigger>
            <TabsTrigger value="balances" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              Balances
            </TabsTrigger>
            <TabsTrigger value="members" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              Members
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="settings" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                Settings
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="expenses" className="relative pb-20 lg:pb-0">
            <div className="space-y-6">
              
              {expenses.length === 0 && !expensesLoading && (
                <Card className="glass-card">
                  <CardContent className="p-8 text-center">
                    <Receipt className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">No Expenses Yet</h3>
                    <p className="text-white/60 mb-4">
                      This group doesn't have any expenses yet. Be the first to add one!
                    </p>
                    <Button 
                      onClick={() => setShowAddExpense(true)}
                      className="bg-gradient-primary text-white hover:shadow-glow"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add First Expense
                    </Button>
                  </CardContent>
                </Card>
              )}
              
              {expenses.map((expense, index) => (
                <Card 
                  key={expense._id || `expense-${index}`} 
                  className="glass-card hover-lift animate-fade-in group cursor-pointer" 
                  style={{ animationDelay: `${index * 0.1}s` }}
                  onClick={() => handleExpenseClick(expense)}
                >
                  <CardContent className="p-4 sm:p-6 md:p-8">
                    {/* Mobile Layout: Stacked vertically */}
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex items-start gap-3 sm:gap-6 flex-1 min-w-0">
                        <div className="flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary/10 text-2xl sm:text-3xl group-hover:scale-110 transition-transform duration-300 shrink-0">
                          {getCategoryIcon(expense.category)}
                        </div>
                        <div className="flex-1 space-y-2 sm:space-y-3 min-w-0">
                          <h3 className="font-bold text-white text-base sm:text-lg md:text-xl group-hover:text-primary transition-colors duration-300 line-clamp-2">{expense.title}</h3>
                          {expense.description && (
                            <p className="text-white/60 text-xs sm:text-sm leading-relaxed line-clamp-2">{expense.description}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-white/50">
                            <span className="flex items-center gap-1 sm:gap-2 bg-white/5 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full">
                              <Avatar className="w-4 h-4 sm:w-5 sm:h-5">
                                <AvatarFallback className="bg-primary text-white text-xs">
                                  {expense.paidBy && typeof expense.paidBy === 'object' ? 
                                    expense.paidBy.firstName?.charAt(0) || expense.paidBy.email?.charAt(0) :
                                    'U'
                                  }
                                </AvatarFallback>
                              </Avatar>
                              <span className="hidden sm:inline">Paid by </span>{expense.paidBy && typeof expense.paidBy === 'object' ? 
                                (expense.paidBy.firstName && expense.paidBy.lastName ? 
                                  `${expense.paidBy.firstName} ${expense.paidBy.lastName}` : 
                                  expense.paidBy.email) :
                                'Unknown'
                              }
                            </span>
                            <span className="flex items-center gap-1 bg-white/5 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full">
                              <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                              {new Date(expense.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                            <span className="flex items-center gap-1 bg-white/5 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full">
                              <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                              {expense.splitBetween?.length || 1} <span className="hidden sm:inline">people</span>
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 sm:text-right space-y-0 sm:space-y-2">
                        <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white group-hover:text-primary transition-colors duration-300">{formatCurrency(expense.amount, group.currency)}</div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge variant="outline" className="border-primary/30 text-primary bg-primary/10 text-xs">
                            {expense.category}
                          </Badge>
                          <div className="text-xs sm:text-sm text-white/40">
                            {formatCurrency(calculateIndividualShare(expense), group.currency)} <span className="hidden sm:inline">per person</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {/* Mobile Action Buttons for Expenses Tab */}
            <div className="lg:hidden fixed bottom-4 left-4 right-4 z-50">
              <div className="flex gap-3">
                <Button 
                  onClick={() => setShowAddExpense(true)}
                  className="flex-1 bg-gradient-primary text-white hover:shadow-glow transition-all duration-300 h-12 shadow-lg"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Add Expense
                </Button>
                <Button
                  onClick={() => setShowInviteMember(true)}
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 h-12 px-4 shadow-lg"
                >
                  <UserPlus className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="members" className="relative pb-20 lg:pb-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {members.map((member, index) => (
                <Card key={member.user._id || `member-${index}`} className="glass-card hover-lift animate-fade-in group" style={{ animationDelay: `${index * 0.1}s` }}>
                  <CardContent className="p-4 sm:p-6 md:p-8">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                        <div className="relative shrink-0">
                          <Avatar className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 border-3 border-primary/30 group-hover:border-primary/60 transition-all duration-300">
                            <AvatarImage src={member.user.avatar?.url} />
                            <AvatarFallback className="bg-gradient-primary text-white text-base sm:text-lg md:text-xl font-bold">
                              {member.user.firstName?.charAt(0) || member.user.email?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          {member.role === 'admin' && (
                            <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-5 h-5 sm:w-6 sm:h-6 bg-amber-400 rounded-full flex items-center justify-center">
                              <div className="w-2 h-2 sm:w-3 sm:h-3 bg-white rounded-full" />
                            </div>
                          )}
                        </div>
                        <div className="space-y-1 sm:space-y-2 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-white text-sm sm:text-base md:text-lg group-hover:text-primary transition-colors duration-300 truncate">
                              {member.user.firstName && member.user.lastName ? 
                                `${member.user.firstName} ${member.user.lastName}` : 
                                member.user.email
                              }
                            </h3>
                            {member.role === 'admin' && (
                              <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs px-2 py-0.5 sm:py-1">
                                Admin
                              </Badge>
                            )}
                          </div>
                          <p className="text-white/60 text-xs sm:text-sm truncate">{member.user.email}</p>
                          <p className="text-white/40 text-xs bg-white/5 px-2 py-0.5 sm:py-1 rounded-full inline-block">
                            Joined {new Date(member.joinedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                        <div className="text-left sm:text-right space-y-1 sm:space-y-2">
                          <div className={`text-xl sm:text-2xl font-bold group-hover:scale-110 transition-transform duration-300 ${getBalanceColor(getMemberBalance(member.user._id))}`}>
                            {formatCurrency(getMemberBalance(member.user._id), group.currency)}
                          </div>
                          <div className="text-xs text-white/40 bg-white/5 px-2 sm:px-3 py-1 rounded-full inline-block">
                            {getMemberBalance(member.user._id) > 0 ? 'gets back' : getMemberBalance(member.user._id) < 0 ? 'owes' : 'settled'}
                          </div>
                        </div>
                        
                        {/* Member Actions for Admins */}
                        {isAdmin && member.user._id !== user?._id && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-white hover:bg-white/10"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-black/95 border-white/20">
                              <DropdownMenuItem
                                onClick={() => {
                                  if (confirm(`Are you sure you want to remove ${member.user.firstName} ${member.user.lastName} from the group?`)) {
                                    removeMemberMutation.mutate({
                                      groupId: groupId!,
                                      memberId: member.user._id
                                    }, {
                                      onSuccess: () => {
                                        toast({
                                          title: "Member Removed",
                                          description: `${member.user.firstName} ${member.user.lastName} has been removed from the group`
                                        });
                                      },
                                      onError: (error: any) => {
                                        toast({
                                          title: "Error",
                                          description: error.message || "Failed to remove member",
                                          variant: "destructive"
                                        });
                                      }
                                    });
                                  }
                                }}
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                              >
                                <UserMinus className="w-4 h-4 mr-2" />
                                Remove Member
                              </DropdownMenuItem>
                              {member.role !== 'admin' && (
                                <DropdownMenuItem className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/20">
                                  <Shield className="w-4 h-4 mr-2" />
                                  Make Admin
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}  
                      </div>
                    </div>
                    
                    {/* Detailed balance breakdown - Mobile Responsive */}
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm">
                        <div className="flex items-center gap-1 sm:gap-2">
                          <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
                          <span className="text-white/70">Gets back:</span>
                          <span className="text-green-400 font-medium">
                            {formatCurrency(memberBalances.find(m => m.user._id === member.user._id)?.totalGetsBack || 0, group.currency)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2">
                          <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 text-red-400" />
                          <span className="text-white/70">Needs to pay:</span>
                          <span className="text-red-400 font-medium">
                            {formatCurrency(memberBalances.find(m => m.user._id === member.user._id)?.totalNeedsToPay || 0, group.currency)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {/* Enhanced Add Member Card */}
              <Card className="glass-card border-dashed border-primary/30 hover:border-primary/50 transition-all duration-300 hover:scale-105 cursor-pointer animate-fade-in group" style={{ animationDelay: `${members.length * 0.1}s` }}>
                <CardContent className="p-8 text-center space-y-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4 group-hover:bg-primary/20 transition-all duration-300">
                    <UserPlus className="w-8 h-8 text-primary group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <h3 className="font-bold text-white mb-2 text-lg">Invite Member</h3>
                  <p className="text-white/60 text-sm mb-6">Add someone new to this group</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowInviteMember(true)}
                    className="border-primary text-primary hover:bg-primary hover:text-white transition-all duration-300"
                  >
                    Send Invitation
                  </Button>
                </CardContent>
              </Card>
            </div>
            
            {/* Mobile Action Buttons for Members Tab */}
            <div className="lg:hidden fixed bottom-4 left-4 right-4 z-50">
              <div className="flex gap-3">
                <Button 
                  onClick={() => setShowInviteMember(true)}
                  className="flex-1 bg-gradient-primary text-white hover:shadow-glow transition-all duration-300 h-12 shadow-lg"
                >
                  <UserPlus className="w-5 h-5 mr-2" />
                  Invite Member
                </Button>
                <Button
                  onClick={() => setShowAddExpense(true)}
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 h-12 px-4 shadow-lg"
                >
                  <Plus className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="balances" className="relative pb-20 lg:pb-0">
            <div className="space-y-6">
              {/* Enhanced Balance Section */}
              <EnhancedBalanceSection 
                memberBalances={transformMemberBalances(memberBalances, groupBalances?.balances || [])} 
                currency={group?.currency}
                groupId={groupId}
              />
              
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-primary" />
                      Suggested Settlements
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="border-primary/30 text-primary hover:bg-primary/10"
                      onClick={() => {
                        // Trigger one-click simplify
                        toast({
                          title: "One-Click Simplify",
                          description: "Settlement suggestions optimized! 💡"
                        });
                      }}
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Simplify
                    </Button>
                  </CardTitle>
                  <CardDescription>Optimize payments to settle all debts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {settlementSuggestions && settlementSuggestions.length > 0 ? (
                    settlementSuggestions.map((suggestion, index) => (
                      <div key={`settlement-${index}-${suggestion.fromUser?._id}-${suggestion.toUser?._id}`} className="p-4 rounded-lg bg-white/5 border border-white/10">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={suggestion.fromUser?.avatar?.url} />
                              <AvatarFallback className="bg-red-500/20 text-red-400 text-xs">
                                {suggestion.fromUser?.firstName?.charAt(0)}{suggestion.fromUser?.lastName?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-white font-medium">
                              {suggestion.fromUser?.firstName} {suggestion.fromUser?.lastName}
                            </span>
                            <span className="text-white/60">should pay</span>
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={suggestion.toUser?.avatar?.url} />
                              <AvatarFallback className="bg-green-500/20 text-green-400 text-xs">
                                {suggestion.toUser?.firstName?.charAt(0)}{suggestion.toUser?.lastName?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-white font-medium">
                              {suggestion.toUser?.firstName} {suggestion.toUser?.lastName}
                            </span>
                          </div>
                          <span className="text-emerald-400 font-bold">
                            {formatCurrency(suggestion.amount, suggestion.currency || group.currency)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-white/60">
                            This will settle {suggestion.fromUser?.firstName}'s debt
                          </div>
                          {user && user._id === suggestion.fromUser?._id ? (
                            <Button
                              size="sm"
                              className="bg-primary/20 text-primary hover:bg-primary hover:text-white flex items-center gap-1"
                              onClick={() => {
                                // This would trigger the payment modal
                                toast({
                                  title: "Payment Options",
                                  description: "Choose your preferred payment method to settle this amount",
                                });
                                // You can integrate with PaymentMethodModal here
                              }}
                            >
                              <CreditCard className="w-3 h-3" />
                              Pay Now
                            </Button>
                          ) : user && user._id === suggestion.toUser?._id ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-green-500/30 text-green-400 hover:bg-green-500/20"
                              onClick={() => {
                                toast({
                                  title: "Payment Request Sent",
                                  description: `Reminded ${suggestion.fromUser?.firstName} about the pending payment`
                                });
                              }}
                            >
                              <Send className="w-3 h-3 mr-1" />
                              Remind
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-white/30 text-white/60 cursor-not-allowed"
                              disabled
                            >
                              View Only
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-white mb-2">All Settled! 🎉</h3>
                      <p className="text-white/60">No settlements needed - all balances are even.</p>
                      <p className="text-sm text-white/40 mt-2">
                        Group fully settled on {new Date().toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Settlement History */}
              <SettlementHistory 
                groupId={groupId!}
                currency={group?.currency} 
              />

              {/* Enhanced Group Analytics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="text-primary text-lg">Group Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-white/60">Total Spent:</span>
                      <span className="font-bold text-white">{formatCurrency(group.statistics?.totalAmount || 0, group.currency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Average per Member:</span>
                      <span className="font-bold text-white">{formatCurrency((group.statistics?.totalAmount || 0) / (group.memberCount || 1), group.currency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Active Expenses:</span>
                      <span className="font-bold text-white">{group.statistics?.totalExpenses || expenses.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Settlement Progress:</span>
                      <span className="font-bold text-primary">
                        {memberBalances.length > 0 ? 
                          Math.round(((memberBalances.filter(m => Math.abs(m.netBalance) < 0.01).length) / memberBalances.length) * 100) : 0}%
                      </span>
                    </div>
                    <Progress 
                      value={memberBalances.length > 0 ? 
                        ((memberBalances.filter(m => Math.abs(m.netBalance) < 0.01).length) / memberBalances.length) * 100 : 0} 
                      className="mt-2"
                    />
                  </CardContent>
                </Card>

                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="text-primary text-lg">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button 
                      onClick={() => setShowAddExpense(true)}
                      className="w-full bg-gradient-primary text-white hover:shadow-glow transition-all duration-300"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add New Expense
                    </Button>
                    <Button 
                      variant="outline"
                      className="w-full border-primary text-primary hover:bg-primary hover:text-white"
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Share Group Code
                    </Button>
                    {isAdmin && (
                      <Button 
                        variant="outline"
                        className="w-full border-white/30 text-white hover:bg-white/10"
                      >
                        <Archive className="w-4 h-4 mr-2" />
                        Settle All Balances
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Mobile Action Buttons for Balances Tab */}
            <div className="lg:hidden fixed bottom-4 left-4 right-4 z-50">
              <div className="flex gap-3">
                <Button 
                  onClick={() => setShowAddExpense(true)}
                  className="flex-1 bg-gradient-primary text-white hover:shadow-glow transition-all duration-300 h-12 shadow-lg"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Add Expense
                </Button>
                <Button 
                  variant="outline" 
                  className="border-white/30 text-white hover:bg-white/10 h-12 px-4 shadow-lg"
                  onClick={() => setShowSettings(true)}
                >
                  <Settings className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </TabsContent>

          {isAdmin && (
            <TabsContent value="settings" className="relative pb-20 lg:pb-0">
              <div className="space-y-6">
                {/* Group Settings */}
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Settings className="w-5 h-5 text-primary" />
                      Group Settings
                    </CardTitle>
                    <CardDescription>Manage group preferences and permissions</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Group Details */}
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-white">Group Name</label>
                          <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                            <span className="text-white">{group.name}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-white">Description</label>
                          <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                            <span className="text-white/70">{group.description}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-white">Currency</label>
                          <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                            <span className="text-white">{group.currency}</span>
                          </div>
                        </div>
                      </div>

                      {/* Group Actions */}
                      <div className="space-y-4">
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium text-white">Group Actions</h4>
                          <Button 
                            variant="outline"
                            className="w-full justify-start border-primary/30 text-primary hover:bg-primary/10"
                            onClick={() => setShowAddExpense(true)}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Expense
                          </Button>
                          <Button 
                            variant="outline"
                            className="w-full justify-start border-white/30 text-white hover:bg-white/10"
                          >
                            <UserPlus className="w-4 h-4 mr-2" />
                            Invite Members
                          </Button>
                          <Button 
                            variant="outline"
                            className="w-full justify-start border-white/30 text-white hover:bg-white/10"
                          >
                            <Share2 className="w-4 h-4 mr-2" />
                            Share Group Code
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Danger Zone */}
                <Card className="glass-card border-red-500/20">
                  <CardHeader>
                    <CardTitle className="text-red-400 flex items-center gap-2">
                      <Archive className="w-5 h-5" />
                      Danger Zone
                    </CardTitle>
                    <CardDescription>Irreversible actions that affect the entire group</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <Button 
                        variant="outline"
                        className="w-full justify-start border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                      >
                        <Archive className="w-4 h-4 mr-2" />
                        Settle All Balances
                      </Button>
                      <Button 
                        variant="outline"
                        className="w-full justify-start border-red-500/30 text-red-400 hover:bg-red-500/10"
                      >
                        <Archive className="w-4 h-4 mr-2" />
                        Archive Group
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Mobile Action Buttons for Settings Tab */}
              <div className="lg:hidden fixed bottom-4 left-4 right-4 z-50">
                <div className="flex gap-3">
                  <Button 
                    onClick={() => setShowAddExpense(true)}
                    className="flex-1 bg-gradient-primary text-white hover:shadow-glow transition-all duration-300 h-12 shadow-lg"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Add Expense
                  </Button>
                  <Button
                    onClick={() => setShowInviteMember(true)}
                    variant="outline"
                    className="border-white/30 text-white hover:bg-white/10 h-12 px-4 shadow-lg"
                  >
                    <UserPlus className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>

        {/* Add Expense Form Dialog - Mobile Responsive */}
        <Dialog open={showAddExpense} onOpenChange={setShowAddExpense}>
          <DialogContent className="w-full max-w-full sm:max-w-6xl max-h-[90vh] overflow-y-auto bg-transparent border-0 p-0 m-2 sm:m-4">
            <AddExpenseForm
              groupId={groupId}
              members={members.map(member => ({
                id: member.user._id,
                name: member.user.firstName && member.user.lastName ? 
                  `${member.user.firstName} ${member.user.lastName}` : 
                  member.user.email,
                email: member.user.email,
                isAdmin: member.role === 'admin',
                isActive: member.status === 'active',
                joinedAt: member.joinedAt,
                lastActive: member.joinedAt, // placeholder
                balance: 0 // placeholder
              }))}
              onSubmit={async (expenseData: any) => {
                try {
                  // Category is now sent directly from the form in the correct backend format
                  // No mapping needed as AddExpenseForm now uses backend-compatible categories
                  
                  // Convert form data to API format with safe property access
                  const expenseRequest = {
                    title: expenseData.title,
                    description: expenseData.description || expenseData.notes || undefined,
                    amount: parseFloat(expenseData.amount?.toString() || '0'),
                    currency: expenseData.currency || group.currency,
                    category: expenseData.category || 'Other', // Category is already in backend format
                    date: expenseData.date ? new Date(expenseData.date).toISOString() : new Date().toISOString(),
                    splitType: 'group' as const,
                    groupId: expenseData.groupId || groupId!,
                    splitMethod: expenseData.splitMethod || expenseData.splitType || 'equal',
                    paymentMethod: expenseData.paymentMethod || 'cash' as const,
                    tags: expenseData.tags || [],
                    
                    // Handle multiple payers
                    multiplePayers: expenseData.multiplePayers || false,
                    payers: expenseData.payers || undefined,
                    
                    // Handle single payer
                    paidBy: expenseData.paidBy || expenseData.payerId,
                    
                    // Handle excluded members
                    excludedMembers: expenseData.excludedMembers,
                    
                    // Handle split between with safe mapping
                    splitBetween: expenseData.splitBetween || (expenseData.splits && Array.isArray(expenseData.splits) && expenseData.splits.length > 0
                      ? expenseData.splits.map((split: any) => ({
                          user: split.memberId || split.user,
                          amount: split.amount || 0,
                          percentage: split.percentage,
                          customAmount: split.customAmount,
                          shares: split.shares,
                          weight: split.weight,
                          income: split.income,
                          adjustmentAmount: split.adjustmentAmount,
                          adjustmentReason: split.adjustmentReason
                        }))
                      : []) // Fallback to empty array if no splits
                  };
                  
                  await createExpenseMutation.mutateAsync(expenseRequest);
                  
                  toast({
                    title: "Expense Added!",
                    description: `${formatCurrency(parseFloat(expenseData.amount || '0'), group.currency)} expense for "${expenseData.title}" has been recorded.`
                  });
                  setShowAddExpense(false);
                } catch (error: any) {
                  toast({
                    title: "Error",
                    description: error.message || "Failed to add expense. Please try again.",
                    variant: "destructive"
                  });
                }
              }}
              onCancel={() => setShowAddExpense(false)}
              defaultPayer={user?._id || user?.id}
            />
          </DialogContent>
        </Dialog>

        {/* Edit Group Dialog - Mobile Responsive */}
        <Dialog open={showEditGroup} onOpenChange={setShowEditGroup}>
          <DialogContent className="bg-black/95 border-white/20 w-full max-w-full sm:max-w-md m-2 sm:m-4">
            <DialogHeader>
              <DialogTitle className="text-white">Edit Group Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-white">Group Name</Label>
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  className="bg-white/10 border-white/30 text-white"
                  placeholder="Enter group name"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white">Description</Label>
                <Textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  className="bg-white/10 border-white/30 text-white"
                  placeholder="Enter group description"
                  rows={3}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowEditGroup(false)}
                  className="flex-1 border-white/30 text-white hover:bg-white/10"
                >
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    if (!editForm.name.trim()) {
                      toast({
                        title: "Error",
                        description: "Group name is required",
                        variant: "destructive"
                      });
                      return;
                    }
                    
                    try {
                      await updateGroupMutation.mutateAsync({
                        id: groupId!,
                        updates: {
                          name: editForm.name.trim(),
                          description: editForm.description.trim()
                        }
                      });
                      
                      toast({
                        title: "Success!",
                        description: "Group details updated successfully"
                      });
                      setShowEditGroup(false);
                    } catch (error) {
                      toast({
                        title: "Error",
                        description: "Failed to update group details",
                        variant: "destructive"
                      });
                    }
                  }}
                  disabled={updateGroupMutation.isPending}
                  className="flex-1 bg-gradient-primary text-white hover:shadow-glow"
                >
                  {updateGroupMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Enhanced Invite Members Modal */}
        <InviteMembersModal
          isOpen={showInviteMember}
          onClose={() => setShowInviteMember(false)}
          groupName={group?.name || 'Group'}
          groupId={groupId || ''}
          onInviteSent={(invites) => {
            toast({
              title: "Invitations Sent! 🎉",
              description: `Successfully sent ${invites.length} invitation${invites.length > 1 ? 's' : ''}`
            });
            
            // The group member list will be updated when new members join
            // No need to manually refetch here as the API handles real-time updates
          }}
        />

        {/* Settings Dialog - Mobile Responsive */}
        <Dialog open={showSettings} onOpenChange={setShowSettings}>
          <DialogContent className="bg-black/95 border-white/20 w-full max-w-full sm:max-w-md m-2 sm:m-4">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Group Settings
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start border-white/30 text-white hover:bg-white/10"
                onClick={() => {
                  toast({
                    title: "Notifications",
                    description: "Notification settings updated"
                  });
                }}
              >
                <Bell className="w-4 h-4 mr-2" />
                Notification Settings
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start border-white/30 text-white hover:bg-white/10"
                onClick={() => {
                  toast({
                    title: "Export",
                    description: "Group data exported successfully"
                  });
                }}
              >
                <Share2 className="w-4 h-4 mr-2" />
                Export Data
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start border-white/30 text-white hover:bg-white/10"
                onClick={() => {
                  toast({
                    title: "Privacy",
                    description: "Privacy settings updated"
                  });
                }}
              >
                <Shield className="w-4 h-4 mr-2" />
                Privacy Settings
              </Button>
              
              <Separator className="bg-white/20" />
              
              <Button
                onClick={() => {
                  toast({
                    title: "Left Group",
                    description: "You have successfully left the group",
                    variant: "destructive"
                  });
                  navigate('/');
                }}
                variant="outline"
                className="w-full justify-start border-red-500 text-red-400 hover:bg-red-500/20"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Leave Group
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Expense Detail Dialog - Mobile Responsive */}
        <Dialog open={showExpenseDetail} onOpenChange={setShowExpenseDetail}>
          <DialogContent className="bg-black/95 border-white/20 w-full max-w-full sm:max-w-4xl max-h-[90vh] overflow-y-auto m-2 sm:m-4">
            {selectedExpense && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-white flex items-center gap-3">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/20">
                      {getCategoryIcon(selectedExpense.category)}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">{selectedExpense.title}</h2>
                      <p className="text-white/60 text-sm font-normal">{selectedExpense.category}</p>
                    </div>
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-6 mt-6">
                  {/* Expense Overview */}
                  <Card className="glass-card border-white/20">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Receipt className="w-5 h-5 text-primary" />
                        Expense Overview
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <p className="text-white/60 text-sm mb-2">Total Amount</p>
                        <p className="text-3xl font-bold text-white">₹{selectedExpense.amount.toFixed(2)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-white/60 text-sm mb-2">Per Person</p>
                        <p className="text-2xl font-bold text-primary">
                          ₹{(selectedExpense.amount / (selectedExpense.splitBetween?.length || 1)).toFixed(2)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-white/60 text-sm mb-2">Date</p>
                        <p className="text-xl font-semibold text-white">
                          {new Date(selectedExpense.date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Payment Information */}
                  <Card className="glass-card border-white/20">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-primary" />
                        Payment Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 p-4 bg-white/5 rounded-lg">
                        <Avatar className="w-12 h-12">
                          <AvatarFallback className="bg-gradient-primary text-white text-lg font-bold">
                            {selectedExpense.paidBy && typeof selectedExpense.paidBy === 'object' ?
                              selectedExpense.paidBy.firstName?.charAt(0) || selectedExpense.paidBy.fullName?.charAt(0) || selectedExpense.paidBy.email?.charAt(0) || 'U' :
                              'U'
                            }
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-white font-semibold text-lg">
                            {selectedExpense.paidBy && typeof selectedExpense.paidBy === 'object' ?
                              (selectedExpense.paidBy.firstName && selectedExpense.paidBy.lastName ?
                                `${selectedExpense.paidBy.firstName} ${selectedExpense.paidBy.lastName}` :
                                selectedExpense.paidBy.fullName || selectedExpense.paidBy.email) :
                              'Unknown'
                            }
                          </p>
                          <p className="text-white/60 text-sm">Paid the full amount</p>
                        </div>
                        <div className="text-right">
                          <p className="text-green-400 font-bold text-xl">₹{selectedExpense.amount.toFixed(2)}</p>
                          <p className="text-white/60 text-sm">Amount Paid</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Split Details */}
                  <Card className="glass-card border-white/20">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary" />
                        Split Details ({selectedExpense.splitBetween?.length || 0} people)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {selectedExpense.splitBetween?.map((split, index) => {
                        const splitUserId = typeof split.user === 'object' ? split.user._id : split.user;
                        const member = members.find(m => m.user._id === splitUserId);
                        const isPayer = splitUserId === selectedExpense.paidBy || 
                          splitUserId === (typeof selectedExpense.paidBy === 'object' ? selectedExpense.paidBy._id : selectedExpense.paidBy);
                        
                        // Calculate net balance for this member in this expense
                        const memberShare = split.amount;
                        const netBalance = isPayer ? (selectedExpense.amount - memberShare) : -memberShare;
                        
                        return (
                          <div key={splitUserId || `split-${index}`} className="border-b border-white/10 pb-4 last:border-0">
                            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                              <div className="flex items-center gap-3">
                                <Avatar className="w-10 h-10">
                                  <AvatarImage src={member?.user.avatar?.url} />
                                  <AvatarFallback className="bg-gradient-primary text-white font-semibold">
                                    {member?.user.firstName?.charAt(0) || member?.user.email?.charAt(0) || '?'}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="text-white font-medium">
                                    {member?.user.firstName && member?.user.lastName ? 
                                      `${member.user.firstName} ${member.user.lastName}` : 
                                      member?.user.email || 'Unknown Member'
                                    }
                                  </p>
                                  <p className="text-sm">
                                    {isPayer ? (
                                      <span className="text-green-400">Paid ₹{selectedExpense.amount.toFixed(2)}</span>
                                    ) : (
                                      <span className="text-white/60">Did not pay</span>
                                    )}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className={`font-bold text-lg ${
                                  netBalance > 0 ? 'text-green-400' : netBalance < 0 ? 'text-red-400' : 'text-gray-400'
                                }`}>
                                  {netBalance > 0 ? '+' : ''}{formatCurrency(netBalance, group.currency)}
                                </p>
                                <p className="text-white/60 text-sm">
                                  {netBalance > 0 ? 'gets back' : netBalance < 0 ? 'owes' : 'settled'}
                                </p>
                              </div>
                            </div>
                            
                            {/* Detailed breakdown for non-payers */}
                            {!isPayer && (
                              <div className="mt-3 pl-12 space-y-2">
                                <div className="text-sm text-white/80">Breakdown:</div>
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-white/70">Their share</span>
                                  <span className="text-red-400">-{formatCurrency(memberShare, group.currency)}</span>
                                </div>
                                {netBalance < 0 && (
                                  <div className="flex items-center justify-between text-sm font-medium">
                                    <span className="text-white">Net amount owed</span>
                                    <span className="text-red-400">{formatCurrency(Math.abs(netBalance), group.currency)}</span>
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {/* Detailed breakdown for payer */}
                            {isPayer && (
                              <div className="mt-3 pl-12 space-y-2">
                                <div className="text-sm text-white/80">Breakdown:</div>
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-white/70">Amount paid</span>
                                  <span className="text-green-400">+{formatCurrency(selectedExpense.amount, group.currency)}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-white/70">Their share</span>
                                  <span className="text-red-400">-{formatCurrency(memberShare, group.currency)}</span>
                                </div>
                                {netBalance > 0 && (
                                  <div className="flex items-center justify-between text-sm font-medium">
                                    <span className="text-white">Net amount gets back</span>
                                    <span className="text-green-400">+{formatCurrency(netBalance, group.currency)}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      }) || []}
                    </CardContent>
                  </Card>

                  {/* Description */}
                  {selectedExpense.description && (
                    <Card className="glass-card border-white/20">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                          <MessageSquare className="w-5 h-5 text-primary" />
                          Description
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-white/80 leading-relaxed">{selectedExpense.description}</p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Action Buttons */}
                  <Card className="glass-card border-white/20">
                    <CardContent className="p-6">
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          className="flex-1 border-white/30 text-white hover:bg-white/10"
                          onClick={() => setShowExpenseDetail(false)}
                        >
                          Close
                        </Button>
                        <Button
                          variant="outline"
                          className="border-primary text-primary hover:bg-primary hover:text-white"
                        >
                          <Edit2 className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          className="border-green-500 text-green-400 hover:bg-green-500 hover:text-white"
                        >
                          <Share2 className="w-4 h-4 mr-2" />
                          Share
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
        
        {/* Group QR Scanner */}
        {showQRScanner && group && (
          <GroupQRScanner
            groupId={group._id}
            groupName={group.name}
            groupMembers={members.map((member: any) => ({
              id: member.user._id,
              name: member.user.firstName && member.user.lastName 
                ? `${member.user.firstName} ${member.user.lastName}`
                : member.user.email || 'Unknown User',
              avatar: member.user.avatar
            }))}
            onClose={() => setShowQRScanner(false)}
          />
        )}
        </div>
      </div>
    </div>
  );
};

// Standalone GroupDetails page with layout (for /group/:groupId route)
const GroupDetailsPage = withLayout(GroupDetails, { defaultMode: 'group', defaultSubNav: 'home' });

export default GroupDetailsPage;
