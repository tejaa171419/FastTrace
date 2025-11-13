import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Users, User, Home, Plus, UserPlus, Wallet, PieChart, History, TrendingUp, Bell, Settings, LogOut, CreditCard, Shield, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNotifications } from "@/contexts/NotificationContext";
import ExpensiverLogo from "@/components/ExpensiverLogo";
import WalletBalanceDisplay from "@/components/WalletBalanceDisplay";

interface NavigationProps {
  activeMode: 'group' | 'personal';
  onModeChange: (mode: 'group' | 'personal') => void;
  activeSubNav: string;
  onSubNavChange: (nav: string) => void;
}

const Navigation = ({ activeMode, onModeChange, activeSubNav, onSubNavChange }: NavigationProps) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const { unreadCount } = useNotifications();

  const handleLogoClick = () => {
    navigate('/');
  };

  const handleNotificationClick = () => {
    navigate('/notifications');
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account.",
      });
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      toast({
        title: "Logout failed",
        description: "There was an error logging you out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getUserInitials = () => {
    if (!user) return 'U';
    const firstInitial = user.firstName?.charAt(0)?.toUpperCase() || '';
    const lastInitial = user.lastName?.charAt(0)?.toUpperCase() || '';
    return firstInitial + lastInitial || user.email?.charAt(0)?.toUpperCase() || 'U';
  };

  const getUserDisplayName = () => {
    if (!user) return 'User';
    return user.fullName || `${user.firstName} ${user.lastName}` || user.email || 'User';
  };

  const groupNavItems = [
    { id: 'home', label: 'Groups', icon: Home, route: '/groups' },
    { id: 'create-group', label: 'Create Group', icon: Plus, route: '/create-group' },
    { id: 'join-group', label: 'Join Group', icon: UserPlus, route: '/join-group' },
    { id: 'wallet', label: 'Wallet', icon: Wallet, route: '/wallet' },
    { id: 'analytics', label: 'Analytics', icon: PieChart, route: '/analytics' },
    { id: 'history', label: 'History', icon: History, route: '/history/group' },
  ];

  const personalNavItems = [
    { id: 'home', label: 'Dashboard', icon: Home, route: '/personal-dashboard' },
    { id: 'expenses', label: 'Expenses', icon: TrendingUp, route: '/personal-expenses' },
    { id: 'wallet', label: 'Wallet', icon: Wallet, route: '/wallet' },
    { id: 'analytics', label: 'Analytics', icon: PieChart, route: '/analytics' },
    { id: 'history', label: 'History', icon: History, route: '/history/personal' },
  ];

  const currentNavItems = activeMode === 'group' ? groupNavItems : personalNavItems;

  // Hide navigation on mobile - will be replaced by MobileNavigation
  if (isMobile) {
    return null;
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-xl border-b border-white/10 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4">
        {/* Enhanced Top Navigation Bar */}
        <div className="flex items-center justify-between py-3 border-b border-white/5">
          {/* Enhanced Logo */}
          <ExpensiverLogo 
            size="lg"
            onClick={handleLogoClick}
          />

          {/* Right Section with Balance, Notifications, and Profile */}
          <div className="flex items-center gap-4">
            {/* Modern Balance Display */}
            <WalletBalanceDisplay 
              compact={true} 
              showControls={true}
              autoRefresh={true}
            />

            {/* Enhanced Notification Button */}
            <Button
              variant="ghost"
              size="sm"
              className="relative p-3 h-12 w-12 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-300 group"
              onClick={handleNotificationClick}
            >
              <Bell className="w-5 h-5 text-white/80 group-hover:text-white transition-colors duration-300" />
              {unreadCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 w-5 h-5 p-0 text-xs flex items-center justify-center bg-red-500 border-2 border-black animate-pulse"
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
            </Button>

            {/* Enhanced Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative p-3 h-12 w-12 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-300 group"
                >
                  <Avatar className="w-6 h-6 border-2 border-white/20 group-hover:border-white/40 transition-all duration-300">
                    <AvatarImage src={user?.avatar?.url} alt="Profile" />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                className="w-64 bg-black/95 backdrop-blur-xl border border-white/10 shadow-2xl"
              >
                <div className="p-4 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12 border-2 border-white/20">
                      <AvatarImage src={user?.avatar?.url} alt="Profile" />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-white font-semibold">{getUserDisplayName()}</p>
                      <p className="text-white/60 text-sm">{user?.email || 'No email'}</p>
                    </div>
                  </div>
                </div>
                
                <DropdownMenuItem 
                  onClick={() => navigate('/profile')}
                  className="p-3 text-white/80 hover:text-white hover:bg-white/10 cursor-pointer transition-all duration-200"
                >
                  <User className="w-4 h-4 mr-3" />
                  View Profile
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                  onClick={() => {
                    onSubNavChange('wallet');
                    navigate('/wallet');
                  }}
                  className="p-3 text-white/80 hover:text-white hover:bg-white/10 cursor-pointer transition-all duration-200"
                >
                  <Wallet className="w-4 h-4 mr-3" />
                  Wallet
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                  onClick={() => navigate('/payment-methods')}
                  className="p-3 text-white/80 hover:text-white hover:bg-white/10 cursor-pointer transition-all duration-200"
                >
                  <CreditCard className="w-4 h-4 mr-3" />
                  Payment Methods
                </DropdownMenuItem>
                
                <DropdownMenuSeparator className="bg-white/10" />
                
                <DropdownMenuItem 
                  onClick={() => navigate('/settings')}
                  className="p-3 text-white/80 hover:text-white hover:bg-white/10 cursor-pointer transition-all duration-200"
                >
                  <Settings className="w-4 h-4 mr-3" />
                  Settings
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                  onClick={handleLogout}
                  className="p-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer transition-all duration-200"
                >
                  <LogOut className="w-4 h-4 mr-3" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Enhanced Mode Toggle and Sub Navigation */}
        <div className="flex items-center justify-between py-2.5">
          {/* Mode Toggles */}
          <div className="flex items-center gap-1 bg-white/5 backdrop-blur-md rounded-xl p-1 border border-white/10">
            <Button
              variant={activeMode === 'group' ? 'default' : 'ghost'}
              size="default"
              onClick={() => onModeChange('group')}
              className={`h-10 px-6 text-sm font-medium transition-all duration-300 ${
                activeMode === 'group'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg hover:shadow-xl'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <Users className="w-4 h-4 mr-2" />
              Group Expenses
            </Button>
            <Button
              variant={activeMode === 'personal' ? 'default' : 'ghost'}
              size="default"
              onClick={() => onModeChange('personal')}
              className={`h-10 px-6 text-sm font-medium transition-all duration-300 ${
                activeMode === 'personal'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg hover:shadow-xl'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <User className="w-4 h-4 mr-2" />
              Personal Finance
            </Button>
          </div>

          {/* Sub Navigation */}
          <div className="flex items-center space-x-2">
            {currentNavItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  size="default"
                  onClick={() => {
                    onSubNavChange(item.id);
                    if (item.route) {
                      navigate(item.route);
                    }
                  }}
                  className={`h-10 px-4 ${
                    activeSubNav === item.id 
                      ? 'bg-white/20 text-white shadow-lg border border-white/20' 
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  } transition-all duration-300 whitespace-nowrap hover-lift animate-slide-in-left`}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  <span className="font-medium">{item.label}</span>
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;