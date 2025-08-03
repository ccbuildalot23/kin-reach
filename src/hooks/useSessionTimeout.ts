import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { auditLogger } from '@/lib/auditLogger';

const SESSION_TIMEOUT_MINUTES = 15;
const SESSION_TIMEOUT_MS = SESSION_TIMEOUT_MINUTES * 60 * 1000;
const WARNING_BEFORE_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes before timeout

export const useSessionTimeout = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const handleLogout = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      
      // Log session timeout
      if (userId) {
        await auditLogger.logSessionTimeout(userId);
      }
      
      await supabase.auth.signOut();
      navigate('/auth');
      
      toast({
        title: "Session expired",
        description: "You've been logged out due to inactivity. Please sign in again.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error during session timeout logout:', error);
    }
  }, [navigate, toast]);

  const showWarning = useCallback(() => {
    toast({
      title: "Session expiring soon",
      description: "Your session will expire in 2 minutes due to inactivity. Any action will extend your session.",
      variant: "default",
      duration: 10000, // Show for 10 seconds
    });
  }, [toast]);

  const resetTimers = useCallback(() => {
    // Clear existing timers
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningRef.current) {
      clearTimeout(warningRef.current);
    }

    // Update last activity
    lastActivityRef.current = Date.now();

    // Set warning timer
    warningRef.current = setTimeout(() => {
      showWarning();
    }, SESSION_TIMEOUT_MS - WARNING_BEFORE_TIMEOUT_MS);

    // Set logout timer
    timeoutRef.current = setTimeout(() => {
      handleLogout();
    }, SESSION_TIMEOUT_MS);
  }, [handleLogout, showWarning]);

  const handleActivity = useCallback(() => {
    const now = Date.now();
    const timeSinceLastActivity = now - lastActivityRef.current;
    
    // Only reset if it's been more than 1 second since last activity
    // This prevents excessive timer resets
    if (timeSinceLastActivity > 1000) {
      resetTimers();
    }
  }, [resetTimers]);

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Initialize timers
      resetTimers();

      // Activity events to track
      const events = [
        'mousedown',
        'mousemove',
        'keypress',
        'scroll',
        'touchstart',
        'click',
        'keydown',
      ];

      // Add event listeners
      events.forEach(event => {
        document.addEventListener(event, handleActivity);
      });

      // Cleanup function
      return () => {
        events.forEach(event => {
          document.removeEventListener(event, handleActivity);
        });

        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        if (warningRef.current) {
          clearTimeout(warningRef.current);
        }
      };
    };

    const cleanup = checkAuth();

    return () => {
      cleanup?.then(fn => fn?.());
    };
  }, [handleActivity, resetTimers]);

  // Return a function to manually reset the timer if needed
  return { resetSessionTimer: resetTimers };
};