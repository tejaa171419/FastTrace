import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Wallet, Eye, EyeOff, TrendingUp, ArrowUpRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useWalletBalance } from '@/hooks/useWalletBalance';

interface WalletBalanceDisplayProps {
  balance?: number; // Optional: if provided, uses this instead of fetching
  compact?: boolean;
  showControls?: boolean;
  className?: string;
  onClick?: () => void;
  autoRefresh?: boolean; // Enable auto-refresh (default: true)
  refreshInterval?: number; // Refresh interval in ms (default: 30000)
}

const WalletBalanceDisplay = ({ 
  balance: propBalance, 
  compact = false, 
  showControls = true,
  className = '',
  onClick,
  autoRefresh = true,
  refreshInterval = 30000
}: WalletBalanceDisplayProps) => {
  const [showBalance, setShowBalance] = useState(true);
  const navigate = useNavigate();
  
  // Fetch real wallet balance from API
  const { 
    balance: fetchedBalance, 
    availableBalance,
    isLoading, 
    error 
  } = useWalletBalance(autoRefresh, refreshInterval);
  
  // Use prop balance if provided, otherwise use fetched balance
  const displayBalance = propBalance !== undefined ? propBalance : fetchedBalance;

  const handleBalanceClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate('/wallet');
    }
  };

  const toggleBalanceVisibility = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowBalance(!showBalance);
  };

  if (compact) {
    return (
      <div className={cn("relative", className)}>
        <div
          onClick={handleBalanceClick}
          className="group relative flex items-center gap-2.5 bg-gradient-to-r from-emerald-500/10 via-green-500/10 to-teal-500/10 hover:from-emerald-500/20 hover:via-green-500/20 hover:to-teal-500/20 backdrop-blur-md rounded-xl pl-3 pr-10 py-2 border border-emerald-500/20 hover:border-emerald-500/40 cursor-pointer transition-all duration-300 overflow-hidden"
        >
          {/* Animated background gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-green-500/10 to-emerald-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-shimmer"></div>
          
          {/* Wallet icon with pulse effect */}
          <div className="relative z-10">
            <Wallet className="w-4 h-4 text-emerald-400 group-hover:text-emerald-300 transition-all duration-300 group-hover:scale-110" />
            <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/50"></div>
          </div>

          {/* Balance amount */}
          <div className="relative z-10 flex flex-col min-w-[70px]">
            <span className="text-[9px] text-emerald-400/70 font-medium uppercase tracking-wider leading-none">
              Balance
            </span>
            <span className="text-sm font-bold text-emerald-400 group-hover:text-emerald-300 transition-colors tabular-nums leading-tight mt-0.5 flex items-center gap-1">
              {isLoading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : error ? (
                <span className="text-red-400 text-xs">Error</span>
              ) : (
                showBalance ? `₹${displayBalance.toLocaleString('en-IN')}` : '₹••••'
              )}
            </span>
          </div>

          {/* Trending indicator */}
          <div className="relative z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <TrendingUp className="w-3 h-3 text-emerald-400" />
          </div>
        </div>

        {/* Eye toggle button - integrated overlay */}
        {showControls && (
          <button
            onClick={toggleBalanceVisibility}
            className="absolute right-1 top-1/2 -translate-y-1/2 z-20 p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 hover:border-emerald-500/50 transition-all duration-300 group/eye backdrop-blur-sm"
            title={showBalance ? 'Hide balance' : 'Show balance'}
          >
            {showBalance ? (
              <EyeOff className="w-3.5 h-3.5 text-emerald-400 group-hover/eye:text-emerald-300 transition-colors duration-300" />
            ) : (
              <Eye className="w-3.5 h-3.5 text-emerald-400 group-hover/eye:text-emerald-300 transition-colors duration-300" />
            )}
          </button>
        )}
      </div>
    );
  }

  // Full display mode
  return (
    <div className={cn("relative", className)}>
      <div
        onClick={handleBalanceClick}
        className="group relative overflow-hidden bg-gradient-to-br from-emerald-500/10 via-green-500/10 to-teal-500/10 hover:from-emerald-500/20 hover:via-green-500/20 hover:to-teal-500/20 backdrop-blur-md rounded-2xl p-4 pr-14 border border-emerald-500/20 hover:border-emerald-500/40 cursor-pointer transition-all duration-300 shadow-lg hover:shadow-emerald-500/20"
      >
        {/* Animated background effects */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-green-500/20 to-emerald-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-shimmer"></div>
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-500/20 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        
        <div className="relative z-10 flex items-center gap-4">
          {/* Icon and balance section */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-600/20 backdrop-blur-sm border border-emerald-500/30 group-hover:scale-110 transition-transform duration-300">
                <Wallet className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/50"></div>
            </div>
            
            <div className="flex flex-col">
              <span className="text-xs text-emerald-400/70 font-medium uppercase tracking-wide">
                Wallet Balance
              </span>
              <span className="text-2xl font-bold text-emerald-400 group-hover:text-emerald-300 transition-colors tabular-nums flex items-center gap-2">
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-base">Loading...</span>
                  </>
                ) : error ? (
                  <span className="text-red-400 text-lg">Failed to load</span>
                ) : (
                  showBalance ? `₹${displayBalance.toLocaleString('en-IN')}` : '₹••••••'
                )}
              </span>
              {!isLoading && !error && availableBalance > 0 && (
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3 text-green-400" />
                  <span className="text-[10px] text-green-400 font-medium">
                    Available: ₹{availableBalance.toLocaleString('en-IN')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Integrated control buttons - overlay */}
      {showControls && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-1.5">
          <button
            onClick={toggleBalanceVisibility}
            className="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 hover:border-emerald-500/50 transition-all duration-300 group/eye backdrop-blur-sm"
            title={showBalance ? 'Hide balance' : 'Show balance'}
          >
            {showBalance ? (
              <EyeOff className="w-4 h-4 text-emerald-400 group-hover/eye:text-emerald-300 transition-colors duration-300" />
            ) : (
              <Eye className="w-4 h-4 text-emerald-400 group-hover/eye:text-emerald-300 transition-colors duration-300" />
            )}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate('/wallet');
            }}
            className="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 hover:border-emerald-500/50 transition-all duration-300 group/arrow backdrop-blur-sm"
            title="Open wallet"
          >
            <ArrowUpRight className="w-4 h-4 text-emerald-400 group-hover/arrow:text-emerald-300 transition-colors duration-300" />
          </button>
        </div>
      )}
    </div>
  );
};

export default WalletBalanceDisplay;