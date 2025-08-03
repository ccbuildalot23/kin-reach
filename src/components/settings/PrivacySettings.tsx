import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Shield } from "lucide-react";
import { useState } from "react";

export function PrivacySettings() {
  const [isSearchable, setIsSearchable] = useState(false);
  const [allowContact, setAllowContact] = useState(false);
  const [profileVisible, setProfileVisible] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Privacy & Visibility
        </CardTitle>
        <CardDescription>
          Control who can see your information and contact you
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Allow others to find me</Label>
            <p className="text-sm text-muted-foreground">
              Let other users discover your profile
            </p>
          </div>
          <Switch
            checked={isSearchable}
            onCheckedChange={setIsSearchable}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Allow contact requests</Label>
            <p className="text-sm text-muted-foreground">
              Let users send you support requests
            </p>
          </div>
          <Switch
            checked={allowContact}
            onCheckedChange={setAllowContact}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Public profile</Label>
            <p className="text-sm text-muted-foreground">
              Make your profile visible to all users
            </p>
          </div>
          <Switch
            checked={profileVisible}
            onCheckedChange={setProfileVisible}
          />
        </div>
      </CardContent>
    </Card>
  );
}