import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ArrowRightLeft, 
  Calendar,
  Filter,
  Download
} from "lucide-react";
import { useBankTransfer, BankTransfer } from "@/hooks/useBankTransfer";
import { format } from "date-fns";

export const TransferHistory = () => {
  const { getTransferHistory, loading } = useBankTransfer();
  
  const [transfers, setTransfers] = useState<BankTransfer[]>([]);
  const [selectedTransfer, setSelectedTransfer] = useState<BankTransfer | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    fetchTransfers();
  }, [statusFilter, typeFilter]);

  const fetchTransfers = async () => {
    const params: any = {};
    if (statusFilter !== "all") params.status = statusFilter;
    if (typeFilter !== "all") params.transferType = typeFilter;
    
    const result = await getTransferHistory(params);
    setTransfers(result.transfers);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: any = {
      completed: { label: "Completed", color: "bg-green-500/20 text-green-500 border-green-500/30", icon: CheckCircle2 },
      processing: { label: "Processing", color: "bg-blue-500/20 text-blue-500 border-blue-500/30", icon: Clock },
      pending: { label: "Pending", color: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30", icon: Clock },
      failed: { label: "Failed", color: "bg-red-500/20 text-red-500 border-red-500/30", icon: XCircle },
      cancelled: { label: "Cancelled", color: "bg-gray-500/20 text-gray-500 border-gray-500/30", icon: XCircle },
      initiated: { label: "Initiated", color: "bg-purple-500/20 text-purple-500 border-purple-500/30", icon: Clock },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant="outline" className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getTransferTypeLabel = (type: string) => {
    const labels: any = {
      wallet_to_bank: "Wallet → Bank",
      bank_to_wallet: "Bank → Wallet",
      wallet_to_upi: "Wallet → UPI",
      bank_to_bank: "Bank → Bank",
      bank_to_upi: "Bank → UPI"
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="glass-card border-white/20">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="glass-card border-white/20">
              <ArrowRightLeft className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="wallet_to_bank">Wallet → Bank</SelectItem>
              <SelectItem value="bank_to_wallet">Bank → Wallet</SelectItem>
              <SelectItem value="wallet_to_upi">Wallet → UPI</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Transfer List */}
      <div className="space-y-3">
        {loading ? (
          // Loading skeleton
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="glass-card border-white/10 rounded-lg p-4">
              <Skeleton className="h-20 w-full" />
            </div>
          ))
        ) : transfers.length === 0 ? (
          // Empty state
          <div className="text-center py-12 glass-card border-white/10 rounded-lg">
            <ArrowRightLeft className="w-16 h-16 mx-auto mb-4 text-muted-foreground/40" />
            <h3 className="text-lg font-semibold mb-2">No Transfers Found</h3>
            <p className="text-muted-foreground text-sm">
              {statusFilter !== "all" || typeFilter !== "all" 
                ? "Try adjusting your filters"
                : "Start by making your first transfer"}
            </p>
          </div>
        ) : (
          // Transfer items
          transfers.map((transfer) => (
            <div
              key={transfer._id}
              className="glass-card border-white/10 rounded-lg p-4 hover:bg-white/5 transition-all cursor-pointer"
              onClick={() => setSelectedTransfer(transfer)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="font-semibold truncate">{getTransferTypeLabel(transfer.transferType)}</p>
                    {getStatusBadge(transfer.status)}
                  </div>
                  
                  <p className="text-sm text-muted-foreground truncate mb-2">
                    {transfer.description}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(transfer.createdAt), "MMM dd, yyyy")}
                    </span>
                    <span>ID: {transfer.transferId}</span>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">₹{transfer.amount.toLocaleString('en-IN')}</p>
                  {transfer.fees.total > 0 && (
                    <p className="text-xs text-muted-foreground">+ ₹{transfer.fees.total.toFixed(2)} fees</p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Transfer Details Dialog */}
      <Dialog open={!!selectedTransfer} onOpenChange={() => setSelectedTransfer(null)}>
        <DialogContent className="glass-card border-primary/20 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              Transfer Details
              {selectedTransfer && getStatusBadge(selectedTransfer.status)}
            </DialogTitle>
            <DialogDescription>
              Transaction ID: {selectedTransfer?.transferId}
            </DialogDescription>
          </DialogHeader>

          {selectedTransfer && (
            <div className="space-y-6 py-4">
              {/* Amount Section */}
              <div className="glass-card border-white/10 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground mb-2">Transfer Amount</p>
                <p className="text-4xl font-bold text-primary">
                  ₹{selectedTransfer.amount.toLocaleString('en-IN')}
                </p>
                {selectedTransfer.fees.total > 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    + ₹{selectedTransfer.fees.total.toFixed(2)} fees
                  </p>
                )}
              </div>

              {/* Transfer Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="glass-card border-white/10 rounded-lg p-4">
                  <p className="text-xs text-muted-foreground mb-2">From</p>
                  <p className="font-semibold capitalize">{selectedTransfer.source.type}</p>
                  {selectedTransfer.source.bankName && (
                    <p className="text-sm text-muted-foreground">{selectedTransfer.source.bankName}</p>
                  )}
                </div>

                <div className="glass-card border-white/10 rounded-lg p-4">
                  <p className="text-xs text-muted-foreground mb-2">To</p>
                  <p className="font-semibold capitalize">{selectedTransfer.destination.type}</p>
                  {selectedTransfer.destination.bankName && (
                    <p className="text-sm text-muted-foreground">{selectedTransfer.destination.bankName}</p>
                  )}
                  {selectedTransfer.destination.upiId && (
                    <p className="text-sm text-muted-foreground font-mono">{selectedTransfer.destination.upiId}</p>
                  )}
                </div>
              </div>

              {/* Fee Breakdown */}
              {selectedTransfer.fees.total > 0 && (
                <div className="glass-card border-white/10 rounded-lg p-4">
                  <p className="font-semibold mb-3">Fee Breakdown</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Processing Fee</span>
                      <span>₹{selectedTransfer.fees.processingFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Gateway Fee</span>
                      <span>₹{selectedTransfer.fees.gatewayFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">GST (18%)</span>
                      <span>₹{selectedTransfer.fees.gst.toFixed(2)}</span>
                    </div>
                    <div className="border-t border-white/10 pt-2 flex justify-between font-semibold">
                      <span>Total Fees</span>
                      <span>₹{selectedTransfer.fees.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div className="glass-card border-white/10 rounded-lg p-4">
                <p className="font-semibold mb-3">Timeline</p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Clock className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm">Initiated</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(selectedTransfer.createdAt), "MMM dd, yyyy 'at' hh:mm a")}
                      </p>
                    </div>
                  </div>
                  
                  {selectedTransfer.completedAt && (
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm">Completed</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(selectedTransfer.completedAt), "MMM dd, yyyy 'at' hh:mm a")}
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedTransfer.processing?.estimatedCompletionAt && !selectedTransfer.completedAt && (
                    <div className="flex items-start gap-3">
                      <Clock className="w-4 h-4 text-blue-500 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm">Estimated Completion</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(selectedTransfer.processing.estimatedCompletionAt), "MMM dd, yyyy 'at' hh:mm a")}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
