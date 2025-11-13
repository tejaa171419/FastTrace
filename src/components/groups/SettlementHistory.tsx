import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  History, 
  CheckCircle, 
  Clock, 
  X, 
  ArrowRight, 
  Calendar,
  CreditCard,
  Smartphone,
  Wallet,
  Building,
  QrCode,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSettlementHistory } from '@/hooks/useSettlementHistory';
import type { SettlementRecord } from '@/hooks/useSettlementHistory';

interface SettlementHistoryProps {
  groupId: string;
  currency?: string;
  onSettlementUpdate?: (settlementId: string, status: string) => void;
}

const SettlementHistory: React.FC<SettlementHistoryProps> = ({
  groupId,
  currency = 'INR',
  onSettlementUpdate
}) => {
  const { toast } = useToast();
  const [filter, setFilter] = useState<'all' | 'completed' | 'pending' | 'failed'>('all');
  const [page, setPage] = useState(1);
  
  // Fetch settlement history from API
  const { data: settlementData, isLoading, refetch } = useSettlementHistory({ 
    groupId, 
    page, 
    limit: 20 
  });

  const settlements = settlementData?.data?.settlements || [];
  const statistics = settlementData?.data?.statistics;
  const pagination = settlementData?.data?.pagination;

  const formatCurrency = (amount: number) => {
    const symbol = currency === 'USD' ? '$' : '₹';
    return `${symbol}${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (date: string | Date) => {
    return new Intl.DateTimeFormat('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'gpay':
      case 'phonepe':
        return Smartphone;
      case 'paytm':
        return Wallet;
      case 'upi':
        return QrCode;
      case 'netbanking':
        return Building;
      case 'card':
        return CreditCard;
      default:
        return CreditCard;
    }
  };

  const getPaymentMethodName = (method: string) => {
    const methods: { [key: string]: string } = {
      'gpay': 'Google Pay',
      'phonepe': 'PhonePe',
      'paytm': 'Paytm',
      'upi': 'UPI',
      'netbanking': 'Net Banking',
      'card': 'Card'
    };
    return methods[method] || method.toUpperCase();
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { 
        icon: CheckCircle, 
        className: 'bg-green-500/10 text-green-400 border-green-500/30',
        label: 'Completed'
      },
      processing: { 
        icon: Clock, 
        className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30 animate-pulse',
        label: 'Processing'
      },
      pending: { 
        icon: Clock, 
        className: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
        label: 'Pending'
      },
      failed: { 
        icon: X, 
        className: 'bg-red-500/10 text-red-400 border-red-500/30',
        label: 'Failed'
      },
      cancelled: { 
        icon: X, 
        className: 'bg-gray-500/10 text-gray-400 border-gray-500/30',
        label: 'Cancelled'
      }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config.icon;

    return (
      <Badge variant="outline" className={`${config.className} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const filteredSettlements = settlements.filter(settlement => {
    if (filter === 'all') return true;
    return settlement.status === filter;
  });

  const handleRetryPayment = (settlement: SettlementRecord) => {
    toast({
      title: "Payment Retry",
      description: `Retrying payment of ${formatCurrency(settlement.amount)} to ${settlement.toUser.firstName}`,
    });
    // Implement retry logic here
  };

  const handleCancelPayment = (settlement: SettlementRecord) => {
    toast({
      title: "Payment Cancelled",
      description: `Cancelled payment of ${formatCurrency(settlement.amount)} to ${settlement.toUser.firstName}`,
    });
    // Implement cancel logic here
  };

  const handleExportHistory = () => {
    toast({
      title: "Export Started",
      description: "Generating settlement history report...",
    });
    // Implement export functionality
  };

  const handleRefresh = () => {
    refetch();
    toast({
      title: "Refreshing",
      description: "Fetching latest settlement history...",
    });
  };

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardContent className="flex items-center justify-center p-8">
          <RefreshCw className="w-6 h-6 text-primary animate-spin mr-3" />
          <span className="text-white/60">Loading settlement history...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              Settlement History
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleRefresh}
                className="border-white/30 text-white hover:bg-white/10"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleExportHistory}
                className="border-white/30 text-white hover:bg-white/10"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Statistics Section */}
          {statistics && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <div className="text-xs text-white/60 mb-1">Total Settled</div>
                <div className="text-lg font-bold text-white">
                  {formatCurrency(statistics.totalAmount)}
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <div className="text-xs text-white/60 mb-1">Completed</div>
                <div className="text-lg font-bold text-green-400">
                  {statistics.completedCount}
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <div className="text-xs text-white/60 mb-1">Pending</div>
                <div className="text-lg font-bold text-yellow-400">
                  {statistics.pendingCount}
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <div className="text-xs text-white/60 mb-1">Failed</div>
                <div className="text-lg font-bold text-red-400">
                  {statistics.failedCount}
                </div>
              </div>
            </div>
          )}

          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            {(['all', 'completed', 'pending', 'failed'] as const).map((filterValue) => (
              <Button
                key={filterValue}
                size="sm"
                variant={filter === filterValue ? "default" : "outline"}
                onClick={() => setFilter(filterValue)}
                className={`${
                  filter === filterValue 
                    ? 'bg-primary text-white' 
                    : 'border-white/30 text-white hover:bg-white/10'
                }`}
              >
                <Filter className="w-3 h-3 mr-2" />
                {filterValue.charAt(0).toUpperCase() + filterValue.slice(1)}
              </Button>
            ))}
          </div>

          {filteredSettlements.length === 0 ? (
            <div className="text-center py-8">
              <History className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/60">No settlement history found</p>
              <p className="text-white/40 text-sm">
                {filter !== 'all' ? `No ${filter} settlements` : 'Start making settlements to see history'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSettlements.map((settlement) => {
                const PaymentIcon = getPaymentMethodIcon(settlement.paymentMethod);
                
                return (
                  <Card key={settlement.id} className="bg-white/5 border-white/10">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={settlement.fromUser.avatar?.url} />
                            <AvatarFallback className="bg-red-500/20 text-red-400 text-xs">
                              {settlement.fromUser.firstName.charAt(0)}
                              {settlement.fromUser.lastName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <ArrowRight className="w-4 h-4 text-white/40" />
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={settlement.toUser.avatar?.url} />
                            <AvatarFallback className="bg-green-500/20 text-green-400 text-xs">
                              {settlement.toUser.firstName.charAt(0)}
                              {settlement.toUser.lastName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="text-white text-sm font-medium">
                              {settlement.fromUser.firstName} → {settlement.toUser.firstName}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-white/60">
                              <PaymentIcon className="w-3 h-3" />
                              {getPaymentMethodName(settlement.paymentMethod)}
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-primary font-semibold">
                            {formatCurrency(settlement.amount)}
                          </div>
                          {getStatusBadge(settlement.status)}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-white/60">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(settlement.createdAt)}
                          </div>
                          <div>
                            ID: {settlement.transactionId}
                          </div>
                          {settlement.paymentReference && (
                            <div>
                              Ref: {settlement.paymentReference}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {settlement.status === 'failed' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRetryPayment(settlement)}
                              className="h-6 px-2 text-xs border-primary/30 text-primary hover:bg-primary/10"
                            >
                              Retry
                            </Button>
                          )}
                          {settlement.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCancelPayment(settlement)}
                              className="h-6 px-2 text-xs border-red-500/30 text-red-400 hover:bg-red-500/10"
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </div>

                      {settlement.notes && (
                        <>
                          <Separator className="my-2 bg-white/10" />
                          <div className="text-xs text-white/60">
                            <span className="font-medium">Note:</span> {settlement.notes}
                          </div>
                        </>
                      )}

                      {settlement.failureReason && (
                        <>
                          <Separator className="my-2 bg-white/10" />
                          <div className="text-xs text-red-400">
                            <span className="font-medium">Failure reason:</span> {settlement.failureReason}
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <div className="text-sm text-white/60">
                Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalItems} total)
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pagination.currentPage === 1}
                  onClick={() => setPage(page - 1)}
                  className="border-white/30 text-white hover:bg-white/10"
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pagination.currentPage === pagination.totalPages}
                  onClick={() => setPage(page + 1)}
                  className="border-white/30 text-white hover:bg-white/10"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SettlementHistory;
