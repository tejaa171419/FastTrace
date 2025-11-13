import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, CreditCard, QrCode, Building2, Mail, Phone, Shield, ArrowLeft } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import UniversalProfileButton from "@/components/UniversalProfileButton";
import ImprovedPersonalInfoForm from "@/components/profile/ImprovedPersonalInfoForm";
import UPIManagement from "@/components/profile/UPIManagement";
import QRCodeSection from "@/components/profile/QRCodeSection";
import BankAccountsManager from "@/components/profile/BankAccountsManager";
import ContactInformation from "@/components/profile/ContactInformation";
import SecuritySettings from "@/components/wallet/SecuritySettings";
import withLayout from "@/components/withLayout";

const Profile = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("personal");
  const navigate = useNavigate();

  // Handle URL tab parameters
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['personal', 'upi', 'qr', 'bank', 'contact', 'security', 'payment', 'preferences'].includes(tab)) {
      // Map 'payment' to 'upi' for backward compatibility
      const mappedTab = tab === 'payment' ? 'upi' : tab === 'preferences' ? 'security' : tab;
      setActiveTab(mappedTab);
    }
  }, [searchParams]);

  return (
    <div className="px-4 py-6 md:py-8 pb-20">
      <div className="max-w-6xl mx-auto">
        {/* Enhanced Header with Navigation */}
        <div className="flex items-center justify-between mb-8 md:mb-12">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="text-muted-foreground hover:text-foreground transition-all duration-300"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <div className="text-center flex-1">
            <h1 className="text-responsive-2xl font-bold text-gradient-cyber mb-2 animate-fade-in">
              Profile Settings
            </h1>
            <p className="text-muted-foreground text-responsive-sm max-w-2xl mx-auto animate-slide-up">
              Manage your personal information, payment methods, and security settings
            </p>
          </div>
          
          {/* Profile Avatar - Universal Profile Button */}
          <div className="flex items-center gap-3">
            <UniversalProfileButton 
              variant="outline"
              size="lg"
              className="bg-card/80 backdrop-blur-lg border-primary/20 shadow-glow"
            />
          </div>
        </div>

        {/* Enhanced Profile Tabs with Modern Design */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="relative mb-8 md:mb-12">
            <TabsList className="w-full h-auto p-2 bg-card/80 backdrop-blur-lg border border-primary/20 rounded-xl shadow-glow overflow-x-auto scrollbar-hide">
              <div className="flex w-full min-w-max gap-2">
                <TabsTrigger 
                  value="personal" 
                  className="flex-1 min-w-[120px] h-12 rounded-lg data-[state=active]:bg-gradient-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow text-muted-foreground hover:text-foreground transition-all duration-300 data-[state=active]:scale-105"
                >
                  <User className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="text-xs md:text-sm font-medium">Personal</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="upi" 
                  className="flex-1 min-w-[100px] h-12 rounded-lg data-[state=active]:bg-gradient-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow text-muted-foreground hover:text-foreground transition-all duration-300 data-[state=active]:scale-105"
                >
                  <CreditCard className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="text-xs md:text-sm font-medium">UPI</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="qr" 
                  className="flex-1 min-w-[110px] h-12 rounded-lg data-[state=active]:bg-gradient-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow text-muted-foreground hover:text-foreground transition-all duration-300 data-[state=active]:scale-105"
                >
                  <QrCode className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="text-xs md:text-sm font-medium">QR Code</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="bank" 
                  className="flex-1 min-w-[100px] h-12 rounded-lg data-[state=active]:bg-gradient-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow text-muted-foreground hover:text-foreground transition-all duration-300 data-[state=active]:scale-105"
                >
                  <Building2 className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="text-xs md:text-sm font-medium">Banks</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="contact" 
                  className="flex-1 min-w-[110px] h-12 rounded-lg data-[state=active]:bg-gradient-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow text-muted-foreground hover:text-foreground transition-all duration-300 data-[state=active]:scale-105"
                >
                  <Mail className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="text-xs md:text-sm font-medium">Contact</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="security" 
                  className="flex-1 min-w-[110px] h-12 rounded-lg data-[state=active]:bg-gradient-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow text-muted-foreground hover:text-foreground transition-all duration-300 data-[state=active]:scale-105"
                >
                  <Shield className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="text-xs md:text-sm font-medium">Security</span>
                </TabsTrigger>
              </div>
            </TabsList>
            
            {/* Active Tab Indicator */}
            <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-primary opacity-50 rounded-full"></div>
          </div>

          {/* Enhanced Tab Content with Animations */}
          <TabsContent value="personal" className="space-y-6 animate-fade-in">
            <div className="glass-card p-6 md:p-8 rounded-xl">
              <ImprovedPersonalInfoForm />
            </div>
          </TabsContent>

          <TabsContent value="upi" className="space-y-6 animate-fade-in">
            <div className="glass-card p-6 md:p-8 rounded-xl">
              <UPIManagement />
            </div>
          </TabsContent>

          <TabsContent value="qr" className="space-y-6 animate-fade-in">
            <div className="glass-card p-6 md:p-8 rounded-xl">
              <QRCodeSection />
            </div>
          </TabsContent>

          <TabsContent value="bank" className="space-y-6 animate-fade-in">
            <div className="glass-card p-6 md:p-8 rounded-xl">
              <BankAccountsManager />
            </div>
          </TabsContent>

          <TabsContent value="contact" className="space-y-6 animate-fade-in">
            <div className="glass-card p-6 md:p-8 rounded-xl">
              <ContactInformation />
            </div>
          </TabsContent>

          <TabsContent value="security" className="space-y-6 animate-fade-in">
            <div className="glass-card p-6 md:p-8 rounded-xl">
              <SecuritySettings />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default withLayout(Profile, { defaultMode: 'group', defaultSubNav: 'profile' });