import { supabase } from "@/integrations/supabase/client";
import { useState } from 'react';
import { formatPhoneForSMS, validatePhoneNumber as validatePhoneUtil } from './phoneUtils';

// Configuration - change to true when A2P is approved
const IS_SMS_APPROVED = false;
const SMS_TEST_MODE = true; // Set to false in production

// Main SMS function with mock mode support
export async function sendSMS(phoneNumber: string, message: string, userId?: string) {
  try {
    // Validate and format phone number
    const validation = validatePhoneUtil(phoneNumber);
    if (!validation.isValid) {
      console.error(`❌ Invalid phone number: ${validation.error}`);
      return { success: false, error: `Invalid phone number: ${validation.error}` };
    }

    const formattedPhone = formatPhoneForSMS(phoneNumber);
    console.log(`📱 SMS Request: ${formattedPhone} - ${message.substring(0, 50)}...`);

    if (!IS_SMS_APPROVED && SMS_TEST_MODE) {
      // Mock mode - simulate successful send
      console.log(`🧪 MOCK SMS sent to ${formattedPhone}: ${message}`);
      
      // Log to notification queue for tracking
      if (userId) {
        await supabase
          .from('notification_queue')
          .insert({
            user_id: userId,
            channel: 'sms',
            body: message,
            recipient_address: formattedPhone,
            status: 'mock_sent',
            scheduled_for: new Date().toISOString(),
            sent_at: new Date().toISOString()
          });
      }
      
      return { success: true, messageId: 'mock_' + Date.now(), mock: true };
    }

    // Real SMS sending (when A2P is approved)
    const { data, error } = await supabase.functions.invoke('send-sms', {
      body: {
        to: formattedPhone,
        message: message
      }
    });

    if (error) {
      console.error('❌ SMS error:', error);
      return { success: false, error: error.message };
    }

    if (data?.success) {
      console.log('✅ SMS sent successfully:', data.messageId);
      
      // Log successful send to notification queue
      if (userId) {
        await supabase
          .from('notification_queue')
          .insert({
            user_id: userId,
            channel: 'sms',
            body: message,
            recipient_address: formattedPhone,
            status: 'sent',
            scheduled_for: new Date().toISOString(),
            sent_at: new Date().toISOString()
          });
      }
      
      return { success: true, messageId: data.messageId };
    } else {
      console.error('❌ SMS failed:', data);
      return { success: false, error: data?.error || 'Unknown error' };
    }
  } catch (error) {
    console.error('❌ SMS exception:', error);
    return { success: false, error: error.message };
  }
}

// Crisis alert function using your existing database structure
export async function sendCrisisAlert(userId: string, customMessage?: string) {
  try {
    console.log(`🚨 Crisis alert triggered for user: ${userId}`);

    // Get emergency contacts from your crisis_contacts table
    const { data: contacts, error: contactsError } = await supabase
      .from('crisis_contacts')
      .select('phone_number, name, relationship')
      .eq('user_id', userId)
      .order('priority_order', { ascending: true });

    if (contactsError) {
      console.error('❌ Error fetching crisis contacts:', contactsError);
      throw new Error('Could not fetch emergency contacts');
    }

    if (!contacts?.length) {
      console.log('⚠️ No emergency contacts found');
      throw new Error('No emergency contacts configured');
    }

    const message = customMessage ||
      `🚨 CRISIS ALERT: Your contact needs immediate support. Please reach out to them right away. If this is an emergency, call 911. Sent from Recovery App.`;

    // Send SMS to all emergency contacts
    const smsPromises = contacts.map(contact => 
      sendSMS(contact.phone_number, message, userId)
    );

    const results = await Promise.allSettled(smsPromises);
    const successCount = results.filter(r => 
      r.status === 'fulfilled' && r.value.success
    ).length;

    // Log the crisis alert to your crisis_alerts table
    const { error: alertError } = await supabase
      .from('crisis_alerts')
      .insert({
        user_id: userId,
        alert_time: new Date().toISOString(),
        contacts_notified: successCount,
        status: successCount > 0 ? 'sent' : 'failed',
        message_sent: successCount > 0 ? message : null
      });

    if (alertError) {
      console.error('❌ Error logging crisis alert:', alertError);
    }

    console.log(`✅ Crisis alert: ${successCount}/${contacts.length} contacts notified`);
    
    return {
      success: successCount > 0,
      contactsNotified: successCount,
      totalContacts: contacts.length,
      results: results
    };

  } catch (error) {
    console.error('❌ Crisis alert failed:', error);
    
    // Log failed crisis alert
    await supabase
      .from('crisis_alerts')
      .insert({
        user_id: userId,
        alert_time: new Date().toISOString(),
        contacts_notified: 0,
        status: 'failed',
        message_sent: null
      });

    return {
      success: false,
      error: error.message,
      contactsNotified: 0,
      totalContacts: 0
    };
  }
}

