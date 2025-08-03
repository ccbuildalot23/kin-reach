import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

// Enhanced auth state cleanup with security logging
const cleanupAuthState = () => {
  const removedKeys: string[] = [];
  
  // Remove all Supabase auth keys from localStorage
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-') || key.startsWith('connect-button-') || key.startsWith('wellness-app-')) {
      localStorage.removeItem(key);
      removedKeys.push(key);
    }
  });
  
  // Remove from sessionStorage if in use
  Object.keys(sessionStorage || {}).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      sessionStorage.removeItem(key);
      removedKeys.push(key);
    }
  });
  
  // Clear any cached user data
  localStorage.removeItem('cached-user-data');
  sessionStorage.removeItem('cached-user-data');
  
  // Log security cleanup (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.log(`Security cleanup: Removed ${removedKeys.length} auth keys`);
  }
};

// Security event logging for auth events
const logSecurityEvent = async (event: string, details: Record<string, any> = {}) => {
  try {
    // Only log in production for security monitoring
    if (process.env.NODE_ENV === 'production') {
      // This would normally send to a security monitoring service
      console.log('Security Event:', { event, timestamp: new Date().toISOString(), ...details });
    }
  } catch (error) {
    // Silently fail to prevent auth flow interruption
  }
};

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Enhanced security logging for auth events
        await logSecurityEvent(`auth_${event.toLowerCase()}`, {
          userId: session?.user?.id,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent
        });
        
        // Clean up on sign out events
        if (event === 'SIGNED_OUT') {
          setTimeout(() => {
            cleanupAuthState();
          }, 0);
        }
        
        // Validate session integrity on sign in
        if (event === 'SIGNED_IN' && session) {
          setTimeout(async () => {
            try {
              // Verify session is still valid
              const { data, error } = await supabase.auth.getUser();
              if (error || !data.user) {
                console.warn('Session validation failed, cleaning up');
                cleanupAuthState();
                window.location.href = '/auth';
              }
            } catch (error) {
              console.error('Session validation error:', error);
            }
          }, 1000);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      setLoading(true);
      
      // Log security event
      await logSecurityEvent('user_signout_initiated', {
        userId: user?.id,
        timestamp: new Date().toISOString()
      });
      
      // Clean up auth state first
      cleanupAuthState();
      
      // Clear any additional app-specific data
      localStorage.removeItem('last-page-visited');
      sessionStorage.clear();
      
      // Attempt global sign out (fallback if it fails)
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        console.log('Sign out attempt completed');
      }
      
      // Security: Clear browser cache for sensitive data
      if ('caches' in window) {
        try {
          const cacheNames = await caches.keys();
          await Promise.all(
            cacheNames.map(cacheName => caches.delete(cacheName))
          );
        } catch (error) {
          // Silently fail to prevent sign out interruption
        }
      }
      
      // Force page reload for a clean state
      window.location.href = '/auth';
    } catch (error) {
      console.error('Error signing out:', error);
      // Log security incident
      await logSecurityEvent('signout_error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
      // Force redirect even if there's an error
      window.location.href = '/auth';
    }
  };

  return {
    user,
    session,
    loading,
    signOut,
    isAuthenticated: !!user
  };
};