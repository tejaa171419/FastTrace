import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  CreditCard, 
  Building2, 
  Smartphone, 
  Plus, 
  ArrowLeft, 
  Star,
  Trash2,
  Edit,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import withLayout from "@/components/withLayout";
import UPIManagement from "@/components/profile/UPIManagement";
import BankAccountsManager from "@/components/profile/BankAccountsManager";

const PaymentMethodsPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("upi");

  // Mock data for cards (you can replace with real data from API)
  const [cards] = useState([
    {
      id: "1",
      type: "visa",
      last4: "4242",
      brand: "Visa",
      expiryMonth: 12,
      expiryYear: 2025,
      isDefault: true,
      cardholderName: "John Doe"
    },
    {
      id: "2",
      type: "mastercard",
      last4: "8888",
      brand: "Mastercard",
      expiryMonth: 6,
      expiryYear: 2026,
      isDefault: false,
      cardholderName: "John Doe"
    }
  ]);

  const getCardIcon = (type: string) => {
    // You can replace with actual card logos
    return <CreditCard className="w-8 h-8" />;
  };

  return (
    <div className="px-4 py-6 md:py-8 pb-20">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
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
              Payment Methods
            </h1>
            <p className="text-muted-foreground text-responsive-sm max-w-2xl mx-auto animate-slide-up">
              Manage your UPI IDs, bank accounts, and payment cards
            </p>
          </div>
          
          <div className="w-[100px]" /> {/* Spacer for balance */}
        </div>

        {/* Payment Methods Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="glass-card hover:scale-105 transition-transform duration-300 cursor-pointer" onClick={() => setActiveTab("upi")}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                  <Smartphone className="w-6 h-6 text-white" />
                </div>
                <Badge variant="secondary" className="text-xs">Active</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-lg mb-1">UPI IDs</CardTitle>
              <CardDescription>2 linked accounts</CardDescription>
            </CardContent>
          </Card>

          <Card className="glass-card hover:scale-105 transition-transform duration-300 cursor-pointer" onClick={() => setActiveTab("banks")}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <Badge variant="secondary" className="text-xs">Active</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-lg mb-1">Bank Accounts</CardTitle>
              <CardDescription>3 linked accounts</CardDescription>
            </CardContent>
          </Card>

          <Card className="glass-card hover:scale-105 transition-transform duration-300 cursor-pointer" onClick={() => setActiveTab("cards")}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl">
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
                <Badge variant="secondary" className="text-xs">Active</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-lg mb-1">Cards</CardTitle>
              <CardDescription>{cards.length} saved cards</CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Payment Methods Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full h-auto p-2 bg-card/80 backdrop-blur-lg border border-primary/20 rounded-xl shadow-glow mb-8">
            <div className="flex w-full gap-2">
              <TabsTrigger 
                value="upi" 
                className="flex-1 h-12 rounded-lg data-[state=active]:bg-gradient-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow text-muted-foreground hover:text-foreground transition-all duration-300"
              >
                <Smartphone className="w-4 h-4 mr-2" />
                <span className="text-sm font-medium">UPI</span>
              </TabsTrigger>
              <TabsTrigger 
                value="banks" 
                className="flex-1 h-12 rounded-lg data-[state=active]:bg-gradient-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow text-muted-foreground hover:text-foreground transition-all duration-300"
              >
                <Building2 className="w-4 h-4 mr-2" />
                <span className="text-sm font-medium">Banks</span>
              </TabsTrigger>
              <TabsTrigger 
                value="cards" 
                className="flex-1 h-12 rounded-lg data-[state=active]:bg-gradient-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow text-muted-foreground hover:text-foreground transition-all duration-300"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                <span className="text-sm font-medium">Cards</span>
              </TabsTrigger>
            </div>
          </TabsList>

          {/* UPI Tab */}
          <TabsContent value="upi" className="space-y-6 animate-fade-in">
            <div className="glass-card p-6 md:p-8 rounded-xl">
              <UPIManagement />
            </div>
          </TabsContent>

          {/* Banks Tab */}
          <TabsContent value="banks" className="space-y-6 animate-fade-in">
            <div className="glass-card p-6 md:p-8 rounded-xl">
              <BankAccountsManager />
            </div>
          </TabsContent>

          {/* Cards Tab */}
          <TabsContent value="cards" className="space-y-6 animate-fade-in">
            <Card className="glass-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Saved Cards</CardTitle>
                    <CardDescription>Manage your debit and credit cards</CardDescription>
                  </div>
                  <Button className="bg-gradient-to-r from-blue-500 to-purple-600">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Card
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {cards.length === 0 ? (
                  <div className="text-center py-12">
                    <CreditCard className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">No cards added yet</p>
                    <Button variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Your First Card
                    </Button>
                  </div>
                ) : (
                  cards.map((card) => (
                    <div
                      key={card.id}
                      className="relative group p-6 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 border border-white/10 hover:border-white/20 transition-all duration-300"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                          {getCardIcon(card.type)}
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-white font-semibold">
                                {card.brand} •••• {card.last4}
                              </p>
                              {card.isDefault && (
                                <Badge variant="default" className="text-xs">
                                  <Star className="w-3 h-3 mr-1" />
                                  Default
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Expires {String(card.expiryMonth).padStart(2, '0')}/{card.expiryYear}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {card.cardholderName}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-green-400" />
                          <span>Verified</span>
                        </div>
                        {!card.isDefault && (
                          <Button
                            variant="link"
                            size="sm"
                            className="h-auto p-0 text-xs"
                          >
                            Set as Default
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Security Notice */}
            <Card className="glass-card border-yellow-500/20">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-white mb-1">Security Notice</p>
                    <p className="text-xs text-muted-foreground">
                      Your card details are encrypted and stored securely. We never store your CVV.
                      All transactions are protected with industry-standard security measures.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default withLayout(PaymentMethodsPage, { defaultMode: 'group', defaultSubNav: 'wallet' });
