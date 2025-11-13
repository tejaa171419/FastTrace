// User types
export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: {
    url?: string;
    publicId?: string;
  };
  phone?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  occupation?: string;
  bio?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
  };
  // UPI and Payment Information
  upiIds?: Array<{
    upiId: string;
    displayName?: string;
    provider?: 'paytm' | 'phonepe' | 'googlepay' | 'bhim' | 'amazonpay' | 'other';
    isPrimary?: boolean;
    isVerified?: boolean;
    addedAt?: string;
  }>;
  // Bank Account Information
  bankAccounts?: Array<{
    _id?: string;
    accountNumber?: string;
    ifscCode?: string;
    bankName?: string;
    accountHolderName?: string;
    accountType?: 'savings' | 'current' | 'salary';
    isPrimary?: boolean;
    isVerified?: boolean;
    addedAt?: string;
  }>;
  preferences?: {
    currency?: string;
    language?: string;
    timezone?: string;
    notifications?: {
      email?: boolean;
      push?: boolean;
      sms?: boolean;
    };
    privacy?: {
      profileVisibility?: 'public' | 'friends' | 'private';
      allowGroupInvites?: boolean;
    };
  };
  // Profile completion tracking
  profileCompletion?: {
    isComplete?: boolean;
    completedFields?: Array<{
      field: string;
      completedAt: string;
    }>;
    completionPercentage?: number;
  };
  // Authentication related
  isEmailVerified?: boolean;
  lastLoginAt?: string;
  twoFactorEnabled?: boolean;
  fullName: string;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

// Group types
export interface Group {
  _id: string;
  name: string;
  description?: string;
  avatar?: {
    url?: string;
    publicId?: string;
  };
  currency: string;
  privacy: 'private' | 'public';
  visibility: 'public' | 'private' | 'hidden';
  category: 'Travel' | 'Living' | 'Work' | 'Entertainment' | 'Food' | 'Shopping' | 'Other';
  owner: User;
  members: GroupMember[];
  joinRequests?: JoinRequest[];
  inviteCode?: string;
  inviteCodeExpiry?: string;
  inviteLink?: string;
  memberLimit?: number;
  tags?: string[];
  location?: {
    name?: string;
    city?: string;
    country?: string;
  };
  statistics: {
    totalExpenses: number;
    totalAmount: number;
    totalMembers: number;
    lastActivity?: string;
  };
  status: 'active' | 'settled' | 'inactive' | 'archived';
  settings: {
    allowMemberInvites: boolean;
    autoSplit: boolean;
    requireApproval: boolean;
    allowEditExpenses: boolean;
    defaultSplitMethod: 'equal' | 'percentage' | 'custom';
  };
  memberCount: number;
  isPopular?: boolean;
  recentActivity?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GroupMember {
  user: User;
  role: 'admin' | 'member';
  joinedAt: string;
  status: 'active' | 'invited' | 'pending' | 'left' | 'removed';
  invitedBy?: User;
}

export interface CreateGroupRequest {
  name: string;
  description?: string;
  category?: string;
  currency?: string;
  privacy?: 'private' | 'public';
  visibility?: 'public' | 'private' | 'hidden';
  isPrivate?: boolean;
  requireApproval?: boolean;
  memberLimit?: number;
  tags?: string[];
  location?: {
    name?: string;
    city?: string;
    country?: string;
  };
  memberEmails?: string[];
}

export interface UpdateGroupRequest {
  name?: string;
  description?: string;
  category?: string;
  currency?: string;
  privacy?: 'private' | 'public';
  visibility?: 'public' | 'private' | 'hidden';
  memberLimit?: number;
  tags?: string[];
  location?: {
    name?: string;
    city?: string;
    country?: string;
  };
  settings?: Partial<Group['settings']>;
}

export interface InviteMemberRequest {
  email: string;
  message?: string;
}

export interface JoinRequest {
  _id: string;
  user: User;
  message?: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: User;
  rejectionReason?: string;
}

export interface JoinGroupRequest {
  inviteCode: string;
  message?: string;
}

export interface SubmitJoinRequestData {
  message?: string;
}

export interface DiscoverGroupsParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  sortBy?: 'popular' | 'members' | 'recent' | 'expenses';
  city?: string;
  country?: string;
}

export interface PublicGroup extends Omit<Group, 'joinRequests' | 'inviteCode'> {
  rating?: number;
  memberLimit?: number;
  memberCount: number;
  recentActivity?: string;
  isPopular?: boolean;
}

// Expense types
export interface Expense {
  _id: string;
  title: string;
  description?: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  subcategory?: string;
  date: string;
  type: 'expense' | 'income';
  splitType: 'personal' | 'group';
  
  // Personal expense fields
  userId?: string;
  
  // Group expense fields
  groupId?: Group;
  paidBy?: User;
  splitMethod?: 'equal' | 'percentage' | 'custom' | 'exact';
  splitBetween?: ExpenseSplit[];
  
  receipt?: {
    url: string;
    publicId: string;
    filename: string;
    uploadedAt: string;
    size: number;
    mimetype: string;
  };
  
  location?: {
    name: string;
    address: string;
    coordinates?: [number, number];
  };
  
  paymentMethod: 'cash' | 'card' | 'upi' | 'bank_transfer' | 'other';
  tags: string[];
  
