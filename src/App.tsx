import React, { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { GlobalErrorHandler } from "@/components/GlobalErrorHandler";
import { NavigationProvider } from "@/contexts/NavigationContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { PinProvider } from "@/contexts/PinContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { WebSocketProvider } from "@/contexts/WebSocketContext";
import { initializeRealtime } from "@/lib/realtime";
import pushNotificationService from "@/lib/services/pushNotificationService";

// Eagerly load critical pages
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Index from "./pages/Index";

// Lazy load non-critical pages for better initial load performance
const GroupsPage = lazy(() => import("./pages/Groups").then(m => ({ default: m.GroupsPage })));
const GroupDetails = lazy(() => import("./pages/GroupDetails"));
const CreateGroupPage = lazy(() => import("./pages/CreateGroup").then(m => ({ default: m.CreateGroupPage })));
const JoinGroupPage = lazy(() => import("./pages/JoinGroup").then(m => ({ default: m.JoinGroupPage })));
const Profile = lazy(() => import("./pages/Profile"));
const GroupChat = lazy(() => import("./pages/GroupChat"));
const Notifications = lazy(() => import("./pages/Notifications"));
const NotFound = lazy(() => import("./pages/NotFound"));
const WalletPage = lazy(() => import("./pages/WalletPage"));
const SetPinPage = lazy(() => import("./pages/SetPinPage"));
const SecuritySettingsPage = lazy(() => import("./pages/SecuritySettingsPage"));
const History = lazy(() => import("./pages/History"));
const PersonalExpenses = lazy(() => import("./pages/PersonalExpenses"));
const PersonalDashboard = lazy(() => import("./pages/PersonalDashboard"));
const Analytics = lazy(() => import("./pages/Analytics"));
const AddMoneyPage = lazy(() => import("./pages/AddMoneyPage"));
const QRScannerPage = lazy(() => import("./pages/QRScannerPage"));
const MobilePayPage = lazy(() => import("./pages/MobilePayPage"));
const RechargePage = lazy(() => import("./pages/RechargePage"));
const ContactTransferPage = lazy(() => import("./pages/ContactTransferPage"));
const BankTransferPage = lazy(() => import("./pages/BankTransferPage"));
const AdvancedBankTransferPage = lazy(() => import("./pages/AdvancedBankTransferPage"));
const PaymentMethodsPage = lazy(() => import("./pages/PaymentMethodsPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors except 408 (timeout)
        if (error?.status >= 400 && error?.status < 500 && error?.status !== 408) {
          return false;
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: false, // Disable automatic refetch on reconnect
      refetchInterval: false, // Disable automatic refetch intervals
      refetchIntervalInBackground: false, // Disable background refetch
      staleTime: 15 * 60 * 1000, // 15 minutes (increased from 5 minutes)
      gcTime: 20 * 60 * 1000, // 20 minutes (increased from 10 minutes)
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
});

// Initialize real-time sync
const { syncManager, connectionMonitor } = initializeRealtime(queryClient);

const AppContent = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-cyber flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-white/60">Loading application...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <Suspense fallback={
        <div className="min-h-screen bg-gradient-cyber flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
            <p className="text-white/60">Loading...</p>
          </div>
        </div>
      }>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<Navigate to="/" replace />} />
          <Route path="/groups" element={<GroupsPage />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/group" element={<Navigate to="/groups" replace />} />
          <Route path="/group/:groupId" element={<GroupDetails />} />
          <Route path="/group/:groupId/chat" element={<GroupChat />} />
          <Route path="/create-group" element={<CreateGroupPage />} />
          <Route path="/join-group" element={<JoinGroupPage />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/wallet" element={<WalletPage />} />
          <Route path="/wallet/set-pin" element={<SetPinPage />} />
          <Route path="/wallet/setup-pin" element={<SetPinPage />} />
          <Route path="/wallet/security" element={<SecuritySettingsPage />} />
          <Route path="/wallet/add-money" element={<AddMoneyPage />} />
          <Route path="/wallet/scan-qr" element={<QRScannerPage />} />
          <Route path="/wallet/mobile-pay" element={<MobilePayPage />} />
          <Route path="/wallet/recharge" element={<RechargePage />} />
          <Route path="/wallet/contact-transfer" element={<ContactTransferPage />} />
          <Route path="/wallet/bank-transfer" element={<BankTransferPage />} />
          <Route path="/bank-transfer" element={<AdvancedBankTransferPage />} />
          <Route path="/history" element={<History mode="group" />} />
          <Route path="/history/group" element={<History mode="group" />} />
          <Route path="/history/personal" element={<History mode="personal" />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/personal-dashboard" element={<PersonalDashboard />} />
          <Route path="/personal-expenses" element={<PersonalExpenses />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/payment-methods" element={<PaymentMethodsPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

const App = () => {
  // Initialize push notifications
  React.useEffect(() => {
    const initializePushNotifications = async () => {
      try {
        const initialized = await pushNotificationService.initialize();
        if (initialized) {
          console.log('✅ Push notifications initialized');
          
          // Setup message handler for service worker messages
          pushNotificationService.setupMessageHandler((event) => {
            console.log('Message from service worker:', event.data);
            if (event.data && event.data.type === 'notification-click') {
              // Handle notification click
              window.location.href = `/notifications#${event.data.notificationId}`;
            }
          });
        }
      } catch (error) {
        console.error('Failed to initialize push notifications:', error);
      }
    };

    initializePushNotifications();
  }, []);

  // Delay real-time sync initialization to improve initial load time
  React.useEffect(() => {
    // Check if auto-sync is disabled
    const disableSync = localStorage.getItem('disableAutoSync') === 'true';
    
    // Add a small delay before starting sync to allow UI to render
    const syncStartTimeout = setTimeout(() => {
      if (!disableSync) {
        console.log('🔄 Starting sync manager...');
        syncManager.start();
      } else {
        console.log('⏸️ Auto-sync disabled by user setting');
      }
    }, 1000); // 1 second delay
    
    return () => {
      clearTimeout(syncStartTimeout);
      console.log('🛑 Stopping sync manager...');
      syncManager.stop();
    };
  }, []);

  return (
    <GlobalErrorHandler>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <WebSocketProvider>
              <NotificationProvider>
                <PinProvider>
                  <NavigationProvider>
                    <Toaster />
                    <Sonner />
                    <AppContent />
                  </NavigationProvider>
                </PinProvider>
              </NotificationProvider>
            </WebSocketProvider>
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </GlobalErrorHandler>
  );
};

export default App;