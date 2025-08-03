import { supabase } from '@/integrations/supabase/client';

export type AuditEventType = 
  | 'AUTH_LOGIN_ATTEMPT'
  | 'AUTH_LOGIN_SUCCESS'
  | 'AUTH_LOGIN_FAILED'
  | 'AUTH_LOGOUT'
  | 'AUTH_SIGNUP_ATTEMPT'
  | 'AUTH_SIGNUP_SUCCESS'
  | 'AUTH_SIGNUP_FAILED'
  | 'AUTH_PASSWORD_RESET_REQUEST'
  | 'AUTH_PASSWORD_RESET_SUCCESS'
  | 'AUTH_PASSWORD_RESET_FAILED'
  | 'DATA_ACCESS'
  | 'DATA_MODIFICATION'
  | 'SESSION_TIMEOUT'
  | 'SECURITY_ALERT';

export type AuditOutcome = 'SUCCESS' | 'FAILURE' | 'PENDING';

interface AuditLogEntry {
  userId?: string;
  eventType: AuditEventType;
  action: string;
  outcome: AuditOutcome;
  ipAddress?: string;
  userAgent?: string;
  deviceInfo?: Record<string, any>;
  sessionId?: string;
  errorMessage?: string;
  additionalData?: Record<string, any>;
}

class AuditLogger {
  private static instance: AuditLogger;
  
  private constructor() {}
  
  static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger();
    }
    return AuditLogger.instance;
  }

  private getDeviceInfo(): Record<string, any> {
    const userAgent = navigator.userAgent;
    const platform = navigator.platform;
    const vendor = navigator.vendor;
    const language = navigator.language;
    
    // Basic device detection
    const isMobile = /Mobile|Android|iPhone|iPad/i.test(userAgent);
    const isTablet = /iPad|Android(?!.*Mobile)/i.test(userAgent);
    const isDesktop = !isMobile && !isTablet;
    
    // Browser detection
    let browser = 'Unknown';
    if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';
    
    return {
      platform,
      vendor,
      language,
      browser,
      deviceType: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop',
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  }

  private async getIpAddress(): Promise<string | null> {
    try {
      // In production, this would be handled server-side
      // For now, we'll return a placeholder
      return null;
    } catch (error) {
      console.error('Failed to get IP address:', error);
      return null;
    }
  }

  async log(entry: AuditLogEntry): Promise<void> {
    try {
      const ipAddress = entry.ipAddress || await this.getIpAddress();
      const userAgent = entry.userAgent || navigator.userAgent;
      const deviceInfo = entry.deviceInfo || this.getDeviceInfo();
      
      // Get current session if available
      const { data: { session } } = await supabase.auth.getSession();
      const userId = entry.userId || session?.user?.id || null;
      
      // Call the database function to log the event
      const { error } = await supabase.rpc('log_auth_event', {
        p_user_id: userId,
        p_event_type: entry.eventType,
        p_action: entry.action,
        p_outcome: entry.outcome,
        p_ip_address: ipAddress,
        p_user_agent: userAgent,
        p_device_info: deviceInfo,
        p_session_id: entry.sessionId || session?.access_token?.substring(0, 20),
        p_error_message: entry.errorMessage,
        p_additional_data: entry.additionalData,
      });

      if (error) {
        console.error('Failed to log audit event:', error);
      }
    } catch (error) {
      console.error('Audit logging error:', error);
    }
  }

  // Convenience methods for common events
  async logLoginAttempt(email: string): Promise<void> {
    await this.log({
      eventType: 'AUTH_LOGIN_ATTEMPT',
      action: 'User attempted to log in',
      outcome: 'PENDING',
      additionalData: { email },
    });
  }

  async logLoginSuccess(userId: string, email: string): Promise<void> {
    await this.log({
      userId,
      eventType: 'AUTH_LOGIN_SUCCESS',
      action: 'User successfully logged in',
      outcome: 'SUCCESS',
      additionalData: { email },
    });
  }

  async logLoginFailure(email: string, errorMessage: string): Promise<void> {
    await this.log({
      eventType: 'AUTH_LOGIN_FAILED',
      action: 'Login attempt failed',
      outcome: 'FAILURE',
      errorMessage,
      additionalData: { email },
    });
  }

  async logSignupAttempt(email: string): Promise<void> {
    await this.log({
      eventType: 'AUTH_SIGNUP_ATTEMPT',
      action: 'User attempted to sign up',
      outcome: 'PENDING',
      additionalData: { email },
    });
  }

  async logSignupSuccess(userId: string, email: string): Promise<void> {
    await this.log({
      userId,
      eventType: 'AUTH_SIGNUP_SUCCESS',
      action: 'User successfully signed up',
      outcome: 'SUCCESS',
      additionalData: { email },
    });
  }

  async logSignupFailure(email: string, errorMessage: string): Promise<void> {
    await this.log({
      eventType: 'AUTH_SIGNUP_FAILED',
      action: 'Signup attempt failed',
      outcome: 'FAILURE',
      errorMessage,
      additionalData: { email },
    });
  }

  async logPasswordResetRequest(email: string): Promise<void> {
    await this.log({
      eventType: 'AUTH_PASSWORD_RESET_REQUEST',
      action: 'Password reset requested',
      outcome: 'SUCCESS',
      additionalData: { email },
    });
  }

  async logPasswordResetSuccess(userId: string): Promise<void> {
    await this.log({
      userId,
      eventType: 'AUTH_PASSWORD_RESET_SUCCESS',
      action: 'Password successfully reset',
      outcome: 'SUCCESS',
    });
  }

  async logLogout(userId: string): Promise<void> {
    await this.log({
      userId,
      eventType: 'AUTH_LOGOUT',
      action: 'User logged out',
      outcome: 'SUCCESS',
    });
  }

  async logSessionTimeout(userId: string): Promise<void> {
    await this.log({
      userId,
      eventType: 'SESSION_TIMEOUT',
      action: 'Session expired due to inactivity',
      outcome: 'SUCCESS',
    });
  }
}

export const auditLogger = AuditLogger.getInstance();