import { supabase } from "@/integrations/supabase/client";
import { sendSMS } from "@/lib/sms"; // Your existing SMS service
import { Database } from "@/integrations/supabase/types";

// Type definitions based on your database schema
type NotificationType = 'crisis_alert' | 'check_in' | 'milestone' | 'support_message' | 'system' | 'sponsor_message' | 'meeting_reminder';
type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

interface NotificationData {
  recipientId: string;
  senderId?: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  priority?: NotificationPriority;
  expiresAt?: Date;
}

interface NotificationPreferences {
  in_app_enabled: boolean;
  sms_enabled: boolean;
  email_enabled: boolean;
  crisis_alerts: boolean;
  check_ins: boolean;
  milestones: boolean;
  support_messages: boolean;
  sponsor_messages: boolean;
  meeting_reminders: boolean;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
}

interface SendToSupportNetworkOptions {
  type: NotificationType;
  title: string;
  message: string;
  priority?: NotificationPriority;
  includeSMS?: boolean;
}

export class NotificationService {
  /**
   * Send a notification to a user
   */
  static async send(notification: NotificationData): Promise<boolean> {
    try {
      // Get recipient preferences
      const preferences = await this.getUserPreferences(notification.recipientId);
      
      // Check if notification type is enabled
      if (!this.isNotificationTypeEnabled(notification.type, preferences)) {
        console.log(`Notification type ${notification.type} disabled for user ${notification.recipientId}`);
        return false;
      }

      // Check quiet hours (except for urgent notifications)
      if (notification.priority !== 'urgent' && this.isInQuietHours(preferences)) {
        console.log(`User ${notification.recipientId} is in quiet hours`);
        return false;
      }

      // Send in-app notification if enabled
      if (preferences.in_app_enabled) {
        await this.sendInAppNotification(notification);
      }

      // Send SMS if enabled and high priority
      if (preferences.sms_enabled && 
          (notification.priority === 'high' || notification.priority === 'urgent')) {
        await this.sendSMSNotification(notification);
      }

      return true;
    } catch (error) {
      console.error('Error sending notification:', error);
      return false;
    }
  }

  /**
   * Send multiple notifications (batch)
   */
  static async sendBatch(notifications: NotificationData[]): Promise<void> {
    const promises = notifications.map(notification => this.send(notification));
    await Promise.all(promises);
  }

  /**
   * Send notification to entire support network
   */
  static async sendToSupportNetwork(
    userId: string, 
    options: SendToSupportNetworkOptions
  ): Promise<void> {
    const { error } = await supabase.rpc('send_to_support_network', {
      sender_uuid: userId,
      notification_type: options.type,
      notification_title: options.title,
      notification_message: options.message,
      notification_priority: options.priority || 'normal'
    });

    if (error) {
      console.error('Error sending to support network:', error);
      throw error;
    }

    // If SMS is requested and it's high priority, also send SMS
    if (options.includeSMS && (options.priority === 'high' || options.priority === 'urgent')) {
      await this.sendSMSToSupportNetwork(userId, options);
    }
  }

  /**
   * Send crisis alert to all support network members
   */
  static async sendCrisisAlert(userId: string, message?: string): Promise<void> {
    const alertMessage = message || 'I need immediate support. Please reach out.';
    
    await this.sendToSupportNetwork(userId, {
      type: 'crisis_alert',
      title: '🚨 Crisis Alert',
      message: alertMessage,
      priority: 'urgent',
      includeSMS: true
    });
  }

  /**
   * Send in-app notification
   */
  private static async sendInAppNotification(notification: NotificationData): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .insert({
        recipient_id: notification.recipientId,
        sender_id: notification.senderId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data || {},
        priority: notification.priority || 'normal',
        expires_at: notification.expiresAt?.toISOString()
      });

