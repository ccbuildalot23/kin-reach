import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, Phone, MessageSquare, MapPin, Clock, Heart } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";

export function CrisisPreferences() {
  const [loading, setLoading] = useState(false);
  const [crisisSettings, setCrisisSettings] = useState({
    autoCallEmergency: false,
    emergencyDelay: 30,
    shareLocation: true,
    preferredContact: 'text',
    crisisMessage: "I'm having a crisis and need help. Please reach out to me.",
    safeWords: [],
    autoNotifyNetwork: true,
    includeVitalInfo: true,
    medicalInfo: '',
    emergencyContacts: [],
  });
  const [newSafeWord, setNewSafeWord] = useState('');
  const [newEmergencyContact, setNewEmergencyContact] = useState({ name: '', phone: '' });
  const { toast } = useToast();

  useEffect(() => {
    loadCrisisSettings();
  }, []);

  async function loadCrisisSettings() {
    try {
      const savedSettings = localStorage.getItem('crisis-settings');
      if (savedSettings) {
        setCrisisSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Error loading crisis settings:', error);
    }
  }

  async function saveCrisisSettings() {
    setLoading(true);
    try {
      localStorage.setItem('crisis-settings', JSON.stringify(crisisSettings));
      toast({
        title: "Crisis preferences saved",
        description: "Your emergency settings have been updated",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save crisis preferences",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const addSafeWord = () => {
    if (newSafeWord.trim()) {
      setCrisisSettings({
        ...crisisSettings,
        safeWords: [...crisisSettings.safeWords, newSafeWord.trim()]
      });
      setNewSafeWord('');
    }
  };

  const removeSafeWord = (index: number) => {
    setCrisisSettings({
      ...crisisSettings,
      safeWords: crisisSettings.safeWords.filter((_, i) => i !== index)
    });
  };

  const addEmergencyContact = () => {
    if (newEmergencyContact.name && newEmergencyContact.phone) {
      setCrisisSettings({
        ...crisisSettings,
        emergencyContacts: [...crisisSettings.emergencyContacts, newEmergencyContact]
      });
      setNewEmergencyContact({ name: '', phone: '' });
    }
  };

  const removeEmergencyContact = (index: number) => {
    setCrisisSettings({
      ...crisisSettings,
      emergencyContacts: crisisSettings.emergencyContacts.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Crisis Alert Settings
          </CardTitle>
          <CardDescription>
            Configure how crisis alerts work for you
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-notify">Auto-Notify Support Network</Label>
              <p className="text-sm text-muted-foreground">
                Automatically alert your support network during a crisis
              </p>
            </div>
            <Switch
              id="auto-notify"
              checked={crisisSettings.autoNotifyNetwork}
              onCheckedChange={(checked) =>
                setCrisisSettings({ ...crisisSettings, autoNotifyNetwork: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="share-location">Share Location</Label>
              <p className="text-sm text-muted-foreground">
                Include your location in crisis alerts
              </p>
            </div>
            <Switch
              id="share-location"
              checked={crisisSettings.shareLocation}
              onCheckedChange={(checked) =>
                setCrisisSettings({ ...crisisSettings, shareLocation: checked })
              }
            />
          </div>

          <div className="space-y-3">
            <Label>Preferred Contact Method</Label>
            <RadioGroup
              value={crisisSettings.preferredContact}
              onValueChange={(value) =>
                setCrisisSettings({ ...crisisSettings, preferredContact: value })
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="text" id="text" />
                <Label htmlFor="text" className="flex items-center gap-2 cursor-pointer">
                  <MessageSquare className="h-4 w-4" />
                  Text Message
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="call" id="call" />
                <Label htmlFor="call" className="flex items-center gap-2 cursor-pointer">
                  <Phone className="h-4 w-4" />
                  Phone Call
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="both" id="both" />
                <Label htmlFor="both" className="cursor-pointer">
                  Both
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <Label htmlFor="crisis-message">Default Crisis Message</Label>
            <Textarea
              id="crisis-message"
              value={crisisSettings.crisisMessage}
              onChange={(e) =>
                setCrisisSettings({ ...crisisSettings, crisisMessage: e.target.value })
              }
              placeholder="Message sent during crisis alerts..."
              className="min-h-[100px]"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Safe Words
          </CardTitle>
          <CardDescription>
            Words or phrases that indicate you need help
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newSafeWord}
              onChange={(e) => setNewSafeWord(e.target.value)}
              placeholder="Add a safe word..."
              onKeyPress={(e) => e.key === 'Enter' && addSafeWord()}
            />
            <Button onClick={addSafeWord} size="sm">Add</Button>
          </div>
          <div className="space-y-2">
            {crisisSettings.safeWords.map((word, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                <span>{word}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeSafeWord(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Emergency Contacts
          </CardTitle>
          <CardDescription>
            Additional emergency contacts (outside support network)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Input
              value={newEmergencyContact.name}
              onChange={(e) => setNewEmergencyContact({ ...newEmergencyContact, name: e.target.value })}
              placeholder="Contact name"
            />
            <Input
              value={newEmergencyContact.phone}
              onChange={(e) => setNewEmergencyContact({ ...newEmergencyContact, phone: e.target.value })}
              placeholder="Phone number"
              type="tel"
            />
            <Button onClick={addEmergencyContact} className="w-full" size="sm">
              Add Emergency Contact
            </Button>
          </div>
          <div className="space-y-2">
            {crisisSettings.emergencyContacts.map((contact, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded">
                <div>
                  <p className="font-medium">{contact.name}</p>
                  <p className="text-sm text-muted-foreground">{contact.phone}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeEmergencyContact(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Auto-Emergency Settings
          </CardTitle>
          <CardDescription>
            Configure automatic emergency responses
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-call">Auto-Call Emergency Services</Label>
              <p className="text-sm text-muted-foreground">
                Automatically call 911 after countdown
              </p>
            </div>
            <Switch
              id="auto-call"
              checked={crisisSettings.autoCallEmergency}
              onCheckedChange={(checked) =>
                setCrisisSettings({ ...crisisSettings, autoCallEmergency: checked })
              }
            />
          </div>

          {crisisSettings.autoCallEmergency && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="delay">Emergency Call Delay</Label>
                <span className="text-sm text-muted-foreground">
                  {crisisSettings.emergencyDelay} seconds
                </span>
              </div>
              <Slider
                id="delay"
                min={10}
                max={120}
                step={10}
                value={[crisisSettings.emergencyDelay]}
                onValueChange={([value]) =>
                  setCrisisSettings({ ...crisisSettings, emergencyDelay: value })
                }
                className="w-full"
              />
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="vital-info">Include Vital Information</Label>
              <p className="text-sm text-muted-foreground">
                Share medical info with emergency responders
              </p>
            </div>
            <Switch
              id="vital-info"
              checked={crisisSettings.includeVitalInfo}
              onCheckedChange={(checked) =>
                setCrisisSettings({ ...crisisSettings, includeVitalInfo: checked })
              }
            />
          </div>

          {crisisSettings.includeVitalInfo && (
            <div className="space-y-3">
              <Label htmlFor="medical-info">Medical Information</Label>
              <Textarea
                id="medical-info"
                value={crisisSettings.medicalInfo}
                onChange={(e) =>
                  setCrisisSettings({ ...crisisSettings, medicalInfo: e.target.value })
                }
                placeholder="Allergies, medications, conditions..."
                className="min-h-[100px]"
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Button onClick={saveCrisisSettings} disabled={loading} className="w-full">
        Save Crisis Preferences
      </Button>
    </div>
  );
}