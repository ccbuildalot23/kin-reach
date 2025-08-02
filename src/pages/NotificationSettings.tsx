import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NotificationPreferences } from '@/components/notifications/NotificationPreferences';
import { useAuth } from '@/hooks/useAuth';

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
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </h1>
        </div>
        <NotificationPreferences />
      </div>
    </div>
  );
};

export default NotificationSettingsPage;

