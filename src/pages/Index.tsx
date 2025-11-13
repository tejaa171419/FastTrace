import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import StickyActionBar from "@/components/StickyActionBar";
import PersonalExpenses from "./PersonalExpenses";
import CreateGroup from "./CreateGroup";
import JoinGroup from "./JoinGroup";
import History from "./History";
import Profile from "./Profile";
import Groups from "./Groups";
import Analytics from "./Analytics";
import WelcomeHero from "@/components/WelcomeHero";
import FloatingActionButton from "@/components/FloatingActionButton";
import AddExpenseModal from "@/components/AddExpenseModal";
import CalculatorModal from "@/components/CalculatorModal";
import QRScannerModal from "@/components/wallet/QRScannerModal";
import PullToRefresh from "@/components/PullToRefresh";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { Receipt } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const [activeMode, setActiveMode] = useState<'group' | 'personal'>('group');
  const [activeSubNav, setActiveSubNav] = useState('groups');
  const [showWelcome, setShowWelcome] = useState(true);
  const [isNewUser, setIsNewUser] = useState(true);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Check if user is new (this would typically come from auth/storage)
  useEffect(() => {
    const hasVisited = localStorage.getItem('hasVisited');
    if (hasVisited) {
      setIsNewUser(false);
      setShowWelcome(false);
    }
  }, []);

  const handleWelcomeDismiss = () => {
    setShowWelcome(false);
    localStorage.setItem('hasVisited', 'true');
    setIsNewUser(false);
  };

  const handleNavigation = (nav: string) => {
    // Handle profile navigation
    if (nav === 'profile') {
      navigate('/profile');
      return;
    }
    
    // Handle create group navigation
    if (nav === 'create-group') {
      navigate('/create-group');
      return;
    }
    
    // For all other navigation, set the sub nav (stays on current page)
    setActiveSubNav(nav);
  };

  const handleFloatingAction = (action: string) => {
    switch (action) {
      case 'addExpense':
        setShowAddExpense(true);
        break;
      case 'sendMoney':
        navigate('/wallet');
        toast({
          title: "Send Money",
          description: "Navigating to wallet...",
        });
        break;
      case 'scanQR':
        navigate('/wallet/scan-qr');
        toast({
          title: "QR Scanner",
          description: "Opening QR scanner...",
        });
        break;
      case 'calculate':
        setShowCalculator(true);
        break;
    }
  };

  const handleRefresh = async () => {
    // Simulate data refresh
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast({
      title: "Refreshed!",
      description: "Data has been updated.",
    });
  };

  const renderContent = () => {
    // Show welcome hero for new users
    if (isNewUser && showWelcome && activeSubNav === 'home') {
      return (
        <WelcomeHero 
          onDismiss={handleWelcomeDismiss} 
          onCreateGroup={() => handleNavigation('create-group')}
          onStartPersonalTracking={() => {
            setActiveMode('personal');
            setActiveSubNav('expenses');
            handleWelcomeDismiss();
          }}
        />
      );
    }

    switch (activeSubNav) {
      case 'home':
        return <Groups />;
      case 'groups':
        return <Groups />;
      case 'create-group':
        return <CreateGroup />;
      case 'join-group':
        return <JoinGroup />;
      case 'wallet':
        // Navigate to dedicated wallet page instead of rendering inline
        navigate('/wallet');
        return null;
      case 'history':
        return <History mode={activeMode} />;
      case 'analytics':
        return <Analytics mode={activeMode} />;
      case 'expenses':
        if (activeMode === 'group') {
          return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
              <div className="text-center space-y-6 animate-fade-in">
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
                  <Receipt className="w-5 h-5 mr-2 text-primary" />
                  <span className="text-white/80 text-sm font-medium">Group Expenses</span>
                </div>
                
                <h1 className="text-4xl md:text-5xl font-bold text-gradient-cyber mb-4">
                  Group Expenses
                </h1>
                
                <p className="text-lg text-white/70 max-w-3xl mx-auto leading-relaxed">
                  Select a group to view and manage expenses
                </p>
              </div>
              
              <div className="text-center py-16">
                <Groups />
              </div>
            </div>
          );
        } else {
          return (
            <PersonalExpenses 
              onAddExpense={() => handleFloatingAction('addExpense')}
              onSendMoney={() => handleFloatingAction('sendMoney')}
              onScanQR={() => handleFloatingAction('scanQR')}
              onCalculate={() => handleFloatingAction('calculate')}
            />
          );
        }
      default:
        return (
          <div className="min-h-screen flex items-center justify-center px-4">
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-4 text-foreground">{activeSubNav} Page</h2>
              <p className="text-muted-foreground">This section is under construction</p>
            </div>
          </div>
        );
    }
  };

  return (
    <Layout
      activeMode={activeMode}
      onModeChange={setActiveMode}
      activeSubNav={activeSubNav}
      onSubNavChange={handleNavigation}
    >
      <div className="p-4 max-w-7xl mx-auto">
        <PullToRefresh onRefresh={handleRefresh}>
          <div className="animate-fade-in">
            {renderContent()}
          </div>
        </PullToRefresh>
      </div>

      {/* Mobile Sticky Action Bar */}
      {isMobile && !(isNewUser && showWelcome && activeSubNav === 'home') && (
        <StickyActionBar
          onAddExpense={() => handleFloatingAction('addExpense')}
          onSendMoney={() => handleFloatingAction('sendMoney')}
          onScanQR={() => handleFloatingAction('scanQR')}
          onCalculate={() => handleFloatingAction('calculate')}
          mode={activeMode}
        />
      )}

      {/* Desktop Floating Action Button */}
      {!isMobile && !(isNewUser && showWelcome && activeSubNav === 'home') && (
        <FloatingActionButton
          onAddExpense={() => handleFloatingAction('addExpense')}
          onSendMoney={() => handleFloatingAction('sendMoney')}
          onScanQR={() => handleFloatingAction('scanQR')}
          onCalculate={() => handleFloatingAction('calculate')}
        />
      )}
      
      {/* Modals */}
      <AddExpenseModal
        isOpen={showAddExpense}
        onClose={() => setShowAddExpense(false)}
        mode={activeMode}
      />
      
      <CalculatorModal
        isOpen={showCalculator}
        onClose={() => setShowCalculator(false)}
      />
      
      <QRScannerModal
        isOpen={showQRScanner}
        onClose={() => setShowQRScanner(false)}
      />
    </Layout>
  );
};

export default Index;