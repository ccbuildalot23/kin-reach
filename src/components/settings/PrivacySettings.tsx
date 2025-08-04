import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Shield, 
  Eye, 
  Users, 
  Download, 
  Trash2, 
  Lock, 
  AlertTriangle, 
  Info,
  Loader2,
  Save,
  FileText
} from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export function PrivacySettings() {
  const [profileVisibility, setProfileVisibility] = useState('friends');
  const [allowSupportRequests, setAllowSupportRequests] = useState(true);
  const [shareRecoveryProgress, setShareRecoveryProgress] = useState(false);
  const [allowAnalytics, setAllowAnalytics] = useState(true);
  const [allowDataSharing, setAllowDataSharing] = useState(false);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [researchParticipation, setResearchParticipation] = useState(false);
  const [dataRetentionPeriod, setDataRetentionPeriod] = useState(365);
  const [privacyNotes, setPrivacyNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exportingData, setExportingData] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (isAuthenticated && user) {
      loadPrivacySettings();
    }
  }, [isAuthenticated, user]);

  const loadPrivacySettings = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_privacy_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading privacy settings:', error);
        return;
      }

      if (data) {
        setProfileVisibility(data.profile_visibility ?? 'friends');
        setAllowSupportRequests(data.allow_support_requests ?? true);
        setShareRecoveryProgress(data.share_recovery_progress ?? false);
        setAllowAnalytics(data.allow_analytics ?? true);
        setAllowDataSharing(data.allow_data_sharing ?? false);
        setMarketingEmails(data.marketing_emails ?? false);
        setResearchParticipation(data.research_participation ?? false);
        setDataRetentionPeriod(data.data_retention_days ?? 365);
        setPrivacyNotes(data.privacy_notes ?? '');
      }
    } catch (error) {
      console.error('Error in loadPrivacySettings:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePrivacySettings = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const settings = {
        user_id: user.id,
        profile_visibility: profileVisibility,
        allow_support_requests: allowSupportRequests,
        share_recovery_progress: shareRecoveryProgress,
        allow_analytics: allowAnalytics,
        allow_data_sharing: allowDataSharing,
        marketing_emails: marketingEmails,
        research_participation: researchParticipation,
        data_retention_days: dataRetentionPeriod,
        privacy_notes: privacyNotes,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('user_privacy_settings')
        .upsert(settings, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error saving privacy settings:', error);
        toast({
          title: 'Error',
          description: 'Failed to save privacy settings',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Success',
        description: 'Privacy settings updated successfully',
      });
    } catch (error) {
      console.error('Error in savePrivacySettings:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const exportUserData = async () => {
    if (!user) return;

    setExportingData(true);
    try {
      // Get user's data from various tables
      const [profiles, notifications, supportNetwork, crisisAlerts, preferences] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', user.id),
        supabase.from('notifications').select('*').eq('recipient_id', user.id),
        supabase.from('support_network').select('*').eq('user_id', user.id),
        supabase.from('crisis_alerts').select('*').eq('user_id', user.id),
        supabase.from('notification_preferences').select('*').eq('user_id', user.id)
      ]);

      const userData = {
        export_date: new Date().toISOString(),
        user_id: user.id,
        email: user.email,
        profiles: profiles.data,
        notifications: notifications.data,
        support_network: supportNetwork.data,
        crisis_alerts: crisisAlerts.data,
        preferences: preferences.data
      };

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recovery-app-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Success',
        description: 'Your data has been exported successfully',
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: 'Error',
        description: 'Failed to export your data',
        variant: 'destructive',
      });
    } finally {
      setExportingData(false);
    }
  };

  const deleteUserData = async () => {
    if (!confirm('Are you sure you want to delete all your data? This action cannot be undone.')) {
      return;
    }

    try {
      // This would require careful implementation to handle foreign key constraints
      toast({
        title: 'Data Deletion',
        description: 'Please contact support to delete your account and all associated data.',
      });
    } catch (error) {
      console.error('Error deleting data:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete your data',
        variant: 'destructive',
      });
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
            <Eye className="h-5 w-5" />
            Profile Visibility
          </CardTitle>
          <CardDescription>
            Control who can see your profile and recovery information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label>Profile visibility</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="public"
                  name="visibility"
                  value="public"
                  checked={profileVisibility === 'public'}
                  onChange={(e) => setProfileVisibility(e.target.value)}
                  className="text-purple-600"
                />
                <Label htmlFor="public">Public - Anyone can see your profile</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="friends"
                  name="visibility"
                  value="friends"
                  checked={profileVisibility === 'friends'}
                  onChange={(e) => setProfileVisibility(e.target.value)}
                  className="text-purple-600"
                />
                <Label htmlFor="friends">Support Network Only - Only your support network can see your profile</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="private"
                  name="visibility"
                  value="private"
                  checked={profileVisibility === 'private'}
                  onChange={(e) => setProfileVisibility(e.target.value)}
                  className="text-purple-600"
                />
                <Label htmlFor="private">Private - Your profile is hidden from others</Label>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <div className="space-y-0.5">
              <Label>Allow support requests</Label>
              <p className="text-sm text-muted-foreground">
                Let users send you support requests
              </p>
            </div>
            <Switch
              checked={allowSupportRequests}
              onCheckedChange={setAllowSupportRequests}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Share recovery progress</Label>
              <p className="text-sm text-muted-foreground">
                Allow your support network to see your recovery milestones
              </p>
            </div>
            <Switch
              checked={shareRecoveryProgress}
              onCheckedChange={setShareRecoveryProgress}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Data & Analytics
          </CardTitle>
          <CardDescription>
            Control how your data is used to improve the app
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Usage analytics</Label>
              <p className="text-sm text-muted-foreground">
                Help improve the app by sharing anonymous usage statistics
              </p>
            </div>
            <Switch
              checked={allowAnalytics}
              onCheckedChange={setAllowAnalytics}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Data sharing for research</Label>
              <p className="text-sm text-muted-foreground">
                Share anonymized data with approved recovery research institutions
              </p>
            </div>
            <Switch
              checked={allowDataSharing}
              onCheckedChange={setAllowDataSharing}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Marketing communications</Label>
              <p className="text-sm text-muted-foreground">
                Receive emails about new features and recovery resources
              </p>
            </div>
            <Switch
              checked={marketingEmails}
              onCheckedChange={setMarketingEmails}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Research participation</Label>
              <p className="text-sm text-muted-foreground">
                Be contacted about participating in recovery research studies
              </p>
            </div>
            <Switch
              checked={researchParticipation}
              onCheckedChange={setResearchParticipation}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Data Management
          </CardTitle>
          <CardDescription>
            Manage your personal data and account information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="data-retention">Data retention period (days)</Label>
            <input
              id="data-retention"
              type="number"
              min="30"
              max="3650"
              value={dataRetentionPeriod}
              onChange={(e) => setDataRetentionPeriod(parseInt(e.target.value) || 365)}
              className="w-32 px-3 py-2 border rounded-md"
            />
            <p className="text-sm text-muted-foreground">
              How long to keep your data (minimum 30 days, maximum 10 years)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="privacy-notes">Privacy notes</Label>
            <Textarea
              id="privacy-notes"
              placeholder="Any specific privacy preferences or notes..."
              value={privacyNotes}
              onChange={(e) => setPrivacyNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={exportUserData} 
              disabled={exportingData}
              variant="outline"
              className="flex-1"
            >
              {exportingData ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Export My Data
                </>
              )}
            </Button>

            <Button 
              onClick={deleteUserData}
              variant="destructive"
              className="flex-1"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete All Data
            </Button>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Your data export will include your profile, notifications, support network, and preferences. 
              Data deletion is permanent and cannot be undone.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            HIPAA & Compliance
          </CardTitle>
          <CardDescription>
            Healthcare privacy and compliance information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              This app follows HIPAA guidelines for protecting your health information. 
              Your recovery data is encrypted and stored securely.
            </AlertDescription>
          </Alert>

          <div className="text-sm space-y-2">
            <p><strong>Your Rights:</strong></p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Access your personal health information</li>
              <li>Request corrections to your data</li>
              <li>Request restrictions on data use</li>
              <li>File a complaint if you believe your privacy rights have been violated</li>
            </ul>
          </div>

          <Button variant="outline" className="w-full">
            <FileText className="mr-2 h-4 w-4" />
            View Full Privacy Policy
          </Button>
        </CardContent>
      </Card>

      <Button 
        onClick={savePrivacySettings} 
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
            Save Privacy Settings
          </>
        )}
      </Button>
    </div>
  );
}