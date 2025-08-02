import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { NotificationService } from '@/lib/notificationService';
import { Loader2, Bell, MessageSquare, Phone, Mail, Moon } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface NotificationPreferences {
  in_app_enabled: boolean;
  sms_enabled: boolean;
  email_enabled: boolean;
  crisis_alerts: boolean;
  check_ins: boolean;
  milestones: boolean;
  support_messages: boolean;
  sponsor_messages: boolean;
  meeting_reminders: boolean;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
}

export const NotificationPreferences: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    in_app_enabled: true,
    sms_enabled: true,
    email_enabled: false,
    crisis_alerts: true,
    check_ins: true,
    milestones: true,
    support_messages: true,
    sponsor_messages: true,
    meeting_reminders: true,
  });

  useEffect(() => {
    if (!user?.id) return;

    const fetchPreferences = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setPreferences(data as NotificationPreferences);
      }
      setLoading(false);
    };

    fetchPreferences();
  }, [user?.id]);

  const handleSave = async () => {
    if (!user?.id) return;

    setSaving(true);
    try {
      await NotificationService.updatePreferences(user.id, preferences);
      toast({
        title: 'Success',
        description: 'Your notification preferences have been saved',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save preferences. Please try again.',
        variant: 'destructive',
      });
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>
          Choose how and when you want to receive notifications about your recovery journey
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Delivery Methods */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Bell className="h-5 w-5" />
            <h3 className="font-medium">Delivery Methods</h3>
          </div>
          
          <div className="space-y-4 ml-7">
            <div className="flex items-center justify-between">
              <Label htmlFor="in-app" className="flex flex-col space-y-1 cursor-pointer">
                <span className="font-normal">In-App Notifications</span>
                <span className="text-sm text-muted-foreground">
                  Receive notifications within Serenity
                </span>
              </Label>
              <Switch
                id="in-app"
                checked={preferences.in_app_enabled}
                onCheckedChange={(checked) =>
                  setPreferences({ ...preferences, in_app_enabled: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="sms" className="flex flex-col space-y-1 cursor-pointer">
                <span className="font-normal flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  SMS Notifications
                </span>
                <span className="text-sm text-muted-foreground">
                  Get urgent alerts via text message
                </span>
              </Label>
              <Switch
                id="sms"
                checked={preferences.sms_enabled}
                onCheckedChange={(checked) =>
                  setPreferences({ ...preferences, sms_enabled: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="email" className="flex flex-col space-y-1 cursor-pointer">
                <span className="font-normal flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Notifications
                </span>
                <span className="text-sm text-muted-foreground">
                  Receive daily summaries and updates
                </span>
              </Label>
              <Switch
                id="email"
                checked={preferences.email_enabled}
                onCheckedChange={(checked) =>
                  setPreferences({ ...preferences, email_enabled: checked })
                }
                disabled // Email not implemented yet
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Notification Types */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="h-5 w-5" />
            <h3 className="font-medium">Notification Types</h3>
          </div>
          
          <div className="space-y-4 ml-7">
            <div className="flex items-center justify-between">
              <Label htmlFor="crisis" className="flex flex-col space-y-1 cursor-pointer">
                <span className="font-normal text-red-600">🚨 Crisis Alerts</span>
                <span className="text-sm text-muted-foreground">
                  Emergency notifications from your support network
                </span>
              </Label>
              <Switch
                id="crisis"
                checked={preferences.crisis_alerts}
                onCheckedChange={(checked) =>
                  setPreferences({ ...preferences, crisis_alerts: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="checkins" className="flex flex-col space-y-1 cursor-pointer">
                <span className="font-normal">💙 Daily Check-ins</span>
                <span className="text-sm text-muted-foreground">
                  Reminders and responses for daily recovery check-ins
                </span>
              </Label>
              <Switch
                id="checkins"
                checked={preferences.check_ins}
                onCheckedChange={(checked) =>
                  setPreferences({ ...preferences, check_ins: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="milestones" className="flex flex-col space-y-1 cursor-pointer">
                <span className="font-normal">🏆 Milestones</span>
                <span className="text-sm text-muted-foreground">
                  Celebrate your recovery achievements
                </span>
              </Label>
              <Switch
                id="milestones"
                checked={preferences.milestones}
                onCheckedChange={(checked) =>
                  setPreferences({ ...preferences, milestones: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="support" className="flex flex-col space-y-1 cursor-pointer">
                <span className="font-normal">💬 Support Messages</span>
                <span className="text-sm text-muted-foreground">
                  Messages from your support network
                </span>
              </Label>
              <Switch
                id="support"
                checked={preferences.support_messages}
                onCheckedChange={(checked) =>
                  setPreferences({ ...preferences, support_messages: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="sponsor" className="flex flex-col space-y-1 cursor-pointer">
                <span className="font-normal">👥 Sponsor Messages</span>
                <span className="text-sm text-muted-foreground">
                  Direct messages from your sponsor
                </span>
              </Label>
              <Switch
                id="sponsor"
                checked={preferences.sponsor_messages}
                onCheckedChange={(checked) =>
                  setPreferences({ ...preferences, sponsor_messages: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="meetings" className="flex flex-col space-y-1 cursor-pointer">
                <span className="font-normal">📅 Meeting Reminders</span>
                <span className="text-sm text-muted-foreground">
                  Reminders for recovery meetings
                </span>
              </Label>
              <Switch
                id="meetings"
                checked={preferences.meeting_reminders}
                onCheckedChange={(checked) =>
                  setPreferences({ ...preferences, meeting_reminders: checked })
                }
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Quiet Hours */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Moon className="h-5 w-5" />
            <h3 className="font-medium">Quiet Hours</h3>
          </div>
          <p className="text-sm text-muted-foreground ml-7">
            Set times when only urgent notifications will come through
          </p>
          
          <div className="flex gap-4 items-center ml-7">
            <div className="flex-1">
              <Label htmlFor="quiet-start">Start Time</Label>
              <input
                type="time"
                id="quiet-start"
                className="w-full mt-1 p-2 border rounded-md"
                value={preferences.quiet_hours_start || ''}
                onChange={(e) =>
                  setPreferences({ ...preferences, quiet_hours_start: e.target.value })
                }
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="quiet-end">End Time</Label>
              <input
                type="time"
                id="quiet-end"
                className="w-full mt-1 p-2 border rounded-md"
                value={preferences.quiet_hours_end || ''}
                onChange={(e) =>
                  setPreferences({ ...preferences, quiet_hours_end: e.target.value })
                }
              />
            </div>
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Preferences'
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

