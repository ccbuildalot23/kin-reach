import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import { useSMS, sendCrisisAlert } from '@/lib/sms';
import { toast } from 'sonner';

export function SMSTest() {
  const { send, isSending, lastResult } = useSMS();
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('Test message from your Recovery App! 🎉');

  const handleTest = async () => {
    if (!testPhone) {
      toast.error('Please enter a phone number');
      return;
    }
    
    if (!testMessage) {
      toast.error('Please enter a message');
      return;
    }
    
    const success = await send(testPhone, testMessage);
    if (success) {
      toast.success('✅ Test SMS sent successfully!');
    } else {
      toast.error('❌ Test SMS failed - check console for details');
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>🧪 SMS Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium">Phone Number</label>
          <Input
            type="tel"
            placeholder="+1234567890"
            value={testPhone}
            onChange={(e) => setTestPhone(e.target.value)}
          />
        </div>
        
        <div>
          <label className="text-sm font-medium">Message</label>
          <Textarea
            placeholder="Test message"
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            rows={3}
          />
        </div>
        
        <Button 
          onClick={handleTest} 
          disabled={isSending}
          className="w-full"
        >
          {isSending ? 'Sending...' : 'Send Test SMS'}
        </Button>
        
        {lastResult !== null && (
          <div className={`text-center p-2 rounded ${lastResult ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {lastResult ? '✅ SMS sent successfully!' : '❌ SMS failed'}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Crisis Button Component (add this to your crisis-related pages)
interface CrisisButtonProps {
  userId: string;
}

export function CrisisButton({ userId }: CrisisButtonProps) {
  const [isSending, setIsSending] = useState(false);

  const handleCrisisAlert = async () => {
    const confirmed = window.confirm(
      '🚨 This will send a crisis alert to ALL your emergency contacts. Are you sure you want to continue?'
    );
    
    if (confirmed) {
      setIsSending(true);
      try {
        const success = await sendCrisisAlert(userId);
        
        if (success) {
          toast.success('Crisis alert sent to your emergency contacts');
        } else {
          toast.error('Failed to send crisis alert. Please call 911 if this is an emergency.');
        }
      } finally {
        setIsSending(false);
      }
    }
  };

  return (
    <Button 
      onClick={handleCrisisAlert}
      disabled={isSending}
      variant="destructive"
      size="lg"
      className="w-full"
    >
      <AlertTriangle className="mr-2 h-5 w-5" />
      {isSending ? 'Sending Alert...' : '🚨 Crisis Alert'}
    </Button>
  );
}