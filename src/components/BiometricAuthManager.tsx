import React, { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Fingerprint, 
  Scan, 
  Shield, 
  CheckCircle, 
  AlertCircle, 
  Eye, 
  Smartphone, 
  Lock, 
  Unlock,
  Timer,
  Settings,
  UserCheck,
  Key,
  Loader2,
  Camera,
  ScanLine
} from "lucide-react";
import { toast } from "sonner";

interface BiometricCapability {
  type: 'fingerprint' | 'face' | 'voice' | 'iris';
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  isAvailable: boolean;
  isEnabled: boolean;
  isConfigured: boolean;
  lastUsed?: Date;
  successRate: number;
  securityLevel: 'basic' | 'standard' | 'high' | 'maximum';
}

interface PaymentAuthRequest {
  id: string;
  amount: number;
  recipient: string;
  description: string;
  method: string;
  timestamp: Date;
  requiresBiometric: boolean;
  authMethods: string[];
}

interface AuthSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  status: 'active' | 'expired' | 'revoked';
  method: string;
  deviceInfo: string;
}

const BiometricAuthManager = () => {
  const [capabilities, setCapabilities] = useState<BiometricCapability[]>([
    {
      type: 'fingerprint',
      name: 'Fingerprint',
      icon: Fingerprint,
      isAvailable: true,
      isEnabled: true,
      isConfigured: true,
      lastUsed: new Date(Date.now() - 2 * 60 * 60 * 1000),
      successRate: 94.5,
      securityLevel: 'high'
    },
    {
      type: 'face',
      name: 'Face Recognition',
      icon: Scan,
      isAvailable: true,
      isEnabled: false,
      isConfigured: false,
      successRate: 88.2,
      securityLevel: 'standard'
    },
    {
      type: 'voice',
      name: 'Voice Recognition',
      icon: UserCheck,
      isAvailable: false,
      isEnabled: false,
      isConfigured: false,
      successRate: 0,
      securityLevel: 'basic'
    },
    {
      type: 'iris',
      name: 'Iris Scan',
      icon: Eye,
      isAvailable: false,
      isEnabled: false,
      isConfigured: false,
      successRate: 0,
      securityLevel: 'maximum'
    }
  ]);

  const [authRequests, setAuthRequests] = useState<PaymentAuthRequest[]>([]);
  const [activeSessions, setActiveSessions] = useState<AuthSession[]>([]);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authProgress, setAuthProgress] = useState(0);
  const [authMethod, setAuthMethod] = useState<string>('');
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [currentRequest, setCurrentRequest] = useState<PaymentAuthRequest | null>(null);
  const [authTimeout, setAuthTimeout] = useState(30); // seconds
  const [fallbackPin, setFallbackPin] = useState('');
  const [showFallback, setShowFallback] = useState(false);

  // Global biometric settings
  const [settings, setSettings] = useState({
    requireBiometricForPayments: true,
    minimumAmount: 1000, // INR
    sessionTimeout: 15, // minutes
    maxFailedAttempts: 3,
    allowFallbackAuth: true,
    enhancedSecurity: false
  });

  const detectBiometricCapabilities = useCallback(async () => {
    try {
      // Simulate checking device capabilities
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In real implementation, you would check:
      // - navigator.credentials for Web Authentication API
      // - Device hardware capabilities
      // - Platform-specific biometric APIs
      
      setCapabilities(prev => prev.map(cap => {
        if (cap.type === 'fingerprint') {
          return { ...cap, isAvailable: true };
        }
        if (cap.type === 'face') {
          return { ...cap, isAvailable: Math.random() > 0.3 }; // 70% chance
        }
        return cap;
      }));
      
      toast.success("Biometric capabilities detected");
    } catch (error) {
      toast.error("Failed to detect biometric capabilities");
    }
  }, []);

  const enableBiometric = async (type: string) => {
    try {
      setCapabilities(prev => prev.map(cap => 
        cap.type === type 
          ? { ...cap, isEnabled: true, isConfigured: true }
          : cap
      ));
      
      toast.success(`${type} authentication enabled successfully!`);
    } catch (error) {
      toast.error(`Failed to enable ${type} authentication`);
    }
  };

  const disableBiometric = (type: string) => {
    setCapabilities(prev => prev.map(cap => 
      cap.type === type 
        ? { ...cap, isEnabled: false }
        : cap
    ));
    
    toast.success(`${type} authentication disabled`);
  };

  const configureBiometric = async (type: string) => {
    try {
      // Simulate biometric enrollment process
      setIsAuthenticating(true);
      setAuthMethod(type);
      setAuthProgress(0);
      
      // Enrollment simulation with progress
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 200));
        setAuthProgress(i);
      }
      
      setCapabilities(prev => prev.map(cap => 
        cap.type === type 
          ? { ...cap, isConfigured: true, isEnabled: true }
          : cap
      ));
      
      setIsAuthenticating(false);
      toast.success(`${type} configured successfully!`);
    } catch (error) {
      setIsAuthenticating(false);
      toast.error(`Failed to configure ${type}`);
    }
  };

  const authenticatePayment = async (request: PaymentAuthRequest) => {
    setCurrentRequest(request);
    setShowAuthDialog(true);
    setAuthProgress(0);
    setShowFallback(false);
    
    // Get preferred auth method
    const preferredMethod = capabilities.find(cap => cap.isEnabled && cap.isConfigured);
    if (preferredMethod) {
      setAuthMethod(preferredMethod.type);
      performBiometricAuth(preferredMethod.type);
    } else {
      setShowFallback(true);
    }
  };

  const performBiometricAuth = async (method: string) => {
    try {
      setIsAuthenticating(true);
      
      // Simulate biometric authentication process
      for (let i = 0; i <= 100; i += 5) {
        await new Promise(resolve => setTimeout(resolve, 50));
        setAuthProgress(i);
        
        // Simulate potential failure at random points
        if (i === 60 && Math.random() < 0.1) {
          throw new Error('Authentication failed');
        }
      }
      
      // Update success rate and last used
      setCapabilities(prev => prev.map(cap => 
        cap.type === method 
          ? { 
              ...cap, 
              lastUsed: new Date(),
              successRate: Math.min(cap.successRate + 0.5, 100)
            }
          : cap
      ));
      
      // Create auth session
      const session: AuthSession = {
        id: `session_${Date.now()}`,
        startTime: new Date(),
        status: 'active',
        method: method,
        deviceInfo: navigator.userAgent.split(' ')[0]
      };
      
      setActiveSessions(prev => [...prev, session]);
      setIsAuthenticating(false);
      setShowAuthDialog(false);
      
      toast.success(`Payment authorized via ${method}! 🎉`, {
        description: `₹${currentRequest?.amount} to ${currentRequest?.recipient}`
      });
      
      // Auto-expire session after timeout
      setTimeout(() => {
        setActiveSessions(prev => prev.map(s => 
          s.id === session.id 
            ? { ...s, status: 'expired', endTime: new Date() }
            : s
        ));
      }, settings.sessionTimeout * 60 * 1000);
      
    } catch (error) {
      setIsAuthenticating(false);
      
      // Update failure rate
      setCapabilities(prev => prev.map(cap => 
        cap.type === method 
          ? { ...cap, successRate: Math.max(cap.successRate - 1, 0) }
          : cap
      ));
      
      if (settings.allowFallbackAuth) {
        setShowFallback(true);
        toast.error("Biometric authentication failed. Please use PIN.");
      } else {
        setShowAuthDialog(false);
        toast.error("Authentication failed. Please try again.");
      }
    }
  };

  const authenticateWithPin = () => {
    if (fallbackPin === '123456') { // Demo PIN
      setShowAuthDialog(false);
      setFallbackPin('');
      toast.success("Payment authorized via PIN! 🔐");
    } else {
      toast.error("Invalid PIN. Please try again.");
    }
  };

  const getSecurityColor = (level: string) => {
    switch (level) {
      case 'maximum': return 'text-purple-600';
      case 'high': return 'text-green-600';
      case 'standard': return 'text-blue-600';
      case 'basic': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getSecurityBadgeColor = (level: string) => {
    switch (level) {
      case 'maximum': return 'bg-purple-100 text-purple-800';
      case 'high': return 'bg-green-100 text-green-800';
      case 'standard': return 'bg-blue-100 text-blue-800';
      case 'basic': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  useEffect(() => {
    detectBiometricCapabilities();
  }, [detectBiometricCapabilities]);

  // Demo payment request
  const createDemoPayment = () => {
    const demoRequest: PaymentAuthRequest = {
      id: `req_${Date.now()}`,
      amount: 2500,
      recipient: "Current User",
      description: "Dinner split payment",
      method: "UPI",
      timestamp: new Date(),
      requiresBiometric: true,
      authMethods: ['fingerprint', 'face', 'pin']
    };
    
    authenticatePayment(demoRequest);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Biometric Authentication
          </CardTitle>
          <CardDescription>
            Secure your payments with advanced biometric authentication
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Payment Protection</h3>
              <p className="text-sm text-muted-foreground">
                Require biometric authentication for payments above ₹{settings.minimumAmount}
              </p>
            </div>
            <Switch 
              checked={settings.requireBiometricForPayments}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, requireBiometricForPayments: checked }))
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Biometric Capabilities */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Available Authentication Methods</CardTitle>
          <CardDescription>
            Configure and manage your biometric authentication options
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {capabilities.map(capability => (
            <div key={capability.type} className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full ${
                  capability.isEnabled ? 'bg-success/20' : 'bg-muted'
                }`}>
                  <capability.icon className={`w-5 h-5 ${
                    capability.isEnabled ? 'text-success' : 'text-muted-foreground'
                  }`} />
                </div>
                <div>
                  <h3 className="font-semibold flex items-center gap-2">
                    {capability.name}
                    <Badge 
                      variant="secondary" 
                      className={getSecurityBadgeColor(capability.securityLevel)}
                    >
                      {capability.securityLevel}
                    </Badge>
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Success Rate: {capability.successRate}%</span>
                    {capability.lastUsed && (
                      <span>Last Used: {capability.lastUsed.toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {!capability.isAvailable ? (
                  <Badge variant="outline">Not Available</Badge>
                ) : !capability.isConfigured ? (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => configureBiometric(capability.type)}
                  >
                    Set Up
                  </Button>
                ) : (
                  <Switch
                    checked={capability.isEnabled}
                    onCheckedChange={(checked) => 
                      checked 
                        ? enableBiometric(capability.type)
                        : disableBiometric(capability.type)
                    }
                  />
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer className="w-5 h-5" />
            Active Authentication Sessions
          </CardTitle>
          <CardDescription>
            Manage your current authentication sessions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeSessions.filter(s => s.status === 'active').length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No active sessions
            </p>
          ) : (
            <div className="space-y-3">
              {activeSessions
                .filter(s => s.status === 'active')
                .map(session => (
                <div key={session.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-success/20">
                      <CheckCircle className="w-4 h-4 text-success" />
                    </div>
                    <div>
                      <p className="font-semibold capitalize">{session.method} Authentication</p>
                      <p className="text-sm text-muted-foreground">
                        Started: {session.startTime.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setActiveSessions(prev => prev.map(s => 
                        s.id === session.id 
                          ? { ...s, status: 'revoked', endTime: new Date() }
                          : s
                      ));
                      toast.success("Session revoked");
                    }}
                  >
                    Revoke
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Security Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="minimum-amount">Minimum Amount for Biometric (₹)</Label>
              <Input
                id="minimum-amount"
                type="number"
                value={settings.minimumAmount}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  minimumAmount: parseInt(e.target.value) || 0 
                }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
              <Input
                id="session-timeout"
                type="number"
                value={settings.sessionTimeout}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  sessionTimeout: parseInt(e.target.value) || 15 
                }))}
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Allow PIN Fallback</h3>
                <p className="text-sm text-muted-foreground">
                  Allow PIN authentication if biometric fails
                </p>
              </div>
              <Switch 
                checked={settings.allowFallbackAuth}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, allowFallbackAuth: checked }))
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Enhanced Security Mode</h3>
                <p className="text-sm text-muted-foreground">
                  Require multiple authentication factors for high-value transactions
                </p>
              </div>
              <Switch 
                checked={settings.enhancedSecurity}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, enhancedSecurity: checked }))
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Demo Section */}
      <Card className="glass-card border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Key className="w-5 h-5" />
            Test Authentication
          </CardTitle>
          <CardDescription>
            Try the biometric authentication flow with a demo payment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={createDemoPayment} className="w-full">
            <Fingerprint className="w-4 h-4 mr-2" />
            Test Payment Authentication
          </Button>
        </CardContent>
      </Card>

      {/* Authentication Dialog */}
      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Authenticate Payment
            </DialogTitle>
            <DialogDescription>
              {currentRequest && (
                <>Payment of ₹{currentRequest.amount} to {currentRequest.recipient}</>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {!showFallback ? (
              <div className="text-center space-y-4">
                <div className="relative mx-auto w-24 h-24">
                  <div className={`w-24 h-24 rounded-full border-4 border-primary/20 flex items-center justify-center ${
                    isAuthenticating ? 'animate-pulse' : ''
                  }`}>
                    {authMethod === 'fingerprint' && <Fingerprint className="w-12 h-12 text-primary" />}
                    {authMethod === 'face' && <Scan className="w-12 h-12 text-primary" />}
                    {authMethod === 'voice' && <UserCheck className="w-12 h-12 text-primary" />}
                  </div>
                  {isAuthenticating && (
                    <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin" />
                  )}
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-semibold capitalize">
                    {isAuthenticating ? `Authenticating with ${authMethod}...` : `Place your ${authMethod}`}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {isAuthenticating 
                      ? 'Please hold still during authentication'
                      : `Use your ${authMethod} to authorize this payment`
                    }
                  </p>
                </div>
                
                {isAuthenticating && (
                  <div className="space-y-2">
                    <Progress value={authProgress} className="h-2" />
                    <p className="text-xs text-muted-foreground">{authProgress}% complete</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold">Enter PIN</h3>
                  <p className="text-sm text-muted-foreground">
                    Biometric authentication failed. Please enter your PIN.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="fallback-pin">6-digit PIN</Label>
                  <Input
                    id="fallback-pin"
                    type="password"
                    placeholder="••••••"
                    value={fallbackPin}
                    onChange={(e) => setFallbackPin(e.target.value)}
                    maxLength={6}
                  />
                </div>
                
                <Button 
                  onClick={authenticateWithPin} 
                  className="w-full"
                  disabled={fallbackPin.length !== 6}
                >
                  Authenticate with PIN
                </Button>
              </div>
            )}
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowAuthDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              {!showFallback && settings.allowFallbackAuth && (
                <Button 
                  variant="outline" 
                  onClick={() => setShowFallback(true)}
                  className="flex-1"
                >
                  Use PIN
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Configuration Progress Dialog */}
      <Dialog open={isAuthenticating && !showAuthDialog} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Setting up {authMethod}
            </DialogTitle>
            <DialogDescription>
              Please follow the on-screen instructions to configure your biometric authentication
            </DialogDescription>
          </DialogHeader>
          
          <div className="text-center space-y-4">
            <div className="w-24 h-24 rounded-full border-4 border-primary/20 flex items-center justify-center mx-auto">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
            </div>
            
            <div className="space-y-2">
              <Progress value={authProgress} className="h-2" />
              <p className="text-sm text-muted-foreground">
                Configuring {authMethod}... {authProgress}%
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BiometricAuthManager;