import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Shield, Search, Eye } from "lucide-react";

export function PrivacySettings() {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    is_searchable: true,
    allow_contact_from: 'connections',
    profile_visibility: 'connections'
  });
  const { toast } = useToast();

  useEffect(() => {
    loadPrivacySettings();
  }, []);

  async function loadPrivacySettings() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('is_searchable, allow_contact_from, profile_visibility')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setSettings({
          is_searchable: data.is_searchable ?? true,
          allow_contact_from: data.allow_contact_from || 'connections',
          profile_visibility: data.profile_visibility || 'connections'
        });
      }
    } catch (error) {
      console.error('Error loading privacy settings:', error);
    }
  }

  async function updatePrivacySettings() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update({
          is_searchable: settings.is_searchable,
          allow_contact_from: settings.allow_contact_from,
          profile_visibility: settings.profile_visibility,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Privacy settings updated"
      });
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      toast({
        title: "Error",
        description: "Failed to update privacy settings",
        variant: "destructive"
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
            <Search className="h-5 w-5" />
            Discoverability
          </CardTitle>
          <CardDescription>
            Control how other users can find you
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="searchable">Make profile searchable</Label>
              <p className="text-sm text-muted-foreground">
                Allow others to find you by phone number or email
              </p>
            </div>
            <Switch
              id="searchable"
              checked={settings.is_searchable}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, is_searchable: checked }))
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Contact Preferences
          </CardTitle>
          <CardDescription>
            Choose who can send you messages and notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={settings.allow_contact_from}
            onValueChange={(value) => 
              setSettings(prev => ({ ...prev, allow_contact_from: value }))
            }
          >
            <div className="flex items-center space-x-2 py-2">
              <RadioGroupItem value="everyone" id="everyone" />
              <Label htmlFor="everyone" className="flex-1 cursor-pointer">
                <div>Everyone</div>
                <p className="text-sm text-muted-foreground">
                  Any user can send you messages
                </p>
              </Label>
            </div>
            <div className="flex items-center space-x-2 py-2">
              <RadioGroupItem value="connections" id="connections" />
              <Label htmlFor="connections" className="flex-1 cursor-pointer">
                <div>Connections only</div>
                <p className="text-sm text-muted-foreground">
                  Only your support network and accountability partners
                </p>
              </Label>
            </div>
            <div className="flex items-center space-x-2 py-2">
              <RadioGroupItem value="nobody" id="nobody" />
              <Label htmlFor="nobody" className="flex-1 cursor-pointer">
                <div>Nobody</div>
                <p className="text-sm text-muted-foreground">
                  No one can send you messages (except crisis alerts)
                </p>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Profile Visibility
          </CardTitle>
          <CardDescription>
            Control who can see your full profile
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={settings.profile_visibility}
            onValueChange={(value) => 
              setSettings(prev => ({ ...prev, profile_visibility: value }))
            }
          >
            <div className="flex items-center space-x-2 py-2">
              <RadioGroupItem value="public" id="public" />
              <Label htmlFor="public" className="flex-1 cursor-pointer">
                <div>Public</div>
                <p className="text-sm text-muted-foreground">
                  Anyone can view your profile
                </p>
              </Label>
            </div>
            <div className="flex items-center space-x-2 py-2">
              <RadioGroupItem value="connections" id="connections-vis" />
              <Label htmlFor="connections-vis" className="flex-1 cursor-pointer">
                <div>Connections only</div>
                <p className="text-sm text-muted-foreground">
                  Only your connections can see your full profile
                </p>
              </Label>
            </div>
            <div className="flex items-center space-x-2 py-2">
              <RadioGroupItem value="private" id="private" />
              <Label htmlFor="private" className="flex-1 cursor-pointer">
                <div>Private</div>
                <p className="text-sm text-muted-foreground">
                  Only you can see your profile
                </p>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <Button onClick={updatePrivacySettings} disabled={loading} className="w-full">
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          "Save Privacy Settings"
        )}
      </Button>
    </div>
  );
}

