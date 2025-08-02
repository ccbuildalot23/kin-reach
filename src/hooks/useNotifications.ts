import { useState, useEffect, useCallback } from 'react';
import { NotificationService } from '@/lib/notificationService';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

type NotificationType = 'crisis_alert' | 'check_in' | 'milestone' | 'support_message' | 'system' | 'sponsor_message' | 'meeting_reminder';
type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

interface Notification {
  id: string;
  recipient_id: string;
  sender_id?: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  read_at?: string;
  created_at: string;
  priority: NotificationPriority;
  sender?: {
    id: string;
    display_name: string;
    avatar_url?: string;
  };
}

export const useNotifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const data = await NotificationService.getUserNotifications(user.id);
      setNotifications(data);
      
      const count = await NotificationService.getUnreadCount(user.id);
      setUnreadCount(count);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast({
        title: 'Error',
        description: 'Failed to load notifications',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id, toast]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await NotificationService.markAsRead(notificationId);
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      await NotificationService.markAllAsRead();
      setNotifications(prev =>
        prev.map(n => ({ ...n, read_at: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }, []);

  // Send a notification
  const sendNotification = useCallback(async (
    recipientId: string,
    type: NotificationType,
    title: string,
    message: string,
    priority: NotificationPriority = 'normal',
    data?: Record<string, unknown>
  ) => {
    try {
      const success = await NotificationService.send({
        recipientId,
        senderId: user?.id,
        type,
        title,
        message,
        priority,
        data,
      });

      if (success) {
        toast({
          title: 'Notification sent',
          description: 'Your message has been delivered',
        });
      }

      return success;
    } catch (error) {
      console.error('Error sending notification:', error);
      toast({
        title: 'Error',
        description: 'Failed to send notification',
        variant: 'destructive',
      });
      return false;
    }
  }, [user?.id, toast]);

  // Send crisis alert
  const sendCrisisAlert = useCallback(async (message?: string) => {
    if (!user?.id) return;

    try {
      await NotificationService.sendCrisisAlert(user.id, message);
      toast({
        title: '🚨 Crisis Alert Sent',
        description: 'Your support network has been notified',
        variant: 'default',
      });
    } catch (error) {
      console.error('Error sending crisis alert:', error);
      toast({
        title: 'Error',
        description: 'Failed to send crisis alert. Please try again.',
        variant: 'destructive',
      });
    }
  }, [user?.id, toast]);

  // Real-time subscription
  useEffect(() => {
    if (!user?.id) return;

    fetchNotifications();

    // Subscribe to new notifications
    const subscription = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${user.id}`,
        },
        async (payload) => {
          const newNotification = payload.new as Notification;
          
          // Fetch sender info if needed
          if (newNotification.sender_id) {
            const { data: sender } = await supabase
              .from('profiles')
              .select('id, display_name, avatar_url')
              .eq('id', newNotification.sender_id)
              .single();
            
            if (sender) {
              newNotification.sender = sender;
            }
          }

          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);

          // Show toast for important notifications
          if (newNotification.priority === 'high' || newNotification.priority === 'urgent') {
            toast({
              title: newNotification.title,
              description: newNotification.message,
              variant: newNotification.priority === 'urgent' ? 'destructive' : 'default',
            });
          }

          // Browser notification
          if (Notification.permission === 'granted') {
            new Notification(newNotification.title, {
              body: newNotification.message,
              icon: '/icon-192x192.png',
              tag: newNotification.id,
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${user.id}`,
        },
        (payload) => {
          const updatedNotification = payload.new as Notification;
          setNotifications(prev =>
            prev.map(n =>
              n.id === updatedNotification.id ? updatedNotification : n
            )
          );
          
          if (updatedNotification.read_at) {
            setUnreadCount(prev => Math.max(0, prev - 1));
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id, fetchNotifications, toast]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    sendNotification,
    sendCrisisAlert,
    refresh: fetchNotifications,
  };
};

