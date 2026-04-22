import { randomBytes } from 'crypto';

/**
 * Generate a random token for file sharing
 * Used as a share token for public file access
 */
export const generateShareToken = () => {
  return randomBytes(32).toString('hex');
};

/**
 * Generate random salt for PBKDF2
 * Used for password-based key derivation
 */
export const generateSalt = () => {
  // 16 bytes = 128 bits as per requirements
  return randomBytes(16).toString('base64');
};

/**
 * Validate that encrypted data was received correctly
 */
export const validateEncryptedFileMetadata = (iv, authTag) => {
  if (!iv || typeof iv !== 'string') {
    throw new Error('Invalid encryption IV');
  }
  if (!authTag || typeof authTag !== 'string') {
    throw new Error('Invalid authentication tag');
  }
  // IV should be 12 bytes = 16 characters in base64
  // AuthTag should be 16 bytes = 24 characters in base64
  return true;
};
