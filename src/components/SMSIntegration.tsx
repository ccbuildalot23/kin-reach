import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useSMS, getSMSStatus } from '@/lib/sms';
import { toast } from 'sonner';
import { 
  Settings, 
  MessageSquare, 
  Users, 
  Bell, 
  CheckCircle, 
  AlertTriangle,
  Phone,
  Clock,
  Database 
} from 'lucide-react';

interface SMSIntegrationProps {
  userId: string;
}

export function SMSIntegration({ userId }: SMSIntegrationProps) {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [emergencyContacts, setEmergencyContacts] = useState<any[]>([]);
  const [notificationPrefs, setNotificationPrefs] = useState<any>(null);
  const [recentAlerts, setRecentAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { sendNotification, isSending } = useSMS();
  const smsStatus = getSMSStatus();

  useEffect(() => {
    fetchUserData();
    fetchEmergencyContacts();
    fetchNotificationPrefs();
    fetchRecentAlerts();
  }, [userId]);

  const fetchUserData = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    setUserProfile(data);
  };

  const fetchEmergencyContacts = async () => {
    const { data } = await supabase
      .from('crisis_contacts')
      .select('*')
      .eq('user_id', userId)
      .order('priority_order', { ascending: true });
    
    setEmergencyContacts(data || []);
  };

  const fetchNotificationPrefs = async () => {
    const { data } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    setNotificationPrefs(data);
    setLoading(false);
  };

  const fetchRecentAlerts = async () => {
    const { data } = await supabase
      .from('crisis_alerts')
      .select('*')
      .eq('user_id', userId)
      .order('alert_time', { ascending: false })
      .limit(5);
    
    setRecentAlerts(data || []);
  };

  const updateSMSPreference = async (enabled: boolean) => {
    const currentChannels = notificationPrefs?.system_channels || {};
    const updatedChannels = { ...currentChannels, sms: enabled };

    const { error } = await supabase
      .from('notification_preferences')
      .upsert({
        user_id: userId,
        system_channels: updatedChannels,
        updated_at: new Date().toISOString()
      });

    if (!error) {
      setNotificationPrefs(prev => ({
        ...prev,
        system_channels: updatedChannels
      }));
      toast.success(`SMS notifications ${enabled ? 'enabled' : 'disabled'}`);
    } else {
      toast.error('Failed to update SMS preferences');
    }
  };

  const sendTestNotification = async () => {
    const testMessage = "This is a test notification from your Recovery App. Your SMS system is working correctly! 🎉";
    
    const result = await sendNotification(userId, testMessage, 'test');
    
    if (result.success) {
      toast.success('Test notification sent successfully!');
    } else {
      toast.error(`Test notification failed: ${(result as any).error || (result as any).reason || 'Unknown error'}`);
    }
  };

  const processNotificationQueue = async () => {
    // Process pending SMS notifications from your notification_queue
    const { data: pending } = await supabase
      .from('notification_queue')
      .select('*')
      .eq('channel', 'sms')
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString())
      .limit(10);

    if (pending?.length) {
      toast.info(`Processing ${pending.length} pending SMS notifications...`);
      
      for (const notification of pending) {
        try {
          const result = await sendNotification(
            notification.user_id,
            notification.body,
            'queued'
          );

          // Update status
          await supabase
            .from('notification_queue')
            .update({
              status: result.success ? 'sent' : 'failed',
              sent_at: result.success ? new Date().toISOString() : null,
              error_message: result.success ? null : (result as any).error || (result as any).reason || 'Unknown error'
            })
            .eq('id', notification.id);

        } catch (error) {
          console.error('Queue processing error:', error);
        }
      }
      
      toast.success('Notification queue processed');
    } else {
      toast.info('No pending SMS notifications');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 animate-spin" />
            Loading SMS integration...
          </div>
        </CardContent>
      </Card>
    );
  }

  const smsEnabled = notificationPrefs?.system_channels?.sms || false;

  return (
    <div className="space-y-4">
      {/* SMS Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            SMS Integration Status
            {smsStatus.approved ? (
              <Badge variant="default" className="bg-green-600">Live</Badge>
            ) : (
              <Badge variant="secondary">Test Mode</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!smsStatus.approved && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                A2P 10DLC registration pending. SMS functionality is in test mode - messages are simulated.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Status:</span>
              <p className="font-medium">{smsStatus.status.replace('_', ' ')}</p>
            </div>
            <div>
              <span className="text-gray-500">Test Mode:</span>
              <p className="font-medium">{smsStatus.testMode ? 'Yes' : 'No'}</p>
            </div>
            <div>
              <span className="text-gray-500">User Preference:</span>
              <p className="font-medium">{smsEnabled ? 'Enabled' : 'Disabled'}</p>
            </div>
            <div>
              <span className="text-gray-500">Emergency Contacts:</span>
              <p className="font-medium">{emergencyContacts.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User SMS Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            SMS Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Enable SMS Notifications</p>
              <p className="text-sm text-gray-500">
                Receive wellness checks, reminders, and crisis support via SMS
              </p>
            </div>
            <Switch
              checked={smsEnabled}
              onCheckedChange={updateSMSPreference}
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={sendTestNotification}
              disabled={isSending || !smsEnabled}
              variant="outline"
              size="sm"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              {isSending ? 'Sending...' : 'Send Test Message'}
            </Button>

            <Button
              onClick={processNotificationQueue}
              variant="outline"
              size="sm"
            >
              <Database className="w-4 h-4 mr-2" />
              Process Queue
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Contacts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Emergency Contacts
            <Badge variant="outline">{emergencyContacts.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {emergencyContacts.length > 0 ? (
            <div className="space-y-2">
              {emergencyContacts.map((contact, index) => (
                <div key={contact.id} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <p className="font-medium">{contact.name}</p>
                    <p className="text-sm text-gray-500">
                      {contact.relationship} • {contact.phone_number}
                    </p>
                  </div>
                  <Badge variant="outline">Priority {index + 1}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No emergency contacts configured. Add contacts to enable crisis alerts.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Recent Crisis Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Recent Crisis Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentAlerts.length > 0 ? (
            <div className="space-y-2">
              {recentAlerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <p className="text-sm">
                      {new Date(alert.alert_time).toLocaleDateString()} at{' '}
                      {new Date(alert.alert_time).toLocaleTimeString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {alert.contacts_notified} contacts notified
                    </p>
                  </div>
                  <Badge variant={alert.status === 'sent' ? 'default' : 'destructive'}>
                    {alert.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No recent crisis alerts</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Quick setup component for new users
export function SMSQuickSetup({ userId }: { userId: string }) {
  const [step, setStep] = useState(1);
  const [contacts, setContacts] = useState([{ name: '', phone: '', relationship: '' }]);

  const addContact = () => {
    setContacts([...contacts, { name: '', phone: '', relationship: '' }]);
  };

  const updateContact = (index: number, field: string, value: string) => {
    const updated = [...contacts];
    updated[index] = { ...updated[index], [field]: value };
    setContacts(updated);
  };

  const saveContacts = async () => {
    const validContacts = contacts.filter(c => c.name && c.phone);
    
    const contactsToInsert = validContacts.map((contact, index) => ({
      user_id: userId,
      name: contact.name,
      phone_number: contact.phone,
      relationship: contact.relationship,
      priority_order: index + 1,
      created_at: new Date().toISOString()
    }));

    const { error } = await supabase
      .from('crisis_contacts')
      .insert(contactsToInsert);

    if (!error) {
      toast.success('Emergency contacts saved!');
      setStep(3);
    } else {
      toast.error('Failed to save contacts');
    }
  };

  const enableSMSNotifications = async () => {
    const { error } = await supabase
      .from('notification_preferences')
      .upsert({
        user_id: userId,
        system_channels: { sms: true, email: true, push: true },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (!error) {
      toast.success('SMS notifications enabled!');
      setStep(4);
    } else {
      toast.error('Failed to enable SMS');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>SMS Setup Wizard</CardTitle>
      </CardHeader>
      <CardContent>
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="font-medium">Welcome to SMS Integration</h3>
            <p className="text-sm text-gray-600">
              Set up SMS notifications for wellness checks, reminders, and crisis support.
            </p>
            <Button onClick={() => setStep(2)}>Get Started</Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h3 className="font-medium">Add Emergency Contacts</h3>
            {contacts.map((contact, index) => (
              <div key={index} className="grid grid-cols-3 gap-2">
                <input
                  placeholder="Name"
                  value={contact.name}
                  onChange={(e) => updateContact(index, 'name', e.target.value)}
                  className="p-2 border rounded"
                />
                <input
                  placeholder="Phone"
                  value={contact.phone}
                  onChange={(e) => updateContact(index, 'phone', e.target.value)}
                  className="p-2 border rounded"
                />
                <input
                  placeholder="Relationship"
                  value={contact.relationship}
                  onChange={(e) => updateContact(index, 'relationship', e.target.value)}
                  className="p-2 border rounded"
                />
              </div>
            ))}
            <div className="flex gap-2">
              <Button onClick={addContact} variant="outline" size="sm">
                Add Contact
              </Button>
              <Button onClick={saveContacts} disabled={!contacts[0].name}>
                Save & Continue
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h3 className="font-medium">Enable SMS Notifications</h3>
            <p className="text-sm text-gray-600">
              Allow the app to send you wellness check-ins and crisis support via SMS.
            </p>
            <Button onClick={enableSMSNotifications}>Enable SMS</Button>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4 text-center">
            <CheckCircle className="w-8 h-8 text-green-600 mx-auto" />
            <h3 className="font-medium">SMS Setup Complete!</h3>
            <p className="text-sm text-gray-600">
              Your SMS integration is ready. You can now receive notifications and send crisis alerts.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}