// Send notification using your existing notification system
export async function sendNotificationSMS(
  userId: string, 
  message: string, 
  notificationType: string = 'wellness_check'
) {
  try {
    // Get user's phone number and SMS preferences
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', userId)
      .single();

    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Check if user has SMS enabled for crisis alerts
    if (!prefs?.crisis_alerts) {
      console.log('📵 SMS notifications disabled for user');
      return { success: false, reason: 'SMS disabled' };
    }

    // Get phone number from emergency contacts (fallback)
    const { data: contact } = await supabase
      .from('crisis_contacts')
      .select('phone_number')
      .eq('user_id', userId)
      .limit(1)
      .single();

    if (!contact?.phone_number) {
      console.log('📵 No phone number found for user');
      return { success: false, reason: 'No phone number' };
    }

    // Queue notification in your notification_queue table
    const { error: queueError } = await supabase
      .from('notification_queue')
      .insert({
        user_id: userId,
        channel: 'sms',
        body: message,
        recipient_address: contact.phone_number,
        scheduled_for: new Date().toISOString(),
        status: 'pending'
      });

    if (queueError) {
      throw new Error('Failed to queue notification');
    }

    // Send SMS
    const result = await sendSMS(contact.phone_number, message, userId);
    
    return result;

  } catch (error) {
    console.error('❌ Notification SMS failed:', error);
    return { success: false, error: error.message };
  }
}

// React hook for SMS functionality
export function useSMS() {
  const [isSending, setIsSending] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  const send = async (phoneNumber: string, message: string, userId?: string) => {
    setIsSending(true);
    try {
      const result = await sendSMS(phoneNumber, message, userId);
      setLastResult(result);
      return result;
    } finally {
      setIsSending(false);
    }
  };

  const sendCrisis = async (userId: string) => {
    setIsSending(true);
    try {
      const result = await sendCrisisAlert(userId);
      setLastResult(result);
      return result;
    } finally {
      setIsSending(false);
    }
  };

  const sendNotification = async (userId: string, message: string, type?: string) => {
    setIsSending(true);
    try {
      const result = await sendNotificationSMS(userId, message, type);
      setLastResult(result);
      return result;
    } finally {
      setIsSending(false);
    }
  };

  return { 
    send, 
    sendCrisis, 
    sendNotification, 
    isSending, 
    lastResult,
    isTestMode: SMS_TEST_MODE,
    isApproved: IS_SMS_APPROVED
  };
}

// Phone number utilities (deprecated - use phoneUtils.ts instead)
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  }
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+${cleaned}`;
  }
  return phone;
}

export function validatePhoneNumber(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length === 10 || (cleaned.length === 11 && cleaned.startsWith('1'));
}

// Configuration helpers
export function enableSMS() {
  console.log('🔧 SMS approval received - update IS_SMS_APPROVED to true');
}

export function getSMSStatus() {
  return {
    approved: IS_SMS_APPROVED,
    testMode: SMS_TEST_MODE,
    status: IS_SMS_APPROVED ? 'live' : 'waiting_for_approval'
  };
}