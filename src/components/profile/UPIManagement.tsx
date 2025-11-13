import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { CreditCard, Plus, Trash2, CheckCircle, AlertCircle, Smartphone, Wallet, Building2, Phone, Zap, Shield, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useProfile } from "@/hooks/useProfile";
import LoadingSpinner from "@/components/LoadingSpinner";
// Enhanced UPI provider detection and validation
const UPI_PROVIDERS = {
  'paytm': {
    name: 'Paytm',
    icon: '💳',
    color: 'bg-blue-500',
    textColor: 'text-blue-600',
    bgLight: 'bg-blue-50',
    website: 'https://paytm.com'
  },
  'googlepay': {
    name: 'Google Pay',
    icon: '🎯',
    color: 'bg-green-500',
    textColor: 'text-green-600',
    bgLight: 'bg-green-50',
    website: 'https://pay.google.com'
  },
  'phonepe': {
    name: 'PhonePe',
    icon: '📱',
    color: 'bg-purple-500',
    textColor: 'text-purple-600',
    bgLight: 'bg-purple-50',
    website: 'https://phonepe.com'
  },
  'amazonpay': {
    name: 'Amazon Pay',
    icon: '🛒',
    color: 'bg-orange-500',
    textColor: 'text-orange-600',
    bgLight: 'bg-orange-50',
    website: 'https://amazonpay.in'
  },
  'bhim': {
    name: 'BHIM',
    icon: '🇮🇳',
    color: 'bg-emerald-500',
    textColor: 'text-emerald-600',
    bgLight: 'bg-emerald-50',
    website: 'https://bhimupi.gov.in'
  },
  'other': {
    name: 'Other',
    icon: '💰',
    color: 'bg-gray-500',
    textColor: 'text-gray-600',
    bgLight: 'bg-gray-50',
    website: '#'
  }
};

const upiSchema = z.object({
  upiId: z.string()
    .min(1, "UPI ID is required")
    .regex(/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/, "Please enter a valid UPI ID format (e.g., yourname@paytm)"),
  displayName: z.string().min(1, "Display name is required").max(50, "Display name too long")
});

type UPIFormData = z.infer<typeof upiSchema>;

