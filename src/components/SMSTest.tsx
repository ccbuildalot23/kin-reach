import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ValidatedPhoneInput } from '@/components/PhoneInput';
import { useSMS, getSMSStatus } from '@/lib/sms';
import { formatPhoneForSMS } from '@/lib/phoneUtils';
import { useToast } from '@/hooks/use-toast';
import { Phone, MessageSquare, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

export function SMSTest() {
  const { send, isSending, lastResult, isTestMode, isApproved } = useSMS();
  const [testPhone, setTestPhone] = useState('');
  const [phoneValid, setPhoneValid] = useState(false);
  const [testMessage, setTestMessage] = useState('Test message from your Recovery App! 🎉');
  const [userId, setUserId] = useState('test-user-id');

  const smsStatus = getSMSStatus();
  const { toast } = useToast();

  const handleTest = async () => {
    if (!testPhone) {
      toast({
        title: 'Almost ready',
        description: 'We need a phone number to send to',
        className: 'bg-amber-100 text-amber-900 border-amber-200',
      });
      return;
    }

    if (!phoneValid) {
      toast({
        title: 'Let\'s check that number',
        description: 'The phone number needs to be in the right format',
        className: 'bg-amber-100 text-amber-900 border-amber-200',
      });
      return;
    }

    if (!testMessage) {
      toast({
        title: 'What would you like to say?',
        description: 'Add a message to send to your support',
        className: 'bg-amber-100 text-amber-900 border-amber-200',
      });
      return;
    }
    
    const smsFormat = formatPhoneForSMS(testPhone);
    const result = await send(smsFormat, testMessage, userId);
    
    if (result.success) {
      if (result.mock) {
        toast({
          title: '🧪 Test message sent',
          description: 'Your message was simulated successfully',
          className: 'bg-blue-100 text-blue-900 border-blue-200',
        });
      } else {
        toast({
          title: '💙 Message delivered',
          description: 'Your support has been notified',
          className: 'bg-green-100 text-green-900 border-green-200',
        });
      }
    } else {
      toast({
        title: 'Let\'s try again',
        description: result.error || 'Sometimes messages need a second attempt',
        className: 'bg-amber-100 text-amber-900 border-amber-200',
      });
    }
  };

  const getStatusBadge = () => {
    if (isApproved) {
      return <Badge variant="default" className="bg-green-600"><CheckCircle className="w-3 h-3 mr-1" />Live</Badge>;
    } else if (isTestMode) {
      return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Test Mode</Badge>;
    } else {
      return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Disabled</Badge>;
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            SMS Test
            {getStatusBadge()}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isApproved && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                A2P 10DLC approval pending. Currently in test mode - messages will be simulated.
              </AlertDescription>
            </Alert>
          )}

          <ValidatedPhoneInput
            value={testPhone}
            onChange={(value, isValid) => {
              setTestPhone(value);
              setPhoneValid(isValid);
            }}
            label="Phone Number"
            required={true}
            className="mt-1"
          />
          
          <div>
            <label className="text-sm font-medium">Test User ID</label>
            <Input
              type="text"
              placeholder="user-id-for-logging"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="mt-1"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">Message</label>
            <Textarea
              placeholder="Test message"
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              rows={3}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              {testMessage.length}/160 characters
            </p>
          </div>
          
          <Button 
            onClick={handleTest} 
            disabled={isSending}
            className="w-full"
          >
            <Phone className="w-4 h-4 mr-2" />
            {isSending ? 'Sending...' : isTestMode ? 'Send Test SMS (Mock)' : 'Send SMS'}
          </Button>
          
          {lastResult && (
            <div className={`text-center p-3 rounded-lg ${
              lastResult.success 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {lastResult.success ? (
                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    SMS sent successfully!
                  </div>
                  {lastResult.mock && (
                    <p className="text-sm">
                      🧪 Mock mode - check console for details
                    </p>
                  )}
                  {lastResult.messageId && (
                    <p className="text-xs font-mono">
                      ID: {lastResult.messageId}
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Message needs another try: {lastResult.error}
                </div>
              )}
            </div>
          )}

          <div className="text-xs text-gray-500 space-y-1">
            <p><strong>Status:</strong> {smsStatus.status}</p>
            <p><strong>Test Mode:</strong> {isTestMode ? 'Yes' : 'No'}</p>
            <p><strong>A2P Approved:</strong> {isApproved ? 'Yes' : 'No'}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Quick SMS status indicator component
export function SMSStatusIndicator() {
  const smsStatus = getSMSStatus();
  
  return (
    <div className="flex items-center gap-2 text-sm">
      <MessageSquare className="w-4 h-4" />
      <span>SMS:</span>
      {smsStatus.approved ? (
        <Badge variant="default" className="bg-green-600">Live</Badge>
      ) : (
        <Badge variant="secondary">Test Mode</Badge>
      )}
    </div>
  );
}