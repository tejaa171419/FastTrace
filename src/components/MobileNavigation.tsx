import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Users, User, Home, Plus, UserPlus, Wallet, PieChart, History, TrendingUp, Menu, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import UniversalProfileButton from "@/components/UniversalProfileButton";

interface MobileNavigationProps {
  activeMode: 'group' | 'personal';
  onModeChange: (mode: 'group' | 'personal') => void;
  activeSubNav: string;
  onSubNavChange: (nav: string) => void;
}

const MobileNavigation = ({ activeMode, onModeChange, activeSubNav, onSubNavChange }: MobileNavigationProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();

  const groupNavItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'create-group', label: 'Create Group', icon: Plus },
    { id: 'join-group', label: 'Join Group', icon: UserPlus },
    { id: 'wallet', label: 'Wallet', icon: Wallet },
  ];

  const personalNavItems = [
    { id: 'home', label: 'Dashboard', icon: Home },
    { id: 'expenses', label: 'Expenses', icon: TrendingUp },
  ];

  const currentNavItems = activeMode === 'group' ? groupNavItems : personalNavItems;

  const handleNavClick = (nav: string) => {
    onSubNavChange(nav);
    setIsOpen(false);
  };

  if (!isMobile) {
    return null; // Only show on mobile
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-xl border-b border-white/10 no-scroll-x">
      <div className="flex items-center justify-between px-4 py-3 landscape-nav">
        {/* Logo */}
        <div className="text-gradient-cyber font-bold text-lg">
          Zenith
        </div>
        
        {/* Mode Toggle - Compact */}
        <div className="flex items-center space-x-1">
          <Button
            variant={activeMode === 'group' ? 'default' : 'ghost'}
            size="icon-sm"
            onClick={() => onModeChange('group')}
            className="transition-all duration-300"
          >
            <Users className="w-4 h-4" />
          </Button>
          <Button
            variant={activeMode === 'personal' ? 'default' : 'ghost'}
            size="icon-sm"
            onClick={() => onModeChange('personal')}
            className="transition-all duration-300"
          >
            <User className="w-4 h-4" />
          </Button>
        </div>

        {/* Mobile Menu */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="touch-target">
              <Menu className="w-6 h-6 text-white" />
            </Button>
          </SheetTrigger>
          
          <SheetContent 
            side="right" 
            className="w-80 bg-background/95 backdrop-blur-xl border-l border-white/10"
          >
            <SheetHeader className="pb-6">
              <div className="flex items-center justify-between">
                <SheetTitle className="text-gradient-cyber text-xl">
                  Navigation
                </SheetTitle>
                <SheetClose asChild>
                  <Button variant="ghost" size="icon-sm">
                    <X className="w-5 h-5" />
                  </Button>
                </SheetClose>
              </div>
            </SheetHeader>

            {/* Mode Selection */}
            <div className="space-y-4 mb-6">
              <h3 className="text-sm font-medium text-muted-foreground">Mode</h3>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={activeMode === 'group' ? 'default' : 'outline'}
                  className="w-full justify-start"
                  onClick={() => onModeChange('group')}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Group
                </Button>
                <Button
                  variant={activeMode === 'personal' ? 'default' : 'outline'}
                  className="w-full justify-start"
                  onClick={() => onModeChange('personal')}
                >
                  <User className="w-4 h-4 mr-2" />
                  Personal
                </Button>
              </div>
            </div>

            {/* Navigation Items */}
            <div className="space-y-4 mb-6">
              <h3 className="text-sm font-medium text-muted-foreground">
                {activeMode === 'group' ? 'Group Features' : 'Personal Features'}
              </h3>
              <div className="space-y-2">
                {currentNavItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Button
                      key={item.id}
                      variant={activeSubNav === item.id ? 'default' : 'ghost'}
                      className="w-full justify-start touch-target"
                      onClick={() => handleNavClick(item.id)}
                    >
                      <Icon className="w-5 h-5 mr-3" />
                      <span className="text-base">{item.label}</span>
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Account Section with Universal Profile Button */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Account</h3>
              <div className="flex justify-center">
                <UniversalProfileButton 
                  showLabel={true}
                  variant="outline"
                  size="default"
                  className="w-full justify-start"
                />
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
};

export default MobileNavigation;