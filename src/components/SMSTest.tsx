import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSMS, formatPhoneNumber, validatePhoneNumber, getSMSStatus } from '@/lib/sms';
import { toast } from 'sonner';
import { Phone, MessageSquare, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

export function SMSTest() {
  const { send, isSending, lastResult, isTestMode, isApproved } = useSMS();
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('Test message from your Recovery App! 🎉');
  const [userId, setUserId] = useState('test-user-id');

  const smsStatus = getSMSStatus();

  const handleTest = async () => {
    if (!testPhone) {
      toast.error('Please enter a phone number');
      return;
    }
    
    if (!validatePhoneNumber(testPhone)) {
      toast.error('Please enter a valid US phone number');
      return;
    }
    
    if (!testMessage) {
      toast.error('Please enter a message');
      return;
    }
    
    const formattedPhone = formatPhoneNumber(testPhone);
    const result = await send(formattedPhone, testMessage, userId);
    
    if (result.success) {
      if (result.mock) {
        toast.success('🧪 Mock SMS sent successfully! (Check console for details)');
      } else {
        toast.success('✅ Real SMS sent successfully!');
      }
    } else {
      toast.error(`❌ SMS failed: ${result.error}`);
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

          <div>
            <label className="text-sm font-medium">Phone Number</label>
            <Input
              type="tel"
              placeholder="+1234567890"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              US phone numbers only (10 digits)
            </p>
          </div>
          
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
                  Failed: {lastResult.error}
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