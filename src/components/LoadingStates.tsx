import React from 'react';
import { Loader2, Users, Receipt, DollarSign, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// Page-level loading spinner
export const PageLoader: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => (
  <div className="min-h-screen bg-gradient-cyber flex items-center justify-center">
    <div className="text-center space-y-4">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
        <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-primary/20 rounded-full animate-pulse mx-auto" />
      </div>
      <p className="text-white/70 text-lg font-medium">{message}</p>
    </div>
  </div>
);

// Component-level loading spinner
export const ComponentLoader: React.FC<{ message?: string; size?: 'sm' | 'md' | 'lg' }> = ({ 
  message = 'Loading...', 
  size = 'md' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8'
  };

  return (
    <div className="flex items-center justify-center p-8">
      <div className="text-center space-y-3">
        <Loader2 className={`${sizeClasses[size]} animate-spin mx-auto text-primary`} />
        <p className="text-white/60 text-sm">{message}</p>
      </div>
    </div>
  );
};

// Inline loading spinner
export const InlineLoader: React.FC<{ size?: 'sm' | 'md' }> = ({ size = 'sm' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5'
  };

  return <Loader2 className={`${sizeClasses[size]} animate-spin text-primary`} />;
};

// Groups loading skeleton
export const GroupsLoadingSkeleton: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
    {[...Array(6)].map((_, i) => (
      <Card key={i} className="glass-card">
        <CardContent className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <Skeleton className="w-16 h-16 rounded-full bg-white/10" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-6 w-3/4 bg-white/10" />
              <Skeleton className="h-4 w-full bg-white/10" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-16 bg-white/10" />
              <Skeleton className="h-6 w-20 bg-white/10" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20 bg-white/10" />
              <Skeleton className="h-6 w-24 bg-white/10" />
            </div>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

// Expenses loading skeleton
export const ExpensesLoadingSkeleton: React.FC = () => (
  <div className="space-y-4">
    {[...Array(5)].map((_, i) => (
      <Card key={i} className="glass-card">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-6 w-48 bg-white/10" />
                <Skeleton className="h-5 w-16 bg-white/10 rounded-full" />
              </div>
              <Skeleton className="h-4 w-3/4 bg-white/10" />
              <div className="flex gap-4">
                <Skeleton className="h-4 w-20 bg-white/10" />
                <Skeleton className="h-4 w-16 bg-white/10" />
              </div>
            </div>
            <div className="text-right space-y-2">
              <Skeleton className="h-8 w-20 bg-white/10" />
              <Skeleton className="h-3 w-16 bg-white/10" />
            </div>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

// Balances loading skeleton
export const BalancesLoadingSkeleton: React.FC = () => (
  <div className="space-y-3">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-full bg-white/10" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-24 bg-white/10" />
            <Skeleton className="h-3 w-32 bg-white/10" />
          </div>
        </div>
        <div className="text-right space-y-2">
          <Skeleton className="h-5 w-16 bg-white/10" />
          <Skeleton className="h-3 w-12 bg-white/10" />
        </div>
      </div>
    ))}
  </div>
);

// Stats cards loading skeleton  
export const StatsLoadingSkeleton: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    {[...Array(4)].map((_, i) => (
      <Card key={i} className="glass-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="w-10 h-10 rounded-lg bg-white/10" />
            <Skeleton className="w-16 h-5 rounded-full bg-white/10" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-8 w-20 bg-white/10" />
            <Skeleton className="h-4 w-24 bg-white/10" />
            <Skeleton className="h-3 w-32 bg-white/10" />
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

// Dashboard content loading
export const DashboardLoadingSkeleton: React.FC = () => (
  <div className="space-y-8 py-6">
    {/* Header skeleton */}
    <div className="text-center space-y-4">
      <Skeleton className="h-8 w-48 mx-auto bg-white/10" />
      <Skeleton className="h-12 w-96 mx-auto bg-white/10" />
      <Skeleton className="h-6 w-64 mx-auto bg-white/10" />
    </div>

    {/* Stats skeleton */}
    <StatsLoadingSkeleton />

    {/* Main content skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <Card className="glass-card">
        <CardContent className="p-6 space-y-4">
          <Skeleton className="h-6 w-32 bg-white/10" />
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-full bg-white/10" />
          ))}
        </CardContent>
      </Card>
      
      <div className="lg:col-span-2">
        <Card className="glass-card">
          <CardContent className="p-6">
            <Skeleton className="h-6 w-40 mb-6 bg-white/10" />
            <div className="w-full h-64 bg-white/5 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-16 h-16 text-white/20" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
);

// Empty state components
export const EmptyState: React.FC<{
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: React.ReactNode;
}> = ({ icon: Icon, title, description, action }) => (
  <div className="text-center py-12 space-y-4">
    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/5 mb-4">
      <Icon className="w-10 h-10 text-white/40" />
    </div>
    <h3 className="text-xl font-bold text-white/60">{title}</h3>
    <p className="text-white/40 max-w-md mx-auto">{description}</p>
    {action && <div className="pt-4">{action}</div>}
  </div>
);

// Empty states for specific components
export const EmptyGroups: React.FC<{ onCreateGroup?: () => void }> = ({ onCreateGroup }) => (
  <EmptyState
    icon={Users}
    title="No groups found"
    description="Create your first group to start tracking shared expenses with friends, family, or colleagues."
    action={onCreateGroup && (
      <button
        onClick={onCreateGroup}
        className="px-6 py-2 bg-gradient-primary text-white rounded-lg hover:shadow-glow transition-all duration-300"
      >
        Create Your First Group
      </button>
    )}
  />
);

export const EmptyExpenses: React.FC<{ onAddExpense?: () => void }> = ({ onAddExpense }) => (
  <EmptyState
    icon={Receipt}
    title="No expenses yet"
    description="Start by adding your first group expense. Split bills, track shared costs, and keep everyone organized."
    action={onAddExpense && (
      <button
        onClick={onAddExpense}
        className="px-6 py-2 bg-gradient-primary text-white rounded-lg hover:shadow-glow transition-all duration-300"
      >
        Add Your First Expense
      </button>
    )}
  />
);

export const EmptyBalances: React.FC = () => (
  <EmptyState
    icon={DollarSign}
    title="All Settled!"
    description="Everyone is even - no outstanding balances. Great job keeping things fair!"
  />
);