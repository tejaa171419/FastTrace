// Enhanced wallet types with comprehensive backend integration
export interface WalletTransaction {
  id: string;
  type: 'credit' | 'debit' | 'transfer_in' | 'transfer_out' | 'refund' | 'fee' | 'cashback';
  amount: number;
  description: string;
  category: 'topup' | 'payment' | 'transfer' | 'withdrawal' | 'refund' | 'fee' | 'cashback' | 'reward';
  paymentId?: string;
  balanceBefore: number;
  balanceAfter: number;
  timestamp: string;
  metadata?: Record<string, any>;
  formattedAmount?: string;
  statusColor?: string;
  icon?: string;
}

export interface WalletLimits {
  daily: {
    limit: number;
    used: number;
    remaining: number;
    lastReset?: string;
  };
  monthly: {
    limit: number;
    used: number;
    remaining: number;
    lastReset?: string;
  };
  perTransaction: number;
}

export interface WalletSecurity {
  pinSet: boolean;
  biometricEnabled: boolean;
  twoFactorEnabled: boolean;
  suspiciousActivity?: {
    alerts: Array<{
      type: string;
      timestamp: string;
      resolved: boolean;
    }>;
    riskScore: number;
  };
}

export interface WalletKYC {
  status: 'not_started' | 'pending' | 'verified' | 'rejected';
  verificationLevel: 'basic' | 'intermediate' | 'full';
  documents?: {
    aadhar?: {
      number?: string;
      verified: boolean;
      verifiedAt?: string;
    };
    pan?: {
      number?: string;
      verified: boolean;
      verifiedAt?: string;
    };
  };
  submittedAt?: string;
  verifiedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
}

export interface WalletRewards {
  totalCashback: number;
  pendingCashback: number;
  loyaltyPoints: number;
  tier: 'basic' | 'silver' | 'gold' | 'platinum';
  nextTierRequirement?: {
    type: 'spending' | 'transactions';
    current: number;
    target: number;
    percentage: number;
  };
}

export interface WalletStatistics {
  totalCredits: number;
  totalDebits: number;
  transactionCount: number;
  averageTransactionAmount?: number;
  monthlySpending?: number;
  spendingTrend?: 'increasing' | 'decreasing' | 'stable';
  topCategories?: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
}

export interface WalletAutoTopup {
  enabled: boolean;
  threshold: number;
  amount: number;
  paymentMethodId?: string;
  lastTriggered?: string;
}

export interface WalletData {
  id: string;
  balance: number;
  formattedBalance: string;
  currency: string;
  status: 'active' | 'suspended' | 'blocked' | 'closed';
  limits: WalletLimits;
  security: WalletSecurity;
  kyc: WalletKYC;
  rewards: WalletRewards;
  recentTransactions: WalletTransaction[];
  statistics: WalletStatistics;
  autoTopup?: WalletAutoTopup;
  createdAt: string;
  lastActivity: string;
  availableBalance?: number;
  pendingAmount?: number;
}

// Payment related types
export interface PaymentOrder {
  orderId: string;
  amount: number;
  currency: string;
  paymentId: string;
  razorpayKeyId: string;
  fees?: number;
  description?: string;
}

export interface PaymentVerification {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  payment_id: string;
}

export interface PaymentResult {
  payment: {
    id: string;
    amount: number;
    status: string;
    description: string;
    createdAt: string;
    completedAt?: string;
  };
  newBalance: number;
  transaction: WalletTransaction;
  cashback?: number;
}

// Transfer types
export interface WalletTransfer {
  toUserId: string;
  amount: number;
  description?: string;
  pin: string;
}

export interface TransferResult {
  payment: {
    id: string;
    amount: number;
    status: string;
    description: string;
  };
  fromWallet: {
    balance: number;
  };
  toWallet: {
    balance: number;
  };
  recipient: {
    id: string;
    name: string;
    email: string;
  };
}

// UPI Payment types
export interface UPIPayment {
  toUPI: string;
  amount: number;
  description?: string;
  pin: string;
}

// Payment history filters
export interface PaymentHistoryFilters {
  page?: number;
  limit?: number;
  type?: 'wallet_topup' | 'wallet_transfer' | 'settlement' | 'expense_payment' | 'withdrawal' | 'refund';
  status?: 'initiated' | 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'expired' | 'refunded';
  method?: 'upi' | 'bank_transfer' | 'card' | 'wallet' | 'netbanking' | 'cash';
  startDate?: string;
  endDate?: string;
}

export interface PaymentHistoryResponse {
  payments: Array<{
    id: string;
    amount: number;
    currency: string;
    type: string;
    method: string;
    status: string;
    description: string;
    from: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
    to?: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
    group?: {
      id: string;
      name: string;
    };
    createdAt: string;
    completedAt?: string;
  }>;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
  statistics?: {
    totalAmount: number;
    totalTransactions: number;
    avgTransactionAmount: number;
  };
}

// Wallet Analytics
export interface WalletAnalytics {
  paymentStats: {
    totalAmount: number;
    totalTransactions: number;
    avgTransactionAmount: number;
    successRate: number;
  };
  walletBalance: number;
  statusStats: Array<{
    status: string;
    count: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    amount: number;
    transactions: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
}

// Error types specific to wallet operations
export interface WalletError {
  code: string;
  message: string;
  details?: {
    kycRequired?: boolean;
    amount?: number;
    currentKycStatus?: string;
    limitType?: 'daily' | 'monthly' | 'per_transaction';
    remainingLimit?: number;
  };
}

// Wallet notification types
export interface WalletNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  autoHide?: boolean;
  duration?: number;
}

// Real-time update types
export interface WalletUpdate {
  type: 'balance_update' | 'transaction_added' | 'limit_reset' | 'security_alert';
  data: {
    newBalance?: number;
    transaction?: WalletTransaction;
    alert?: string;
    timestamp: string;
  };
}

// PIN management
export interface PinSetup {
  pin: string;
  confirmPin: string;
}

export interface PinValidation {
  pin: string;
  action: 'transfer' | 'payment' | 'settings';
}

// QR Code types for payments
export interface QRPaymentData {
  merchantName: string;
  upiId: string;
  amount?: number;
  description?: string;
  merchantCode?: string;
}

// Enhanced UI state types
export interface WalletUIState {
  isLoading: boolean;
  showBalance: boolean;
  activeTab: 'overview' | 'transactions' | 'rewards' | 'settings' | 'analytics';
  isRefreshing: boolean;
  modalStates: {
    addMoney: boolean;
    transfer: boolean;
    qrPayment: boolean;
    pinSetup: boolean;
    security: boolean;
  };
  theme: 'light' | 'dark' | 'auto';
  animations: {
    balanceAnimation: boolean;
    transactionAnimations: boolean;
    chartAnimations: boolean;
  };
}

// Component props types
export interface WalletComponentProps {
  wallet: WalletData;
  onRefresh?: () => void;
  onError?: (error: WalletError) => void;
  onNotification?: (notification: WalletNotification) => void;
}

export interface TransactionItemProps {
  transaction: WalletTransaction;
  showBalance?: boolean;
  onTransactionClick?: (transaction: WalletTransaction) => void;
}

export interface QuickActionProps {
  icon: React.ComponentType<any>;
  label: string;
  description?: string;
  onClick: () => void;
  disabled?: boolean;
  badge?: string | number;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
}