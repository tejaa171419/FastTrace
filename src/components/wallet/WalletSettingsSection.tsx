import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Shield,
  Bell,
  AlertCircle,
  Lock,
  Fingerprint,
  Save,
  CheckCircle,
  Globe,
  Palette,
  Zap,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";
import { PinSetupDialog } from "./PinSetupDialog";
import { PinChangeDialog } from "./PinChangeDialog";
import { AccountDetailsCard } from "./AccountDetailsCard";

interface WalletSettings {
  security: {
    pinEnabled: boolean;
    twoFactorEnabled: boolean;
    biometricEnabled: boolean;
    loginNotifications: boolean;
    transactionPinRequired: boolean;
  };
  notifications: {
    transactionAlerts: boolean;
    paymentReminders: boolean;
    offersAndRewards: boolean;
    weeklyStatement: boolean;
    lowBalanceAlert: boolean;
    largeTransactionAlert: boolean;
  };
  limits: {
    dailyLimit: number;
    monthlyLimit: number;
    perTransactionLimit: number;
    dailyUsed: number;
    monthlyUsed: number;
  };
  account: {
    accountNumber: string;
    ifscCode: string;
    balance: number;
    currency: string;
    status: string;
    kycStatus: string;
    kycLevel: number;
  };
  preferences: {
    language: string;
    currency: string;
    theme: string;
    autoTopup: boolean;
    autoTopupAmount: number;
    autoTopupThreshold: number;
  };
  user: {
    name: string;
    email: string;
    phone: string;
  };
}

