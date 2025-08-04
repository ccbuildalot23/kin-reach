import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Shield, Lock, Eye, Database, Trash2, Download, UserX } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function PrivacySettings() {
  const [loading, setLoading] = useState(false);
  const [privacySettings, setPrivacySettings] = useState({
    shareDataWithSupport: true,
    allowAnonymousStats: true,
    locationSharing: false,
    notificationPreview: true,
    autoDeleteOldData: false,
    dataRetentionDays: 90,
  });
  const { toast } = useToast();

  useEffect(() => {
    loadPrivacySettings();
  }, []);

  async function loadPrivacySettings() {
    try {
      const savedSettings = localStorage.getItem('privacy-settings');
      if (savedSettings) {
        setPrivacySettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Error loading privacy settings:', error);
    }
  }

  async function savePrivacySettings() {
    setLoading(true);
    try {
      localStorage.setItem('privacy-settings', JSON.stringify(privacySettings));
      toast({
        title: "Privacy settings updated",
        description: "Your privacy preferences have been saved",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save privacy settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function exportData() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Fetch all user data
      const [profileData, supportNetwork, notifications, crisisAlerts] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', user.id).single(),
        supabase.from('support_network').select('*').eq('user_id', user.id),
        supabase.from('notifications').select('*').eq('recipient_id', user.id),
        supabase.from('crisis_alerts').select('*').eq('user_id', user.id),
      ]);

      const exportData = {
        exportDate: new Date().toISOString(),
        profile: profileData.data,
        supportNetwork: supportNetwork.data,
        notifications: notifications.data,
        crisisAlerts: crisisAlerts.data,
      };

      // Create and download file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kin-reach-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Data exported",
        description: "Your data has been downloaded successfully",
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: "Export failed",
        description: "Failed to export your data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function deleteAllData() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Delete all user data
      await Promise.all([
        supabase.from('support_network').delete().eq('user_id', user.id),
        supabase.from('notifications').delete().eq('recipient_id', user.id),
        supabase.from('crisis_alerts').delete().eq('user_id', user.id),
        supabase.from('support_requests').delete().eq('user_id', user.id),
      ]);

      // Clear local storage
      localStorage.clear();

      toast({
        title: "Data deleted",
        description: "All your data has been permanently deleted",
      });

      // Sign out and redirect
      await supabase.auth.signOut();
      window.location.href = '/auth';
    } catch (error) {
      console.error('Error deleting data:', error);
      toast({
        title: "Error",
        description: "Failed to delete all data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Privacy & Data Management
          </CardTitle>
          <CardDescription>
            Control how your data is used and shared
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="share-data">Share Data with Support Network</Label>
                <p className="text-sm text-muted-foreground">
                  Allow your support network to see your status updates
                </p>
              </div>
              <Switch
                id="share-data"
                checked={privacySettings.shareDataWithSupport}
                onCheckedChange={(checked) =>
                  setPrivacySettings({ ...privacySettings, shareDataWithSupport: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="anonymous-stats">Anonymous Usage Statistics</Label>
                <p className="text-sm text-muted-foreground">
                  Help improve the app by sharing anonymous usage data
                </p>
              </div>
              <Switch
                id="anonymous-stats"
                checked={privacySettings.allowAnonymousStats}
                onCheckedChange={(checked) =>
                  setPrivacySettings({ ...privacySettings, allowAnonymousStats: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="location">Location Sharing</Label>
                <p className="text-sm text-muted-foreground">
                  Share your location during crisis alerts
                </p>
              </div>
              <Switch
                id="location"
                checked={privacySettings.locationSharing}
                onCheckedChange={(checked) =>
                  setPrivacySettings({ ...privacySettings, locationSharing: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="preview">Notification Previews</Label>
                <p className="text-sm text-muted-foreground">
                  Show message content in notifications
                </p>
              </div>
              <Switch
                id="preview"
                checked={privacySettings.notificationPreview}
                onCheckedChange={(checked) =>
                  setPrivacySettings({ ...privacySettings, notificationPreview: checked })
                }
              />
            </div>
          </div>

          <Button onClick={savePrivacySettings} disabled={loading} className="w-full">
            Save Privacy Settings
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Management
          </CardTitle>
          <CardDescription>
            Export or delete your personal data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="outline"
            onClick={exportData}
            disabled={loading}
            className="w-full"
          >
            <Download className="mr-2 h-4 w-4" />
            Export My Data
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full" disabled={loading}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete All My Data
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your
                  account and remove all your data from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={deleteAllData}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Delete Everything
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}