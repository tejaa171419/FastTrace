import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Bell, User, Settings, LogOut, Wallet, CreditCard, Shield, QrCode } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNotifications } from "@/contexts/NotificationContext";
import UniversalProfileButton from "@/components/UniversalProfileButton";
import ExpensiverLogo from "@/components/ExpensiverLogo";
import WalletBalanceDisplay from "@/components/WalletBalanceDisplay";

interface TopNavbarProps {
  activeMode: 'group' | 'personal';
  onModeChange: (mode: 'group' | 'personal') => void;
  showLogo?: boolean;
  showModeToggle?: boolean;
  showOnlyProfile?: boolean;
}

const TopNavbar = ({ 
  activeMode, 
  onModeChange, 
  showLogo = true, 
  showModeToggle = true,
  showOnlyProfile = false 
}: TopNavbarProps) => {
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

  const handleQRScanClick = () => {
    navigate('/wallet/scan-qr');
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

  return (
    <div className={`${showOnlyProfile ? '' : 'sticky top-0 z-50 bg-black/95 backdrop-blur-xl border-b border-white/10 shadow-lg'}`}>
      <div className={`flex items-center ${showOnlyProfile ? 'gap-2 sm:gap-3' : 'justify-between px-2 sm:px-4 py-2 sm:py-3'}`}>
        {/* Enhanced Logo */}
        {showLogo && (
          <div className="flex-shrink-0">
            <ExpensiverLogo 
              size="md"
              onClick={handleLogoClick}
            />
          </div>
        )}

        {/* Enhanced Mode Toggle */}
        {showModeToggle && (
          <div className="flex items-center gap-0.5 sm:gap-1 bg-white/5 backdrop-blur-md rounded-lg sm:rounded-xl p-0.5 sm:p-1 border border-white/10">
            <Button
              variant={activeMode === 'group' ? 'default' : 'ghost'}
              size="sm"
              className={`h-7 sm:h-9 px-2 sm:px-4 text-xs sm:text-sm font-medium transition-all duration-300 ${
                activeMode === 'group'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg hover:shadow-xl'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
              onClick={() => onModeChange('group')}
            >
              Group
            </Button>
            <Button
              variant={activeMode === 'personal' ? 'default' : 'ghost'}
              size="sm"
              className={`h-7 sm:h-9 px-2 sm:px-4 text-xs sm:text-sm font-medium transition-all duration-300 ${
                activeMode === 'personal'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg hover:shadow-xl'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
              onClick={() => onModeChange('personal')}
            >
              Personal
            </Button>
          </div>
        )}

        {/* Spacer for profile-only mode */}
        {showOnlyProfile && !showLogo && !showModeToggle && <div />}

        {/* Enhanced Right Section */}
        {!showOnlyProfile && (
          <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
            {/* Modern Balance Display - Hidden on mobile */}
            <div className="hidden md:flex">
              <WalletBalanceDisplay 
                compact={true} 
                showControls={true}
                autoRefresh={true}
              />
            </div>

            {/* QR Scanner Button */}
            <Button
              variant="ghost"
              size="sm"
              className="p-1.5 sm:p-2 h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-300 group"
              onClick={handleQRScanClick}
            >
              <QrCode className="w-4 h-4 sm:w-5 sm:h-5 text-white/80 group-hover:text-white transition-colors duration-300" />
            </Button>

            {/* Enhanced Notification Button */}
            <Button
              variant="ghost"
              size="sm"
              className="relative p-1.5 sm:p-2 h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-300 group"
              onClick={handleNotificationClick}
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-white/80 group-hover:text-white transition-colors duration-300" />
              {unreadCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-0.5 sm:-top-1 -right-0.5 sm:-right-1 w-4 h-4 sm:w-5 sm:h-5 p-0 text-[10px] sm:text-xs flex items-center justify-center bg-red-500 border border-black sm:border-2 animate-pulse"
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
                  className="relative p-1.5 sm:p-2 h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-300 group"
                >
                  <Avatar className="w-5 h-5 sm:w-6 sm:h-6 border border-white/20 sm:border-2 group-hover:border-white/40 transition-all duration-300">
                    <AvatarImage src={user?.avatar?.url} alt="Profile" />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-[10px] sm:text-xs">
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
                  onClick={() => navigate('/wallet')}
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
        )}

        {/* Profile-only mode */}
        {showOnlyProfile && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative p-2 h-10 w-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-300 group"
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
                onClick={() => navigate('/wallet')}
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
        )}
      </div>
    </div>
  );
};

export default TopNavbar;