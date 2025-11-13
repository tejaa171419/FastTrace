import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Settings as SettingsIcon, 
  ArrowLeft, 
  Bell, 
  Moon, 
  Sun, 
  Globe, 
  Lock,
  Eye,
  EyeOff,
  Download,
  Trash2,
  RefreshCw,
  Shield,
  Smartphone,
  Monitor,
  Palette,
  Volume2,
  Vibrate,
  Mail,
  MessageSquare,
  CheckCircle,
  Info,
  ChevronRight
} from "lucide-react";
import withLayout from "@/components/withLayout";
import { useToast } from "@/hooks/use-toast";
import { useNavigation } from "@/contexts/NavigationContext";

const SettingsPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { navigationPreferences, updateNavigationPreference, navigationStyle, setNavigationStyle } = useNavigation();

  // Settings State
  const [settings, setSettings] = useState({
    // Notifications
    pushNotifications: true,
    emailNotifications: true,
    smsNotifications: false,
    transactionAlerts: true,
    groupActivityAlerts: true,
    paymentReminders: true,
    marketingEmails: false,
    
    // Appearance
    theme: "dark", // dark, light, system
    language: "en",
    currency: "INR",
    
    // Privacy
    profileVisibility: "friends", // public, friends, private
    showOnlineStatus: true,
    shareAnalytics: true,
    
    // Security
    twoFactorAuth: false,
    biometricAuth: false,
    autoLock: true,
    autoLockTime: 5, // minutes
    
    // Display
    showBalance: true,
    compactView: false,
    animations: true,
    soundEffects: true,
    hapticFeedback: true,
  });

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
    
    toast({
      title: "Setting Updated",
      description: "Your preferences have been saved.",
    });
  };

  const handleExportData = () => {
    toast({
      title: "Exporting Data",
      description: "Your data export has been initiated. You'll receive a download link via email.",
    });
  };

  const handleClearCache = () => {
    toast({
      title: "Cache Cleared",
      description: "All cached data has been cleared successfully.",
    });
  };

  const handleDeleteAccount = () => {
    toast({
      title: "Account Deletion",
      description: "Please contact support to delete your account.",
      variant: "destructive",
    });
  };

  return (
    <div className="px-4 py-6 md:py-8 pb-20">
      <div className="max-w-4xl mx-auto">
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
              Settings
            </h1>
            <p className="text-muted-foreground text-responsive-sm max-w-2xl mx-auto animate-slide-up">
              Customize your app experience and preferences
            </p>
          </div>
          
          <div className="w-[100px]" /> {/* Spacer */}
        </div>

        <div className="space-y-6">
          {/* Quick Access - Security */}
          <Card 
            className="glass-card cursor-pointer hover:scale-[1.02] transition-all duration-300 border-blue-500/20 hover:border-blue-500/40"
            onClick={() => navigate('/wallet/security')}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-card-foreground mb-1">
                      Security & Privacy
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Manage PIN, authentication, and account security
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          {/* Notifications Settings */}
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                  <Bell className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle>Notifications</CardTitle>
                  <CardDescription>Manage how you receive notifications</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="push-notifications" className="text-base">Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive push notifications in your browser</p>
                </div>
                <Switch
                  id="push-notifications"
                  checked={settings.pushNotifications}
                  onCheckedChange={(checked) => handleSettingChange('pushNotifications', checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications" className="text-base">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Get updates via email</p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="sms-notifications" className="text-base">SMS Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive important alerts via SMS</p>
                </div>
                <Switch
                  id="sms-notifications"
                  checked={settings.smsNotifications}
                  onCheckedChange={(checked) => handleSettingChange('smsNotifications', checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="transaction-alerts" className="text-base">Transaction Alerts</Label>
                  <p className="text-sm text-muted-foreground">Get notified about transactions</p>
                </div>
                <Switch
                  id="transaction-alerts"
                  checked={settings.transactionAlerts}
                  onCheckedChange={(checked) => handleSettingChange('transactionAlerts', checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="group-activity" className="text-base">Group Activity</Label>
                  <p className="text-sm text-muted-foreground">Notifications from group activities</p>
                </div>
                <Switch
                  id="group-activity"
                  checked={settings.groupActivityAlerts}
                  onCheckedChange={(checked) => handleSettingChange('groupActivityAlerts', checked)}
                />
              </div>
          </CardContent>
        </Card>

        {/* Navigation Preferences */}
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg">
                <Monitor className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle>Navigation Preferences</CardTitle>
                <CardDescription>Customize how you navigate the app</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label className="text-base">Navigation Style</Label>
              <p className="text-sm text-muted-foreground mb-3">
                Choose between horizontal top navigation or sidebar navigation (desktop only)
              </p>
              <RadioGroup
                value={navigationStyle}
                onValueChange={(value) => {
                  setNavigationStyle(value as 'horizontal' | 'sidebar');
                  toast({
                    title: "Navigation Style Updated",
                    description: `Switched to ${value} navigation mode.`,
                  });
                }}
                className="grid grid-cols-2 gap-4"
              >
                <div>
                  <RadioGroupItem value="horizontal" id="horizontal" className="peer sr-only" />
                  <Label
                    htmlFor="horizontal"
                    className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    <div className="w-full h-12 mb-3 bg-muted rounded flex items-center justify-center">
                      <div className="flex gap-1">
                        <div className="w-8 h-1 bg-primary rounded" />
                        <div className="w-8 h-1 bg-primary rounded" />
                        <div className="w-8 h-1 bg-primary rounded" />
                      </div>
                    </div>
                    <span className="text-sm font-medium">Horizontal</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="sidebar" id="sidebar" className="peer sr-only" />
                  <Label
                    htmlFor="sidebar"
                    className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    <div className="w-full h-12 mb-3 bg-muted rounded flex items-start gap-1">
                      <div className="w-3 h-full bg-primary rounded" />
                      <div className="flex-1 space-y-1 pt-1">
                        <div className="w-full h-1 bg-primary rounded" />
                        <div className="w-3/4 h-1 bg-primary/50 rounded" />
                      </div>
                    </div>
                    <span className="text-sm font-medium">Sidebar</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-switch" className="text-base">Auto-Switch Navigation</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically switch between styles based on screen size
                </p>
              </div>
              <Switch
                id="auto-switch"
                checked={navigationPreferences.autoSwitch}
                onCheckedChange={(checked) => {
                  updateNavigationPreference('autoSwitch', checked);
                  toast({
                    title: "Setting Updated",
                    description: `Auto-switch ${checked ? 'enabled' : 'disabled'}.`,
                  });
                }}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="remember-choice" className="text-base">Remember Navigation Choice</Label>
                <p className="text-sm text-muted-foreground">
                  Save your preferred navigation style
                </p>
              </div>
              <Switch
                id="remember-choice"
                checked={navigationPreferences.rememberChoice}
                onCheckedChange={(checked) => {
                  updateNavigationPreference('rememberChoice', checked);
                  toast({
                    title: "Setting Updated",
                    description: `Navigation preference will ${checked ? 'be saved' : 'not be saved'}.`,
                  });
                }}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="sidebar-collapsed" className="text-base">Sidebar Collapsed by Default</Label>
                <p className="text-sm text-muted-foreground">
                  Start with a collapsed sidebar (sidebar mode only)
                </p>
              </div>
              <Switch
                id="sidebar-collapsed"
                checked={navigationPreferences.sidebarDefaultCollapsed}
                onCheckedChange={(checked) => {
                  updateNavigationPreference('sidebarDefaultCollapsed', checked);
                  toast({
                    title: "Setting Updated",
                    description: `Sidebar will ${checked ? 'start collapsed' : 'start expanded'}.`,
                  });
                }}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="show-quick-actions" className="text-base">Show Quick Actions</Label>
                <p className="text-sm text-muted-foreground">
                  Display quick action buttons in navigation
                </p>
              </div>
              <Switch
                id="show-quick-actions"
                checked={navigationPreferences.showQuickActions}
                onCheckedChange={(checked) => {
                  updateNavigationPreference('showQuickActions', checked);
                  toast({
                    title: "Setting Updated",
                    description: `Quick actions ${checked ? 'shown' : 'hidden'}.`,
                  });
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Appearance Settings */}
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
                  <Palette className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle>Appearance</CardTitle>
                  <CardDescription>Customize the look and feel</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label className="text-base">Theme</Label>
                <RadioGroup
                  value={settings.theme}
                  onValueChange={(value) => handleSettingChange('theme', value)}
                  className="grid grid-cols-3 gap-4"
                >
                  <div>
                    <RadioGroupItem value="light" id="light" className="peer sr-only" />
                    <Label
                      htmlFor="light"
                      className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                    >
                      <Sun className="mb-3 h-6 w-6" />
                      <span className="text-sm font-medium">Light</span>
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="dark" id="dark" className="peer sr-only" />
                    <Label
                      htmlFor="dark"
                      className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                    >
                      <Moon className="mb-3 h-6 w-6" />
                      <span className="text-sm font-medium">Dark</span>
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="system" id="system" className="peer sr-only" />
                    <Label
                      htmlFor="system"
                      className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                    >
                      <Monitor className="mb-3 h-6 w-6" />
                      <span className="text-sm font-medium">System</span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label htmlFor="language" className="text-base">Language</Label>
                <Select value={settings.language} onValueChange={(value) => handleSettingChange('language', value)}>
                  <SelectTrigger id="language">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="hi">Hindi</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label htmlFor="currency" className="text-base">Currency</Label>
                <Select value={settings.currency} onValueChange={(value) => handleSettingChange('currency', value)}>
                  <SelectTrigger id="currency">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INR">INR (₹)</SelectItem>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Privacy Settings */}
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                  <Lock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle>Privacy</CardTitle>
                  <CardDescription>Control your privacy and data sharing</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="profile-visibility" className="text-base">Profile Visibility</Label>
                <Select value={settings.profileVisibility} onValueChange={(value) => handleSettingChange('profileVisibility', value)}>
                  <SelectTrigger id="profile-visibility">
                    <SelectValue placeholder="Select visibility" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="friends">Friends Only</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="online-status" className="text-base">Show Online Status</Label>
                  <p className="text-sm text-muted-foreground">Let others see when you're online</p>
                </div>
                <Switch
                  id="online-status"
                  checked={settings.showOnlineStatus}
                  onCheckedChange={(checked) => handleSettingChange('showOnlineStatus', checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="share-analytics" className="text-base">Share Analytics</Label>
                  <p className="text-sm text-muted-foreground">Help us improve by sharing usage data</p>
                </div>
                <Switch
                  id="share-analytics"
                  checked={settings.shareAnalytics}
                  onCheckedChange={(checked) => handleSettingChange('shareAnalytics', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Display Settings */}
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg">
                  <Eye className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle>Display</CardTitle>
                  <CardDescription>Customize how information is displayed</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="show-balance" className="text-base">Show Balance</Label>
                  <p className="text-sm text-muted-foreground">Display your wallet balance</p>
                </div>
                <Switch
                  id="show-balance"
                  checked={settings.showBalance}
                  onCheckedChange={(checked) => handleSettingChange('showBalance', checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="animations" className="text-base">Animations</Label>
                  <p className="text-sm text-muted-foreground">Enable smooth animations</p>
                </div>
                <Switch
                  id="animations"
                  checked={settings.animations}
                  onCheckedChange={(checked) => handleSettingChange('animations', checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="sound-effects" className="text-base">Sound Effects</Label>
                  <p className="text-sm text-muted-foreground">Play sounds for interactions</p>
                </div>
                <Switch
                  id="sound-effects"
                  checked={settings.soundEffects}
                  onCheckedChange={(checked) => handleSettingChange('soundEffects', checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="haptic-feedback" className="text-base">Haptic Feedback</Label>
                  <p className="text-sm text-muted-foreground">Vibration feedback on mobile</p>
                </div>
                <Switch
                  id="haptic-feedback"
                  checked={settings.hapticFeedback}
                  onCheckedChange={(checked) => handleSettingChange('hapticFeedback', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Data & Storage */}
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg">
                  <Download className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle>Data & Storage</CardTitle>
                  <CardDescription>Manage your data and storage</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleExportData}
              >
                <Download className="w-4 h-4 mr-2" />
                Export My Data
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleClearCache}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Clear Cache
              </Button>

              <Separator />

              <div className="pt-4">
                <div className="flex items-start gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                  <Info className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-400 mb-2">Danger Zone</p>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDeleteAccount}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Account
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* App Info */}
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">ZenithWallet Version 1.0.0</p>
                <p className="text-xs text-muted-foreground">© 2025 ZenithWallet. All rights reserved.</p>
                <div className="flex items-center justify-center gap-4 pt-2">
                  <Button variant="link" size="sm" className="text-xs">Terms of Service</Button>
                  <Button variant="link" size="sm" className="text-xs">Privacy Policy</Button>
                  <Button variant="link" size="sm" className="text-xs">Help & Support</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default withLayout(SettingsPage, { defaultMode: 'group', defaultSubNav: 'wallet' });
