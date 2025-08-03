import { supabase } from "@/integrations/supabase/client";

export class NotificationService {
  static async sendCrisisAlert(userId: string, message: string) {
    try {
      console.log('Sending crisis alert for user:', userId);
      
      // Get user's support network
      const { data: supportNetwork, error: networkError } = await supabase
        .from('support_network')
        .select(`
          supporter_id,
          relationship_type
        `)
        .eq('user_id', userId);

      if (networkError) {
        console.error('Error loading support network:', networkError);
        throw new Error('Failed to load support network');
      }

      if (!supportNetwork || supportNetwork.length === 0) {
        throw new Error('No support network members found');
      }

      console.log('Found support network:', supportNetwork);

      // Create notifications for each support member
      const notifications = supportNetwork.map(member => ({
        recipient_id: member.supporter_id,
        sender_id: userId,
        type: 'crisis_alert',
        title: 'Crisis Alert',
        message: message,
        priority: 'urgent',
        data: {
          alert_type: 'crisis',
          timestamp: new Date().toISOString(),
          requires_immediate_attention: true
        }
      }));

      const { data: insertedNotifications, error: notificationError } = await supabase
        .from('notifications')
        .insert(notifications)
        .select();

      if (notificationError) {
        console.error('Error creating notifications:', notificationError);
        throw new Error('Failed to send notifications');
      }

      console.log('Successfully created notifications:', insertedNotifications);

      // Also create a crisis alert record
      const { error: crisisError } = await supabase
        .from('crisis_alerts')
        .insert({
          user_id: userId,
          message_sent: message,
          contacts_notified: supportNetwork.length,
          status: 'sent'
        });

      if (crisisError) {
        console.error('Error creating crisis alert record:', crisisError);
        // Don't throw here as notifications were already sent
      }

      return {
        success: true,
        notificationsCreated: insertedNotifications?.length || 0,
        supportMembersNotified: supportNetwork.length
      };

    } catch (error) {
      console.error('Error in sendCrisisAlert:', error);
      throw error;
    }
  }

  static async sendSupportNotification(userId: string, type: string, title: string, message: string) {
    try {
      // Get user's support network
      const { data: supportNetwork, error: networkError } = await supabase
        .from('support_network')
        .select('supporter_id')
        .eq('user_id', userId);

      if (networkError || !supportNetwork || supportNetwork.length === 0) {
        console.log('No support network found for user:', userId);
        return { success: false, error: 'No support network found' };
      }

      // Create notifications for each support member
      const notifications = supportNetwork.map(member => ({
        recipient_id: member.supporter_id,
        sender_id: userId,
        type: type,
        title: title,
        message: message,
        priority: 'normal',
        data: {
          notification_type: type,
          timestamp: new Date().toISOString()
        }
      }));

      const { data: insertedNotifications, error: notificationError } = await supabase
        .from('notifications')
        .insert(notifications)
        .select();

      if (notificationError) {
        throw new Error('Failed to send notifications');
      }

      return {
        success: true,
        notificationsCreated: insertedNotifications?.length || 0
      };

    } catch (error) {
      console.error('Error in sendSupportNotification:', error);
      throw error;
    }
  }
}