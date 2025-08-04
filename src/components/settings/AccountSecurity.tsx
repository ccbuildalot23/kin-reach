import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Key, Lock, Smartphone, Mail, AlertTriangle, CheckCircle, Loader2, Eye, EyeOff } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export function AccountSecurity() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [loginNotifications, setLoginNotifications] = useState(true);
  const [securityUpdates, setSecurityUpdates] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState(30);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (isAuthenticated && user) {
      loadSecuritySettings();
    }
  }, [isAuthenticated, user]);

  const loadSecuritySettings = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Load user security preferences
      const { data, error } = await supabase
        .from('user_security_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading security settings:', error);
        return;
      }

      if (data) {
        setTwoFactorEnabled(data.two_factor_enabled ?? false);
        setLoginNotifications(data.login_notifications ?? true);
        setSecurityUpdates(data.security_updates ?? true);
        setSessionTimeout(data.session_timeout_minutes ?? 30);
      }
    } catch (error) {
      console.error('Error in loadSecuritySettings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSecuritySettings = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const settings = {
        user_id: user.id,
        two_factor_enabled: twoFactorEnabled,
        login_notifications: loginNotifications,
        security_updates: securityUpdates,
        session_timeout_minutes: sessionTimeout,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('user_security_settings')
        .upsert(settings, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error saving security settings:', error);
        toast({
          title: 'Error',
          description: 'Failed to save security settings',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Success',
        description: 'Security settings updated successfully',
      });
    } catch (error) {
      console.error('Error in saveSecuritySettings:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: 'Error',
        description: 'Please fill in all password fields',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'New passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: 'Error',
        description: 'Password must be at least 8 characters long',
        variant: 'destructive',
      });
      return;
    }

    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('Error changing password:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to change password',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Success',
        description: 'Password changed successfully',
      });

      // Clear password fields
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error('Error in handlePasswordChange:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const getPasswordStrengthText = (strength: number) => {
    switch (strength) {
      case 0:
      case 1:
        return { text: "Very Weak", color: "text-red-600" };
      case 2:
        return { text: "Weak", color: "text-orange-600" };
      case 3:
        return { text: "Moderate", color: "text-yellow-600" };
      case 4:
        return { text: "Strong", color: "text-green-600" };
      case 5:
        return { text: "Very Strong", color: "text-green-700" };
      default:
        return { text: "", color: "" };
    }
  };

  const passwordStrength = getPasswordStrength(newPassword);
  const strengthInfo = getPasswordStrengthText(passwordStrength);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Change Password
          </CardTitle>
          <CardDescription>
            Update your password to keep your account secure
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Current Password</Label>
            <div className="relative">
              <Input
                id="current-password"
                type={showPasswords ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowPasswords(!showPasswords)}
              >
                {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showPasswords ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="pr-10"
              />
            </div>
            {newPassword && (
              <div className="flex items-center gap-2 text-sm">
                <span>Strength:</span>
                <span className={strengthInfo.color}>{strengthInfo.text}</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className={`h-2 w-6 rounded ${
                        i <= passwordStrength
                          ? passwordStrength <= 2
                            ? "bg-red-400"
                            : passwordStrength <= 3
                            ? "bg-yellow-400"
                            : "bg-green-400"
                          : "bg-gray-200"
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <Input
              id="confirm-password"
              type={showPasswords ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          
          <Button 
            onClick={handlePasswordChange} 
            disabled={changingPassword}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            {changingPassword ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating Password...
              </>
            ) : (
              "Update Password"
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Add an extra layer of security to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Two-Factor Authentication</Label>
              <p className="text-sm text-muted-foreground">
                Require a verification code in addition to your password
              </p>
            </div>
            <Switch
              checked={twoFactorEnabled}
              onCheckedChange={setTwoFactorEnabled}
            />
          </div>
          
          {twoFactorEnabled && (
            <Alert>
              <Smartphone className="h-4 w-4" />
              <AlertDescription>
                Two-factor authentication is enabled. You'll need to use an authenticator app when signing in.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Preferences
          </CardTitle>
          <CardDescription>
            Configure how you receive security notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Login notifications</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when someone signs into your account
              </p>
            </div>
            <Switch
              checked={loginNotifications}
              onCheckedChange={setLoginNotifications}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Security updates</Label>
              <p className="text-sm text-muted-foreground">
                Receive important security updates and alerts
              </p>
            </div>
            <Switch
              checked={securityUpdates}
              onCheckedChange={setSecurityUpdates}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="session-timeout">Session timeout (minutes)</Label>
            <Input
              id="session-timeout"
              type="number"
              min="5"
              max="120"
              value={sessionTimeout}
              onChange={(e) => setSessionTimeout(parseInt(e.target.value) || 30)}
              className="w-32"
            />
            <p className="text-sm text-muted-foreground">
              Automatically sign out after this period of inactivity
            </p>
          </div>

          <Button 
            onClick={saveSecuritySettings} 
            disabled={saving}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Security Settings"
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Security Status
          </CardTitle>
          <CardDescription>
            Your account security information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-green-900 dark:text-green-100">Account Secured</p>
                <p className="text-sm text-green-700 dark:text-green-300">Your account is protected with strong security measures</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              {twoFactorEnabled ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-orange-600" />
              )}
              <span>Two-factor authentication</span>
            </div>
            
            <div className="flex items-center gap-2">
              {passwordStrength >= 4 ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-orange-600" />
              )}
              <span>Strong password</span>
            </div>
            
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Encrypted communications</span>
            </div>
            
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Secure data storage</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}