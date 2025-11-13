import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import InviteMembersModal from '@/components/InviteMembersModal';
import GroupInviteCodeManager from '@/components/GroupInviteCodeManager';
import ExpenseDetailsView from './ExpenseDetailsView';
import LeaveGroupConfirmationDialog from './LeaveGroupConfirmationDialog';
import { useExpenses } from '@/hooks/useExpenses';
import { useGroupBalances } from '@/hooks/useBalances';
import { useLeaveGroup } from '@/hooks/useGroups';
import { apiClient } from '@/lib/api';
import {
  Users,
  Plus,
  Settings,
  Edit2,
  UserPlus,
  TrendingUp,
  TrendingDown,
  IndianRupee,
  Calculator,
  History,
  BarChart3,
  Share,
  Copy,
  ExternalLink,
  Bell,
  Crown,
  Shield,
  LogOut,
  MoreHorizontal,
  Calendar,
  Receipt,
  ArrowUpRight,
  ArrowDownLeft,
  AlertCircle,
  CheckCircle2,
  Clock,
  Target
} from 'lucide-react';
import { toast } from 'sonner';

interface GroupMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  balance: number; // positive = gets back money, negative = needs to pay money
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
  date: string;
  paidBy: string;
  participants: string[];
  status: 'completed' | 'pending' | 'disputed';
  description?: string;
}

interface GroupData {
  id: string;
  name: string;
  description: string;
  totalExpenses: number;
  totalMembers: number;
  netBalance: number;
  currency: string;
  createdAt: string;
  coverImage?: string;
  inviteCode: string;
  owner: string; // User ID of the group owner
}

interface GroupDetailsPageProps {
  group: GroupData;
  members: GroupMember[];
  recentExpenses: GroupExpense[];
  currentUserId: string;
  onAddExpense: () => void;
  onSettleBalance: () => void;
  onInviteMember: (email: string) => void;
  onEditGroup: (data: Partial<GroupData>) => void;
  onLeaveGroup: () => void;
}

