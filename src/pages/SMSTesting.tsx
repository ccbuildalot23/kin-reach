import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare, AlertTriangle, Users, Heart, Sparkles, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SMSTest } from '@/components/SMSTest';
import { CrisisButton, CrisisResources } from '@/components/CrisisButton';
import { SMSIntegration } from '@/components/SMSIntegration';
import { useAuth } from '@/hooks/useAuth';
import { FloatingCrisisButton } from '@/components/FloatingCrisisButton';

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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <FloatingCrisisButton userId={user?.id || ''} />
      
      <div className="max-w-4xl mx-auto p-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-purple-600 border-purple-300 hover:bg-purple-50"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Safety
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <MessageSquare className="w-8 h-8 text-purple-500" />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Support Messages
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Stay connected with your recovery team 💙
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - SMS Test */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-purple-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-700">
                  <MessageSquare className="h-5 w-5" />
                  Test Your Support Messages
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SMSTest />
              </CardContent>
            </Card>

            {/* SMS Integration Management */}
            <Card className="border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-700">
                  <Users className="h-5 w-5" />
                  Message Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    <Heart className="w-4 h-4 inline mr-1" />
                    Your support team will receive your messages with love and care
                  </p>
                </div>
                <SMSIntegration userId={user.id} />
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Crisis Features */}
          <div className="space-y-6">
            <Card className="border-red-200 bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/10 dark:to-pink-900/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
                  <AlertTriangle className="h-5 w-5" />
                  Emergency Support
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-red-600 dark:text-red-400 mb-4">
                  You're never alone - help is always available
                </p>
                <CrisisButton 
                  userId={user.id} 
                  variant="emergency" 
                  showStatus={true} 
                />
                <CrisisResources />
              </CardContent>
            </Card>

            {/* Recovery Support */}
            <Card className="border-purple-200 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                  <Sparkles className="h-5 w-5" />
                  Quick Support
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start border-purple-300 text-purple-600 hover:bg-purple-50"
                  onClick={() => navigate('/settings')}
                >
                  <Heart className="w-4 h-4 mr-2" />
                  Recovery Settings
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start border-red-300 text-red-600 hover:bg-red-50"
                  onClick={() => window.location.href = 'tel:988'}
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Crisis Lifeline: 988
                </Button>
                <div className="pt-2 text-center">
                  <p className="text-xs text-gray-500">
                    Emergency? Call 911
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SMSTesting;
