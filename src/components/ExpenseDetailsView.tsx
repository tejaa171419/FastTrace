import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Calendar,
  Receipt,
  Users,
  IndianRupee,
  MapPin,
  Tag,
  MessageSquare,
  Download,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  CreditCard,
  Split,
  User,
  ChevronDown,
  ChevronUp,
  Filter,
  Search,
  SortAsc,
  SortDesc,
  MoreHorizontal,
  Copy,
  Share2,
  Plus,
  ArrowRight
} from 'lucide-react';
import { PaymentStatusBadge, OwesStatusBadge, ShareStatusBadge } from './PaymentStatusBadge';
import { cn } from '@/lib/utils';
import { Expense, User as UserType } from '@/lib/types';

interface ExpenseDetailsViewProps {
  expenses: Expense[];
  currentUserId: string;
  isLoading?: boolean;
  onExpenseUpdate?: (expense: Expense) => void;
  onExpenseDelete?: (expenseId: string) => void;
  onAddExpense?: () => void;
}

interface FilterOptions {
  category: string;
  status: string;
  dateRange: string;
  minAmount: number;
  maxAmount: number;
  paidBy: string;
}

const ExpenseDetailsView = ({
  expenses,
  currentUserId,
  isLoading = false,
  onExpenseUpdate,
  onExpenseDelete,
  onAddExpense
}: ExpenseDetailsViewProps) => {
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<FilterOptions>({
    category: 'all',
    status: 'all',
    dateRange: 'all',
    minAmount: 0,
    maxAmount: 100000,
    paidBy: 'all'
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'title'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);

  // Filter and sort expenses
  const filteredAndSortedExpenses = useMemo(() => {
    let filtered = expenses.filter(expense => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!expense.title.toLowerCase().includes(query) && 
            !expense.description?.toLowerCase().includes(query) &&
            !expense.category.toLowerCase().includes(query)) {
          return false;
        }
      }

      // Category filter
      if (filters.category !== 'all' && expense.category !== filters.category) {
        return false;
      }

      // Amount filter
      if (expense.amount < filters.minAmount || expense.amount > filters.maxAmount) {
        return false;
      }

      // Date range filter
      if (filters.dateRange !== 'all') {
        const expenseDate = new Date(expense.date);
        const now = new Date();
        const daysDiff = Math.floor((now.getTime() - expenseDate.getTime()) / (1000 * 60 * 60 * 24));
        
        switch (filters.dateRange) {
          case 'today':
            if (daysDiff > 0) return false;
            break;
          case 'week':
            if (daysDiff > 7) return false;
            break;
          case 'month':
            if (daysDiff > 30) return false;
            break;
          case 'year':
            if (daysDiff > 365) return false;
            break;
        }
      }

      // Paid by filter
      if (filters.paidBy !== 'all') {
        const paidById = typeof expense.paidBy === 'object' ? expense.paidBy._id : expense.paidBy;
        if (paidById !== filters.paidBy) {
          return false;
        }
      }

      return true;
    });

    // Sort expenses
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [expenses, searchQuery, filters, sortBy, sortOrder]);

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, any> = {
      'Food & Dining': '🍽️',
      'Transportation': '🚗',
      'Shopping': '🛍️',
      'Entertainment': '🎬',
      'Bills & Utilities': '📄',
      'Healthcare': '🏥',
      'Travel': '✈️',
      'Education': '📚',
      'Groceries': '🛒',
      'Personal Care': '💄',
      'Home & Garden': '🏠',
      'Gifts & Donations': '🎁',
      'Business': '💼',
      'Other': '📦'
    };
    return icons[category] || '📦';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'disputed': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const toggleExpanded = (expenseId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(expenseId)) {
      newExpanded.delete(expenseId);
    } else {
      newExpanded.add(expenseId);
    }
    setExpandedItems(newExpanded);
  };

  const getUserShare = (expense: Expense) => {
    const userSplit = expense.splitBetween?.find(
      split => (typeof split.user === 'object' ? split.user._id : split.user) === currentUserId
    );
    return userSplit ? userSplit.amount : 0;
  };

  const getUserStatus = (expense: Expense) => {
    const userSplit = expense.splitBetween?.find(
      split => (typeof split.user === 'object' ? split.user._id : split.user) === currentUserId
    );
    return userSplit ? userSplit.status : 'pending';
  };

  // Function to get the name of the person who paid for the expense
  const getPaidByName = (expense: Expense) => {
    // Handle case where paidBy is a populated User object
    if (typeof expense.paidBy === 'object' && expense.paidBy !== null) {
      const user = expense.paidBy as UserType;
      const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
      return fullName || user.email || 'Unknown User';
    }
    
    // Handle case where paidBy is a string ID
    if (typeof expense.paidBy === 'string') {
      const paidById = expense.paidBy;
      
      // Try to find the user in the splitBetween array
      const payerSplit = expense.splitBetween?.find(split => {
        // Handle both populated and non-populated user objects in splitBetween
        if (typeof split.user === 'object' && split.user !== null) {
          return split.user._id === paidById;
        } else if (typeof split.user === 'string') {
          return split.user === paidById;
        }
        return false;
      });
      
      // If we found the payer in splitBetween and the user is populated
      if (payerSplit && typeof payerSplit.user === 'object' && payerSplit.user !== null) {
        const user = payerSplit.user as UserType;
        const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
        return fullName || user.email || 'Unknown User';
      }
      
      // If we couldn't find the user, return a generic message
      return 'Unknown User';
    }
    
    // Fallback case
    return 'Unknown User';
  };

  const getUniqueCategories = () => {
    const categories = [...new Set(expenses.map(e => e.category))];
    return categories.sort();
  };

  const getUniquePayees = () => {
    const payees = expenses.map(e => ({
      id: typeof e.paidBy === 'object' ? e.paidBy._id : e.paidBy,
      name: typeof e.paidBy === 'object' 
        ? `${e.paidBy.firstName || ''} ${e.paidBy.lastName || ''}`.trim()
        : 'Unknown'
    }));
    return payees.filter((payee, index, self) => 
      index === self.findIndex(p => p.id === payee.id)
    );
  };

  if (isLoading) {
    return (
      <Card className="glass-card border-white/20">
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-white/60">Loading expenses...</p>
        </CardContent>
      </Card>
    );
  }

  if (expenses.length === 0) {
    return (
      <Card className="glass-card border-white/20">
        <CardContent className="p-6 text-center">
          <Receipt className="w-16 h-16 text-white/40 mx-auto mb-4" />
          <h3 className="text-white text-lg font-semibold mb-2">No Expenses Yet</h3>
          <p className="text-white/60 mb-4">Start by adding your first expense to the group</p>
          <Button onClick={() => onAddExpense?.()} className="bg-primary text-white">
            <Receipt className="w-4 h-4 mr-2" />
            Add First Expense
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">All Expenses</h2>
          <p className="text-white/60">{filteredAndSortedExpenses.length} of {expenses.length} expenses</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/60" />
            <input
              type="text"
              placeholder="Search expenses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Sort */}
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="date">Sort by Date</option>
              <option value="amount">Sort by Amount</option>
              <option value="title">Sort by Title</option>
            </select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="border-white/20 text-white hover:bg-white/10"
            >
              {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
            </Button>
          </div>

          {/* Filters Toggle */}
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="border-white/20 text-white hover:bg-white/10"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
          
          {/* Add Expense Button */}
          {onAddExpense && (
            <Button
              onClick={onAddExpense}
              className="bg-gradient-primary text-white hover:shadow-glow transition-all duration-300 hover:scale-105"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Expense
            </Button>
          )}
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <Card className="glass-card border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Filter Expenses</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* Category Filter */}
            <div>
              <label className="text-white/80 text-sm mb-2 block">Category</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({...filters, category: e.target.value})}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Categories</option>
                {getUniqueCategories().map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Date Range Filter */}
            <div>
              <label className="text-white/80 text-sm mb-2 block">Date Range</label>
              <select
                value={filters.dateRange}
                onChange={(e) => setFilters({...filters, dateRange: e.target.value})}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
              </select>
            </div>

            {/* Paid By Filter */}
            <div>
              <label className="text-white/80 text-sm mb-2 block">Paid By</label>
              <select
                value={filters.paidBy}
                onChange={(e) => setFilters({...filters, paidBy: e.target.value})}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Members</option>
                {getUniquePayees().map(payee => (
                  <option key={payee.id} value={payee.id}>{payee.name}</option>
                ))}
              </select>
            </div>

            {/* Amount Range */}
            <div>
              <label className="text-white/80 text-sm mb-2 block">Min Amount</label>
              <input
                type="number"
                value={filters.minAmount}
                onChange={(e) => setFilters({...filters, minAmount: Number(e.target.value)})}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="0"
              />
            </div>

            <div>
              <label className="text-white/80 text-sm mb-2 block">Max Amount</label>
              <input
                type="number"
                value={filters.maxAmount}
                onChange={(e) => setFilters({...filters, maxAmount: Number(e.target.value)})}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="100000"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expenses List */}
      <div className="space-y-4">
        {filteredAndSortedExpenses.map((expense) => {
          const isExpanded = expandedItems.has(expense._id);
          const userShare = getUserShare(expense);
          const userStatus = getUserStatus(expense);
          const isPaidByUser = typeof expense.paidBy === 'object' 
            ? expense.paidBy._id === currentUserId 
            : expense.paidBy === currentUserId;

          return (
            <Card key={expense._id} className="glass-card border-white/20 hover:border-white/30 transition-all duration-300">
              <CardContent className="p-0">
                {/* Main expense info */}
                <div 
                  className="p-6 cursor-pointer"
                  onClick={() => toggleExpanded(expense._id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      {/* Category Icon */}
                      <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center text-2xl">
                        {getCategoryIcon(expense.category)}
                      </div>

                      {/* Expense Details */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-white font-semibold text-lg">{expense.title}</h3>
                          <Badge className={getStatusColor(expense.status || 'active')}>
                            {expense.status || 'active'}
                          </Badge>
                          {isPaidByUser && (
                            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                              You paid
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-white/60 text-sm">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(expense.date)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Tag className="w-4 h-4" />
                            {expense.category}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {isPaidByUser ? 'You paid upfront' : `${getPaidByName(expense)} paid upfront`}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {expense.splitBetween?.length || 0} people
                          </span>
                        </div>

                        {expense.description && (
                          <p className="text-white/60 text-sm mt-2">{expense.description}</p>
                        )}
                      </div>
                    </div>

                    {/* Amount and Action */}
                    <div className="text-right">
                      <div className="text-2xl font-bold text-white mb-2">
                        {formatCurrency(expense.amount)}
                      </div>
                      
                      {userShare > 0 && (
                        <div className="text-sm space-y-2">
                          <ShareStatusBadge 
                            isPayer={isPaidByUser}
                            shareAmount={userShare}
                            totalAmount={expense.amount}
                            currency={expense.currency || '₹'}
                          />
                          {!isPaidByUser && (
                            <>
                              <PaymentStatusBadge status={userStatus as any} />
                              {userStatus === 'pending' && (
                                <div className="flex items-center gap-1 text-yellow-400 text-xs">
                                  <ArrowRight className="w-3 h-3" />
                                  <span>Owe {getPaidByName(expense)}</span>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      )}

                      <div className="mt-2">
                        {isExpanded ? 
                          <ChevronUp className="w-5 h-5 text-white/60" /> : 
                          <ChevronDown className="w-5 h-5 text-white/60" />
                        }
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-white/10 bg-white/5">
                    <div className="p-6 space-y-6">
                      {/* Split Details */}
                      {expense.splitBetween && expense.splitBetween.length > 0 && (
                        <div>
                          <h4 className="text-white font-medium mb-4 flex items-center gap-2">
                            <Split className="w-4 h-4" />
                            Split Details
                          </h4>
                          <div className="space-y-3">
                            {expense.splitBetween.map((split, index) => (
                              <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                <div className="flex items-center gap-3">
                                  <Avatar className="w-8 h-8">
                                    <AvatarImage src={typeof split.user === 'object' ? split.user.avatar?.url : undefined} />
                                    <AvatarFallback className="bg-primary text-white text-sm">
                                      {typeof split.user === 'object' 
                                        ? `${split.user.firstName?.charAt(0) || ''}${split.user.lastName?.charAt(0) || ''}`
                                        : 'U'
                                      }
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="text-white">
                                      {typeof split.user === 'object' 
                                        ? `${split.user.firstName || ''} ${split.user.lastName || ''}`.trim()
                                        : 'Unknown User'
                                      }
                                    </div>
                                    {(() => {
                                      const splitUserId = typeof split.user === 'object' ? split.user._id : split.user;
                                      const paidById = typeof expense.paidBy === 'object' ? expense.paidBy._id : expense.paidBy;
                                      const isSplitPayer = splitUserId === paidById;
                                      return isSplitPayer ? (
                                        <span className="text-xs text-blue-400">✓ Already paid (payer)</span>
                                      ) : split.status === 'pending' ? (
                                        <span className="text-xs text-yellow-400 flex items-center gap-1">
                                          <ArrowRight className="w-3 h-3" />
                                          Owes {getPaidByName(expense)}
                                        </span>
                                      ) : null;
                                    })()}
                                  </div>
                                </div>
                                <div className="text-right space-y-1">
                                  <div className="text-white font-medium">{formatCurrency(split.amount)}</div>
                                  <PaymentStatusBadge status={split.status as any} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Additional Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Payment Info */}
                        <div>
                          <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                            <CreditCard className="w-4 h-4" />
                            Payment Details
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-white/60">Payment Method:</span>
                              <span className="text-white capitalize">{expense.paymentMethod || 'cash'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-white/60">Split Method:</span>
                              <span className="text-white capitalize">{expense.splitMethod || 'equal'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-white/60">Paid Upfront By:</span>
                              <span className="text-white font-semibold">
                                {isPaidByUser ? 'You' : getPaidByName(expense)}
                              </span>
                            </div>
                            {!isPaidByUser && userShare > 0 && userStatus === 'pending' && (
                              <div className="flex justify-between items-center p-2 bg-yellow-500/10 border border-yellow-500/30 rounded mt-2">
                                <span className="text-yellow-400 text-xs flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3" />
                                  You owe
                                </span>
                                <span className="text-yellow-400 font-bold">
                                  {formatCurrency(userShare)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Tags and Location */}
                        <div>
                          <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                            <Tag className="w-4 h-4" />
                            Additional Info
                          </h4>
                          <div className="space-y-3">
                            {expense.tags && expense.tags.length > 0 && (
                              <div>
                                <span className="text-white/60 text-sm">Tags:</span>
                                <div className="flex flex-wrap gap-2 mt-1">
                                  {expense.tags.map((tag, index) => (
                                    <Badge key={index} variant="outline" className="border-white/20 text-white/80">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {expense.location && (
                              <div>
                                <span className="text-white/60 text-sm">Location:</span>
                                <div className="flex items-center gap-1 mt-1">
                                  <MapPin className="w-4 h-4 text-white/60" />
                                  <span className="text-white text-sm">{expense.location.name}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-4 border-t border-white/10">
                        <div className="flex gap-3">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedExpense(expense);
                            }}
                            className="border-white/20 text-white hover:bg-white/10"
                          >
                            <Receipt className="w-4 h-4 mr-2" />
                            View Details
                          </Button>
                          
                          {isPaidByUser && (
                            <>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onExpenseUpdate?.(expense);
                                }}
                                className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </Button>
                              
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onExpenseDelete?.(expense._id);
                                }}
                                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </Button>
                            </>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(`${expense.title} - ${formatCurrency(expense.amount)}`);
                            }}
                            className="text-white/60 hover:text-white hover:bg-white/10"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (navigator.share) {
                                navigator.share({
                                  title: expense.title,
                                  text: `${expense.title} - ${formatCurrency(expense.amount)}`,
                                });
                              }
                            }}
                            className="text-white/60 hover:text-white hover:bg-white/10"
                          >
                            <Share2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Expense Detail Modal */}
      {selectedExpense && (
        <Dialog open={!!selectedExpense} onOpenChange={() => setSelectedExpense(null)}>
          <DialogContent className="bg-black/95 border-white/20 max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                <Receipt className="w-5 h-5" />
                Expense Details
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Expense Header */}
              <div className="text-center p-6 bg-white/5 rounded-lg">
                <div className="text-4xl mb-2">{getCategoryIcon(selectedExpense.category)}</div>
                <h2 className="text-2xl font-bold text-white mb-2">{selectedExpense.title}</h2>
                <div className="text-3xl font-bold text-primary mb-2">
                  {formatCurrency(selectedExpense.amount)}
                </div>
                <p className="text-white/60">{formatDate(selectedExpense.date)}</p>
              </div>

              {/* Full expense details would go here */}
              <div className="text-center">
                <p className="text-white/60">Complete expense detail view implementation...</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ExpenseDetailsView;
export { ExpenseDetailsView };