const getProviderFromUpiId = (upiId: string): keyof typeof UPI_PROVIDERS => {
  const domain = upiId.split('@')[1]?.toLowerCase();
  
  // Map common domains to providers
  const domainMap: Record<string, keyof typeof UPI_PROVIDERS> = {
    'paytm': 'paytm',
    'ptm': 'paytm',
    'gpay': 'googlepay',
    'okgooglepay': 'googlepay',
    'googlepaytez': 'googlepay',
    'phonepe': 'phonepe',
    'ibl': 'phonepe',
    'ybl': 'phonepe',
    'amazonpay': 'amazonpay',
    'apl': 'amazonpay',
    'bhim': 'bhim',
    'upi': 'bhim'
  };
  
  return domainMap[domain] || 'other';
};
const UPIManagement = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [isVerifying, setIsVerifying] = useState<string | null>(null);
  const [validationStatus, setValidationStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  
  const {
    user,
    isLoading,
    addUpiId,
    updateUpiId,
    deleteUpiId,
    isAddingUpi,
    isUpdatingUpi,
    isDeletingUpi
  } = useProfile();

  const form = useForm<UPIFormData>({
    resolver: zodResolver(upiSchema),
    defaultValues: {
      upiId: "",
      displayName: ""
    }
  });

  const upiAccounts = user?.upiIds || [];

  const onSubmit = async (data: UPIFormData) => {
    const provider = getProviderFromUpiId(data.upiId);
    
    const upiData = {
      upiId: data.upiId,
      displayName: data.displayName,
      provider: provider,
      isPrimary: upiAccounts.length === 0
    };
    
    addUpiId(upiData);
    form.reset();
    setShowAddForm(false);
  };

  const setPrimaryUPI = (upiId: string) => {
    updateUpiId(upiId, { isPrimary: true });
  };

  const deleteUPI = (upiId: string) => {
    deleteUpiId(upiId);
  };

  const verifyUPI = async (upiId: string) => {
    setIsVerifying(upiId);
    // Simulate verification delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsVerifying(null);
    toast.success('UPI ID verification completed!');
  };

  const validateUPIRealTime = async (upiId: string) => {
    if (!upiId || !upiId.includes('@')) {
      setValidationStatus('idle');
      return;
    }
    
    setValidationStatus('checking');
    
    // Simulate real-time validation
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const provider = getProviderFromUpiId(upiId);
    const isValidFormat = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(upiId);
    
    setValidationStatus(isValidFormat ? 'valid' : 'invalid');
  };
  
  // Real-time UPI validation on input change
  useEffect(() => {
    const subscription = form.watch((value) => {
      if (value.upiId) {
        validateUPIRealTime(value.upiId);
      }
    });
    return () => subscription.unsubscribe();
  }, [form.watch]);

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardContent className="flex items-center justify-center p-8">
          <LoadingSpinner size="lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-card-foreground">
            <CreditCard className="w-5 h-5" />
            UPI Management
          </CardTitle>
          <CardDescription>
            Manage your UPI IDs for seamless payments and money transfers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="bg-accent/10 border-accent/20">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Your UPI IDs are used for receiving payments and splitting expenses. 
              Make sure to verify them for secure transactions.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* UPI Accounts List */}
      <div className="space-y-4">
        {upiAccounts.map((upi, index) => {
          const provider = getProviderFromUpiId(upi.upiId);
          const providerInfo = UPI_PROVIDERS[provider];
          
          return (
            <Card key={upi.upiId} className="glass-card">
              <CardContent className="p-6 bg-card/90 backdrop-blur-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`relative flex items-center justify-center w-12 h-12 ${providerInfo.color} rounded-full shadow-lg transition-all duration-300 hover:scale-105`}>
                      <div className="flex items-center justify-center w-full h-full text-white font-bold text-lg">
                        {providerInfo.icon}
                      </div>
                      {upi.isVerified && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background flex items-center justify-center">
                          <CheckCircle className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-card-foreground">{upi.displayName || upi.upiId}</h3>
                        {upi.isPrimary && (
                          <Badge variant="default" className="bg-primary text-primary-foreground">
                            Primary
                          </Badge>
                        )}
                        
                        {upi.isVerified ? (
                          <Badge variant="secondary" className="bg-green-50 text-green-600 border-green-200">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Verified
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-yellow-400 text-yellow-600">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Unverified
                          </Badge>
                        )}
                        
                        {isVerifying === upi.upiId && (
                          <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-blue-200">
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            Verifying...
                          </Badge>
                        )}
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground font-mono">{upi.upiId}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className={`font-medium ${providerInfo.textColor}`}>{providerInfo.name}</span>
                          {upi.addedAt && (
                            <>
                              <span>•</span>
                              <span>Added {new Date(upi.addedAt).toLocaleDateString()}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                
                <div className="flex items-center space-x-2">
                  {!upi.isVerified && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => verifyUPI(upi.upiId)}
                      disabled={isVerifying === upi.upiId}
                      className="border-green-500 text-green-600 hover:bg-green-50"
                    >
                      {isVerifying === upi.upiId ? (
                        <><Loader2 className="w-3 h-3 mr-1 animate-spin" />Verifying</>
                      ) : (
                        <><Shield className="w-3 h-3 mr-1" />Verify</>
                      )}
                    </Button>
                  )}
                  
                  {!upi.isPrimary && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setPrimaryUPI(upi.upiId)}
                      className="border-primary text-primary hover:bg-primary/10"
                      disabled={isUpdatingUpi}
                    >
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Set Primary
                    </Button>
                  )}
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => window.open(providerInfo.website, '_blank')}
                    className="border-muted text-muted-foreground hover:bg-muted/10"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => deleteUPI(upi.upiId)} 
                    className="text-destructive border-destructive hover:bg-destructive/10"
                    disabled={upi.isPrimary || isDeletingUpi}
                  >
                    {isDeletingUpi ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          );
        })}
      </div>

      {/* Add New UPI Form */}
      {showAddForm ? <Card className="glass-card">
          <CardHeader>
            <CardTitle>Add New UPI ID</CardTitle>
            <CardDescription>
              Enter your UPI ID and a display name for easy identification
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="upiId" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      UPI ID *
                      {validationStatus === 'checking' && <Loader2 className="w-3 h-3 animate-spin" />}
                      {validationStatus === 'valid' && <CheckCircle className="w-3 h-3 text-success" />}
                      {validationStatus === 'invalid' && <AlertCircle className="w-3 h-3 text-destructive" />}
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          placeholder="yourname@paytm" 
                          {...field} 
                          className={`pr-20 ${
                            validationStatus === 'valid' ? 'border-success focus:border-success' :
                            validationStatus === 'invalid' ? 'border-destructive focus:border-destructive' :
                            'border-input'
                          }`}
                        />
                        {validationStatus === 'checking' && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                          </div>
                        )}
                        {validationStatus === 'valid' && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <CheckCircle className="w-4 h-4 text-success" />
                          </div>
                        )}
                        {validationStatus === 'invalid' && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <AlertCircle className="w-4 h-4 text-destructive" />
                          </div>
                        )}
                      </div>
                    </FormControl>
                    
                    {/* Provider detection preview */}
                    {field.value && field.value.includes('@') && validationStatus === 'valid' && (
                      <div className="mt-2 p-2 rounded-lg bg-muted/50 border">
                        <div className="flex items-center gap-2 text-sm">
                          {(() => {
                            const provider = getProviderFromUpiId(field.value);
                            const providerInfo = UPI_PROVIDERS[provider];
                            return (
                              <>
                                <div className={`w-6 h-6 ${providerInfo.color} rounded flex items-center justify-center text-white text-xs`}>
                                  {providerInfo.icon}
                                </div>
                                <span className="font-medium">
                                  Detected: {providerInfo.name}
                                </span>
                              </>
                            );
                          })()} 
                        </div>
                      </div>
                    )}
                    
                    <FormMessage />
                    
                    {/* Supported providers info */}
                    <div className="mt-2 text-xs text-muted-foreground">
                      <p className="mb-1">Supported providers:</p>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(UPI_PROVIDERS).slice(0, 6).map(([key, provider]) => (
                          <span key={key} className={`inline-flex items-center gap-1 px-2 py-1 rounded ${provider.bgLight} ${provider.textColor}`}>
                            <span>{provider.icon}</span>
                            <span>{provider.name}</span>
                          </span>
                        ))}
                        {Object.keys(UPI_PROVIDERS).length > 6 && (
                          <span className="px-2 py-1 text-muted-foreground">+{Object.keys(UPI_PROVIDERS).length - 6} more</span>
                        )}
                      </div>
                    </div>
                  </FormItem>
                )} />
                <FormField control={form.control} name="displayName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Name *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="My PayTM UPI" 
                        {...field} 
                        maxLength={50}
                      />
                    </FormControl>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Choose a name to identify this UPI ID</span>
                      <span>{field.value?.length || 0}/50</span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="flex space-x-2">
                  <Button 
                    type="submit" 
                    className="bg-primary hover:bg-primary-dark" 
                    disabled={validationStatus !== 'valid' || isAddingUpi}
                  >
                    {isAddingUpi ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Add UPI ID
                      </>
                    )}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setShowAddForm(false);
                      form.reset();
                      setValidationStatus('idle');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card> : <Button onClick={() => setShowAddForm(true)} className="w-full bg-primary hover:bg-primary-dark" size="lg">
          <Plus className="w-4 h-4 mr-2" />
          Add New UPI ID
        </Button>}
    </div>
  );
};
export default UPIManagement;