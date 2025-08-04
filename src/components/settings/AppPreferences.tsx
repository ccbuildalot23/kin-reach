import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { 
  Palette, 
  Volume2, 
  Moon, 
  Sun, 
  Globe, 
  Accessibility,
  Smartphone,
  Save,
  Loader2,
  Eye,
  Vibrate
} from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export function AppPreferences() {
  const [theme, setTheme] = useState('auto');
  const [language, setLanguage] = useState('en');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hapticFeedback, setHapticFeedback] = useState(true);
  const [highContrast, setHighContrast] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [autoSave, setAutoSave] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);
  const [backgroundSync, setBackgroundSync] = useState(true);
  const [dataCompression, setDataCompression] = useState(true);
  const [cacheDuration, setCacheDuration] = useState(7);
  const [soundVolume, setSoundVolume] = useState([50]);
  const [notificationVolume, setNotificationVolume] = useState([75]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (isAuthenticated && user) {
      loadAppPreferences();
    }
  }, [isAuthenticated, user]);

  const loadAppPreferences = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_app_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading app preferences:', error);
        return;
      }

      if (data) {
        setTheme(data.theme ?? 'auto');
        setLanguage(data.language ?? 'en');
        setSoundEnabled(data.sound_enabled ?? true);
        setHapticFeedback(data.haptic_feedback ?? true);
        setHighContrast(data.high_contrast ?? false);
        setLargeText(data.large_text ?? false);
        setReducedMotion(data.reduced_motion ?? false);
        setAutoSave(data.auto_save ?? true);
        setOfflineMode(data.offline_mode ?? false);
        setBackgroundSync(data.background_sync ?? true);
        setDataCompression(data.data_compression ?? true);
        setCacheDuration(data.cache_duration_days ?? 7);
        setSoundVolume([data.sound_volume ?? 50]);
        setNotificationVolume([data.notification_volume ?? 75]);
      }
    } catch (error) {
      console.error('Error in loadAppPreferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveAppPreferences = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const preferences = {
        user_id: user.id,
        theme: theme,
        language: language,
        sound_enabled: soundEnabled,
        haptic_feedback: hapticFeedback,
        high_contrast: highContrast,
        large_text: largeText,
        reduced_motion: reducedMotion,
        auto_save: autoSave,
        offline_mode: offlineMode,
        background_sync: backgroundSync,
        data_compression: dataCompression,
        cache_duration_days: cacheDuration,
        sound_volume: soundVolume[0],
        notification_volume: notificationVolume[0],
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('user_app_preferences')
        .upsert(preferences, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error saving app preferences:', error);
        toast({
          title: 'Error',
          description: 'Failed to save app preferences',
          variant: 'destructive',
        });
        return;
      }

      // Apply theme changes immediately
      applyThemeChanges();

      toast({
        title: 'Success',
        description: 'App preferences updated successfully',
      });
    } catch (error) {
      console.error('Error in saveAppPreferences:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const applyThemeChanges = () => {
    const root = document.documentElement;
    
    // Apply theme
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      // Auto theme based on system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }

    // Apply accessibility settings
    if (highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    if (largeText) {
      root.classList.add('large-text');
    } else {
      root.classList.remove('large-text');
    }

    if (reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }
  };

  const resetToDefaults = () => {
    setTheme('auto');
    setLanguage('en');
    setSoundEnabled(true);
    setHapticFeedback(true);
    setHighContrast(false);
    setLargeText(false);
    setReducedMotion(false);
    setAutoSave(true);
    setOfflineMode(false);
    setBackgroundSync(true);
    setDataCompression(true);
    setCacheDuration(7);
    setSoundVolume([50]);
    setNotificationVolume([75]);

    toast({
      title: 'Settings Reset',
      description: 'App preferences have been reset to defaults',
    });
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
            <Palette className="h-5 w-5" />
            Appearance
          </CardTitle>
          <CardDescription>
            Customize how the app looks and feels
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="theme">Theme</Label>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger>
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    Auto (follow system)
                  </div>
                </SelectItem>
                <SelectItem value="light">
                  <div className="flex items-center gap-2">
                    <Sun className="h-4 w-4" />
                    Light
                  </div>
                </SelectItem>
                <SelectItem value="dark">
                  <div className="flex items-center gap-2">
                    <Moon className="h-4 w-4" />
                    Dark
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="language">Language</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger>
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Español</SelectItem>
                <SelectItem value="fr">Français</SelectItem>
                <SelectItem value="de">Deutsch</SelectItem>
                <SelectItem value="pt">Português</SelectItem>
                <SelectItem value="zh">中文</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            Audio & Haptics
          </CardTitle>
          <CardDescription>
            Control sound and vibration settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Sound effects</Label>
              <p className="text-sm text-muted-foreground">
                Play sounds for app interactions
              </p>
            </div>
            <Switch
              checked={soundEnabled}
              onCheckedChange={setSoundEnabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Haptic feedback</Label>
              <p className="text-sm text-muted-foreground">
                Vibrate for button presses and notifications
              </p>
            </div>
            <Switch
              checked={hapticFeedback}
              onCheckedChange={setHapticFeedback}
            />
          </div>

          {soundEnabled && (
            <>
              <div className="space-y-2">
                <Label>Sound volume: {soundVolume[0]}%</Label>
                <Slider
                  value={soundVolume}
                  onValueChange={setSoundVolume}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label>Notification volume: {notificationVolume[0]}%</Label>
                <Slider
                  value={notificationVolume}
                  onValueChange={setNotificationVolume}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Accessibility className="h-5 w-5" />
            Accessibility
          </CardTitle>
          <CardDescription>
            Options to make the app more accessible
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>High contrast mode</Label>
              <p className="text-sm text-muted-foreground">
                Increase contrast for better visibility
              </p>
            </div>
            <Switch
              checked={highContrast}
              onCheckedChange={setHighContrast}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Large text</Label>
              <p className="text-sm text-muted-foreground">
                Increase text size throughout the app
              </p>
            </div>
            <Switch
              checked={largeText}
              onCheckedChange={setLargeText}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Reduced motion</Label>
              <p className="text-sm text-muted-foreground">
                Minimize animations and transitions
              </p>
            </div>
            <Switch
              checked={reducedMotion}
              onCheckedChange={setReducedMotion}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            App Behavior
          </CardTitle>
          <CardDescription>
            Configure how the app saves and syncs your data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto-save changes</Label>
              <p className="text-sm text-muted-foreground">
                Automatically save your changes as you type
              </p>
            </div>
            <Switch
              checked={autoSave}
              onCheckedChange={setAutoSave}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Offline mode</Label>
              <p className="text-sm text-muted-foreground">
                Continue using the app without internet connection
              </p>
            </div>
            <Switch
              checked={offlineMode}
              onCheckedChange={setOfflineMode}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Background sync</Label>
              <p className="text-sm text-muted-foreground">
                Sync data when the app is not active
              </p>
            </div>
            <Switch
              checked={backgroundSync}
              onCheckedChange={setBackgroundSync}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Data compression</Label>
              <p className="text-sm text-muted-foreground">
                Compress data to reduce bandwidth usage
              </p>
            </div>
            <Switch
              checked={dataCompression}
              onCheckedChange={setDataCompression}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cache-duration">Cache duration: {cacheDuration} days</Label>
            <Slider
              value={[cacheDuration]}
              onValueChange={(value) => setCacheDuration(value[0])}
              min={1}
              max={30}
              step={1}
              className="w-full"
            />
            <p className="text-sm text-muted-foreground">
              How long to keep app data cached locally
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button 
          onClick={saveAppPreferences} 
          disabled={saving}
          className="flex-1 bg-purple-600 hover:bg-purple-700"
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

        <Button 
          onClick={resetToDefaults}
          variant="outline"
          className="flex-1"
        >
          Reset to Defaults
        </Button>
      </div>
    </div>
  );
}