export const WalletSettingsSection = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<WalletSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pinDialogOpen, setPinDialogOpen] = useState(false);
  const [pinChangeDialogOpen, setPinChangeDialogOpen] = useState(false);
  const [pinLength, setPinLength] = useState(4);

  // Fetch settings on mount
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<{ success: boolean; data: WalletSettings }>(
        '/api/wallet/settings'
      );

      if (response.success) {
        setSettings(response.data);
        
        // Also fetch PIN status to get PIN length
        try {
          const pinResponse = await apiClient.get('/api/payments/wallet/pin/status');
          if (pinResponse.success && pinResponse.data.pinLength) {
            setPinLength(pinResponse.data.pinLength);
          }
        } catch (pinError) {
          console.error('Failed to fetch PIN status:', pinError);
        }
      }
    } catch (error: any) {
      console.error('Failed to fetch wallet settings:', error);
      toast({
        title: "Error",
        description: "Failed to load wallet settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSecuritySettings = async (updates: Partial<WalletSettings['security']>) => {
    try {
      setSaving(true);
      const response = await apiClient.put('/api/wallet/settings/security', updates);

      if (response.success) {
        setSettings((prev) => prev ? {
          ...prev,
          security: { ...prev.security, ...updates }
        } : null);

        toast({
          title: "Success",
          description: "Security settings updated successfully",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update security settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateNotificationSettings = async (updates: Partial<WalletSettings['notifications']>) => {
    try {
      setSaving(true);
      const response = await apiClient.put('/api/wallet/settings/notifications', updates);

      if (response.success) {
        setSettings((prev) => prev ? {
          ...prev,
          notifications: { ...prev.notifications, ...updates }
        } : null);

        toast({
          title: "Success",
          description: "Notification settings updated successfully",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update notification settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateLimitSettings = async (updates: Partial<WalletSettings['limits']>) => {
    try {
      setSaving(true);
      const response = await apiClient.put('/api/wallet/settings/limits', updates);

      if (response.success) {
        setSettings((prev) => prev ? {
          ...prev,
          limits: { ...prev.limits, ...updates }
        } : null);

        toast({
          title: "Success",
          description: "Transaction limits updated successfully",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update transaction limits",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updatePreferences = async (updates: Partial<WalletSettings['preferences']>) => {
    try {
      setSaving(true);
      const response = await apiClient.put('/api/wallet/settings/preferences', updates);

      if (response.success) {
        setSettings((prev) => prev ? {
          ...prev,
          preferences: { ...prev.preferences, ...updates }
        } : null);

        toast({
          title: "Success",
          description: "Preferences updated successfully",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update preferences",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="glass-card border-primary/20">
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!settings) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Failed to load wallet settings</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
      {/* Security Settings */}
      <Card className="glass-card border-primary/20 shadow-glow hover:shadow-glow-lg transition-all duration-500">
        <CardHeader className="p-3 sm:p-4 md:p-6">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base md:text-lg">
            <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            Security
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Manage your wallet security settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-4 md:p-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                <Lock className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-xs sm:text-sm md:text-base">PIN Protection</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                    {settings.security.pinEnabled ? "PIN is set" : "No PIN set"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {settings.security.pinEnabled && (
                  <CheckCircle className="w-4 h-4 text-success" />
                )}
                <Switch
                  checked={settings.security.transactionPinRequired}
                  onCheckedChange={(checked) =>
                    updateSecuritySettings({ transactionPinRequired: checked })
                  }
                  disabled={!settings.security.pinEnabled || saving}
                  className="flex-shrink-0"
                />
              </div>
            </div>
            {!settings.security.pinEnabled ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPinDialogOpen(true)}
                className="w-full text-xs"
              >
                <Lock className="w-3 h-3 mr-2" />
                Setup PIN
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPinChangeDialogOpen(true)}
                className="w-full text-xs"
              >
                <Lock className="w-3 h-3 mr-2" />
                Change PIN
              </Button>
            )}
          </div>

          <Separator />

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <Fingerprint className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
              <div className="min-w-0">
                <p className="font-medium text-xs sm:text-sm md:text-base">
                  Biometric Authentication
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                  Use fingerprint/face ID
                </p>
              </div>
            </div>
            <Switch
              checked={settings.security.biometricEnabled}
              onCheckedChange={(checked) =>
                updateSecuritySettings({ biometricEnabled: checked })
              }
              disabled={saving}
              className="flex-shrink-0"
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-xs sm:text-sm md:text-base">Login Notifications</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                Get notified on new logins
              </p>
            </div>
            <Switch
              checked={settings.security.loginNotifications}
              onCheckedChange={(checked) =>
                updateSecuritySettings({ loginNotifications: checked })
              }
              disabled={saving}
              className="flex-shrink-0"
            />
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card className="glass-card border-primary/20 shadow-glow hover:shadow-glow-lg transition-all duration-500">
        <CardHeader className="p-3 sm:p-4 md:p-6">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base md:text-lg">
            <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            Notifications
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Control wallet notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-4 md:p-6">
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-xs sm:text-sm md:text-base">Transaction Alerts</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                Get notified for all transactions
              </p>
            </div>
            <Switch
              checked={settings.notifications.transactionAlerts}
              onCheckedChange={(checked) =>
                updateNotificationSettings({ transactionAlerts: checked })
              }
              disabled={saving}
              className="flex-shrink-0"
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-xs sm:text-sm md:text-base">Payment Reminders</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                Remind pending payments
              </p>
            </div>
            <Switch
              checked={settings.notifications.paymentReminders}
              onCheckedChange={(checked) =>
                updateNotificationSettings({ paymentReminders: checked })
              }
              disabled={saving}
              className="flex-shrink-0"
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-xs sm:text-sm md:text-base">Low Balance Alert</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                Alert when balance is low
              </p>
            </div>
            <Switch
              checked={settings.notifications.lowBalanceAlert}
              onCheckedChange={(checked) =>
                updateNotificationSettings({ lowBalanceAlert: checked })
              }
              disabled={saving}
              className="flex-shrink-0"
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-xs sm:text-sm md:text-base">Offers & Rewards</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                Promotional notifications
              </p>
            </div>
            <Switch
              checked={settings.notifications.offersAndRewards}
              onCheckedChange={(checked) =>
                updateNotificationSettings({ offersAndRewards: checked })
              }
              disabled={saving}
              className="flex-shrink-0"
            />
          </div>
        </CardContent>
      </Card>

      {/* Account Details */}
      <AccountDetailsCard 
        accountDetails={settings.account}
        userName={settings.user.name}
        onStatementDownload={fetchSettings}
        isLoading={loading}
      />

      {/* Transaction Limits */}
      <Card className="glass-card border-primary/20 shadow-glow hover:shadow-glow-lg transition-all duration-500">
        <CardHeader className="p-3 sm:p-4 md:p-6">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base md:text-lg">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            Transaction Limits
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Set transaction limits and restrictions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-4 md:p-6">
          <div className="space-y-2">
            <Label className="text-xs sm:text-sm">Daily Transaction Limit</Label>
            <div className="relative">
              <span className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs sm:text-sm">
                ₹
              </span>
              <Input
                type="number"
                value={settings.limits.dailyLimit}
                onChange={(e) =>
                  setSettings((prev) =>
                    prev
                      ? {
                          ...prev,
                          limits: { ...prev.limits, dailyLimit: Number(e.target.value) },
                        }
                      : null
                  )
                }
                className="pl-6 sm:pl-8 glass-card border-white/20 text-xs sm:text-sm"
              />
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              Current: ₹{settings.limits.dailyLimit.toLocaleString('en-IN')} | Used: ₹
              {settings.limits.dailyUsed.toLocaleString('en-IN')}
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="text-xs sm:text-sm">Monthly Transaction Limit</Label>
            <div className="relative">
              <span className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs sm:text-sm">
                ₹
              </span>
              <Input
                type="number"
                value={settings.limits.monthlyLimit}
                onChange={(e) =>
                  setSettings((prev) =>
                    prev
                      ? {
                          ...prev,
                          limits: { ...prev.limits, monthlyLimit: Number(e.target.value) },
                        }
                      : null
                  )
                }
                className="pl-6 sm:pl-8 glass-card border-white/20 text-xs sm:text-sm"
              />
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              Current: ₹{settings.limits.monthlyLimit.toLocaleString('en-IN')} | Used: ₹
              {settings.limits.monthlyUsed.toLocaleString('en-IN')}
            </p>
          </div>

          <Button
            variant="outline"
            className="w-full glass-card border-white/20 text-xs sm:text-sm"
            onClick={() =>
              updateLimitSettings({
                dailyLimit: settings.limits.dailyLimit,
                monthlyLimit: settings.limits.monthlyLimit,
              })
            }
            disabled={saving}
          >
            <Save className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
            {saving ? "Saving..." : "Save Limits"}
          </Button>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card className="glass-card border-primary/20 shadow-glow hover:shadow-glow-lg transition-all duration-500">
        <CardHeader className="p-3 sm:p-4 md:p-6">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base md:text-lg">
            <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            Preferences
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Customize your wallet experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-4 md:p-6">
          <div className="space-y-2">
            <Label className="text-xs sm:text-sm flex items-center gap-2">
              <Globe className="w-3 h-3" />
              Language
            </Label>
            <Select
              value={settings.preferences.language}
              onValueChange={(value) => updatePreferences({ language: value })}
            >
              <SelectTrigger className="glass-card border-white/20 text-xs sm:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="hi">Hindi</SelectItem>
                <SelectItem value="ta">Tamil</SelectItem>
                <SelectItem value="te">Telugu</SelectItem>
                <SelectItem value="bn">Bengali</SelectItem>
                <SelectItem value="mr">Marathi</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs sm:text-sm flex items-center gap-2">
              <Palette className="w-3 h-3" />
              Theme
            </Label>
            <Select
              value={settings.preferences.theme}
              onValueChange={(value) => updatePreferences({ theme: value })}
            >
              <SelectTrigger className="glass-card border-white/20 text-xs sm:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="auto">Auto</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
              <div className="min-w-0">
                <p className="font-medium text-xs sm:text-sm md:text-base">Auto Top-up</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                  Automatically add money when low
                </p>
              </div>
            </div>
            <Switch
              checked={settings.preferences.autoTopup}
              onCheckedChange={(checked) => updatePreferences({ autoTopup: checked })}
              disabled={saving}
              className="flex-shrink-0"
            />
          </div>

          {settings.preferences.autoTopup && (
            <div className="space-y-2 pl-7">
              <div>
                <Label className="text-[10px] sm:text-xs">Top-up Amount (₹)</Label>
                <Input
                  type="number"
                  value={settings.preferences.autoTopupAmount}
                  onChange={(e) =>
                    setSettings((prev) =>
                      prev
                        ? {
                            ...prev,
                            preferences: {
                              ...prev.preferences,
                              autoTopupAmount: Number(e.target.value),
                            },
                          }
                        : null
                    )
                  }
                  className="glass-card border-white/20 text-xs h-8"
                />
              </div>
              <div>
                <Label className="text-[10px] sm:text-xs">Threshold (₹)</Label>
                <Input
                  type="number"
                  value={settings.preferences.autoTopupThreshold}
                  onChange={(e) =>
                    setSettings((prev) =>
                      prev
                        ? {
                            ...prev,
                            preferences: {
                              ...prev.preferences,
                              autoTopupThreshold: Number(e.target.value),
                            },
                          }
                        : null
                    )
                  }
                  className="glass-card border-white/20 text-xs h-8"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full glass-card border-white/20 text-[10px] h-7"
                onClick={() =>
                  updatePreferences({
                    autoTopupAmount: settings.preferences.autoTopupAmount,
                    autoTopupThreshold: settings.preferences.autoTopupThreshold,
                  })
                }
                disabled={saving}
              >
                <Save className="w-3 h-3 mr-1" />
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* App Info Card */}
      <Card className="glass-card border-primary/20 shadow-glow hover:shadow-glow-lg transition-all duration-500">
        <CardHeader className="p-3 sm:p-4 md:p-6">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base md:text-lg">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            About
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            App information and support
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-4 md:p-6">
          <div className="space-y-1">
            <p className="text-xs sm:text-sm font-medium">Zenith Wallet</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Version 1.0.0</p>
          </div>

          <Separator />

          <div className="space-y-1">
            <p className="text-xs sm:text-sm font-medium">Account Status</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground capitalize">
              {settings.account.status}
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <Button variant="outline" className="w-full glass-card border-white/20 text-xs sm:text-sm">
              Help & Support
            </Button>
            <Button variant="outline" className="w-full glass-card border-white/20 text-xs sm:text-sm">
              Terms & Conditions
            </Button>
            <Button variant="outline" className="w-full glass-card border-white/20 text-xs sm:text-sm">
              Privacy Policy
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* PIN Setup Dialog */}
      <PinSetupDialog
        open={pinDialogOpen}
        onOpenChange={setPinDialogOpen}
        onComplete={() => {
          fetchSettings();
        }}
      />

      {/* PIN Change Dialog */}
      <PinChangeDialog
        open={pinChangeDialogOpen}
        onOpenChange={setPinChangeDialogOpen}
        currentPinLength={pinLength}
        onComplete={() => {
          fetchSettings();
        }}
      />
    </div>
  );
};
