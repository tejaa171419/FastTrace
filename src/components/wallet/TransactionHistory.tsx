import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { walletAPI } from '@/lib/walletAPI';
import type { WalletData, WalletTransaction, PaymentHistoryFilters } from '@/types/wallet';
import {
  History,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  Gift,
  DollarSign,
  Send,
  Plus,
  Smartphone,
  Search,
  Filter,
  Calendar,
  TrendingUp,
  TrendingDown,
  Loader2,
  ChevronDown,
  Eye,
  EyeOff,
  Download
} from 'lucide-react';

interface TransactionHistoryProps {
  wallet: WalletData;
  showBalance: boolean;
  limit?: number;
  showFilters?: boolean;
  showHeader?: boolean;
  onRefresh?: () => void;
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  wallet,
  showBalance,
  limit,
  showFilters = false,
  showHeader = true,
  onRefresh
}) => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [filters, setFilters] = useState<PaymentHistoryFilters>({
    page: 1,
    limit: limit || 20
  });
  const [expandedTransaction, setExpandedTransaction] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  // Load transaction history
  const loadTransactions = useCallback(async (reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setTransactions([]);
      } else {
        setLoadingMore(true);
      }

      const response = await walletAPI.getPaymentHistory({
        ...filters,
        page: reset ? 1 : filters.page
      });

      const newTransactions = response.payments;

      if (reset) {
        setTransactions(newTransactions);
      } else {
        setTransactions(prev => [...prev, ...newTransactions]);
      }

      setHasMore(response.pagination.currentPage < response.pagination.totalPages);
      
      if (reset) {
        setFilters(prev => ({ ...prev, page: 1 }));
      }
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filters]);

  // Load more transactions
  const loadMore = () => {
    if (!loadingMore && hasMore) {
      setFilters(prev => ({ ...prev, page: prev.page! + 1 }));
    }
  };

  // Filter change handler
  const handleFilterChange = (key: keyof PaymentHistoryFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({ page: 1, limit: filters.limit });
    setSearchQuery('');
  };
  
  // Export transactions to CSV
  const handleExport = () => {
    try {
      setIsExporting(true);
      
      // Prepare CSV headers
      const headers = [
        'Date',
        'Description',
        'Type',
        'Category',
        'Amount',
        'Status',
        'Method',
        'Balance After',
        'Transaction ID'
      ];
      
      // Prepare CSV data
      const csvData = filteredTransactions.map(tx => [
        new Date(tx.timestamp || tx.createdAt).toLocaleString(),
        tx.description,
        tx.type,
        tx.category || '',
        tx.amount.toString(),
        tx.status || '',
        tx.method || 'Wallet',
        tx.balanceAfter !== undefined ? tx.balanceAfter.toString() : '',
        tx.id
      ]);
      
      // Create CSV content
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      const date = new Date().toISOString().split('T')[0];
      const filename = `wallet-transactions-${date}.csv`;
      
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log(`Exported ${csvData.length} transactions`);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export transactions. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Get transaction icon
  const getTransactionIcon = (type: string) => {
    const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
      credit: ArrowDownLeft,
      debit: ArrowUpRight,
      transfer_in: ArrowDownLeft,
      transfer_out: ArrowUpRight,
      refund: RefreshCw,
      cashback: Gift,
      wallet_topup: Plus,
      wallet_transfer: Send,
      upi: Smartphone
    };
    
    const IconComponent = iconMap[type] || DollarSign;
    return IconComponent;
  };

  // Get transaction color
  const getTransactionColor = (type: string) => {
    const colorMap: Record<string, string> = {
      credit: 'text-green-400',
      debit: 'text-red-400',
      transfer_in: 'text-blue-400',
      transfer_out: 'text-orange-400',
      refund: 'text-purple-400',
      cashback: 'text-green-400',
      wallet_topup: 'text-blue-400',
      wallet_transfer: 'text-orange-400'
    };
    return colorMap[type] || 'text-gray-400';
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      completed: 'bg-green-500/20 text-green-400 border-green-500/30',
      pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      failed: 'bg-red-500/20 text-red-400 border-red-500/30',
      cancelled: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    };
    return colorMap[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  // Filter transactions by search query
  const filteredTransactions = transactions.filter(transaction =>
    !searchQuery || 
    transaction.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    transaction.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Effects
  useEffect(() => {
    if (wallet) {
      // Use wallet's recent transactions initially
      setTransactions(wallet.recentTransactions || []);
      
      // Then load full history if not limited
      if (!limit || limit > 5) {
        loadTransactions(true);
      }
    }
  }, [wallet, loadTransactions, limit]);

  useEffect(() => {
    if (filters.page && filters.page > 1) {
      loadTransactions();
    } else if (filters.page === 1 && Object.keys(filters).length > 2) {
      loadTransactions(true);
    }
  }, [filters, loadTransactions]);

  return (
    <Card className="bg-gradient-to-br from-gray-800/40 via-gray-900/40 to-black/40 backdrop-blur-xl border border-gray-700/50 shadow-2xl">
      {showHeader && (
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-3 text-2xl font-bold">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-600/20">
                <History className="w-6 h-6" />
              </div>
              {limit ? `Recent Activity` : 'Transaction History'}
            </CardTitle>
            
            <div className="flex items-center gap-2">
              {onRefresh && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRefresh}
                  className="text-gray-300 hover:text-white hover:bg-white/10"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              )}
              
              {!limit && filteredTransactions.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleExport}
                  disabled={isExporting}
                  className="text-gray-300 hover:text-white hover:bg-white/10"
                  title="Export to CSV"
                >
                  {isExporting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                </Button>
              )}
              
              {!limit && (
                <Badge variant="outline" className="text-gray-400 border-gray-600">
                  {transactions.length} transactions
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
      )}

      <CardContent className="space-y-4">
        {/* Filters */}
        {showFilters && (
          <div className="space-y-4 p-4 rounded-xl bg-gray-800/30 border border-gray-700/30">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-300">Filters</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search transactions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-900/50 border-gray-700 text-white"
                />
              </div>
              
              {/* Type Filter */}
              <Select
                value={filters.type || 'all'}
                onValueChange={(value) => handleFilterChange('type', value === 'all' ? undefined : value)}
              >
                <SelectTrigger className="bg-gray-900/50 border-gray-700 text-white">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="wallet_topup">Top-up</SelectItem>
                  <SelectItem value="wallet_transfer">Transfer</SelectItem>
                  <SelectItem value="settlement">Settlement</SelectItem>
                  <SelectItem value="expense_payment">Expense</SelectItem>
                  <SelectItem value="refund">Refund</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Status Filter */}
              <Select
                value={filters.status || 'all'}
                onValueChange={(value) => handleFilterChange('status', value === 'all' ? undefined : value)}
              >
                <SelectTrigger className="bg-gray-900/50 border-gray-700 text-white">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Clear Filters */}
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="border-gray-700 text-gray-300 hover:bg-white/10"
              >
                Clear
              </Button>
            </div>
          </div>
        )}

        {/* Transaction List */}
        <div className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-400">Loading transactions...</span>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <History className="w-12 h-12 mx-auto mb-4 text-gray-500" />
              <p className="text-gray-400 text-lg font-medium mb-2">No transactions found</p>
              <p className="text-gray-500 text-sm">
                {searchQuery || Object.keys(filters).length > 2 
                  ? 'Try adjusting your filters or search query'
                  : 'Your transaction history will appear here'
                }
              </p>
            </div>
          ) : (
            <ScrollArea className="h-auto max-h-96">
              {filteredTransactions.map((transaction, index) => {
                const IconComponent = getTransactionIcon(transaction.type);
                const isExpanded = expandedTransaction === transaction.id;
                const isCredit = transaction.type === 'credit' || transaction.type === 'cashback' || 
                               transaction.type === 'transfer_in' || transaction.type === 'refund';
                
                return (
                  <div key={transaction.id || index} className="group">
                    <div 
                      className="flex items-center gap-4 p-4 rounded-xl border border-gray-700/50 hover:bg-gray-700/20 transition-all duration-200 hover:border-gray-600/50 cursor-pointer"
                      onClick={() => setExpandedTransaction(isExpanded ? null : transaction.id)}
                    >
                      {/* Transaction Icon */}
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-gray-700/50 to-gray-800/50 backdrop-blur-sm ${getTransactionColor(transaction.type)}`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      
                      {/* Transaction Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold text-white text-base truncate">
                            {transaction.description}
                          </p>
                          <div className="flex items-center gap-2">
                            {transaction.status && (
                              <Badge className={`text-xs px-2 py-1 ${getStatusColor(transaction.status)}`}>
                                {transaction.status}
                              </Badge>
                            )}
                            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <p className="text-gray-400 text-sm">
                            {transaction.category || transaction.type} • {formatDate(transaction.timestamp || transaction.createdAt)}
                          </p>
                          <div className="text-right">
                            <p className={`font-bold text-lg ${isCredit ? 'text-green-400' : 'text-red-400'}`}>
                              {isCredit ? '+' : '-'}₹{transaction.amount.toLocaleString('en-IN')}
                            </p>
                            {showBalance && transaction.balanceAfter !== undefined && (
                              <p className="text-gray-500 text-xs">
                                Balance: ₹{transaction.balanceAfter.toLocaleString('en-IN')}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="mt-2 p-4 rounded-xl bg-gray-800/30 border border-gray-700/30 ml-16">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-400">Transaction ID:</span>
                            <p className="text-white font-mono">{transaction.id}</p>
                          </div>
                          <div>
                            <span className="text-gray-400">Method:</span>
                            <p className="text-white capitalize">{transaction.method || 'Wallet'}</p>
                          </div>
                          {transaction.balanceBefore !== undefined && (
                            <div>
                              <span className="text-gray-400">Balance Before:</span>
                              <p className="text-white">₹{transaction.balanceBefore.toLocaleString('en-IN')}</p>
                            </div>
                          )}
                          {transaction.balanceAfter !== undefined && (
                            <div>
                              <span className="text-gray-400">Balance After:</span>
                              <p className="text-white">₹{transaction.balanceAfter.toLocaleString('en-IN')}</p>
                            </div>
                          )}
                        </div>
                        
                        {transaction.from && (
                          <div className="mt-3 pt-3 border-t border-gray-700/50">
                            <span className="text-gray-400 text-sm">From:</span>
                            <p className="text-white">
                              {transaction.from.firstName} {transaction.from.lastName}
                              <span className="text-gray-400 ml-2">({transaction.from.email})</span>
                            </p>
                          </div>
                        )}
                        
                        {transaction.to && (
                          <div className="mt-2">
                            <span className="text-gray-400 text-sm">To:</span>
                            <p className="text-white">
                              {transaction.to.firstName} {transaction.to.lastName}
                              <span className="text-gray-400 ml-2">({transaction.to.email})</span>
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {index < filteredTransactions.length - 1 && <Separator className="my-3 bg-gray-700/30" />}
                  </div>
                );
              })}
            </ScrollArea>
          )}
        </div>

        {/* Load More Button */}
        {!limit && hasMore && !loading && (
          <div className="text-center pt-4">
            <Button
              variant="outline"
              onClick={loadMore}
              disabled={loadingMore}
              className="border-gray-700 text-gray-300 hover:bg-white/10"
            >
              {loadingMore ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                'Load More'
              )}
            </Button>
          </div>
        )}

        {/* View All Link for Limited View */}
        {limit && wallet.statistics.transactionCount > limit && (
          <div className="text-center pt-4">
            <Button
              variant="link"
              className="text-blue-400 hover:text-blue-300"
              onClick={() => window.location.hash = '#transactions'}
            >
              View All {wallet.statistics.transactionCount} Transactions →
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionHistory;