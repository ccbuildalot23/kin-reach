import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Shield, Check, X, AlertCircle, Eye, UserCheck, MessageSquare, Calendar } from 'lucide-react';

interface ConsentVersion {
  id: string;
  consent_type: string;
  version: string;
  title: string;
  content: string;
  is_required: boolean;
  is_active: boolean;
  effective_date: string;
}

interface UserConsent {
  id: string;
  user_id: string;
  consent_type: string;
  status: 'granted' | 'denied';
  consent_date: string;
  withdrawal_date?: string;
  ip_address?: string;
  user_agent?: string;
}

const ConsentManager = () => {
  const { user } = useAuth();
  const [consentVersions, setConsentVersions] = useState<ConsentVersion[]>([]);
  const [userConsents, setUserConsents] = useState<UserConsent[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadConsents();
    }
  }, [user?.id]);

  const loadConsents = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // For now, we'll use mock data since the tables don't exist
      // This would normally load from consent_versions and current_user_consents tables
      const mockVersions: ConsentVersion[] = [
        {
          id: '1',
          consent_type: 'privacy_notice',
          version: '1.0',
          title: 'Privacy Notice',
          content: 'We value your privacy and are committed to protecting your personal information.',
          is_required: true,
          is_active: true,
          effective_date: '2024-01-01'
        },
        {
          id: '2',
          consent_type: 'sms_communications',
          version: '1.0',
          title: 'SMS Communications',
          content: 'You can receive SMS notifications for crisis support and daily check-ins.',
          is_required: false,
          is_active: true,
          effective_date: '2024-01-01'
        },
        {
          id: '3',
          consent_type: 'data_sharing',
          version: '1.0',
          title: 'Data Sharing with Healthcare Providers',
          content: 'Share anonymized recovery data with healthcare providers for research.',
          is_required: false,
          is_active: true,
          effective_date: '2024-01-01'
        }
      ];

      const mockConsents: UserConsent[] = [
        {
          id: '1',
          user_id: user.id,
          consent_type: 'privacy_notice',
          status: 'granted',
          consent_date: '2024-01-01T00:00:00Z'
        }
      ];

      setConsentVersions(mockVersions);
      setUserConsents(mockConsents);

      // Check for required consents
      const requiredTypes = ['privacy_notice', 'sms_communications'];
      const missingConsents = requiredTypes.filter(type => 
        !mockConsents?.some(c => c.consent_type === type && c.status === 'granted')
      );

      if (missingConsents.length > 0) {
        toast({
          title: "Consent Required",
          description: "Please review and accept required consents to continue using the app.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error loading consents:', error);
      toast({
        title: "Error Loading Consents",
        description: "There was an issue loading your consent preferences.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConsentAction = async (consentType: string, action: 'granted' | 'denied') => {
    if (!user?.id) return;

    try {
      setProcessing(consentType);

      // This would normally call a function to record consent
      // await supabase.rpc('record_consent', { ... });

      // For now, just update local state
      const existingIndex = userConsents.findIndex(c => c.consent_type === consentType);
      const newConsent: UserConsent = {
        id: `${Date.now()}`,
        user_id: user.id,
        consent_type: consentType,
        status: action,
        consent_date: new Date().toISOString()
      };

      if (existingIndex >= 0) {
        const updated = [...userConsents];
        updated[existingIndex] = newConsent;
        setUserConsents(updated);
      } else {
        setUserConsents([...userConsents, newConsent]);
      }

      toast({
        title: action === 'granted' ? "Consent Granted" : "Consent Denied",
        description: `Your preference for ${consentType.replace('_', ' ')} has been updated.`,
      });
    } catch (error) {
      console.error('Error updating consent:', error);
      toast({
        title: "Error",
        description: "There was an issue updating your consent.",
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  const getUserConsentStatus = (consentType: string) => {
    return userConsents.find(c => c.consent_type === consentType)?.status;
  };

  const getConsentIcon = (consentType: string) => {
    switch (consentType) {
      case 'privacy_notice':
        return <Shield className="w-5 h-5" />;
      case 'sms_communications':
        return <MessageSquare className="w-5 h-5" />;
      case 'data_sharing':
        return <UserCheck className="w-5 h-5" />;
      default:
        return <Eye className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-semibold">Privacy & Consent Management</h2>
      </div>

      <div className="grid gap-4">
        {consentVersions.map((version) => {
          const userStatus = getUserConsentStatus(version.consent_type);
          const isProcessing = processing === version.consent_type;

          return (
            <Card key={version.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {getConsentIcon(version.consent_type)}
                    <div>
                      <CardTitle className="text-lg">{version.title}</CardTitle>
                      <CardDescription>Version {version.version}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {version.is_required && (
                      <Badge variant="destructive" className="text-xs">
                        Required
                      </Badge>
                    )}
                    {userStatus && (
                      <Badge variant={userStatus === 'granted' ? 'default' : 'secondary'}>
                        {userStatus === 'granted' ? (
                          <Check className="w-3 h-3 mr-1" />
                        ) : (
                          <X className="w-3 h-3 mr-1" />
                        )}
                        {userStatus === 'granted' ? 'Granted' : 'Denied'}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {version.content}
                </p>

                <div className="flex items-center gap-3 pt-3 border-t">
                  <Button
                    size="sm"
                    onClick={() => handleConsentAction(version.consent_type, 'granted')}
                    disabled={isProcessing || userStatus === 'granted'}
                    className="flex-1"
                  >
                    {isProcessing ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Check className="w-4 h-4 mr-2" />
                    )}
                    Accept
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleConsentAction(version.consent_type, 'denied')}
                    disabled={isProcessing || userStatus === 'denied'}
                    className="flex-1"
                  >
                    {isProcessing ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                    ) : (
                      <X className="w-4 h-4 mr-2" />
                    )}
                    Decline
                  </Button>
                </div>

                {version.is_required && userStatus !== 'granted' && (
                  <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg mt-3">
                    <AlertCircle className="w-4 h-4 text-destructive" />
                    <p className="text-sm text-destructive">
                      This consent is required to use the application.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Consent History
          </CardTitle>
          <CardDescription>
            Review your consent history and withdrawal options
          </CardDescription>
        </CardHeader>
        <CardContent>
          {userConsents.length > 0 ? (
            <div className="space-y-3">
              {userConsents.map((consent) => (
                <div key={consent.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">
                      {consent.consent_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {consent.status === 'granted' ? 'Granted' : 'Denied'} on{' '}
                      {new Date(consent.consent_date).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant={consent.status === 'granted' ? 'default' : 'secondary'}>
                    {consent.status === 'granted' ? 'Active' : 'Declined'}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No consent history available
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ConsentManager;