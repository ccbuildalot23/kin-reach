import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { Palette, Type, Accessibility, Sun, Moon, Contrast } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export function AppearanceSettings() {
  const [loading, setLoading] = useState(false);
  const [appearanceSettings, setAppearanceSettings] = useState({
    theme: 'system',
    fontSize: 16,
    reduceMotion: false,
    highContrast: false,
    colorBlindMode: 'none',
    showAnimations: true,
  });
  const { toast } = useToast();

  useEffect(() => {
    loadAppearanceSettings();
  }, []);

  useEffect(() => {
    // Apply settings to document
    document.documentElement.style.fontSize = `${appearanceSettings.fontSize}px`;
    document.documentElement.classList.toggle('reduce-motion', appearanceSettings.reduceMotion);
    document.documentElement.classList.toggle('high-contrast', appearanceSettings.highContrast);
    
    // Apply theme
    if (appearanceSettings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (appearanceSettings.theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // System preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', prefersDark);
    }
  }, [appearanceSettings]);

  async function loadAppearanceSettings() {
    try {
      const savedSettings = localStorage.getItem('appearance-settings');
      if (savedSettings) {
        setAppearanceSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Error loading appearance settings:', error);
    }
  }

  async function saveAppearanceSettings() {
    setLoading(true);
    try {
      localStorage.setItem('appearance-settings', JSON.stringify(appearanceSettings));
      toast({
        title: "Appearance updated",
        description: "Your appearance preferences have been saved",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save appearance settings",
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
            <Palette className="h-5 w-5" />
            Theme & Colors
          </CardTitle>
          <CardDescription>
            Customize the look and feel of the app
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label>Theme</Label>
            <RadioGroup
              value={appearanceSettings.theme}
              onValueChange={(value) =>
                setAppearanceSettings({ ...appearanceSettings, theme: value })
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="light" id="light" />
                <Label htmlFor="light" className="flex items-center gap-2 cursor-pointer">
                  <Sun className="h-4 w-4" />
                  Light
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="dark" id="dark" />
                <Label htmlFor="dark" className="flex items-center gap-2 cursor-pointer">
                  <Moon className="h-4 w-4" />
                  Dark
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="system" id="system" />
                <Label htmlFor="system" className="cursor-pointer">
                  System Default
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="high-contrast">High Contrast</Label>
              <p className="text-sm text-muted-foreground">
                Increase contrast for better visibility
              </p>
            </div>
            <Switch
              id="high-contrast"
              checked={appearanceSettings.highContrast}
              onCheckedChange={(checked) =>
                setAppearanceSettings({ ...appearanceSettings, highContrast: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="h-5 w-5" />
            Text & Display
          </CardTitle>
          <CardDescription>
            Adjust text size and display options
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="font-size">Font Size</Label>
              <span className="text-sm text-muted-foreground">
                {appearanceSettings.fontSize}px
              </span>
            </div>
            <Slider
              id="font-size"
              min={12}
              max={24}
              step={1}
              value={[appearanceSettings.fontSize]}
              onValueChange={([value]) =>
                setAppearanceSettings({ ...appearanceSettings, fontSize: value })
              }
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Small</span>
              <span>Default</span>
              <span>Large</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Accessibility className="h-5 w-5" />
            Accessibility
          </CardTitle>
          <CardDescription>
            Options to make the app easier to use
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="reduce-motion">Reduce Motion</Label>
              <p className="text-sm text-muted-foreground">
                Minimize animations and transitions
              </p>
            </div>
            <Switch
              id="reduce-motion"
              checked={appearanceSettings.reduceMotion}
              onCheckedChange={(checked) =>
                setAppearanceSettings({ ...appearanceSettings, reduceMotion: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="show-animations">Show Animations</Label>
              <p className="text-sm text-muted-foreground">
                Enable decorative animations
              </p>
            </div>
            <Switch
              id="show-animations"
              checked={appearanceSettings.showAnimations}
              onCheckedChange={(checked) =>
                setAppearanceSettings({ ...appearanceSettings, showAnimations: checked })
              }
            />
          </div>

          <div className="space-y-3">
            <Label>Color Blind Mode</Label>
            <RadioGroup
              value={appearanceSettings.colorBlindMode}
              onValueChange={(value) =>
                setAppearanceSettings({ ...appearanceSettings, colorBlindMode: value })
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="none" id="cb-none" />
                <Label htmlFor="cb-none" className="cursor-pointer">
                  None
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="protanopia" id="protanopia" />
                <Label htmlFor="protanopia" className="cursor-pointer">
                  Protanopia (Red-blind)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="deuteranopia" id="deuteranopia" />
                <Label htmlFor="deuteranopia" className="cursor-pointer">
                  Deuteranopia (Green-blind)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="tritanopia" id="tritanopia" />
                <Label htmlFor="tritanopia" className="cursor-pointer">
                  Tritanopia (Blue-blind)
                </Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      <Button onClick={saveAppearanceSettings} disabled={loading} className="w-full">
        Save Appearance Settings
      </Button>
    </div>
  );
}