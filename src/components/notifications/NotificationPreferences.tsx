import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell } from "lucide-react";
import { useState } from "react";

export function NotificationPreferences() {
  const [inAppEnabled, setInAppEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [crisisAlerts, setCrisisAlerts] = useState(true);
  const [checkIns, setCheckIns] = useState(true);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Preferences
        </CardTitle>
        <CardDescription>
          Choose how you'd like to receive notifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h4 className="font-medium">Delivery Methods</h4>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>In-app notifications</Label>
              <p className="text-sm text-muted-foreground">
                Show notifications within the app
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
        </div>

        <div className="space-y-4">
          <h4 className="font-medium">Notification Types</h4>
          
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
              <Label>Check-in reminders</Label>
              <p className="text-sm text-muted-foreground">
                Daily reminders to complete your check-in
              </p>
            </div>
            <Switch
              checked={checkIns}
              onCheckedChange={setCheckIns}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}