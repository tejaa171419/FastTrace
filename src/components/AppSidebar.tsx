import react,{ useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { 
  Users, 
  User, 
  Home, 
  Plus, 
  UserPlus, 
  Wallet, 
  PieChart, 
  History, 
  Settings, 
  TrendingUp,
  Menu,
  ChevronDown,
  LogOut,
  Bell,
  CreditCard,
  Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ExpensiverCompactLogo } from "@/components/ExpensiverLogo";

interface AppSidebarProps {
  activeMode: 'group' | 'personal';
  onModeChange: (mode: 'group' | 'personal') => void;
  activeSubNav: string;
  onSubNavChange: (nav: string) => void;
}

export function AppSidebar({ activeMode, onModeChange, activeSubNav, onSubNavChange }: AppSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [groupOpen, setGroupOpen] = useState(activeMode === 'group');
  const [personalOpen, setPersonalOpen] = useState(activeMode === 'personal');

  // Sync collapsible state with activeMode changes
  react.useEffect(() => {
    if (activeMode === 'group') {
      setGroupOpen(true);
      setPersonalOpen(false);
    } else if (activeMode === 'personal') {
      setPersonalOpen(true);
      setGroupOpen(false);
    }
  }, [activeMode]);

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

  const handleLogout = async () => {
    try {
      await logout();
      // Navigate to landing page after logout
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Navigation items with proper route mapping
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

  const handleNavClick = (nav: string, mode?: 'group' | 'personal', route?: string) => {
    // Update active mode if switching
    if (mode && mode !== activeMode) {
      onModeChange(mode);
      if (mode === 'group') {
        setGroupOpen(true);
        setPersonalOpen(false);
      } else {
        setPersonalOpen(true);
        setGroupOpen(false);
      }
    }
    
    // Update the sub navigation state
    onSubNavChange(nav);
    
    // Navigate to the appropriate route
    if (route) {
      navigate(route);
    } else if (nav === 'notifications') {
      navigate('/notifications');
    } else if (nav === 'profile') {
      navigate('/profile');
    }
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-white/10 bg-card/95 backdrop-blur-xl">
      {/* Enhanced Header with Modern Design */}
      <SidebarHeader className={`border-b border-white/10 ${collapsed ? 'p-1' : 'p-2'}`}>
        <div 
          className="flex items-center justify-center cursor-pointer group transition-all duration-300 p-0 m-0"
          onClick={() => navigate('/')}
        >
          <div className="relative p-0 m-0">
            <ExpensiverCompactLogo 
              size={collapsed ? 'md' : 'lg'}
              className="transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4 space-y-2 group-data-[collapsible=icon]:!overflow-visible">
        {/* Group Expenses Section */}
        <SidebarGroup className={collapsed ? "mb-1 p-0" : "mb-2"}>
          {collapsed ? (
            // When collapsed, show all group items as icons without collapsible
            <SidebarGroupContent className="!block !visible !opacity-100">
              <SidebarMenu className="!flex !flex-col !gap-1">
                {groupNavItems.map((item) => (
                  <SidebarMenuItem key={`group-${item.id}`}>
                    <SidebarMenuButton
                      asChild
                      isActive={activeMode === 'group' && activeSubNav === item.id}
                      tooltip={item.label}
                    >
                      <button
                        onClick={() => handleNavClick(item.id, 'group', item.route)}
                        className={`flex items-center justify-center w-full h-10 p-2 rounded-lg text-sm transition-all duration-200 ${
                          activeMode === 'group' && activeSubNav === item.id
                            ? 'bg-primary text-primary-foreground shadow-lg hover:bg-primary/90'
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                        }`}
                      >
                        <item.icon className="w-5 h-5 flex-shrink-0" />
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          ) : (
            // When expanded, show collapsible with labels
            <Collapsible open={groupOpen} onOpenChange={setGroupOpen}>
              <CollapsibleTrigger asChild>
                <SidebarGroupLabel className="group/label flex items-center justify-between px-3 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground cursor-pointer transition-all duration-200 hover:bg-white/5 rounded-lg mx-1">
                  <div className="flex items-center gap-2">
                    <div className="p-1 bg-gradient-to-br from-blue-500 to-purple-600 rounded-md">
                      <Users className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-foreground">Group Expenses</span>
                  </div>
                  <ChevronDown className="w-4 h-4 transition-transform duration-200 group-data-[state=open]/label:rotate-180" />
                </SidebarGroupLabel>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {groupNavItems.map((item) => (
                      <SidebarMenuItem key={`group-${item.id}`}>
                        <SidebarMenuButton
                          asChild
                          isActive={activeMode === 'group' && activeSubNav === item.id}
                        >
                          <button
                            onClick={() => handleNavClick(item.id, 'group', item.route)}
                            className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                              activeMode === 'group' && activeSubNav === item.id
                                ? 'bg-primary text-primary-foreground shadow-lg hover:bg-primary/90'
                                : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                            }`}
                          >
                            <item.icon className="w-4 h-4 flex-shrink-0" />
                            <span>{item.label}</span>
                          </button>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </Collapsible>
          )}
        </SidebarGroup>

        {/* Personal Finance Section */}
        {collapsed && <div className="h-px bg-white/10 mx-2 my-2" />}
        <SidebarGroup className={collapsed ? "mb-1 p-0" : "mb-2"}>
          {collapsed ? (
            // When collapsed, show all personal items as icons without collapsible
            <SidebarGroupContent className="!block !visible !opacity-100">
              <SidebarMenu className="!flex !flex-col !gap-1">
                {personalNavItems.map((item) => (
                  <SidebarMenuItem key={`personal-${item.id}`}>
                    <SidebarMenuButton
                      asChild
                      isActive={activeMode === 'personal' && activeSubNav === item.id}
                      tooltip={item.label}
                    >
                      <button
                        onClick={() => handleNavClick(item.id, 'personal', item.route)}
                        className={`flex items-center justify-center w-full h-10 p-2 rounded-lg text-sm transition-all duration-200 ${
                          activeMode === 'personal' && activeSubNav === item.id
                            ? 'bg-primary text-primary-foreground shadow-lg hover:bg-primary/90'
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                        }`}
                      >
                        <item.icon className="w-5 h-5 flex-shrink-0" />
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          ) : (
            // When expanded, show collapsible with labels
            <Collapsible open={personalOpen} onOpenChange={setPersonalOpen}>
              <CollapsibleTrigger asChild>
                <SidebarGroupLabel className="group/label flex items-center justify-between px-3 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground cursor-pointer transition-all duration-200 hover:bg-white/5 rounded-lg mx-1">
                  <div className="flex items-center gap-2">
                    <div className="p-1 bg-gradient-to-br from-green-500 to-emerald-600 rounded-md">
                      <User className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-foreground">Personal Finance</span>
                  </div>
                  <ChevronDown className="w-4 h-4 transition-transform duration-200 group-data-[state=open]/label:rotate-180" />
                </SidebarGroupLabel>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {personalNavItems.map((item) => (
                      <SidebarMenuItem key={`personal-${item.id}`}>
                        <SidebarMenuButton
                          asChild
                          isActive={activeMode === 'personal' && activeSubNav === item.id}
                        >
                          <button
                            onClick={() => handleNavClick(item.id, 'personal', item.route)}
                            className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                              activeMode === 'personal' && activeSubNav === item.id
                                ? 'bg-primary text-primary-foreground shadow-lg hover:bg-primary/90'
                                : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                            }`}
                          >
                            <item.icon className="w-4 h-4 flex-shrink-0" />
                            <span>{item.label}</span>
                          </button>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </Collapsible>
          )}
        </SidebarGroup>

        {/* Account Section */}
        {collapsed && <div className="h-px bg-white/10 mx-2 my-2" />}
        <SidebarGroup className={collapsed ? "mt-1 p-0" : "mt-4"}>
          <SidebarGroupLabel className="px-3 py-2 text-sm font-semibold text-muted-foreground mx-1">
            <div className="flex items-center gap-2">
              <div className="p-1 bg-gradient-to-br from-orange-500 to-red-600 rounded-md">
                <User className="w-3.5 h-3.5 text-white" />
              </div>
              {!collapsed && <span className="text-foreground">Account</span>}
            </div>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location.pathname === '/profile'} tooltip="Profile">
                  <button
                    onClick={() => navigate('/profile')}
                    className={`flex items-center ${collapsed ? 'justify-center h-10 p-2' : 'gap-3 px-3 py-2'} w-full rounded-lg text-sm transition-all duration-200 ${
                      location.pathname === '/profile'
                        ? 'bg-primary text-primary-foreground shadow-lg hover:bg-primary/90'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                    }`}
                  >
                    <User className={`${collapsed ? 'w-5 h-5' : 'w-4 h-4'} flex-shrink-0`} />
                    {!collapsed && <span>Profile</span>}
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location.pathname === '/payment-methods'} tooltip="Payment Methods">
                  <button
                    onClick={() => navigate('/payment-methods')}
                    className={`flex items-center ${collapsed ? 'justify-center h-10 p-2' : 'gap-3 px-3 py-2'} w-full rounded-lg text-sm transition-all duration-200 ${
                      location.pathname === '/payment-methods'
                        ? 'bg-primary text-primary-foreground shadow-lg hover:bg-primary/90'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                    }`}
                  >
                    <CreditCard className={`${collapsed ? 'w-5 h-5' : 'w-4 h-4'} flex-shrink-0`} />
                    {!collapsed && <span>Payment Methods</span>}
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={activeSubNav === 'notifications'} tooltip="Notifications">
                  <button
                    onClick={() => handleNavClick('notifications')}
                    className={`flex items-center ${collapsed ? 'justify-center h-10 p-2' : 'gap-3 px-3 py-2'} w-full rounded-lg text-sm transition-all duration-200 ${
                      activeSubNav === 'notifications'
                        ? 'bg-primary text-primary-foreground shadow-lg hover:bg-primary/90'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                    }`}
                  >
                    <Bell className={`${collapsed ? 'w-5 h-5' : 'w-4 h-4'} flex-shrink-0`} />
                    {!collapsed && <span>Notifications</span>}
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location.pathname === '/settings'} tooltip="Settings">
                  <button
                    onClick={() => navigate('/settings')}
                    className={`flex items-center ${collapsed ? 'justify-center h-10 p-2' : 'gap-3 px-3 py-2'} w-full rounded-lg text-sm transition-all duration-200 ${
                      location.pathname === '/settings'
                        ? 'bg-primary text-primary-foreground shadow-lg hover:bg-primary/90'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                    }`}
                  >
                    <Settings className={`${collapsed ? 'w-5 h-5' : 'w-4 h-4'} flex-shrink-0`} />
                    {!collapsed && <span>Settings</span>}
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Enhanced Footer */}
      <SidebarFooter className={`border-t border-white/10 ${collapsed ? 'p-2' : 'p-4'}`}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className={`w-full ${collapsed ? 'justify-center p-1' : 'justify-start p-2'} h-auto bg-white/5 hover:bg-white/10 transition-colors rounded-lg`}
            >
              <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} w-full`}>
                <Avatar className="w-8 h-8 border border-primary/20">
                  <AvatarImage src={user?.avatar?.url} alt="Profile" />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                {!collapsed && (
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {getUserDisplayName()}
                    </p>
                    <p className="text-xs text-white/60">
                      {user?.email || 'No email'}
                    </p>
                  </div>
                )}
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 bg-black/95 backdrop-blur-xl border border-white/10 shadow-2xl">
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
      </SidebarFooter>
    </Sidebar>
  );
}