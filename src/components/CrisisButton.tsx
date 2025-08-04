import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSMS, getSMSStatus } from '@/lib/sms';
import { toast } from 'sonner';
import { AlertTriangle, Phone, Users, CheckCircle, Clock, Shield } from 'lucide-react';

interface CrisisButtonProps {
  userId: string;
  variant?: 'default' | 'emergency' | 'compact';
  showStatus?: boolean;
}

export function CrisisButton({ 
  userId, 
  variant = 'default',
  showStatus = true 
}: CrisisButtonProps) {
  const { sendCrisis, isSending, isTestMode } = useSMS();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [lastAlert, setLastAlert] = useState<any>(null);

  const handleCrisisAlert = async () => {
    if (!showConfirmation) {
      setShowConfirmation(true);
      return;
    }

    setShowConfirmation(false);
    
    try {
      const result = await sendCrisis(userId);
      setLastAlert(result);
      
      if (result.success) {
        if (isTestMode) {
          toast.success(
            `🧪 Mock crisis alert sent to ${result.contactsNotified}/${result.totalContacts} contacts`,
            { duration: 5000 }
          );
        } else {
          toast.success(
            `Crisis alert sent to ${result.contactsNotified}/${result.totalContacts} emergency contacts`,
            { duration: 5000 }
          );
        }
      } else {
        toast.error(
          result.error || 'Failed to send crisis alert. Please call 911 if this is an emergency.',
          { duration: 8000 }
        );
      }
    } catch (error) {
      toast.error('Crisis alert system error. Please call 911 immediately if this is an emergency.');
    }
  };

  const cancelAlert = () => {
    setShowConfirmation(false);
  };

  // Compact variant for smaller spaces
  if (variant === 'compact') {
    return (
      <Button
        onClick={handleCrisisAlert}
        disabled={isSending}
        variant="destructive"
        size="sm"
        className="relative"
      >
        <AlertTriangle className="w-4 h-4 mr-1" />
        {isSending ? 'Sending...' : 'Crisis Alert'}
        {isTestMode && (
          <Badge variant="secondary" className="ml-2 text-xs">Test</Badge>
        )}
      </Button>
    );
  }

  // Emergency variant - larger, more prominent
  if (variant === 'emergency') {
    return (
      <div className="w-full max-w-sm mx-auto">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-red-600 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-white" />
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-red-800">Crisis Support</h3>
              <p className="text-sm text-red-600">
                Alert your emergency contacts immediately
              </p>
            </div>

            {showStatus && (
              <div className="flex justify-center">
                {isTestMode ? (
                  <Badge variant="secondary">
                    <Clock className="w-3 h-3 mr-1" />
                    Test Mode
                  </Badge>
                ) : (
                  <Badge variant="default" className="bg-green-600">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Live
                  </Badge>
                )}
              </div>
            )}

            {!showConfirmation ? (
              <Button
                onClick={handleCrisisAlert}
                disabled={isSending}
                variant="destructive"
                size="lg"
                className="w-full text-lg py-6"
              >
                <AlertTriangle className="w-6 h-6 mr-2" />
                {isSending ? 'Sending Alert...' : 'Send Crisis Alert'}
              </Button>
            ) : (
              <div className="space-y-3">
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    This will notify all your emergency contacts. Are you sure?
                  </AlertDescription>
                </Alert>
                
                <div className="flex gap-2">
                  <Button
                    onClick={handleCrisisAlert}
                    disabled={isSending}
                    variant="destructive"
                    className="flex-1"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Yes, Send Alert
                  </Button>
                  <Button
                    onClick={cancelAlert}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {lastAlert && (
              <div className={"text-sm p-3 rounded-lg " + 
                lastAlert.success 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
               + ""}>
                {lastAlert.success ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Alert sent to {lastAlert.contactsNotified} contacts
                    {isTestMode && ' (Mock)'}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Alert failed - Call 911 if emergency
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Default variant
  return (
    <div className="w-full max-w-md mx-auto">
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="h-5 w-5" />
            Crisis Alert
            {showStatus && (
              <>
                {isTestMode ? (
                  <Badge variant="secondary">Test Mode</Badge>
                ) : (
                  <Badge variant="default" className="bg-green-600">Live</Badge>
                )}
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            This will immediately notify all your emergency contacts that you need support.
          </p>

          {isTestMode && (
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                SMS system in test mode - alerts will be simulated until A2P approval.
              </AlertDescription>
            </Alert>
          )}

          {!showConfirmation ? (
            <Button
              onClick={handleCrisisAlert}
              disabled={isSending}
              variant="destructive"
              size="lg"
              className="w-full"
            >
              <AlertTriangle className="w-5 h-5 mr-2" />
              {isSending ? 'Sending Alert...' : 'Send Crisis Alert'}
            </Button>
          ) : (
            <div className="space-y-3">
              <Alert className="border-red-200">
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  <strong>Confirm Crisis Alert</strong><br />
                  This will send an urgent message to all your emergency contacts asking them to reach out to you immediately.
                </AlertDescription>
              </Alert>
              
              <div className="flex gap-2">
                <Button
                  onClick={handleCrisisAlert}
                  disabled={isSending}
                  variant="destructive"
                  className="flex-1"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  {isSending ? 'Sending...' : 'Confirm & Send'}
                </Button>
                <Button
                  onClick={cancelAlert}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {lastAlert && (
            <div className={"p-3 rounded-lg " + 
              lastAlert.success 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
             + ""}>
              {lastAlert.success ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 font-medium">
                    <CheckCircle className="w-4 h-4" />
                    Crisis alert sent successfully
                  </div>
                  <p className="text-sm">
                    Notified {lastAlert.contactsNotified} of {lastAlert.totalContacts} emergency contacts
                    {isTestMode && ' (Mock mode)'}
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 font-medium">
                    <AlertTriangle className="w-4 h-4" />
                    Crisis alert failed
                  </div>
                  <p className="text-sm">
                    {lastAlert.error || 'Unknown error'}
                  </p>
                  <p className="text-sm font-medium">
                    ⚠️ If this is an emergency, call 911 immediately
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="text-xs text-gray-500 text-center">
            For immediate emergency help, call 911
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Crisis resources component to show alongside crisis button
export function CrisisResources() {
  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="text-blue-800 text-sm">Crisis Resources</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Emergency:</span>
          <a href="tel:911" className="text-blue-600 font-medium">911</a>
        </div>
        <div className="flex justify-between">
          <span>Crisis Text Line:</span>
          <a href="sms:741741" className="text-blue-600 font-medium">Text HOME to 741741</a>
        </div>
        <div className="flex justify-between">
          <span>Suicide Prevention:</span>
          <a href="tel:988" className="text-blue-600 font-medium">988</a>
        </div>
        <div className="flex justify-between">
          <span>SAMHSA Helpline:</span>
          <a href="tel:1-800-662-4357" className="text-blue-600 font-medium">1-800-662-HELP</a>
        </div>
      </CardContent>
    </Card>
  );
}