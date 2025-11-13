import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, AlertCircle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaymentStatusBadgeProps {
  status: 'paid' | 'pending' | 'settled' | 'acknowledged';
  showIcon?: boolean;
  className?: string;
}

export const PaymentStatusBadge = ({ 
  status, 
  showIcon = true,
  className 
}: PaymentStatusBadgeProps) => {
  const statusConfig = {
    paid: {
      label: '✓ Paid',
      icon: CheckCircle,
      className: 'bg-green-500/20 text-green-400 border-green-500/30'
    },
    pending: {
      label: '⏳ Pending',
      icon: Clock,
      className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    },
    settled: {
      label: '✓ Settled',
      icon: CheckCircle,
      className: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    },
    acknowledged: {
      label: '👁️ Seen',
      icon: AlertCircle,
      className: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  };

  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <Badge className={cn(config.className, className)}>
      {showIcon && <Icon className="w-3 h-3 mr-1" />}
      {config.label}
    </Badge>
  );
};

interface OwesStatusBadgeProps {
  owesTo?: string;
  getsBackFrom?: string;
  amount: number;
  currency?: string;
  className?: string;
}

export const OwesStatusBadge = ({ 
  owesTo, 
  getsBackFrom, 
  amount,
  currency = '₹',
  className 
}: OwesStatusBadgeProps) => {
  if (owesTo) {
    return (
      <Badge className={cn('bg-red-500/20 text-red-400 border-red-500/30 flex items-center gap-1', className)}>
        <span>Owes {owesTo}</span>
        <ArrowRight className="w-3 h-3" />
        <span>{currency}{amount.toFixed(2)}</span>
      </Badge>
    );
  }

  if (getsBackFrom) {
    return (
      <Badge className={cn('bg-green-500/20 text-green-400 border-green-500/30 flex items-center gap-1', className)}>
        <span>Gets {currency}{amount.toFixed(2)}</span>
        <ArrowRight className="w-3 h-3" />
        <span>from {getsBackFrom}</span>
      </Badge>
    );
  }

  return (
    <Badge className={cn('bg-blue-500/20 text-blue-400 border-blue-500/30', className)}>
      ✓ All Settled
    </Badge>
  );
};

interface ShareStatusProps {
  isPayer: boolean;
  shareAmount: number;
  totalAmount: number;
  currency?: string;
  className?: string;
}

export const ShareStatusBadge = ({ 
  isPayer, 
  shareAmount, 
  totalAmount,
  currency = '₹',
  className 
}: ShareStatusProps) => {
  if (isPayer) {
    return (
      <Badge className={cn('bg-blue-500/20 text-blue-400 border-blue-500/30', className)}>
        Your share: {currency}{shareAmount.toFixed(2)} of {currency}{totalAmount.toFixed(2)} ✓ Already paid
      </Badge>
    );
  }

  return (
    <Badge className={cn('bg-yellow-500/20 text-yellow-400 border-yellow-500/30', className)}>
      Your share: {currency}{shareAmount.toFixed(2)} of {currency}{totalAmount.toFixed(2)}
    </Badge>
  );
};

export default PaymentStatusBadge;
