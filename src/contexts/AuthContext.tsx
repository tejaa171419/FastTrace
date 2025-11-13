import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { apiClient, userService, User } from '@/lib/services';
import { authService, LoginRequest, SignupRequest } from '@/lib/services/authService';

interface AuthContextType {
  // Authentication state
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  
  // Authentication methods
  login: (credentials: LoginRequest) => Promise<void>;
  signup: (userData: SignupRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // EMERGENCY CIRCUIT BREAKER: Prevent infinite initialization loops
  const initializationAttempts = useRef(0);
  const lastInitTime = useRef(0);
  const isInitializing = useRef(false);
  const MAX_INIT_ATTEMPTS = 3;
  const MIN_INIT_INTERVAL = 10000; // 10 seconds minimum between init attempts
  const globalInitBlock = useRef(false); // Global emergency block
  const lastSuccessfulAuth = useRef<number | null>(null); // Track last successful auth time

  // Initialize authentication state from localStorage
  useEffect(() => {
    // EMERGENCY CIRCUIT BREAKER: Global blocking
    if (globalInitBlock.current) {
      console.log('🔒 Global auth initialization blocked');
      setIsLoading(false); // Make sure to set loading to false
      return;
    }

    // Prevent multiple initializations
    if (user !== null || !isLoading) {
      return;
    }

    // Prevent concurrent initializations
    if (isInitializing.current) {
      console.log('⏳ Auth initialization already in progress');
      return;
    }

    // Check attempt limits
    const now = Date.now();
    if (initializationAttempts.current >= MAX_INIT_ATTEMPTS) {
      globalInitBlock.current = true;
      console.error('🚨 MAX AUTH INITIALIZATION ATTEMPTS EXCEEDED - BLOCKING FURTHER ATTEMPTS');
      setIsLoading(false); // Make sure to set loading to false
      return;
    }

    // Enforce minimum interval between attempts
    if (now - lastInitTime.current < MIN_INIT_INTERVAL) {
      console.log(`⏰ Rate limiting auth init - ${Math.ceil((MIN_INIT_INTERVAL - (now - lastInitTime.current)) / 1000)}s remaining`);
      setIsLoading(false); // Make sure to set loading to false
      return;
    }

    // Additional protection: Don't re-authenticate too frequently after success
    if (lastSuccessfulAuth.current && (now - lastSuccessfulAuth.current < 30000)) { // 30 seconds
      console.log('🛡️ Recent successful auth - skipping re-initialization');
      setIsLoading(false);
      return;
    }
    
    const initAuth = async () => {
      try {
        isInitializing.current = true;
        initializationAttempts.current += 1;
        lastInitTime.current = Date.now();
        
        console.log(`🔄 Auth init attempt #${initializationAttempts.current}`);
        
        const authToken = localStorage.getItem('authToken');
        
        if (authToken) {
          // Set token in API client
          apiClient.setToken(authToken);
          
          // Get current user from token with timeout
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Auth timeout')), 5000) // 5 second timeout
          );
          
          const authPromise = authService.getMe();
          
          const response: any = await Promise.race([authPromise, timeoutPromise]);
          
          if (response && response.data?.user) {
            setUser(response.data.user);
            lastSuccessfulAuth.current = Date.now();
            // Reset counters on success
            initializationAttempts.current = 0;
            console.log('✅ Auth initialized successfully');
          } else {
            // Token is invalid, clear it
            localStorage.removeItem('authToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('currentUserId');
            apiClient.clearAuth();
            console.log('❌ Invalid token cleared');
          }
        } else {
          console.log('📭 No auth token found');
        }
      } catch (error) {
        console.error('💥 Auth initialization failed:', error);
        // Clear invalid tokens
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('currentUserId');
        apiClient.clearAuth();
        
        // If we've hit the max attempts, block globally
        if (initializationAttempts.current >= MAX_INIT_ATTEMPTS) {
          globalInitBlock.current = true;
          console.error('🚨 GLOBAL AUTH BLOCK ACTIVATED');
        }
      } finally {
        setIsLoading(false);
        isInitializing.current = false;
      }
    };

    // Add a small delay to allow UI to render before auth initialization
    const initTimeout = setTimeout(() => {
      initAuth();
    }, 100); // 100ms delay

    // Listen for auth state changes from API client (only set once)
    const handleAuthStateChange = (event: CustomEvent) => {
      if (!event.detail.authenticated) {
        setUser(null);
        setIsLoading(false);
      }
    };

    window.addEventListener('authStateChanged', handleAuthStateChange as EventListener);
    
    // Cleanup listener and timeout on unmount
    return () => {
      clearTimeout(initTimeout);
      window.removeEventListener('authStateChanged', handleAuthStateChange as EventListener);
    };
  }, []); // Remove [user] dependency to prevent infinite loop

  // Login with email and password
  const login = async (credentials: LoginRequest) => {
    try {
      setIsLoading(true);
      
      const response = await authService.login(credentials);
      
      if (response.success && response.data) {
        const { user, accessToken, refreshToken } = response.data;
        
        // Store tokens and set up API client
        localStorage.setItem('authToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('currentUserId', user._id);
        apiClient.setToken(accessToken);
        
        setUser(user);
      } else {
        throw new Error(response.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login failed:', error);
      // Clear any stored tokens on login failure
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('currentUserId');
      apiClient.clearAuth();
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Signup with user data
  const signup = async (userData: SignupRequest) => {
    try {
      setIsLoading(true);
      
      const response = await authService.signup(userData);
      
      if (response.success && response.data) {
        const { user, accessToken, refreshToken } = response.data;
        
        // Store tokens and set up API client
        localStorage.setItem('authToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('currentUserId', user._id);
        apiClient.setToken(accessToken);
        
        setUser(user);
      } else {
        throw new Error(response.error || 'Signup failed');
      }
    } catch (error) {
      console.error('Signup failed:', error);
      // Clear any stored tokens on signup failure
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('currentUserId');
      apiClient.clearAuth();
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout
  const logout = async () => {
    try {
      // Call logout endpoint to invalidate token on server
      await authService.logout();
    } catch (error) {
      // Even if server logout fails, clear local state
      console.warn('Server logout failed:', error);
    } finally {
      // Always clear local state
      setUser(null);
      apiClient.clearAuth();
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('currentUserId');
    }
  };

  const isAuthenticated = !!user;

  const value: AuthContextType = {
    isAuthenticated,
    user,
    isLoading,
    login,
    signup,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};