/**
 * Encryption utilities using Web Crypto API
 * AES-256-GCM encryption with PBKDF2 key derivation
 */

/**
 * Generate a random AES-256 key
 * @returns {Promise<CryptoKey>} 256-bit AES key
 */
export async function generateAESKey() {
  const key = await crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256
    },
    true, // extractable
    ['encrypt', 'decrypt']
  );
  return key;
}

/**
 * Generate a random IV (Initialization Vector)
 * @returns {Uint8Array} 12-byte IV
 */
export function generateIV() {
  return crypto.getRandomValues(new Uint8Array(12));
}

/**
 * Generate a random salt for PBKDF2
 * @returns {Uint8Array} 16-byte salt
 */
export function generateSalt() {
  return crypto.getRandomValues(new Uint8Array(16));
}

/**
 * Convert Uint8Array to base64 string
 * @param {Uint8Array} data - Data to encode
 * @returns {string} Base64 encoded string
 */
export function arrayBufferToBase64(data) {
  const binary = String.fromCharCode.apply(null, data);
  return btoa(binary);
}

/**
 * Convert base64 string to Uint8Array
 * @param {string} base64 - Base64 encoded string
 * @returns {Uint8Array} Decoded data
 * @throws {Error} If base64 string is invalid
 */
export function base64ToArrayBuffer(base64) {
  if (!base64) {
    throw new Error('Base64 string is empty or undefined');
  }

  // Trim whitespace
  const trimmed = base64.trim();

  // Validate base64 format (should only contain valid base64 characters and optional padding)
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(trimmed)) {
    throw new Error('Invalid base64 format. Contains invalid characters.');
  }

  try {
    const binary = atob(trimmed);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } catch (error) {
    throw new Error(`Base64 decoding failed: ${error.message}`);
  }
}

/**
 * Encrypt file using AES-256-GCM
 * @param {ArrayBuffer|File} fileData - File data to encrypt
 * @param {CryptoKey} key - AES-256 encryption key
 * @param {Uint8Array} iv - 12-byte IV
 * @returns {Promise<{encryptedData: ArrayBuffer, authTag: ArrayBuffer}>}
 */
export async function encryptFile(fileData, key, iv) {
  try {
    // Convert File to ArrayBuffer if needed
    let data = fileData;
    if (fileData instanceof File) {
      data = await fileData.arrayBuffer();
    }

    // Encrypt using AES-GCM
    const encryptedData = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      data
    );

    console.log('✅ File encrypted successfully with AES-256-GCM');
    console.log('  IV:', arrayBufferToBase64(iv));
    console.log('  Ciphertext size:', encryptedData.byteLength, 'bytes');

    // The last 16 bytes of the ciphertext contain the authentication tag
    return encryptedData;
  } catch (error) {
    console.error('❌ Encryption error:', error);
    throw new Error('File encryption failed: ' + error.message);
  }
}

/**
 * Decrypt file using AES-256-GCM
 * @param {ArrayBuffer} encryptedData - Encrypted data (includes auth tag in last 16 bytes)
 * @param {CryptoKey} key - AES-256 decryption key
 * @param {Uint8Array} iv - 12-byte IV (same as encryption)
 * @returns {Promise<ArrayBuffer>} Decrypted file data
 */
export async function decryptFile(encryptedData, key, iv) {
  try {
    // Decrypt using AES-GCM
    // The authentication tag is automatically verified
    const decryptedData = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      encryptedData
    );

    console.log('✅ File decrypted successfully with AES-256-GCM');
    console.log('  Plaintext size:', decryptedData.byteLength, 'bytes');

    return decryptedData;
  } catch (error) {
    console.error('❌ Decryption error:', error);
    if (error.name === 'OperationError') {
      throw new Error('File integrity compromised: Authentication tag verification failed');
    }
    throw new Error('File decryption failed: ' + error.message);
  }
}

/**
 * Derive key from password using PBKDF2
 * @param {string} password - User's password
 * @param {Uint8Array} salt - 16-byte salt
 * @returns {Promise<CryptoKey>} Derived AES-256 key
 */
export async function deriveKeyFromPassword(password, salt) {
  try {
    // Import password as key
    const passwordKey = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    // Derive key using PBKDF2
    const derivedKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        hash: 'SHA-256',
        salt: salt,
        iterations: 100000
      },
      passwordKey,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );

    console.log('✅ Key derived from password using PBKDF2');
    console.log('  Iterations: 100,000');
    console.log('  Hash: SHA-256');

    return derivedKey;
  } catch (error) {
    console.error('❌ Key derivation error:', error);
    throw new Error('Key derivation failed: ' + error.message);
  }
}

/**
 * Export a CryptoKey to raw format (for storage in sessionStorage)
 * @param {CryptoKey} key - Key to export
 * @returns {Promise<ArrayBuffer>} Raw key data
 */
export async function exportKey(key) {
  try {
    const exported = await crypto.subtle.exportKey('raw', key);
    return exported;
  } catch (error) {
    console.error('❌ Key export error:', error);
    throw new Error('Key export failed: ' + error.message);
  }
}

/**
 * Import a raw key for encryption/decryption
 * @param {ArrayBuffer} keyData - Raw key data
 * @returns {Promise<CryptoKey>} Imported CryptoKey
 */
export async function importKey(keyData) {
  try {
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'AES-GCM' },
      true,
      ['encrypt', 'decrypt']
    );
    return key;
  } catch (error) {
    console.error('❌ Key import error:', error);
    throw new Error('Key import failed: ' + error.message);
  }
}

/**
 * Validate encryption metadata
 * @param {string} iv - Base64 encoded IV
 * @param {string} authTag - Base64 encoded auth tag
 * @returns {boolean}
 */
export function validateEncryptionMetadata(iv, authTag) {
  if (!iv || typeof iv !== 'string') {
    throw new Error('Invalid IV');
  }
  if (!authTag || typeof authTag !== 'string') {
    throw new Error('Invalid authentication tag');
  }
  return true;
}
