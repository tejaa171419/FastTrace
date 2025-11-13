import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  Shield, Lock, Eye, EyeOff, Smartphone, Key, 
  AlertTriangle, CheckCircle, Fingerprint, Scan,
  Clock, Globe, Monitor, Settings, UserCheck,
  Bell, Database, Wifi, Phone
} from "lucide-react";
import { toast } from "sonner";

interface SecuritySettings {
  twoFactorEnabled: boolean;
  biometricEnabled: boolean;
  sessionTimeout: number;
  deviceTrust: boolean;
  loginNotifications: boolean;
  dataEncryption: boolean;
  backupCodes: string[];
}

interface LoginSession {
  id: string;
  device: string;
  location: string;
  timestamp: Date;
  isActive: boolean;
  ipAddress: string;
}

const SecurityAuthSystem = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    twoFactorEnabled: true,
    biometricEnabled: false,
    sessionTimeout: 30,
    deviceTrust: true,
    loginNotifications: true,
    dataEncryption: true,
    backupCodes: ['ABC123', 'DEF456', 'GHI789', 'JKL012']
  });

  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [showPassword, setShowPassword] = useState(false);

  // Mock session data
  const [loginSessions] = useState<LoginSession[]>([
    {
      id: '1',
      device: 'iPhone 13 Pro',
      location: 'Mumbai, India',
      timestamp: new Date(),
      isActive: true,
      ipAddress: '192.168.1.1'
    },
    {
      id: '2',
      device: 'Chrome on Windows',
      location: 'Delhi, India',
      timestamp: new Date(Date.now() - 86400000),
      isActive: false,
      ipAddress: '192.168.1.2'
    }
  ]);

  const updateSetting = (key: keyof SecuritySettings, value: any) => {
    setSecuritySettings(prev => ({ ...prev, [key]: value }));
    toast.success(`Security setting updated: ${key}`);
  };

  const calculateSecurityScore = () => {
    let score = 0;
    if (securitySettings.twoFactorEnabled) score += 30;
    if (securitySettings.biometricEnabled) score += 25;
    if (securitySettings.dataEncryption) score += 20;
    if (securitySettings.deviceTrust) score += 15;
    if (securitySettings.loginNotifications) score += 10;
    return score;
  };

  const securityScore = calculateSecurityScore();

  const getSecurityLevel = (score: number) => {
    if (score >= 85) return { level: 'Excellent', color: 'text-green-600', bgColor: 'bg-green-100' };
    if (score >= 65) return { level: 'Good', color: 'text-blue-600', bgColor: 'bg-blue-100' };
    if (score >= 45) return { level: 'Fair', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    return { level: 'Poor', color: 'text-red-600', bgColor: 'bg-red-100' };
  };

  const securityLevel = getSecurityLevel(securityScore);

  const handlePasswordChange = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength += 20;
    if (/[A-Z]/.test(password)) strength += 20;
    if (/[a-z]/.test(password)) strength += 20;
    if (/[0-9]/.test(password)) strength += 20;
    if (/[^A-Za-z0-9]/.test(password)) strength += 20;
    setPasswordStrength(strength);
  };

  const enableTwoFactor = async () => {
    setShowTwoFactorSetup(true);
    // Simulate API call
    setTimeout(() => {
      toast.success("2FA setup initiated. Check your authenticator app!");
    }, 1000);
  };

  const verifyTwoFactor = () => {
    if (verificationCode.length === 6) {
      updateSetting('twoFactorEnabled', true);
      setShowTwoFactorSetup(false);
      setVerificationCode('');
      toast.success("Two-factor authentication enabled successfully!");
    } else {
      toast.error("Invalid verification code");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Security & Authentication
              </CardTitle>
              <CardDescription>
                Comprehensive security features and authentication management
              </CardDescription>
            </div>
            <div className="text-center">
              <div className={`text-3xl font-bold ${securityLevel.color}`}>
                {securityScore}%
              </div>
              <Badge className={`${securityLevel.bgColor} ${securityLevel.color}`}>
                {securityLevel.level}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={securityScore} className="h-2" />
          <p className="text-sm text-muted-foreground mt-2">
            Your account security score based on enabled features
          </p>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="authentication">Authentication</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Security Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="glass-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Lock className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Two-Factor Auth</h3>
                    <p className="text-sm text-muted-foreground">
                      {securitySettings.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={securitySettings.twoFactorEnabled}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      enableTwoFactor();
                    } else {
                      updateSetting('twoFactorEnabled', false);
                    }
                  }}
                />
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Fingerprint className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Biometric Login</h3>
                    <p className="text-sm text-muted-foreground">
                      {securitySettings.biometricEnabled ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={securitySettings.biometricEnabled}
                  onCheckedChange={(checked) => updateSetting('biometricEnabled', checked)}
                />
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <Database className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Data Encryption</h3>
                    <p className="text-sm text-muted-foreground">
                      {securitySettings.dataEncryption ? 'Protected' : 'Unprotected'}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={securitySettings.dataEncryption}
                  onCheckedChange={(checked) => updateSetting('dataEncryption', checked)}
                />
              </CardContent>
            </Card>
          </div>

          {/* Security Alerts */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Security Recommendations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!securitySettings.twoFactorEnabled && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Enable Two-Factor Authentication</strong> - Add an extra layer of security to your account
                    <Button onClick={enableTwoFactor} className="ml-4" size="sm">
                      Enable Now
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              {!securitySettings.biometricEnabled && (
                <Alert>
                  <Fingerprint className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Set up Biometric Authentication</strong> - Use fingerprint or face recognition for quick, secure access
                    <Button onClick={() => updateSetting('biometricEnabled', true)} className="ml-4" size="sm">
                      Set Up
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              {securityScore >= 85 && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <strong>Excellent Security!</strong> Your account has strong security measures in place.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="authentication" className="space-y-6">
          {/* Two-Factor Authentication Setup */}
          {showTwoFactorSetup && (
            <Card className="glass-card border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5" />
                  Set Up Two-Factor Authentication
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-6 bg-white border-2 border-dashed border-gray-200 rounded-lg">
                  <div className="w-32 h-32 mx-auto bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                    <Scan className="w-16 h-16 text-gray-400" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label>Enter verification code from your app</Label>
                  <Input
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button onClick={verifyTwoFactor} disabled={verificationCode.length !== 6}>
                    Verify & Enable
                  </Button>
                  <Button variant="outline" onClick={() => setShowTwoFactorSetup(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Password Security */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Password Security</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>New Password</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    onChange={(e) => handlePasswordChange(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Password Strength</span>
                  <span className="text-sm">{passwordStrength}%</span>
                </div>
                <Progress value={passwordStrength} />
                <div className="text-xs text-muted-foreground">
                  Use 8+ characters with uppercase, lowercase, numbers, and symbols
                </div>
              </div>

              <Button>Update Password</Button>
            </CardContent>
          </Card>

          {/* Backup Codes */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Backup Recovery Codes</CardTitle>
              <CardDescription>
                Save these codes safely. Each can be used once if you lose access to your authenticator.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {securitySettings.backupCodes.map((code, index) => (
                  <div key={index} className="p-2 bg-gray-50 rounded text-center font-mono text-sm">
                    {code}
                  </div>
                ))}
              </div>
              <Button variant="outline">
                Generate New Codes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-6">
          {/* Active Sessions */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="w-5 h-5" />
                Login Sessions
              </CardTitle>
              <CardDescription>
                Manage your active login sessions across different devices
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loginSessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      {session.device.includes('iPhone') ? (
                        <Phone className="w-5 h-5 text-blue-600" />
                      ) : (
                        <Monitor className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{session.device}</p>
                      <p className="text-sm text-muted-foreground">
                        {session.location} • {session.timestamp.toLocaleDateString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        IP: {session.ipAddress}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {session.isActive ? (
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                    {!session.isActive && (
                      <Button variant="outline" size="sm">
                        Revoke
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Session Settings */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Session Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Automatic logout after inactivity</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically sign out after {securitySettings.sessionTimeout} minutes
                  </p>
                </div>
                <select 
                  value={securitySettings.sessionTimeout}
                  onChange={(e) => updateSetting('sessionTimeout', parseInt(e.target.value))}
                  className="border rounded px-3 py-2"
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={120}>2 hours</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Login notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified of new login attempts
                  </p>
                </div>
                <Switch
                  checked={securitySettings.loginNotifications}
                  onCheckedChange={(checked) => updateSetting('loginNotifications', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Trust this device</Label>
                  <p className="text-sm text-muted-foreground">
                    Don't ask for 2FA on this device for 30 days
                  </p>
                </div>
                <Switch
                  checked={securitySettings.deviceTrust}
                  onCheckedChange={(checked) => updateSetting('deviceTrust', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-6">
          {/* Data Privacy */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Data Privacy & Protection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">Data Collection</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Analytics data</span>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Usage statistics</span>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Crash reports</span>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Communication</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Marketing emails</span>
                      <Switch />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Product updates</span>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Security alerts</span>
                      <Switch defaultChecked disabled />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 space-y-3">
                <Button variant="outline" className="w-full">
                  Export My Data
                </Button>
                <Button variant="outline" className="w-full">
                  Delete My Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SecurityAuthSystem;