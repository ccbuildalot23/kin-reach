import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { NotificationService } from '@/lib/notificationService';

export function useNotifications() {
  const [notifications] = useState([]);
  
  const sendSupportNotification = async () => {
    // Placeholder for notification functionality
    console.log('Support notification sent');
  };

  const sendCrisisAlert = async (message: string = 'I need help') => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    await NotificationService.sendCrisisAlert(user.id, message);
  };

  return {
    notifications,
    sendSupportNotification,
    sendCrisisAlert,
  };
}