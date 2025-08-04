import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, Heart, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NotificationPreferences } from '@/components/notifications/NotificationPreferences';
import { useAuth } from '@/hooks/useAuth';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { FloatingCrisisButton } from '@/components/FloatingCrisisButton';

const NotificationSettingsPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

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
      
      <div className="max-w-2xl mx-auto space-y-6 p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="text-purple-600 hover:text-purple-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to safety
            </Button>
            <h1 className="text-2xl font-bold flex items-center gap-2 text-purple-700 dark:text-purple-300">
              <Bell className="h-5 w-5" />
              Support Alerts
            </h1>
          </div>
          <NotificationBell />
        </div>
        
        {/* Encouraging Header */}
        <div className="bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-6 text-center">
          <Sparkles className="w-8 h-8 text-purple-500 mx-auto mb-3" />
          <p className="text-purple-700 dark:text-purple-300 font-medium">
            Stay connected to your recovery journey
          </p>
          <p className="text-purple-600 dark:text-purple-400 text-sm mt-2">
            Gentle reminders to help you stay on track 💙
          </p>
        </div>
        
        <NotificationPreferences />
      </div>
    </div>
  );
};

export default NotificationSettingsPage;

