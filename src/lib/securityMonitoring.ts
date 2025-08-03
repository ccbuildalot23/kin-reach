/**
 * Security Monitoring Service
 * Handles security event logging, rate limiting, and threat detection
 */

import { supabase } from '@/integrations/supabase/client';
import { rateLimiter } from '@/lib/utils';

export interface SecurityEvent {
  type: 'auth_attempt' | 'failed_login' | 'suspicious_input' | 'rate_limit_exceeded' | 'unauthorized_access' | 'data_access';
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: Record<string, any>;
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
}

class SecurityMonitoringService {
  private eventQueue: SecurityEvent[] = [];
  private maxQueueSize = 100;
  private flushInterval = 30000; // 30 seconds
  private isInitialized = false;

  constructor() {
    this.initializeService();
  }

  private initializeService() {
    if (this.isInitialized) return;
    
    // Flush events periodically
    setInterval(() => {
      this.flushEvents();
    }, this.flushInterval);

    this.isInitialized = true;
  }

  /**
   * Log a security event
   */
  async logEvent(event: SecurityEvent): Promise<void> {
    try {
      // Add timestamp and browser fingerprint
      const enhancedEvent: SecurityEvent = {
        ...event,
        details: {
          ...event.details,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          referrer: document.referrer,
          userAgent: navigator.userAgent,
          language: navigator.language,
          platform: navigator.platform,
          cookieEnabled: navigator.cookieEnabled,
          onLine: navigator.onLine,
          screenResolution: `${screen.width}x${screen.height}`,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        }
      };

      // Queue event for batch processing
      this.eventQueue.push(enhancedEvent);

      // Flush immediately for critical events
      if (event.severity === 'critical') {
        await this.flushEvents();
      }

      // Prevent queue overflow
      if (this.eventQueue.length >= this.maxQueueSize) {
        await this.flushEvents();
      }

    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  /**
   * Flush queued events to the database
   */
  private async flushEvents(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const eventsToFlush = [...this.eventQueue];
    this.eventQueue = [];

    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Use log_security_event_enhanced function for secure logging
      for (const event of eventsToFlush) {
        await supabase.rpc('log_security_event_enhanced', {
          event_type: event.type,
          event_data: {
            severity: event.severity,
            details: event.details,
            userId: event.userId || user?.id,
            sessionId: event.sessionId,
            ipAddress: event.ipAddress,
            userAgent: event.userAgent
          },
          risk_level: event.severity
        });
      }
    } catch (error) {
      console.error('Failed to flush security events:', error);
      // Re-queue events on failure (up to max size)
      this.eventQueue = [...eventsToFlush.slice(-this.maxQueueSize / 2), ...this.eventQueue];
    }
  }

  /**
   * Check if an operation is rate limited
   */
  checkRateLimit(operation: string, maxAttempts: number = 5, windowMs: number = 60000): boolean {
    const key = `${operation}_${this.getClientId()}`;
    return rateLimiter.isAllowed(key, maxAttempts, windowMs);
  }

  /**
   * Log a failed authentication attempt
   */
  async logFailedAuth(email: string, reason: string): Promise<void> {
    await this.logEvent({
      type: 'failed_login',
      severity: 'medium',
      details: {
        email: this.obfuscateEmail(email),
        reason,
        attemptCount: this.getFailedAttemptCount(email)
      }
    });
  }

  /**
   * Log suspicious input detection
   */
  async logSuspiciousInput(field: string, value: string, reason: string): Promise<void> {
    await this.logEvent({
      type: 'suspicious_input',
      severity: 'high',
      details: {
        field,
        valueLength: value.length,
        reason,
        obfuscatedValue: value.slice(0, 10) + '...'
      }
    });
  }

  /**
   * Log rate limit exceeded
   */
  async logRateLimitExceeded(operation: string, attempts: number): Promise<void> {
    await this.logEvent({
      type: 'rate_limit_exceeded',
      severity: 'medium',
      details: {
        operation,
        attempts,
        clientId: this.getClientId()
      }
    });
  }

  /**
   * Log unauthorized access attempt
   */
  async logUnauthorizedAccess(resource: string, userId?: string): Promise<void> {
    await this.logEvent({
      type: 'unauthorized_access',
      severity: 'high',
      details: {
        resource,
        userId,
        clientId: this.getClientId()
      }
    });
  }

  /**
   * Log data access for sensitive operations
   */
  async logDataAccess(operation: string, table: string, recordCount: number): Promise<void> {
    await this.logEvent({
      type: 'data_access',
      severity: 'low',
      details: {
        operation,
        table,
        recordCount
      }
    });
  }

  /**
   * Get client identifier for rate limiting
   */
  private getClientId(): string {
    // Generate a fingerprint based on browser characteristics
    const fingerprint = `${navigator.userAgent}_${navigator.language}_${screen.width}x${screen.height}`;
    return btoa(fingerprint).slice(0, 16);
  }

  /**
   * Get failed attempt count for an email
   */
  private getFailedAttemptCount(email: string): number {
    const key = `failed_auth_${email}`;
    const attempts = localStorage.getItem(key);
    return attempts ? parseInt(attempts, 10) : 0;
  }

  /**
   * Increment failed attempt count
   */
  incrementFailedAttempts(email: string): void {
    const key = `failed_auth_${email}`;
    const count = this.getFailedAttemptCount(email) + 1;
    localStorage.setItem(key, count.toString());
    
    // Clean up after 1 hour
    setTimeout(() => {
      localStorage.removeItem(key);
    }, 3600000);
  }

  /**
   * Reset failed attempt count
   */
  resetFailedAttempts(email: string): void {
    const key = `failed_auth_${email}`;
    localStorage.removeItem(key);
  }

  /**
   * Obfuscate email for logging
   */
  private obfuscateEmail(email: string): string {
    if (!email || !email.includes('@')) return '***';
    const [username, domain] = email.split('@');
    return `${username.slice(0, 2)}***@${domain}`;
  }

  /**
   * Check for suspicious patterns in input
   */
  detectSuspiciousInput(input: string, fieldName: string): { isSuspicious: boolean; reason?: string } {
    if (!input || typeof input !== 'string') return { isSuspicious: false };

    // Check for script injection attempts
    if (/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi.test(input)) {
      return { isSuspicious: true, reason: 'Script tag detected' };
    }

    // Check for SQL injection patterns
    if (/(union|select|insert|update|delete|drop|create|alter|exec|script)/gi.test(input)) {
      return { isSuspicious: true, reason: 'SQL injection pattern detected' };
    }

    // Check for XSS patterns
    if (/(javascript:|on\w+\s*=|data:text\/html)/gi.test(input)) {
      return { isSuspicious: true, reason: 'XSS pattern detected' };
    }

    // Check for excessive length (potential DoS)
    if (input.length > 10000) {
      return { isSuspicious: true, reason: 'Excessive input length' };
    }

    // Check for repeated characters (potential DoS)
    if (/(.)\1{100,}/.test(input)) {
      return { isSuspicious: true, reason: 'Repeated character pattern' };
    }

    return { isSuspicious: false };
  }

  /**
   * Validate input and log if suspicious
   */
  async validateAndLogInput(input: string, fieldName: string): Promise<{ isValid: boolean; sanitized: string }> {
    const suspiciousCheck = this.detectSuspiciousInput(input, fieldName);
    
    if (suspiciousCheck.isSuspicious) {
      await this.logSuspiciousInput(fieldName, input, suspiciousCheck.reason || 'Unknown reason');
      return { isValid: false, sanitized: '' };
    }

    // Basic sanitization
    const sanitized = input
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/[<>"'&]/g, (match) => {
        const entities: Record<string, string> = {
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#x27;',
          '&': '&amp;'
        };
        return entities[match] || match;
      })
      .trim();

    return { isValid: true, sanitized };
  }
}

// Export singleton instance
export const securityMonitoring = new SecurityMonitoringService();

// Export utility functions for use in forms and components
export const validateInput = securityMonitoring.validateAndLogInput.bind(securityMonitoring);
export const checkRateLimit = securityMonitoring.checkRateLimit.bind(securityMonitoring);
export const logFailedAuth = securityMonitoring.logFailedAuth.bind(securityMonitoring);
export const logUnauthorizedAccess = securityMonitoring.logUnauthorizedAccess.bind(securityMonitoring);