  approvals?: ExpenseApproval[];
  comments?: ExpenseComment[];
  
  isRecurring: boolean;
  recurringConfig?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    endDate?: string;
    nextOccurrence?: string;
  };
  
  status: 'active' | 'deleted' | 'draft';
  createdBy: User;
  lastModifiedBy?: User;
  
  // Virtual fields
  splitTotal: number;
  pendingAmount: number;
  
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseSplit {
  user: User;
  amount: number;
  percentage?: number;
  status: 'pending' | 'acknowledged' | 'paid' | 'settled';
  paidAt?: string;
  settledAt?: string;
}

export interface ExpenseApproval {
  user: User;
  status: 'approved' | 'rejected' | 'pending';
  comment?: string;
  timestamp: string;
}

export interface ExpenseComment {
  user: User;
  text: string;
  timestamp: string;
}

export type ExpenseCategory = 
  | 'Food & Dining'
  | 'Transportation'
  | 'Shopping'
  | 'Entertainment'
  | 'Bills & Utilities'
  | 'Healthcare'
  | 'Travel'
  | 'Education'
  | 'Groceries'
  | 'Personal Care'
  | 'Home & Garden'
  | 'Gifts & Donations'
  | 'Business'
  | 'Other';

export interface CreateExpenseRequest {
  title: string;
  description?: string;
  amount: number;
  currency?: string;
  category: ExpenseCategory;
  date?: string;
  splitType: 'personal' | 'group';
  
  // Group expense fields
  groupId?: string;
  paidBy?: string;
  splitMethod?: 'equal' | 'percentage' | 'custom';
  splitBetween?: Array<{
    user: string;
    amount: number;
    percentage?: number;
  }>;
  
  paymentMethod?: 'cash' | 'card' | 'upi' | 'bank_transfer' | 'other';
  tags?: string[];
  location?: {
    name?: string;
    address?: string;
  };
}

export interface UpdateExpenseRequest {
  title?: string;
  description?: string;
  amount?: number;
  category?: ExpenseCategory;
  date?: string;
  splitBetween?: Array<{
    user: string;
    amount: number;
    percentage?: number;
    status?: 'pending' | 'acknowledged' | 'paid' | 'settled';
  }>;
  paymentMethod?: 'cash' | 'card' | 'upi' | 'bank_transfer' | 'other';
  tags?: string[];
  location?: {
    name?: string;
    address?: string;
  };
}

export interface ExpenseFilters {
  page?: number;
  limit?: number;
  groupId?: string;
  category?: ExpenseCategory;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  status?: 'active' | 'deleted' | 'draft';
  search?: string;
}

// Balance types
export interface Balance {
  _id: string;
  groupId: Group;
  userA: User;
  userB: User;
  amount: number;
  currency: string;
  transactions: BalanceTransaction[];
  lastSettlement?: {
    amount: number;
    date: string;
    paymentId?: string;
    settledBy?: User;
  };
  isSettled: boolean;
  absAmount: number;
  owesInfo: {
    needsToPay: User | null;
    getsBackFrom: User | null;
    amount: number;
    isSettled: boolean;
  };
  lastUpdated: string;
  createdAt: string;
  updatedAt: string;
}

export interface BalanceTransaction {
  expenseId?: Expense;
  paymentId?: string;
  amount: number;
  date: string;
  type: 'expense' | 'payment' | 'settlement' | 'adjustment';
  description?: string;
}

export interface BalanceSummary {
  id: string;
  otherUser: User;
  group: Group;
  amount: number;
  currency: string;
  relationship: 'needs_to_pay' | 'gets_back' | 'settled';
  isSettled: boolean;
  lastUpdated: string;
}

export interface UserBalanceSummary {
  totalGetsBack: number;
  totalNeedsToPay: number;
  netBalance: number;
  relationships: Array<{
    user: User;
    amount: number;
    type: 'needs_to_pay' | 'gets_back' | 'settled';
  }>;
}

export interface GroupBalanceSummary {
  group: {
    id: string;
    name: string;
    avatar?: {
      url?: string;
    };
  };
  summary: {
    totalGroupDebt: number;
    memberCount: number;
  };
  balances: Balance[];
  memberBalances: Array<{
    user: User;
    totalGetsBack: number;
    totalNeedsToPay: number;
    netBalance: number;
  }>;
}

export interface SettlementSuggestion {
  from: string;
  to: string;
  amount: number;
  currency: string;
  fromUser: User;
  toUser: User;
}

export interface RecordSettlementRequest {
  groupId: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  description?: string;
  method?: string;
}

// Query and mutation response types
export interface GetExpensesResponse {
  expenses: Expense[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface GetDiscoveryGroupsResponse {
  groups: PublicGroup[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface GetJoinRequestsResponse {
  requests: JoinRequest[];
  group: {
    _id: string;
    name: string;
  };
}

export interface GetGroupsResponse {
  groups: Group[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface GetBalancesResponse {
  summary: {
    totalGetsBack: number;
    totalNeedsToPay: number;
    netBalance: number;
  };
  balances: BalanceSummary[];
}

export interface GetSettlementSuggestionsResponse {
  suggestions: SettlementSuggestion[];
  totalTransactions: number;
  message: string;
}