/**
 * Phone number utilities for consistent formatting across the app
 * Standardizes to US E.164 format: +1XXXXXXXXXX
 */

// Remove all non-digit characters from phone number
export function cleanPhoneNumber(phone: string): string {
  return phone.replace(/\D/g, '');
}

// Format phone number for display: (XXX) XXX-XXXX
export function formatPhoneForDisplay(phone: string): string {
  const cleaned = cleanPhoneNumber(phone);
  
  // Handle different input lengths
  if (cleaned.length === 0) return '';
  if (cleaned.length <= 3) return cleaned;
  if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
  if (cleaned.length <= 10) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  
  // Handle 11-digit numbers (with country code)
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    const withoutCountry = cleaned.slice(1);
    return `(${withoutCountry.slice(0, 3)}) ${withoutCountry.slice(3, 6)}-${withoutCountry.slice(6)}`;
  }
  
  // For other lengths, just return the cleaned number
  return cleaned;
}

// Format phone number for SMS/API: +1XXXXXXXXXX
export function formatPhoneForSMS(phone: string): string {
  const cleaned = cleanPhoneNumber(phone);
  
  // Handle 10-digit US number
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  }
  
  // Handle 11-digit number with country code
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+${cleaned}`;
  }
  
  // If already has +1 prefix, just clean and return
  if (phone.startsWith('+1') && cleaned.length >= 11) {
    return `+1${cleaned.slice(-10)}`;
  }
  
  // For invalid lengths, return as-is (will fail validation)
  return phone;
}

// Validate US phone number
export function validatePhoneNumber(phone: string): {
  isValid: boolean;
  error?: string;
  formatted?: string;
} {
  if (!phone || phone.trim() === '') {
    return { isValid: false, error: 'Phone number is required' };
  }

  const cleaned = cleanPhoneNumber(phone);
  
  // Check for valid US phone number lengths
  if (cleaned.length === 10) {
    // Standard 10-digit US number
    if (cleaned.startsWith('0') || cleaned.startsWith('1')) {
      return { isValid: false, error: 'US phone numbers cannot start with 0 or 1' };
    }
    
    return { 
      isValid: true, 
      formatted: formatPhoneForSMS(cleaned)
    };
  }
  
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    // 11-digit with country code
    const localNumber = cleaned.slice(1);
    if (localNumber.startsWith('0') || localNumber.startsWith('1')) {
      return { isValid: false, error: 'US phone numbers cannot start with 0 or 1' };
    }
    
    return { 
      isValid: true, 
      formatted: formatPhoneForSMS(cleaned)
    };
  }
  
  // Invalid length
  if (cleaned.length < 10) {
    return { isValid: false, error: 'Phone number is too short' };
  }
  
  if (cleaned.length > 11) {
    return { isValid: false, error: 'Phone number is too long' };
  }
  
  return { isValid: false, error: 'Invalid phone number format' };
}

// Format phone number as user types (for input fields)
export function formatPhoneAsTyping(input: string): string {
  // Remove all non-digits
  const digits = cleanPhoneNumber(input);
  
  // Don't format if empty
  if (digits.length === 0) return '';
  
  // Format based on length
  if (digits.length <= 3) {
    return `(${digits}`;
  } else if (digits.length <= 6) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  } else if (digits.length <= 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  } else {
    // Handle 11+ digits (trim to 10)
    const trimmed = digits.slice(-10);
    return `(${trimmed.slice(0, 3)}) ${trimmed.slice(3, 6)}-${trimmed.slice(6)}`;
  }
}

// Extract just the digits for storage/comparison
export function getPhoneDigits(phone: string): string {
  const cleaned = cleanPhoneNumber(phone);
  
  // Return 10-digit US number
  if (cleaned.length === 10) return cleaned;
  if (cleaned.length === 11 && cleaned.startsWith('1')) return cleaned.slice(1);
  
  return cleaned;
}

// Check if two phone numbers are the same
export function phoneNumbersMatch(phone1: string, phone2: string): boolean {
  const digits1 = getPhoneDigits(phone1);
  const digits2 = getPhoneDigits(phone2);
  return digits1 === digits2 && digits1.length === 10;
}

// Get phone number info for debugging
export function getPhoneNumberInfo(phone: string): {
  original: string;
  cleaned: string;
  digits: string;
  displayFormat: string;
  smsFormat: string;
  validation: ReturnType<typeof validatePhoneNumber>;
} {
  const cleaned = cleanPhoneNumber(phone);
  const validation = validatePhoneNumber(phone);
  
  return {
    original: phone,
    cleaned,
    digits: getPhoneDigits(phone),
    displayFormat: formatPhoneForDisplay(phone),
    smsFormat: formatPhoneForSMS(phone),
    validation
  };
}

// Common phone number patterns for validation
export const PHONE_PATTERNS = {
  // US phone number with various formats
  US_LOOSE: /^[+]?[1]?[\s-.()]*[2-9]\d{2}[\s-.()]*\d{3}[\s-.]*\d{4}$/,
  
  // Strict E.164 format
  E164: /^\+1[2-9]\d{9}$/,
  
  // Display format
  DISPLAY: /^\([2-9]\d{2}\) [2-9]\d{2}-\d{4}$/,
  
  // Just digits
  DIGITS_ONLY: /^[2-9]\d{9}$/
};

// Mask phone number for privacy (XXX) XXX-1234
export function maskPhoneNumber(phone: string, showLast: number = 4): string {
  const formatted = formatPhoneForDisplay(phone);
  if (formatted.length < 10) return '***-***-****';
  
  const digits = getPhoneDigits(phone);
  if (digits.length !== 10) return '***-***-****';
  
  const masked = '*'.repeat(10 - showLast) + digits.slice(-showLast);
  return formatPhoneForDisplay(masked);
}

// Generate example phone number for placeholders
export function getExamplePhoneNumber(): string {
  return '(555) 123-4567';
}

// Phone number constants
export const PHONE_CONSTANTS = {
  MAX_LENGTH: 14, // (123) 456-7890
  MIN_DIGITS: 10,
  MAX_DIGITS: 10,
  PLACEHOLDER: '(555) 123-4567',
  SMS_FORMAT_EXAMPLE: '+15551234567',
  DISPLAY_FORMAT_EXAMPLE: '(555) 123-4567'
} as const;