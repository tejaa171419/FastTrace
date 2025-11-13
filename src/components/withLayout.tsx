import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';

interface WithLayoutOptions {
  defaultMode?: 'group' | 'personal';
  defaultSubNav?: string;
  hideNavbar?: boolean;
}

/**
 * Higher-order component that wraps a page component with Layout
 * Provides consistent navigation across all pages
 */
export function withLayout<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: WithLayoutOptions = {}
) {
  const {
    defaultMode = 'group',
    defaultSubNav = 'home',
    hideNavbar = false
  } = options;

  const WithLayoutComponent = (props: P) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [activeMode, setActiveMode] = useState<'group' | 'personal'>(defaultMode);
    const [activeSubNav, setActiveSubNav] = useState(defaultSubNav);

    // Update activeSubNav and activeMode based on current route
    useEffect(() => {
      const path = location.pathname;
      
      // Personal finance routes - automatically switch to personal mode
      if (path === '/personal-dashboard' || path === '/personal-expenses') {
        setActiveMode('personal');
        if (path === '/personal-dashboard') {
          setActiveSubNav('home');
        } else if (path === '/personal-expenses') {
          setActiveSubNav('expenses');
        }
        return;
      }
      
      // Map routes to their corresponding nav IDs
      if (path === '/groups' || path === '/') {
        setActiveMode('group');
        setActiveSubNav('home');
      } else if (path === '/analytics') {
        setActiveSubNav('analytics');
        // Keep current mode for analytics
      } else if (path === '/history') {
        setActiveSubNav('history');
        // Keep current mode for history - mode toggle controls it
      } else if (path === '/wallet' || path.startsWith('/wallet/')) {
        setActiveSubNav('wallet');
      } else if (path === '/create-group') {
        setActiveMode('group');
        setActiveSubNav('create-group');
      } else if (path === '/join-group') {
        setActiveMode('group');
        setActiveSubNav('join-group');
      } else if (path === '/profile') {
        setActiveSubNav('profile');
      } else if (path === '/notifications') {
        setActiveSubNav('notifications');
      } else if (path.startsWith('/group/')) {
        setActiveMode('group');
        setActiveSubNav('home'); // Group details should highlight Groups
      }
    }, [location.pathname]);

    const handleNavigation = (nav: string) => {
      // Handle navigation that requires route changes
      if (nav === 'profile') {
        navigate('/profile');
        return;
      }
      
      if (nav === 'create-group') {
        navigate('/create-group');
        return;
      }
      
      if (nav === 'home') {
        navigate('/');
        return;
      }
      
      // For other navigation, set the sub nav (stays on current page)
      setActiveSubNav(nav);
    };

    // If navbar should be hidden, render component directly
    if (hideNavbar) {
      return <WrappedComponent {...props} />;
    }

    return (
      <Layout
        activeMode={activeMode}
        onModeChange={setActiveMode}
        activeSubNav={activeSubNav}
        onSubNavChange={handleNavigation}
      >
        <WrappedComponent {...props} mode={activeMode} />
      </Layout>
    );
  };

  WithLayoutComponent.displayName = `withLayout(${WrappedComponent.displayName || WrappedComponent.name})`;

  return WithLayoutComponent;
}

export default withLayout;