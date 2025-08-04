import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, FileText, MessageSquare, AlertTriangle, Users, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ConsentVersion {
  id: string;
  consent_type: string;
  version: string;
  title: string;
  content: string;
  effective_date: string;
}

interface UserConsent {
  user_id: string;
  consent_type: string;
  status: 'granted' | 'denied' | 'withdrawn';
  version: string;
  consent_date: string;
}

const consentIcons = {
  privacy_notice: Shield,
  sms_communications: MessageSquare,
  crisis_alerts: AlertTriangle,
  data_sharing: Users,
  email_communications: MessageSquare,
  treatment_records: FileText,
  terms_of_service: FileText,
  third_party_services: Shield,
};

export function ConsentManager() {
  const { user } = useAuth();
  const [consentVersions, setConsentVersions] = useState<ConsentVersion[]>([]);
  const [userConsents, setUserConsents] = useState<UserConsent[]>([]);
  const [pendingConsents, setPendingConsents] = useState<Set<string>>(new Set());
  const [showDialog, setShowDialog] = useState(false);
  const [selectedConsent, setSelectedConsent] = useState<ConsentVersion | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      loadConsents();
    }
  }, [user]);

  const loadConsents = async () => {
    try {
      setLoading(true);

      // Load consent versions
      const { data: versions, error: versionsError } = await supabase
        .from('consent_versions')
        .select('*')
        .eq('is_active', true)
        .order('consent_type');

      if (versionsError) throw versionsError;

      // Load user's current consents
      const { data: consents, error: consentsError } = await supabase
        .from('current_user_consents')
        .select('*')
        .eq('user_id', user?.id);

      if (consentsError) throw consentsError;

      setConsentVersions(versions || []);
      setUserConsents(consents || []);

      // Check for required consents
      const requiredTypes = ['privacy_notice', 'sms_communications'];
      const missingConsents = requiredTypes.filter(type => 
        !consents?.some(c => c.consent_type === type && c.status === 'granted')
      );

      if (missingConsents.length > 0) {
        setPendingConsents(new Set(missingConsents));
        setShowDialog(true);
      }
    } catch (error) {
      console.error('Error loading consents:', error);
      toast({
        title: 'Unable to load consent information',
        description: 'Please try again later',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const recordConsent = async (consentType: string, status: 'granted' | 'denied') => {
    if (!user) return;

    try {
      const version = consentVersions.find(v => v.consent_type === consentType);
      if (!version) return;

      // Get user's IP and user agent for audit
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const { ip } = await ipResponse.json();

      const { error } = await supabase.rpc('record_consent', {
        p_user_id: user.id,
        p_consent_type: consentType,
        p_version_id: version.id,
        p_status: status,
        p_ip_address: ip,
        p_user_agent: navigator.userAgent,
        p_method: 'checkbox'
      });

      if (error) throw error;

      // Update local state
      setUserConsents(prev => [
        ...prev.filter(c => c.consent_type !== consentType),
        {
          user_id: user.id,
          consent_type: consentType,
          status,
          version: version.version,
          consent_date: new Date().toISOString()
        }
      ]);

      if (status === 'granted') {
        pendingConsents.delete(consentType);
        setPendingConsents(new Set(pendingConsents));
      }

      toast({
        title: status === 'granted' ? 'Consent recorded' : 'Consent declined',
        description: `Your ${status === 'granted' ? 'consent' : 'preference'} has been saved`,
        className: status === 'granted' ? 'bg-green-100 text-green-900 border-green-200' : '',
      });
    } catch (error) {
      console.error('Error recording consent:', error);
      toast({
        title: 'Unable to save consent',
        description: 'Please try again',
        variant: 'destructive',
      });
    }
  };

  const handleSaveConsents = async () => {
    setSaving(true);

    // Record all pending consents as granted
    for (const consentType of pendingConsents) {
      await recordConsent(consentType, 'granted');
    }

    setSaving(false);
    
    if (pendingConsents.size === 0) {
      setShowDialog(false);
      toast({
        title: '💙 Thank you',
        description: 'Your privacy preferences have been saved',
        className: 'bg-purple-100 text-purple-900 border-purple-200',
      });
    }
  };

  const isConsentGranted = (consentType: string) => {
    const consent = userConsents.find(c => c.consent_type === consentType);
    return consent?.status === 'granted';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-600" />
            Privacy & Consent Settings
          </CardTitle>
          <CardDescription>
            Manage how we use and protect your health information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {consentVersions.map((consent) => {
            const Icon = consentIcons[consent.consent_type as keyof typeof consentIcons] || FileText;
            const isGranted = isConsentGranted(consent.consent_type);
            
            return (
              <div
                key={consent.id}
                className="flex items-start justify-between p-4 rounded-lg border"
              >
                <div className="flex items-start gap-3">
                  <Icon className="w-5 h-5 text-purple-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium">{consent.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Version {consent.version} • 
                      Effective {new Date(consent.effective_date).toLocaleDateString()}
                    </p>
                    <Button
                      variant="link"
                      size="sm"
                      className="p-0 h-auto text-purple-600 mt-1"
                      onClick={() => {
                        setSelectedConsent(consent);
                        setShowDialog(true);
                      }}
                    >
                      View details
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm ${isGranted ? 'text-green-600' : 'text-gray-500'}`}>
                    {isGranted ? 'Granted' : 'Not granted'}
                  </span>
                  <Checkbox
                    checked={isGranted}
                    onCheckedChange={(checked) => 
                      recordConsent(consent.consent_type, checked ? 'granted' : 'withdrawn')
                    }
                  />
                </div>
              </div>
            );
          })}

          <Alert className="bg-blue-50 border-blue-200">
            <Shield className="w-4 h-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              Your privacy is protected by HIPAA. We only share your information
              with your explicit consent or as required by law.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              {selectedConsent ? selectedConsent.title : 'Required Consents'}
            </DialogTitle>
            <DialogDescription>
              {selectedConsent 
                ? `Version ${selectedConsent.version}`
                : 'Please review and accept the following to continue using Kin-Reach'
              }
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="max-h-[50vh] mt-4">
            {selectedConsent ? (
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap font-sans">
                  {selectedConsent.content}
                </pre>
              </div>
            ) : (
              <div className="space-y-4">
                {consentVersions
                  .filter(v => pendingConsents.has(v.consent_type))
                  .map((consent) => {
                    const Icon = consentIcons[consent.consent_type as keyof typeof consentIcons] || FileText;
                    
                    return (
                      <Card key={consent.id}>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <Icon className="w-5 h-5 text-purple-600" />
                            {consent.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-600 whitespace-pre-wrap">
                            {consent.content}
                          </p>
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            )}
          </ScrollArea>

          <div className="flex justify-end gap-3 mt-4">
            {selectedConsent ? (
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedConsent(null);
                  setShowDialog(false);
                }}
              >
                Close
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => setShowDialog(false)}
                  disabled={saving}
                >
                  Review Later
                </Button>
                <Button
                  onClick={handleSaveConsents}
                  disabled={saving || pendingConsents.size === 0}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Accept Required Consents'
                  )}
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}