const GroupDetailsPage = ({
  group,
  members,
  recentExpenses,
  currentUserId,
  onAddExpense,
  onSettleBalance,
  onInviteMember,
  onEditGroup,
  onLeaveGroup
}: GroupDetailsPageProps) => {
  const [showEditGroup, setShowEditGroup] = useState(false);
  const [showInviteMember, setShowInviteMember] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAllExpenses, setShowAllExpenses] = useState(false);
  const [showLeaveGroupDialog, setShowLeaveGroupDialog] = useState(false);
  const [editForm, setEditForm] = useState({
    name: group.name,
    description: group.description
  });

  // Development mode: Set user ID in API client only if not authenticated
  useEffect(() => {
    const devUserId = '68c5371261200e3deba30e67'; // Test user ID for development
    const authToken = localStorage.getItem('authToken');
    
    // Only set development user ID if we're in development mode and NOT authenticated
    if (process.env.NODE_ENV === 'development' && !authToken) {
      const userId = currentUserId || devUserId;
      console.log('🔧 Development mode: Setting user ID header for unauthenticated requests:', userId);
      apiClient.setUserId(userId);
    } else if (authToken) {
      // If we have an auth token, make sure to remove x-user-id header to avoid conflicts
      console.log('🔐 Authenticated mode: Removing development user ID header');
      const currentHeaders = (apiClient as any).defaultHeaders;
      const { 'x-user-id': removed, ...headersWithoutUserId } = currentHeaders;
      (apiClient as any).defaultHeaders = headersWithoutUserId;
    }
  }, [currentUserId]);

  // Fetch real expenses and balances data with increased limit for full view
  const { data: expensesData, isLoading: expensesLoading, error: expensesError } = useExpenses({ 
    groupId: group.id,
    limit: showAllExpenses ? 100 : 10 // Show more when viewing all expenses
  });
  const { data: balancesData, isLoading: balancesLoading, error: balancesError } = useGroupBalances(group.id);

  // Leave group mutation
  const leaveGroupMutation = useLeaveGroup();

  // Algorithm: Calculate real-time balance statistics
  const balanceStats = useMemo(() => {
    const memberBalances = (balancesData as any)?.memberBalances || (balancesData as any)?.data?.memberBalances;
    
    if (!memberBalances) {
      return {
        totalGetsBack: 0,
        totalNeedsToPay: 0,
        totalExpenses: group.totalExpenses || 0,
        memberCount: members.length
      };
    }
    
    const totalGetsBack = memberBalances
      .filter((member: any) => member.netBalance > 0)
      .reduce((sum: number, member: any) => sum + member.netBalance, 0);
    
    const totalNeedsToPay = memberBalances
      .filter((member: any) => member.netBalance < 0)
      .reduce((sum: number, member: any) => sum + Math.abs(member.netBalance), 0);

    const totalExpenses = expensesData?.expenses
      ?.reduce((sum, expense) => sum + expense.amount, 0) || 0;

    return {
      totalGetsBack,
      totalNeedsToPay,
      totalExpenses,
      memberCount: memberBalances.length
    };
  }, [balancesData, expensesData, group.totalExpenses, members.length]);

  // Algorithm: Get current user's balance information
  const currentUserBalance = useMemo(() => {
    const memberBalances = (balancesData as any)?.memberBalances || (balancesData as any)?.data?.memberBalances;
    
    if (!memberBalances || !currentUserId) {
      return { netBalance: 0, getsBackAmount: 0, needsToPayAmount: 0 };
    }

    const userBalance = memberBalances.find(
      (member: any) => member.user._id === currentUserId || member.user.id === currentUserId
    );

    if (!userBalance) {
      return { netBalance: 0, getsBackAmount: 0, needsToPayAmount: 0 };
    }

    return {
      netBalance: userBalance.netBalance,
      getsBackAmount: userBalance.totalGetsBack,
      needsToPayAmount: userBalance.totalNeedsToPay
    };
  }, [balancesData, currentUserId]);

  // Algorithm: Process and categorize recent expenses
  const processedExpenses = useMemo(() => {
    const expenses = expensesData?.expenses || recentExpenses || [];
    
    return expenses.slice(0, 5).map(expense => {
      // Calculate user's share in this expense
      const userSplit = expense.splitBetween?.find(
        split => {
          const splitUserId = typeof split.user === 'object' ? split.user._id : split.user;
          return splitUserId === currentUserId;
        }
      );
      
      const userShare = userSplit ? userSplit.amount : 0;
      const paidById = typeof expense.paidBy === 'object' ? expense.paidBy._id : expense.paidBy;
      const isPaidByUser = paidById === currentUserId;
      
      // Get payer name for display
      const payerName = typeof expense.paidBy === 'object' 
        ? `${expense.paidBy.firstName || ''} ${expense.paidBy.lastName || ''}`.trim() || expense.paidBy.email
        : 'Unknown';
      
      return {
        ...expense,
        userShare,
        isPaidByUser,
        payerName,
        netEffect: isPaidByUser ? expense.amount - userShare : -userShare,
        formattedDate: new Date(expense.date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        })
      };
    });
  }, [expensesData?.expenses, recentExpenses, currentUserId]);

  const currentUser = members.find(m => m.id === currentUserId);
  const isAdmin = currentUser?.isAdmin || false;

  // Get balance status with user-friendly terminology
  const getBalanceStatus = (balance: number) => {
    if (balance > 0) return { text: 'gets back', color: 'text-green-400', bgColor: 'bg-green-500/20' };
    if (balance < 0) return { text: 'needs to pay back', color: 'text-red-400', bgColor: 'bg-red-500/20' };
    return { text: 'settled', color: 'text-gray-400', bgColor: 'bg-gray-500/20' };
  };

  // Handle edit group
  const handleEditGroup = () => {
    if (!editForm.name.trim()) {
      toast.error('Group name is required');
      return;
    }

    onEditGroup(editForm);
    setShowEditGroup(false);
    toast.success('Group details updated');
  };

  // Handle leave group with enhanced confirmation
  const handleLeaveGroup = () => {
    setShowLeaveGroupDialog(true);
    setShowSettings(false);
  };

  // Confirm leave group action
  const handleConfirmLeaveGroup = async () => {
    try {
      await leaveGroupMutation.mutateAsync(group.id);
      toast.success(`Successfully left "${group.name}"`);
      setShowLeaveGroupDialog(false);
      
      // Navigate back to groups list or home page
      if (typeof onLeaveGroup === 'function') {
        onLeaveGroup();
      } else {
        // Fallback navigation - redirect to groups page or home
        window.location.href = '/groups';
      }
    } catch (error: any) {
      console.error('Failed to leave group:', error);
      toast.error(error?.response?.data?.message || 'Failed to leave group');
      setShowLeaveGroupDialog(false);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return `₹${Math.abs(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  // Get expense icon
  const getExpenseIcon = (expense: GroupExpense) => {
    switch (expense.status) {
      case 'completed': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'disputed': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <Receipt className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen pb-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Section */}
        <Card className="glass-card bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 border-white/20">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold text-white">{group.name}</h1>
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
                  </div>
                  <p className="text-white/80 mt-1">{group.description}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-white/60 text-sm flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {group.totalMembers} members
                    </span>
                    <span className="text-white/60 text-sm flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Created {new Date(group.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 animate-slide-in-right w-full lg:w-auto">
              <Button 
                onClick={onAddExpense}
                className="bg-gradient-primary text-white px-6 hover:shadow-glow transition-all duration-300 hover:scale-105 flex-1 lg:flex-none"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Expense
              </Button>
              <Button
                onClick={() => setShowInviteMember(true)}
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Invite
              </Button>
              <Button
                onClick={() => setShowAllExpenses(true)}
                variant="outline"
                className="border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/50 transition-all duration-300 hover:scale-105"
              >
                <BarChart3 className="w-5 h-5 mr-2" />
                View Expenses
              </Button>
              {isAdmin && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSettings(true)}
                  className="text-white/60 hover:text-white hover:bg-white/10"
                >
                  <Settings className="w-4 h-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Debug Panel for Expenses Issue */}
          <div className="lg:col-span-3">
            <Card className="glass-card border-yellow-500/30 bg-yellow-500/10">
              <CardHeader>
                <CardTitle className="text-yellow-400 text-sm flex items-center gap-2">
                  🐛 Debug: Expenses & Balance Loading Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-yellow-300 font-medium">Expenses Query:</p>
                    <p className="text-white/80">Loading: {expensesLoading ? 'Yes' : 'No'}</p>
                    <p className="text-white/80">Error: {expensesError ? 'Yes' : 'No'}</p>
                    <p className="text-white/80">Data: {expensesData ? 'Exists' : 'None'}</p>
                    <p className="text-white/80">Count: {expensesData?.expenses?.length || 0}</p>
                  </div>
                  <div>
                    <p className="text-yellow-300 font-medium">Balance Query:</p>
                    <p className="text-white/80">Loading: {balancesLoading ? 'Yes' : 'No'}</p>
                    <p className="text-white/80">Error: {balancesError ? 'Yes' : 'No'}</p>
                    <p className="text-white/80">Data: {balancesData ? 'Exists' : 'None'}</p>
                    <p className="text-white/80">Member Count: {((balancesData as any)?.memberBalances || (balancesData as any)?.data?.memberBalances)?.length || 0}</p>
                  </div>
                  <div>
                    <p className="text-yellow-300 font-medium">Request Params:</p>
                    <p className="text-white/80">Group ID: {group.id}</p>
                    <p className="text-white/80">Limit: {showAllExpenses ? 100 : 10}</p>
                    <p className="text-white/80">User ID: {currentUserId || 'None'}</p>
                    <p className="text-white/80">Dev Mode: {process.env.NODE_ENV === 'development' ? 'Yes' : 'No'}</p>
                  </div>
                  <div>
                    <p className="text-yellow-300 font-medium">Processed Data:</p>
                    <p className="text-white/80">Processed Expenses: {processedExpenses?.length || 0}</p>
                    <p className="text-white/80">Balance Stats OK: {balanceStats ? 'Yes' : 'No'}</p>
                    <p className="text-white/80">User Balance: {currentUserBalance ? '₹' + Math.abs(currentUserBalance.netBalance).toFixed(2) : 'N/A'}</p>
                  </div>
                </div>
                {expensesError && (
                  <div className="mt-3 p-3 bg-red-500/20 border border-red-500/30 rounded">
                    <p className="text-red-400 font-medium">Error Details:</p>
                    <pre className="text-red-300 text-xs mt-1 overflow-auto">
                      {JSON.stringify(expensesError, null, 2)}
                    </pre>
                  </div>
                )}
                {expensesData && (
                  <div className="mt-3 p-3 bg-blue-500/20 border border-blue-500/30 rounded">
                    <p className="text-blue-400 font-medium">Sample Expense Data (First 2):</p>
                    <pre className="text-blue-300 text-xs mt-1 overflow-auto max-h-48">
                      {JSON.stringify(expensesData?.expenses?.slice(0, 2).map(e => ({
                        id: e._id,
                        title: e.title,
                        amount: e.amount,
                        paidBy: e.paidBy,
                        paidByType: typeof e.paidBy,
                        splitBetweenCount: e.splitBetween?.length,
                        splitSample: e.splitBetween?.[0]
                      })), null, 2)}
                    </pre>
                  </div>
                )}
                {balancesData && (
                  <div className="mt-3 p-3 bg-green-500/20 border border-green-500/30 rounded">
                    <p className="text-green-400 font-medium">Balance Data Summary:</p>
                    <pre className="text-green-300 text-xs mt-1 overflow-auto max-h-32">
                      {JSON.stringify({
                        memberBalances: ((balancesData as any)?.memberBalances || (balancesData as any)?.data?.memberBalances)?.slice(0, 2),
                        balances: ((balancesData as any)?.balances || (balancesData as any)?.data?.balances)?.slice(0, 2),
                        summary: (balancesData as any)?.summary || (balancesData as any)?.data?.summary
                      }, null, 2)}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          {/* Members List */}
          <div className="lg:col-span-2">
            <Card className="glass-card border-white/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Members ({members.length})
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowInviteMember(true)}
                    className="text-blue-400 hover:bg-blue-500/20"
                  >
                    <UserPlus className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {members.map(member => {
                  // Find member's balance data
                  const memberBalances = (balancesData as any)?.memberBalances || (balancesData as any)?.data?.memberBalances;
                  const memberBalance = memberBalances?.find(
                    (balance: any) => balance.user._id === member.id || balance.user.id === member.id
                  );
                  
                  const balanceStatus = memberBalance ? getBalanceStatus(memberBalance.netBalance) : getBalanceStatus(member.balance);
                  const displayBalance = memberBalance ? memberBalance.netBalance : member.balance;
                  
                  return (
                    <div key={member.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={member.avatar} />
                            <AvatarFallback className="bg-gradient-primary text-white font-bold">
                              {member.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {member.isAdmin && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center">
                              <Crown className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-white font-medium">{member.name}</p>
                          <p className="text-white/60 text-sm">{member.email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {member.isActive ? (
                              <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                                Active
                              </Badge>
                            ) : (
                              <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30 text-xs">
                                Inactive
                              </Badge>
                            )}
                            {member.isAdmin && (
                              <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">
                                Admin
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${balanceStatus.color}`}>
                          {displayBalance === 0 ? 'Settled' : formatCurrency(Math.abs(displayBalance))}
                        </p>
                        <p className="text-white/60 text-sm">{balanceStatus.text}</p>
                        {memberBalance && (
                          <div className="text-xs text-white/50 mt-1">
                            <div>Gets back: {formatCurrency(memberBalance.totalGetsBack || 0)}</div>
                            <div>Needs to pay: {formatCurrency(memberBalance.totalNeedsToPay || 0)}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Balance Summary & Recent Activity */}
          <div className="space-y-6">
            {/* Enhanced Balance Summary with Real Data */}
            <Card className="glass-card border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  Balance Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {balancesLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                    <p className="text-white/60 text-sm mt-2">Loading balances...</p>
                  </div>
                ) : (
                  <>
                    {/* Current User's Balance */}
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <h4 className="text-white font-medium mb-3">Your Balance</h4>
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div>
                          <p className={`font-bold text-lg ${
                            currentUserBalance.netBalance > 0 
                              ? 'text-green-400' 
                              : currentUserBalance.netBalance < 0 
                                ? 'text-red-400' 
                                : 'text-gray-400'
                          }`}>
                            {formatCurrency(Math.abs(currentUserBalance.netBalance))}
                          </p>
                          <p className="text-white/60 text-xs">
                            {currentUserBalance.netBalance > 0 
                              ? 'You get back' 
                              : currentUserBalance.netBalance < 0 
                                ? 'You need to pay' 
                                : 'Settled'
                            }
                          </p>
                        </div>
                        <div>
                          <p className="text-green-400 font-bold text-lg">
                            {formatCurrency(currentUserBalance.getsBackAmount)}
                          </p>
                          <p className="text-white/60 text-xs">You get back</p>
                        </div>
                        <div>
                          <p className="text-red-400 font-bold text-lg">
                            {formatCurrency(currentUserBalance.needsToPayAmount)}
                          </p>
                          <p className="text-white/60 text-xs">You need to pay</p>
                        </div>
                      </div>
                    </div>

                    {/* Group Overview */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-red-500/10 rounded-lg border border-red-500/30">
                        <p className="text-red-400 font-bold text-lg">{formatCurrency(balanceStats.totalNeedsToPay)}</p>
                        <p className="text-white/60 text-sm">Total Needs to Pay</p>
                      </div>
                      <div className="text-center p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
                        <p className="text-blue-400 font-bold text-lg">{formatCurrency(balanceStats.totalExpenses)}</p>
                        <p className="text-white/60 text-sm">Total Expenses</p>
                      </div>
                    </div>
                  </>
                )}
                
                <Button 
                  onClick={onSettleBalance}
                  className="w-full bg-gradient-primary text-white hover:shadow-glow"
                >
                  <Target className="w-4 h-4 mr-2" />
                  Settle Balances
                </Button>
              </CardContent>
            </Card>

            {/* Enhanced Recent Expenses with Real Data */}
            <Card className="glass-card border-white/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-2">
                    <History className="w-5 h-5" />
                    Recent Expenses
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAllExpenses(true)}
                    className="text-blue-400 hover:bg-blue-500/20"
                  >
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {expensesLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                    <p className="text-white/60 text-sm mt-2">Loading expenses...</p>
                  </div>
                ) : processedExpenses.length > 0 ? (
                  <>
                    {processedExpenses.map(expense => (
                      <div key={expense.id || expense._id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer">
                        <div className="flex items-center gap-3">
                          {getExpenseIcon(expense)}
                          <div>
                            <p className="text-white font-medium text-sm">{expense.title}</p>
                            <p className="text-white/60 text-xs">{expense.category}</p>
                            <p className="text-white/50 text-xs">
                              Paid by: {expense.payerName || 'Unknown'}
                            </p>
                            {expense.userShare > 0 && (
                              <p className="text-white/50 text-xs">
                                Your share: {formatCurrency(expense.userShare)}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-bold text-sm">{formatCurrency(expense.amount)}</p>
                          <p className="text-white/60 text-xs">{expense.formattedDate}</p>
                          {expense.isPaidByUser && (
                            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs mt-1">
                              You paid
                            </Badge>
                          )}
                          {expense.netEffect !== 0 && (
                            <p className={`text-xs font-medium ${
                              expense.netEffect > 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {expense.netEffect > 0 ? '+' : ''}{formatCurrency(Math.abs(expense.netEffect))}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    <Button 
                      onClick={() => setShowAllExpenses(true)}
                      variant="outline" 
                      size="sm" 
                      className="w-full border-white/20 text-white hover:bg-white/10"
                    >
                      View All {expensesData?.expenses?.length || 0} Expenses
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-6">
                    <Receipt className="w-8 h-8 text-white/40 mx-auto mb-2" />
                    <p className="text-white/60 text-sm">No expenses yet</p>
                    <Button 
                      onClick={onAddExpense}
                      size="sm"
                      className="mt-2 bg-primary text-white"
                    >
                      Add First Expense
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Edit Group Dialog */}
        <Dialog open={showEditGroup} onOpenChange={setShowEditGroup}>
          <DialogContent className="bg-black/95 border-white/20">
            <DialogHeader>
              <DialogTitle className="text-white">Edit Group</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-white">Group Name</Label>
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  className="bg-white/10 border-white/30 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white">Description</Label>
                <Textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  className="bg-white/10 border-white/30 text-white"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowEditGroup(false)}
                  className="flex-1 border-white/30 text-white"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleEditGroup}
                  className="flex-1 bg-blue-500 hover:bg-blue-600"
                >
                  Save Changes
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
          groupId={group?.id || ''}
          onInviteSent={(invites) => {
            toast.success(`Successfully sent ${invites.length} invitation${invites.length > 1 ? 's' : ''}!`);
          }}
        />

        {/* Comprehensive Expenses View Dialog */}
        <Dialog open={showAllExpenses} onOpenChange={setShowAllExpenses}>
          <DialogContent className="bg-black/95 border-white/20 max-w-7xl max-h-[95vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                <Receipt className="w-5 h-5" />
                All Group Expenses
              </DialogTitle>
            </DialogHeader>
            <div className="overflow-y-auto max-h-[80vh]">
              <ExpenseDetailsView
                expenses={expensesData?.expenses || []}
                currentUserId={currentUserId}
                isLoading={expensesLoading}
                onAddExpense={() => {
                  setShowAllExpenses(false);
                  onAddExpense();
                }}
                onExpenseUpdate={(expense) => {
                  console.log('Update expense:', expense);
                  // Handle expense update
                }}
                onExpenseDelete={(expenseId) => {
                  console.log('Delete expense:', expenseId);
                  // Handle expense deletion
                }}
              />
            </div>
          </DialogContent>
        </Dialog>

        {/* Settings Dialog */}
        <Dialog open={showSettings} onOpenChange={setShowSettings}>
          <DialogContent className="bg-black/95 border-white/20">
            <DialogHeader>
              <DialogTitle className="text-white">Group Settings</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Button
                variant="outline"
                className="w-full justify-start border-white/30 text-white hover:bg-white/10"
              >
                <Bell className="w-4 h-4 mr-2" />
                Notification Settings
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start border-white/30 text-white hover:bg-white/10"
              >
                <Share className="w-4 h-4 mr-2" />
                Export Data
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start border-white/30 text-white hover:bg-white/10"
              >
                <Shield className="w-4 h-4 mr-2" />
                Privacy Settings
              </Button>
              
              <Separator className="bg-white/20" />
              
              <Button
                onClick={handleLeaveGroup}
                variant="outline"
                className="w-full justify-start border-red-500 text-red-400 hover:bg-red-500/20"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Leave Group
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Enhanced Leave Group Confirmation Dialog */}
        <LeaveGroupConfirmationDialog
          isOpen={showLeaveGroupDialog}
          onClose={() => setShowLeaveGroupDialog(false)}
          onConfirm={handleConfirmLeaveGroup}
          group={{
            id: group.id,
            name: group.name,
            description: group.description,
            totalMembers: group.totalMembers,
            currency: group.currency
          }}
          userBalance={{
            netBalance: currentUserBalance.netBalance,
            totalGetsBack: currentUserBalance.getsBackAmount,
            totalNeedsToPay: currentUserBalance.needsToPayAmount
          }}
          isCurrentUserOwner={group.owner === currentUserId}
          isCurrentUserAdmin={isAdmin}
          isLoading={leaveGroupMutation.isPending}
          members={members.map(member => ({
            id: member.id,
            name: member.name,
            email: member.email,
            isAdmin: member.isAdmin,
            isActive: member.isActive
          }))}
          currentUserId={currentUserId}
        />
      </div>
    </div>
  );
};

export default GroupDetailsPage;