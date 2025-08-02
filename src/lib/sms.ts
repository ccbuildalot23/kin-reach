import { supabase } from "@/integrations/supabase/client";
import { useState } from 'react';

// Main SMS function
export async function sendSMS(phoneNumber: string, message: string) {
  try {
    const { data, error } = await supabase.functions.invoke('send-sms', {
      body: {
        to: phoneNumber,
        message: message
      }
    });

    if (error) {
      console.error('SMS error:', error);
      return false;
    }

    if (data?.success) {
      console.log('SMS sent successfully:', data.messageId);
      return true;
    } else {
      console.error('SMS failed:', data);
      return false;
    }
  } catch (error) {
    console.error('SMS failed:', error);
    return false;
  }
}

// Crisis alert function that works with your existing database
export async function sendCrisisAlert(userId: string) {
  try {
    // Get emergency contacts from your crisis_contacts table
    const { data: contacts } = await supabase
      .from('crisis_contacts')
      .select('phone_number, name')
      .eq('user_id', userId);

    if (!contacts?.length) {
      console.log('No emergency contacts found');
      return false;
    }

    const message = `🚨 CRISIS ALERT: Your contact needs immediate support. Please reach out to them right away. Sent from Recovery App.`;

    // Send SMS to all emergency contacts
    const smsPromises = contacts.map(contact => 
      sendSMS(contact.phone_number, message)
    );

    const results = await Promise.all(smsPromises);
    const successCount = results.filter(Boolean).length;

    // Log to your existing crisis_alerts table
    await supabase
      .from('crisis_alerts')
      .insert({
        user_id: userId,
        alert_time: new Date().toISOString(),
        contacts_notified: successCount,
        status: successCount > 0 ? 'sent' : 'failed'
      });

    return successCount > 0;
  } catch (error) {
    console.error('Crisis alert failed:', error);
    return false;
  }
}

// React hook for SMS
export function useSMS() {
  const [isSending, setIsSending] = useState(false);
  const [lastResult, setLastResult] = useState<boolean | null>(null);

  const send = async (phoneNumber: string, message: string) => {
    setIsSending(true);
    try {
      const result = await sendSMS(phoneNumber, message);
      setLastResult(result);
      return result;
    } finally {
      setIsSending(false);
    }
  };

  return { send, isSending, lastResult };
}