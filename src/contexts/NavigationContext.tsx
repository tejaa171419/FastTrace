import { Value } from '@radix-ui/react-select';
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface NavigationContextType {
  navigationStyle: 'horizontal' | 'sidebar';
  setNavigationStyle: (style: 'horizontal' | 'sidebar') => void;
  toggleNavigationStyle: () => void;
  isSidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  navigationPreferences: NavigationPreferences;
  updateNavigationPreference: <K extends keyof NavigationPreferences>(key: K, value: NavigationPreferences[K]) => void;
}

interface NavigationPreferences {
  defaultStyle: 'horizontal' | 'sidebar';
  autoSwitch: boolean;
  rememberChoice: boolean;
  sidebarDefaultCollapsed: boolean;
  enableAnimations: boolean;
  showQuickActions: boolean;
}

const defaultPreferences: NavigationPreferences = {
  defaultStyle: 'horizontal',
  autoSwitch: false,
  rememberChoice: true,
  sidebarDefaultCollapsed: false,
  enableAnimations: true,
  showQuickActions: true,
};

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within NavigationProvider');
  }
  return context;
};

interface NavigationProviderProps {
  children: ReactNode;
}

export const NavigationProvider = ({ children }: NavigationProviderProps) => {
  // Initialize preferences from localStorage
  const [navigationPreferences, setNavigationPreferences] = useState<NavigationPreferences>(() => {
    try {
      const saved = localStorage.getItem('navigationPreferences');
      return saved ? { ...defaultPreferences, ...JSON.parse(saved) } : defaultPreferences;
    } catch {
      return defaultPreferences;
    }
  });

  // Initialize navigation style from preferences
  const [navigationStyle, setNavigationStyleState] = useState<'horizontal' | 'sidebar'>(() => {
    if (navigationPreferences.rememberChoice) {
      const saved = localStorage.getItem('navigationStyle');
      return (saved as 'horizontal' | 'sidebar') || navigationPreferences.defaultStyle;
    }
    return navigationPreferences.defaultStyle;
  });

  // Initialize sidebar collapsed state
  const [isSidebarCollapsed, setSidebarCollapsedState] = useState(() => {
    try {
      const saved = localStorage.getItem('sidebarCollapsed');
      return saved ? JSON.parse(saved) : navigationPreferences.sidebarDefaultCollapsed;
    } catch {
      return navigationPreferences.sidebarDefaultCollapsed;
    }
  });

  // Update navigation style
  const setNavigationStyle = useCallback((style: 'horizontal' | 'sidebar') => {
    setNavigationStyleState(style);
    if (navigationPreferences.rememberChoice) {
      localStorage.setItem('navigationStyle', style);
    }
    
    // Dispatch custom event for components that need to react
    window.dispatchEvent(new CustomEvent('navigationStyleChanged', { 
      detail: { style, timestamp: Date.now() } 
    }));
  }, [navigationPreferences.rememberChoice]);

  // Toggle navigation style
  const toggleNavigationStyle = () => {
    const newStyle = navigationStyle === 'horizontal' ? 'sidebar' : 'horizontal';
    setNavigationStyle(newStyle);
  };

  // Update sidebar collapsed state
  const setSidebarCollapsed = (collapsed: boolean) => {
    setSidebarCollapsedState(collapsed);
    localStorage.setItem('sidebarCollapsed', JSON.stringify(collapsed));
  };

  // Toggle sidebar collapsed state
  const toggleSidebar = () => {
    setSidebarCollapsed(!isSidebarCollapsed);
  };

  // Update navigation preferences
  const updateNavigationPreference = <K extends keyof NavigationPreferences>(key: K, value: NavigationPreferences[K]) => {
    const updatedPreferences = { ...navigationPreferences, [key]: value };
    setNavigationPreferences(updatedPreferences);
    localStorage.setItem('navigationPreferences', JSON.stringify(updatedPreferences));

    // Handle special cases
    if (key === 'defaultStyle') {
      setNavigationStyle(value as 'horizontal' | 'sidebar');
    }
    
    if (key === 'sidebarDefaultCollapsed' && navigationStyle === 'sidebar') {
      setSidebarCollapsed(value as boolean);
    }
  };

  // Save preferences to localStorage when they change
  useEffect(() => {
    localStorage.setItem('navigationPreferences', JSON.stringify(navigationPreferences));
  }, [navigationPreferences]);

  // Listen for external navigation style changes (from settings page)
  useEffect(() => {
    const handleNavigationStyleChange = (event: CustomEvent) => {
      if (event.detail?.style) {
        setNavigationStyleState(event.detail.style);
      }
    };

    window.addEventListener('navigationStyleChanged', handleNavigationStyleChange as EventListener);
    return () => {
      window.removeEventListener('navigationStyleChanged', handleNavigationStyleChange as EventListener);
    };
  }, []);

  // Auto-switch logic (if enabled)
  useEffect(() => {
    if (navigationPreferences.autoSwitch) {
      const handleResize = () => {
        const isMobile = window.innerWidth < 768;
        const newStyle = isMobile ? 'horizontal' : 'sidebar';
        if (newStyle !== navigationStyle) {
          setNavigationStyle(newStyle);
        }
      };

      window.addEventListener('resize', handleResize);
      handleResize(); // Check initial size

      return () => window.removeEventListener('resize', handleResize);
    }
  }, [navigationPreferences.autoSwitch, navigationStyle, setNavigationStyle]);

  const value: NavigationContextType = {
    navigationStyle,
    setNavigationStyle,
    toggleNavigationStyle,
    isSidebarCollapsed,
    setSidebarCollapsed,
    toggleSidebar,
    navigationPreferences,
    updateNavigationPreference,
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};

export default NavigationProvider;