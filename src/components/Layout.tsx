import { ReactNode } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigation } from "@/contexts/NavigationContext";
import { useNotifications } from "@/contexts/NotificationContext";
import TopNavbar from "@/components/TopNavbar";
import HorizontalSubNavbar from "@/components/HorizontalSubNavbar";
import Navigation from "@/components/Navigation";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider, SidebarInset, useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Wallet, QrCode, Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ExpensiverLogo from "@/components/ExpensiverLogo";
import UserProfileButton from "@/components/UserProfileButton";
import WalletBalanceDisplay from "@/components/WalletBalanceDisplay";
import ModernSidebarToggle from "@/components/ModernSidebarToggle";

interface LayoutProps {
  children: ReactNode;
  activeMode: 'group' | 'personal';
  onModeChange: (mode: 'group' | 'personal') => void;
  activeSubNav: string;
  onSubNavChange: (nav: string) => void;
}

const Layout = ({ 
  children, 
  activeMode, 
  onModeChange, 
  activeSubNav, 
  onSubNavChange 
}: LayoutProps) => {
  const isMobile = useIsMobile();
  const { navigationStyle, navigationPreferences } = useNavigation();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();

  const handleNotificationClick = () => {
    navigate('/notifications');
  };

  const handleQRScanClick = () => {
    navigate('/wallet/scan-qr');
  };

  // Mobile always uses horizontal navigation regardless of user preference
  if (isMobile) {
    return (
      <div className="h-screen flex flex-col w-full bg-gradient-background overflow-hidden">
        <TopNavbar 
          activeMode={activeMode}
          onModeChange={onModeChange}
        />
        <HorizontalSubNavbar 
          activeMode={activeMode}
          activeSubNav={activeSubNav}
          onSubNavChange={onSubNavChange}
        />
        
        <main className="flex-1 overflow-y-auto overflow-x-hidden pb-6 pt-[12px ]">
          <div className="min-h-full px-4">
            {children}
          </div>
        </main>
      </div>
    );
  }

  // Desktop navigation based on user preference
  if (navigationStyle === 'sidebar') {
    return (
      <SidebarProvider>
        <div className="h-screen flex w-full bg-gradient-background overflow-hidden">
          <AppSidebar
            activeMode={activeMode}
            onModeChange={onModeChange}
            activeSubNav={activeSubNav}
            onSubNavChange={onSubNavChange}
          />
          <SidebarInset className="flex-1 flex flex-col overflow-hidden">
            {/* Enhanced Top bar for sidebar mode */}
            <div className="sticky top-0 z-40 bg-black/95 backdrop-blur-xl border-b border-white/10 shadow-lg flex-shrink-0">
              <div className="flex items-center justify-between px-4 py-3">
                {/* Left section with modern sidebar toggle - logo is in sidebar */}
                <div className="flex items-center gap-3">
                  <ModernSidebarToggle />
                </div>
                
                {/* Center section with mode toggle */}
                <div className="flex items-center gap-1 bg-white/5 backdrop-blur-md rounded-xl p-1 border border-white/10">
                  <Button
                    variant={activeMode === 'group' ? 'default' : 'ghost'}
                    size="sm"
                    className={`h-9 px-4 text-sm font-medium transition-all duration-300 ${
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
                    className={`h-9 px-4 text-sm font-medium transition-all duration-300 ${
                      activeMode === 'personal'
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg hover:shadow-xl'
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                    onClick={() => onModeChange('personal')}
                  >
                    Personal
                  </Button>
                </div>
                
                {/* Right section with balance, notifications and profile */}
                <div className="flex items-center gap-3">
                  {/* Modern Balance Display */}
                  <div className="hidden sm:flex">
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
                    className="p-2 h-10 w-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-300 group"
                    onClick={handleQRScanClick}
                  >
                    <QrCode className="w-5 h-5 text-white/80 group-hover:text-white transition-colors duration-300" />
                  </Button>

                  {/* Enhanced Notification Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="relative p-2 h-10 w-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-300 group"
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

                  {/* Profile Dropdown */}
                  <UserProfileButton size="sm" />
                </div>
              </div>
            </div>
            
            <main className={`flex-1 overflow-y-auto overflow-x-hidden p-6 ${navigationPreferences.enableAnimations ? 'transition-all duration-300' : ''}`}>
              <div className="min-h-full max-w-7xl mx-auto">
                {children}
              </div>
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  // Horizontal navigation (default)
  return (
    <div className="h-screen flex flex-col w-full bg-gradient-background overflow-hidden">
      <Navigation 
        activeMode={activeMode} 
        onModeChange={onModeChange}
        activeSubNav={activeSubNav}
        onSubNavChange={onSubNavChange}
      />
      
      <main className={`flex-1 overflow-y-auto overflow-x-hidden pb-8 pt-[168px] ${navigationPreferences.enableAnimations ? 'transition-all duration-300' : ''}`}>
        <div className="min-h-full max-w-7xl mx-auto px-4">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;