    if (error) {
      throw new Error(`Failed to create notification: ${error.message}`);
    }
  }

  /**
   * Send SMS notification
   */
  private static async sendSMSNotification(notification: NotificationData): Promise<void> {
    // Get recipient phone number from profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('phone')
      .eq('id', notification.recipientId)
      .single();

    if (!profile?.phone) {
      console.log(`No phone number for user ${notification.recipientId}`);
      return;
    }

    // Format message for SMS
    const smsMessage = `Serenity: ${notification.title}\n${notification.message}`;
    
    // Use your existing SMS service
    await sendSMS({
      to: profile.phone,
      message: smsMessage
    });
  }

  /**
   * Send SMS to support network
   */
  private static async sendSMSToSupportNetwork(
    userId: string, 
    options: SendToSupportNetworkOptions
  ): Promise<void> {
    // Get support network with phone numbers
    const { data: supporters } = await supabase
      .from('support_network')
      .select(`
        supporter_id,
        supporter:profiles!support_network_supporter_id_fkey(phone, display_name)
      `)
      .eq('user_id', userId)
      .eq('is_active', true);

    if (!supporters || supporters.length === 0) return;

    // Get sender name
    const { data: sender } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', userId)
      .single();

    const senderName = sender?.display_name || 'A friend';
    const smsMessage = `Serenity Alert: ${senderName} - ${options.message}`;

    // Send SMS to each supporter with a phone number
    const smsPromises = supporters
      .filter(s => s.supporter?.phone)
      .map(supporter => 
        sendSMS({
          to: supporter.supporter.phone,
          message: smsMessage
        })
      );

    await Promise.all(smsPromises);
  }

  /**
   * Get user notification preferences
   */
  private static async getUserPreferences(userId: string): Promise<NotificationPreferences> {
    const { data } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Return defaults if no preferences set
    if (!data) {
      return {
        in_app_enabled: true,
        sms_enabled: true,
        email_enabled: false,
        crisis_alerts: true,
        check_ins: true,
        milestones: true,
        support_messages: true,
        sponsor_messages: true,
        meeting_reminders: true
      };
    }

    return data as NotificationPreferences;
  }

  /**
   * Check if notification type is enabled
   */
  private static isNotificationTypeEnabled(
    type: NotificationType, 
    preferences: NotificationPreferences
  ): boolean {
    switch (type) {
      case 'crisis_alert':
        return preferences.crisis_alerts;
      case 'check_in':
        return preferences.check_ins;
      case 'milestone':
        return preferences.milestones;
      case 'support_message':
        return preferences.support_messages;
      case 'sponsor_message':
        return preferences.sponsor_messages;
      case 'meeting_reminder':
        return preferences.meeting_reminders;
      case 'system':
        return true; // System notifications always enabled
      default:
        return true;
    }
  }

  /**
   * Check if current time is within quiet hours
   */
  private static isInQuietHours(preferences: NotificationPreferences): boolean {
    if (!preferences.quiet_hours_start || !preferences.quiet_hours_end) {
      return false;
    }

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMin] = preferences.quiet_hours_start.split(':').map(Number);
    const [endHour, endMin] = preferences.quiet_hours_end.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Quiet hours span midnight
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase.rpc('mark_notification_read', {
      notification_uuid: notificationId
    });

    if (error) {
      throw new Error(`Failed to mark notification as read: ${error.message}`);
    }
  }

  /**
   * Mark all notifications as read
   */
  static async markAllAsRead(): Promise<void> {
    const { error } = await supabase.rpc('mark_all_notifications_read');

    if (error) {
      throw new Error(`Failed to mark all notifications as read: ${error.message}`);
    }
  }

  /**
   * Get unread notification count
   */
  static async getUnreadCount(userId: string): Promise<number> {
    const { data, error } = await supabase.rpc('get_unread_notification_count', {
      user_uuid: userId
    });

    if (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }

    return data || 0;
  }

  /**
   * Get user notifications with pagination
   */
  static async getUserNotifications(
    userId: string, 
    limit = 20, 
    offset = 0
  ): Promise<any[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select(`
        *,
        sender:sender_id(
          id,
          display_name,
          avatar_url
        )
      `)
      .eq('recipient_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Delete old notifications
   */
  static async cleanupOldNotifications(daysToKeep = 30): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const { error } = await supabase
      .from('notifications')
      .delete()
      .lt('created_at', cutoffDate.toISOString())
      .not('read_at', 'is', null);

    if (error) {
      console.error('Error cleaning up notifications:', error);
    }
  }

  /**
   * Update notification preferences
   */
  static async updatePreferences(
    userId: string, 
    preferences: Partial<NotificationPreferences>
  ): Promise<void> {
    const { error } = await supabase
      .from('notification_preferences')
      .upsert({
        user_id: userId,
        ...preferences,
        updated_at: new Date().toISOString()
      });

    if (error) {
      throw new Error(`Failed to update preferences: ${error.message}`);
    }
  }
}

