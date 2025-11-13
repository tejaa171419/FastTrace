import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "@/contexts/NotificationContext";
import { 
  Home, 
  Users, 
  Wallet, 
  BarChart3, 
  History, 
  CreditCard, 
  Plus,
  UserPlus,
  Settings,
  Bell,
  PieChart
} from "lucide-react";

interface HorizontalSubNavbarProps {
  activeMode: 'group' | 'personal';
  activeSubNav: string;
  onSubNavChange: (nav: string) => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  badge?: string;
  route?: string;
}

const HorizontalSubNavbar = ({ activeMode, activeSubNav, onSubNavChange }: HorizontalSubNavbarProps) => {
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();
  
  const groupNavItems: NavItem[] = [
    { id: 'home', label: 'Groups', icon: Home, route: '/groups' },
    { id: 'create-group', label: 'Create', icon: Plus, badge: 'New', route: '/create-group' },
    { id: 'join-group', label: 'Join', icon: UserPlus, route: '/join-group' },
    { id: 'wallet', label: 'Wallet', icon: Wallet, route: '/wallet' },
    { id: 'analytics', label: 'Analytics', icon: PieChart, route: '/analytics' },
    { id: 'history', label: 'History', icon: History, route: '/history/group' },
  ];

  const personalNavItems: NavItem[] = [
    { id: 'home', label: 'Dashboard', icon: Home, route: '/personal-dashboard' },
    { id: 'wallet', label: 'Wallet', icon: Wallet, route: '/wallet' },
    { id: 'expenses', label: 'Expenses', icon: CreditCard, route: '/personal-expenses' },
    { id: 'analytics', label: 'Analytics', icon: PieChart, route: '/analytics' },
    { id: 'history', label: 'History', icon: History, route: '/history/personal' },
  ];

  const navItems = activeMode === 'group' ? groupNavItems : personalNavItems;

  return (
    <div className="sticky top-[44px] sm:top-[55px] z-40 bg-card/90 backdrop-blur-lg border-b border-primary/20 shadow-medium">
      <div className="w-full overflow-x-auto scrollbar-hide">
        <div className="flex items-center justify-between px-2 sm:px-4 py-2 sm:py-3">
          <div className="flex items-center gap-1.5 sm:gap-3 min-w-max touch-pan-x overflow-x-auto scrollbar-hide flex-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSubNav === item.id;
              
              return (
                <Button
                  key={item.id}
                  variant={isActive ? 'cyber' : 'ghost'}
                  size="sm"
                  className={`
                    flex items-center gap-1 sm:gap-2 h-8 sm:h-10 px-2 sm:px-4 whitespace-nowrap relative transition-all duration-300 rounded-lg flex-shrink-0
                    ${isActive 
                      ? 'bg-gradient-primary text-primary-foreground shadow-glow scale-105 border border-primary/30' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/60 hover:scale-102 border border-transparent'
                    }
                  `}
                  onClick={() => {
                    onSubNavChange(item.id);
                    if (item.route) {
                      navigate(item.route);
                    }
                  }}
                >
                  <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isActive ? 'animate-pulse-glow' : ''}`} />
                  <span className="text-xs sm:text-sm font-medium">{item.label}</span>
                  {item.badge && !isActive && (
                    <Badge 
                      variant="secondary" 
                      className="ml-0.5 sm:ml-1 text-[10px] sm:text-xs px-1 sm:px-2 py-0.5 h-4 sm:h-5 bg-gradient-success text-success-foreground animate-pulse-glow"
                    >
                      {item.badge}
                    </Badge>
                  )}
                  {isActive && (
                    <div className="absolute -bottom-0.5 sm:-bottom-1 left-1/2 transform -translate-x-1/2 w-4 sm:w-6 h-0.5 bg-gradient-primary rounded-full"></div>
                  )}
                </Button>
              );
            })}
          </div>
          
          {/* Notifications Button - Hidden on very small screens */}
          <Button
            variant="ghost"
            size="sm"
            className="hidden xs:flex items-center gap-2 h-8 sm:h-10 px-2 sm:px-3 text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-all duration-300 rounded-lg relative flex-shrink-0 ml-2"
            onClick={() => navigate('/notifications')}
          >
            <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            {unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-0.5 sm:-top-1 -right-0.5 sm:-right-1 w-4 h-4 sm:w-5 sm:h-5 p-0 text-[10px] sm:text-xs flex items-center justify-center"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default HorizontalSubNavbar;