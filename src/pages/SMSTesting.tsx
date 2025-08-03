import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare, AlertTriangle, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SMSTest } from '@/components/SMSTest';
import { CrisisButton, CrisisResources } from '@/components/CrisisButton';
import { SMSIntegration } from '@/components/SMSIntegration';
import { useAuth } from '@/hooks/useAuth';

export function SMSTesting() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  // Redirect to auth if not authenticated
  React.useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-primary/10 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">SMS Management</h1>
            <p className="text-muted-foreground">Test and manage your SMS notifications</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - SMS Test */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  SMS Testing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SMSTest />
              </CardContent>
            </Card>

            {/* SMS Integration Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  SMS Integration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SMSIntegration userId={user.id} />
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Crisis Features */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Crisis Features
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <CrisisButton 
                  userId={user.id} 
                  variant="emergency" 
                  showStatus={true} 
                />
                <CrisisResources />
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate('/auth')}
                >
                  Account Settings
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => window.location.href = 'tel:911'}
                >
                  Emergency: Call 911
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => window.location.href = 'tel:988'}
                >
                  Crisis Line: 988
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SMSTesting;
