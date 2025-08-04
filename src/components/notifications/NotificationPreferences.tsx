import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Bell, Loader2, Save } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export function NotificationPreferences() {
  const [inAppEnabled, setInAppEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [crisisAlerts, setCrisisAlerts] = useState(true);
  const [supportRequests, setSupportRequests] = useState(true);
  const [checkIns, setCheckIns] = useState(true);
  const [milestones, setMilestones] = useState(true);
  const [dailyReminders, setDailyReminders] = useState(false);
  const [weeklyReports, setWeeklyReports] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (isAuthenticated && user) {
      loadPreferences();
    }
  }, [isAuthenticated, user]);

  const loadPreferences = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading preferences:', error);
        toast({
          title: 'Error',
          description: 'Failed to load notification preferences',
          variant: 'destructive',
        });
        return;
      }

      if (data) {
        setInAppEnabled(data.in_app_notifications ?? true);
        setSmsEnabled(data.sms_notifications ?? true);
        setEmailEnabled(data.email_notifications ?? true);
        setCrisisAlerts(data.crisis_alerts ?? true);
        setSupportRequests(data.support_requests ?? true);
        setCheckIns(data.check_ins ?? true);
        setMilestones(data.milestones ?? true);
        setDailyReminders(data.daily_reminders ?? false);
        setWeeklyReports(data.weekly_reports ?? true);
      }
    } catch (error) {
      console.error('Error in loadPreferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const preferences = {
        user_id: user.id,
        in_app_notifications: inAppEnabled,
        sms_notifications: smsEnabled,
        email_notifications: emailEnabled,
        crisis_alerts: crisisAlerts,
        support_requests: supportRequests,
        check_ins: checkIns,
        milestones: milestones,
        daily_reminders: dailyReminders,
        weekly_reports: weeklyReports,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('notification_preferences')
        .upsert(preferences, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error saving preferences:', error);
        toast({
          title: 'Error',
          description: 'Failed to save notification preferences',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Success',
        description: 'Notification preferences updated successfully',
      });
    } catch (error) {
      console.error('Error in savePreferences:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
          <CardDescription>
            Choose how you'd like to receive notifications and what types of alerts you want
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h4 className="font-medium text-purple-700 dark:text-purple-300">Delivery Methods</h4>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>In-app notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Show notifications within the app interface
                </p>
              </div>
              <Switch
                checked={inAppEnabled}
                onCheckedChange={setInAppEnabled}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>SMS notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive important alerts via text message
                </p>
              </div>
              <Switch
                checked={smsEnabled}
                onCheckedChange={setSmsEnabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Get notifications sent to your email address
                </p>
              </div>
              <Switch
                checked={emailEnabled}
                onCheckedChange={setEmailEnabled}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-purple-700 dark:text-purple-300">Notification Types</h4>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Crisis alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Emergency notifications from your support network
                </p>
              </div>
              <Switch
                checked={crisisAlerts}
                onCheckedChange={setCrisisAlerts}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Support requests</Label>
                <p className="text-sm text-muted-foreground">
                  When someone in your network needs support
                </p>
              </div>
              <Switch
                checked={supportRequests}
                onCheckedChange={setSupportRequests}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Check-in reminders</Label>
                <p className="text-sm text-muted-foreground">
                  Daily reminders to complete your wellness check-in
                </p>
              </div>
              <Switch
                checked={checkIns}
                onCheckedChange={setCheckIns}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Milestone celebrations</Label>
                <p className="text-sm text-muted-foreground">
                  Celebrate your recovery achievements and milestones
                </p>
              </div>
              <Switch
                checked={milestones}
                onCheckedChange={setMilestones}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Daily reminders</Label>
                <p className="text-sm text-muted-foreground">
                  Gentle reminders for self-care and wellness activities
                </p>
              </div>
              <Switch
                checked={dailyReminders}
                onCheckedChange={setDailyReminders}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Weekly progress reports</Label>
                <p className="text-sm text-muted-foreground">
                  Summary of your weekly recovery progress
                </p>
              </div>
              <Switch
                checked={weeklyReports}
                onCheckedChange={setWeeklyReports}
              />
            </div>
          </div>

          <Button 
            onClick={savePreferences} 
            disabled={saving}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Preferences
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}