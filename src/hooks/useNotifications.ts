import { useState } from 'react';

export function useNotifications() {
  const [notifications] = useState([]);
  
  const sendSupportNotification = async () => {
    // Placeholder for notification functionality
    console.log('Support notification sent');
  };

  const sendCrisisAlert = async () => {
    // Placeholder for crisis alert functionality
    console.log('Crisis alert sent');
  };

  return {
    notifications,
    sendSupportNotification,
    sendCrisisAlert,
  };
}