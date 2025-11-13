import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { User, Settings, LogOut, CreditCard, Shield, Wallet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UserProfileButtonProps {
  size?: 'sm' | 'md' | 'lg';
  showDropdown?: boolean;
  className?: string;
  showUserInfo?: boolean;
}

export const UserProfileButton: React.FC<UserProfileButtonProps> = ({
  size = 'md',
  showDropdown = true,
  className = '',
  showUserInfo = false
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account.",
      });
      // Navigate to landing page after logout
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
      toast({
        title: "Logout failed",
        description: "There was an error logging you out. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Generate user initials for avatar fallback
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

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  const avatarSizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  };

  if (!showDropdown) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <Avatar className={`${avatarSizeClasses[size]} border-2 border-white/20`}>
          <AvatarImage src={user?.avatar?.url} alt="Profile" />
          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
            {getUserInitials()}
          </AvatarFallback>
        </Avatar>
        {showUserInfo && (
          <div>
            <p className="text-white font-semibold text-sm">{getUserDisplayName()}</p>
            <p className="text-white/60 text-xs">{user?.email || 'No email'}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={`relative p-2 ${sizeClasses[size]} rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-300 group ${className}`}
        >
          <Avatar className={`${avatarSizeClasses[size]} border-2 border-white/20 group-hover:border-white/40 transition-all duration-300`}>
            <AvatarImage src={user?.avatar?.url} alt="Profile" />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-64 bg-black/95 backdrop-blur-xl border border-white/10 shadow-2xl"
      >
        {/* User Info Header */}
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
              {user?.profileCompletion && (
                <p className="text-white/40 text-xs mt-1">
                  Profile {user.profileCompletion.completionPercentage || 0}% complete
                </p>
              )}
            </div>
          </div>
        </div>
        
        {/* Menu Items */}
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
          onClick={() => navigate('/profile?tab=payment')}
          className="p-3 text-white/80 hover:text-white hover:bg-white/10 cursor-pointer transition-all duration-200"
        >
          <CreditCard className="w-4 h-4 mr-3" />
          Payment Methods
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => navigate('/profile?tab=security')}
          className="p-3 text-white/80 hover:text-white hover:bg-white/10 cursor-pointer transition-all duration-200"
        >
          <Shield className="w-4 h-4 mr-3" />
          Security
        </DropdownMenuItem>
        
        <DropdownMenuSeparator className="bg-white/10" />
        
        <DropdownMenuItem 
          onClick={() => navigate('/profile?tab=preferences')}
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
  );
};

export default UserProfileButton;