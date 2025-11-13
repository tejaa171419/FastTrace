import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePin } from '@/contexts/PinContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import withLayout from '@/components/withLayout';
import {
  Shield,
  ArrowLeft,
  Lock,
  Key,
  AlertTriangle,
  CheckCircle,
  Fingerprint,
  Smartphone,
  History,
  Info,
  ChevronRight,
  Clock,
  MapPin,
  Laptop,
  LogOut,
  UserX,
  Eye,
  EyeOff,
  Settings
} from 'lucide-react';

const SecuritySettingsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { pinSet, isLocked, attemptsRemaining } = usePin();

  // Security Settings State
  const [securitySettings, setSecuritySettings] = useState({
    pinEnabled: true,
    biometricEnabled: false,
    twoFactorEnabled: false,
    autoLockEnabled: true,
    autoLockTime: 5, // minutes
    loginAlerts: true,
    transactionAlerts: true,
    suspiciousActivityAlerts: true,
  });

  // Active Sessions State
  const [activeSessions] = useState([
    {
      id: '1',
      device: 'Chrome on Windows',
      location: 'Mumbai, India',
      lastActive: new Date(Date.now() - 5 * 60 * 1000),
      isCurrent: true,
      ip: '192.168.1.100'
    },
    {
      id: '2',
      device: 'Mobile App - Android',
      location: 'Mumbai, India',
      lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000),
      isCurrent: false,
      ip: '192.168.1.101'
    }
  ]);

  // Security Activity Log
  const [securityLog] = useState([
    {
      id: '1',
      action: 'PIN Changed',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      status: 'success',
      device: 'Web Browser',
      location: 'Mumbai, India'
    },
    {
      id: '2',
      action: 'Login Successful',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
      status: 'success',
      device: 'Mobile App',
      location: 'Mumbai, India'
    },
    {
      id: '3',
      action: 'Failed Login Attempt',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      status: 'failed',
      device: 'Unknown Device',
      location: 'Delhi, India'
    }
  ]);

  const handleSettingChange = (setting: string, value: boolean | number) => {
    setSecuritySettings(prev => ({
      ...prev,
      [setting]: value
    }));
    
    toast({
      title: 'Security Setting Updated',
      description: 'Your security preferences have been saved.',
    });
  };

  const getSecurityScore = () => {
    let score = 0;
    const recommendations: string[] = [];

    if (pinSet) score += 25;
    else recommendations.push('Set up a transaction PIN');

    if (securitySettings.biometricEnabled) score += 20;
    else recommendations.push('Enable biometric authentication');

    if (securitySettings.twoFactorEnabled) score += 30;
    else recommendations.push('Enable two-factor authentication');

    if (securitySettings.autoLockEnabled) score += 15;
    else recommendations.push('Enable auto-lock');

    if (securitySettings.loginAlerts) score += 10;
    else recommendations.push('Enable login alerts');

    return { score, recommendations };
  };

  const { score: securityScore, recommendations } = getSecurityScore();

  const getScoreColor = () => {
    if (securityScore >= 80) return 'text-green-400';
    if (securityScore >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBadge = () => {
    if (securityScore >= 80) return { variant: 'default' as const, text: 'Excellent' };
    if (securityScore >= 60) return { variant: 'secondary' as const, text: 'Good' };
    return { variant: 'destructive' as const, text: 'Needs Improvement' };
  };

  const handleTerminateSession = (sessionId: string) => {
    toast({
      title: 'Session Terminated',
      description: 'The device has been logged out successfully.',
    });
  };

  const handleChangePin = () => {
    navigate('/wallet/set-pin', { state: { isUpdate: true } });
  };

  const handleSetupBiometric = () => {
    toast({
      title: 'Biometric Setup',
      description: 'Biometric authentication setup coming soon!',
    });
  };

  const handleSetup2FA = () => {
    toast({
      title: '2FA Setup',
      description: 'Two-factor authentication setup coming soon!',
    });
  };

  const scoreBadge = getScoreBadge();

  return (
    <div className="px-4 py-6 md:py-8 pb-20">
      <div className="max-w-5xl mx-auto">
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
              Security & Privacy
            </h1>
            <p className="text-muted-foreground text-responsive-sm max-w-2xl mx-auto animate-slide-up">
              Protect your wallet and manage security settings
            </p>
          </div>
          
          <div className="w-[100px]" />
        </div>

        {/* Security Score Overview */}
        <Card className="glass-card mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle>Security Score</CardTitle>
                  <CardDescription>Your account security level</CardDescription>
                </div>
              </div>
              <Badge variant={scoreBadge.variant} className="text-lg px-4 py-2">
                {scoreBadge.text}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className={`text-4xl font-bold ${getScoreColor()}`}>
                {securityScore}%
              </span>
            </div>
            <Progress value={securityScore} className="h-3" />
            
            {recommendations.length > 0 && (
              <Alert className="bg-yellow-500/10 border-yellow-500/20">
                <AlertTriangle className="h-4 w-4 text-yellow-400" />
                <AlertDescription>
                  <p className="font-medium mb-2">Recommendations to improve security:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {recommendations.map((rec, index) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Authentication Methods */}
        <Card className="glass-card mb-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                <Key className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle>Authentication Methods</CardTitle>
                <CardDescription>Manage how you secure your wallet</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* PIN Security */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted/70 transition-all cursor-pointer" onClick={handleChangePin}>
              <div className="flex items-center gap-4">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <Lock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold">Transaction PIN</p>
                  <p className="text-sm text-muted-foreground">
                    {pinSet ? 'PIN is set and active' : 'No PIN set'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {pinSet ? (
                  <Badge variant="default" className="bg-green-500">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Active
                  </Badge>
                ) : (
                  <Badge variant="destructive">Not Set</Badge>
                )}
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>

            {/* Biometric */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted/70 transition-all cursor-pointer" onClick={handleSetupBiometric}>
              <div className="flex items-center gap-4">
                <div className="p-2 bg-purple-500 rounded-lg">
                  <Fingerprint className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold">Biometric Authentication</p>
                  <p className="text-sm text-muted-foreground">
                    Use fingerprint or face recognition
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {securitySettings.biometricEnabled ? (
                  <Badge variant="default" className="bg-green-500">Active</Badge>
                ) : (
                  <Badge variant="outline">Not Set</Badge>
                )}
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>

            {/* 2FA */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted/70 transition-all cursor-pointer" onClick={handleSetup2FA}>
              <div className="flex items-center gap-4">
                <div className="p-2 bg-orange-500 rounded-lg">
                  <Smartphone className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold">Two-Factor Authentication</p>
                  <p className="text-sm text-muted-foreground">
                    Add an extra layer of security
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {securitySettings.twoFactorEnabled ? (
                  <Badge variant="default" className="bg-green-500">Active</Badge>
                ) : (
                  <Badge variant="outline">Not Set</Badge>
                )}
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Auto-Lock Settings */}
        <Card className="glass-card mb-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg">
                <Lock className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle>Auto-Lock</CardTitle>
                <CardDescription>Automatically lock your wallet after inactivity</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-lock" className="text-base">Enable Auto-Lock</Label>
                <p className="text-sm text-muted-foreground">Lock wallet after period of inactivity</p>
              </div>
              <Switch
                id="auto-lock"
                checked={securitySettings.autoLockEnabled}
                onCheckedChange={(checked) => handleSettingChange('autoLockEnabled', checked)}
              />
            </div>

            {securitySettings.autoLockEnabled && (
              <>
                <Separator />
                <div className="space-y-3">
                  <Label htmlFor="auto-lock-time" className="text-base">Auto-Lock Timer</Label>
                  <Select 
                    value={securitySettings.autoLockTime.toString()} 
                    onValueChange={(value) => handleSettingChange('autoLockTime', parseInt(value))}
                  >
                    <SelectTrigger id="auto-lock-time">
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 minute</SelectItem>
                      <SelectItem value="5">5 minutes</SelectItem>
                      <SelectItem value="10">10 minutes</SelectItem>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Security Alerts */}
        <Card className="glass-card mb-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle>Security Alerts</CardTitle>
                <CardDescription>Get notified about security events</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="login-alerts" className="text-base">Login Alerts</Label>
                <p className="text-sm text-muted-foreground">Notify me of new logins</p>
              </div>
              <Switch
                id="login-alerts"
                checked={securitySettings.loginAlerts}
                onCheckedChange={(checked) => handleSettingChange('loginAlerts', checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="transaction-alerts" className="text-base">Transaction Alerts</Label>
                <p className="text-sm text-muted-foreground">Notify me of all transactions</p>
              </div>
              <Switch
                id="transaction-alerts"
                checked={securitySettings.transactionAlerts}
                onCheckedChange={(checked) => handleSettingChange('transactionAlerts', checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="suspicious-alerts" className="text-base">Suspicious Activity</Label>
                <p className="text-sm text-muted-foreground">Alert me of unusual activity</p>
              </div>
              <Switch
                id="suspicious-alerts"
                checked={securitySettings.suspiciousActivityAlerts}
                onCheckedChange={(checked) => handleSettingChange('suspiciousActivityAlerts', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Active Sessions */}
        <Card className="glass-card mb-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg">
                <Laptop className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle>Active Sessions</CardTitle>
                <CardDescription>Devices currently logged into your account</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeSessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    {session.device.includes('Mobile') ? (
                      <Smartphone className="w-5 h-5 text-primary" />
                    ) : (
                      <Laptop className="w-5 h-5 text-primary" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{session.device}</p>
                      {session.isCurrent && (
                        <Badge variant="default" className="text-xs">Current</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {session.location}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {session.lastActive.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">IP: {session.ip}</p>
                  </div>
                </div>
                {!session.isCurrent && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTerminateSession(session.id)}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <LogOut className="w-4 h-4 mr-1" />
                    End Session
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Security Activity Log */}
        <Card className="glass-card mb-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
                <History className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Security events from the last 30 days</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {securityLog.map((log) => (
              <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                <div className={`p-1.5 rounded-full ${log.status === 'success' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                  {log.status === 'success' ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{log.action}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <span>{log.device}</span>
                    <span>•</span>
                    <span>{log.location}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {log.timestamp.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="glass-card border-red-500/20">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <UserX className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <CardTitle className="text-red-400">Danger Zone</CardTitle>
                <CardDescription>Irreversible security actions</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="bg-red-500/10 border-red-500/20">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-400">
                These actions are permanent and cannot be undone. Proceed with caution.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start text-red-400 border-red-500/20 hover:bg-red-500/10"
                onClick={() => toast({ title: 'Coming Soon', description: 'This feature is under development.' })}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Log Out All Devices
              </Button>
              
              <Button
                variant="outline"
                className="w-full justify-start text-red-400 border-red-500/20 hover:bg-red-500/10"
                onClick={() => toast({ title: 'Coming Soon', description: 'This feature is under development.' })}
              >
                <Lock className="w-4 h-4 mr-2" />
                Reset All Security Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default withLayout(SecuritySettingsPage, { defaultMode: 'group', defaultSubNav: 'wallet' });
