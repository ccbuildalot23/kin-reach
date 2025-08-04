/**
 * Field-level encryption for PHI (Protected Health Information)
 * Uses Web Crypto API for client-side encryption before storing in database
 */

// Encryption configuration
const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits for GCM
const SALT_LENGTH = 16; // 128 bits
const ITERATIONS = 100000; // PBKDF2 iterations

// PHI field types that should be encrypted
export const PHI_FIELDS = [
  'phone',
  'phone_number',
  'emergency_contact_phone',
  'message',
  'message_sent',
  'notes',
  'bio',
  'recovery_program',
  'goal'
] as const;

export type PHIField = typeof PHI_FIELDS[number];

/**
 * Derives an encryption key from a user-specific key and salt
 */
async function deriveKey(
  userKey: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(userKey),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts a string value using AES-GCM
 */
export async function encryptPHI(
  plaintext: string,
  userKey: string
): Promise<string> {
  try {
    // Generate random salt and IV
    const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    
    // Derive key from user key and salt
    const key = await deriveKey(userKey, salt);
    
    // Encode plaintext
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);
    
    // Encrypt
    const encrypted = await crypto.subtle.encrypt(
      {
        name: ALGORITHM,
        iv: iv
      },
      key,
      data
    );
    
    // Combine salt + iv + encrypted data
    const combined = new Uint8Array(
      salt.length + iv.length + encrypted.byteLength
    );
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(encrypted), salt.length + iv.length);
    
    // Return base64 encoded
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt PHI data');
  }
}

/**
 * Decrypts a string value using AES-GCM
 */
export async function decryptPHI(
  ciphertext: string,
  userKey: string
): Promise<string> {
  try {
    // Decode from base64
    const combined = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
    
    // Extract salt, iv, and encrypted data
    const salt = combined.slice(0, SALT_LENGTH);
    const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const encrypted = combined.slice(SALT_LENGTH + IV_LENGTH);
    
    // Derive key from user key and salt
    const key = await deriveKey(userKey, salt);
    
    // Decrypt
    const decrypted = await crypto.subtle.decrypt(
      {
        name: ALGORITHM,
        iv: iv
      },
      key,
      encrypted
    );
    
    // Decode plaintext
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt PHI data');
  }
}

/**
 * Generates a user-specific encryption key
 * This should be derived from the user's password or a separate key
 */
export function generateUserKey(userId: string, password: string): string {
  // In production, use a more sophisticated key derivation
  // This is a simplified version for demonstration
  return `${userId}-${password}`;
}

/**
 * Encrypts an object's PHI fields
 */
export async function encryptObjectPHI<T extends Record<string, any>>(
  obj: T,
  userKey: string,
  fields: readonly string[] = PHI_FIELDS
): Promise<T> {
  const encrypted = { ...obj };
  
  for (const field of fields) {
    if (field in encrypted && encrypted[field] && typeof encrypted[field] === 'string') {
      try {
        (encrypted as any)[field] = await encryptPHI((encrypted as any)[field], userKey);
        // Add encryption marker
        (encrypted as any)[`${field}_encrypted`] = true;
      } catch (error) {
        console.error(`Failed to encrypt field ${field}:`, error);
      }
    }
  }
  
  return encrypted;
}

/**
 * Decrypts an object's PHI fields
 */
export async function decryptObjectPHI<T extends Record<string, any>>(
  obj: T,
  userKey: string,
  fields: readonly string[] = PHI_FIELDS
): Promise<T> {
  const decrypted = { ...obj };
  
  for (const field of fields) {
    if (
      field in decrypted && 
      decrypted[field] && 
      typeof decrypted[field] === 'string' &&
      decrypted[`${field}_encrypted`] === true
    ) {
      try {
        (decrypted as any)[field] = await decryptPHI((decrypted as any)[field], userKey);
        delete decrypted[`${field}_encrypted`];
      } catch (error) {
        console.error(`Failed to decrypt field ${field}:`, error);
        // Leave encrypted if decryption fails
      }
    }
  }
  
  return decrypted;
}

/**
 * Hook for managing PHI encryption key in memory
 * The key should never be stored permanently
 */
export class PHIKeyManager {
  private static instance: PHIKeyManager;
  private userKey: string | null = null;
  private timeout: NodeJS.Timeout | null = null;
  private readonly TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

  private constructor() {}

  static getInstance(): PHIKeyManager {
    if (!PHIKeyManager.instance) {
      PHIKeyManager.instance = new PHIKeyManager();
    }
    return PHIKeyManager.instance;
  }

  setUserKey(key: string): void {
    this.userKey = key;
    this.resetTimeout();
  }

  getUserKey(): string | null {
    this.resetTimeout();
    return this.userKey;
  }

  clearUserKey(): void {
    this.userKey = null;
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
  }

  private resetTimeout(): void {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
    this.timeout = setTimeout(() => {
      this.clearUserKey();
    }, this.TIMEOUT_MS);
  }
}

/**
 * Utility to check if a field should be encrypted
 */
export function isPHIField(fieldName: string): boolean {
  return PHI_FIELDS.includes(fieldName as PHIField);
}

/**
 * Masks PHI data for display (e.g., phone numbers)
 */
export function maskPHI(value: string, type: 'phone' | 'email' | 'text' = 'text'): string {
  if (!value) return '';
  
  switch (type) {
    case 'phone':
      // Show last 4 digits: (***) ***-1234
      if (value.length >= 4) {
        return `(***) ***-${value.slice(-4)}`;
      }
      return '***-****';
      
    case 'email':
      // Show first letter and domain: j****@example.com
      const [local, domain] = value.split('@');
      if (local && domain) {
        return `${local[0]}${'*'.repeat(Math.max(4, local.length - 1))}@${domain}`;
      }
      return '****@****';
      
    case 'text':
    default:
      // Show first and last character: H****o
      if (value.length <= 2) return '*'.repeat(value.length);
      return `${value[0]}${'*'.repeat(value.length - 2)}${value[value.length - 1]}`;
  }
}