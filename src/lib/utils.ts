import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Security utilities for input sanitization and validation
export function sanitizeInput(input: string): string {
  if (!input) return '';
  
  // Remove HTML tags, script tags, and other potentially dangerous content
  return input
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
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
}

export function validateEmailSecure(email: string): { isValid: boolean; error?: string } {
  if (!email) return { isValid: false, error: 'Email is required' };
  
  // Enhanced email validation with security checks
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Invalid email format' };
  }
  
  // Check for suspicious patterns
  if (email.includes('..') || email.includes('script') || email.length > 254) {
    return { isValid: false, error: 'Invalid email format' };
  }
  
  return { isValid: true };
}

export function obfuscatePhoneNumber(phone: string): string {
  if (!phone) return '';
  
  // Show only last 4 digits for security
  if (phone.length <= 4) return '***';
  
  const lastFour = phone.slice(-4);
  const stars = '*'.repeat(Math.max(0, phone.length - 4));
  return stars + lastFour;
}

export function obfuscateEmail(email: string): string {
  if (!email || !email.includes('@')) return '***';
  
  const [username, domain] = email.split('@');
  if (username.length <= 2) return `${username}***@${domain}`;
  
  return `${username.slice(0, 2)}***@${domain}`;
}

// Rate limiting helper for client-side operations
class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  
  isAllowed(key: string, maxAttempts: number, windowMs: number): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    
    // Remove old attempts outside the window
    const validAttempts = attempts.filter(timestamp => now - timestamp < windowMs);
    
    if (validAttempts.length >= maxAttempts) {
      return false;
    }
    
    validAttempts.push(now);
    this.attempts.set(key, validAttempts);
    return true;
  }
  
  reset(key: string): void {
    this.attempts.delete(key);
  }
}

export const rateLimiter = new RateLimiter();

// Content Security Policy helper
export function createSecureHeaders(): Record<string, string> {
  return {
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co;",
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  };
}
