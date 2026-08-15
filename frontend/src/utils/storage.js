/**
 * Session storage management for encryption keys
 */

const KEY_PREFIX = 'e2e_key_';

/**
 * Store encryption key in sessionStorage
 * @param {string} fileId - File ID
 * @param {ArrayBuffer} keyData - Raw key data
 */
export function storeKey(fileId, keyData) {
  try {
    const keyBase64 = btoa(String.fromCharCode.apply(null, new Uint8Array(keyData)));
    sessionStorage.setItem(KEY_PREFIX + fileId, keyBase64);
    console.log('✅ Key stored in sessionStorage for file:', fileId);
  } catch (error) {
    console.error('❌ Error storing key:', error);
    throw new Error('Failed to store encryption key');
  }
}

/**
 * Retrieve encryption key from sessionStorage
 * @param {string} fileId - File ID
 * @returns {ArrayBuffer|null} Raw key data or null if not found
 */
export function retrieveKey(fileId) {
  try {
    const keyBase64 = sessionStorage.getItem(KEY_PREFIX + fileId);
    if (!keyBase64) {
      console.warn('⚠️ Key not found for file:', fileId);
      return null;
    }

    const binary = atob(keyBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    console.log('✅ Key retrieved from sessionStorage for file:', fileId);
    return bytes.buffer;
  } catch (error) {
    console.error('❌ Error retrieving key:', error);
    return null;
  }
}

/**
 * Delete encryption key from sessionStorage
 * @param {string} fileId - File ID
 */
export function deleteKey(fileId) {
  try {
    sessionStorage.removeItem(KEY_PREFIX + fileId);
    console.log('✅ Key deleted from sessionStorage for file:', fileId);
  } catch (error) {
    console.error('❌ Error deleting key:', error);
  }
}

/**
 * Check if key exists in sessionStorage
 * @param {string} fileId - File ID
 * @returns {boolean}
 */
export function hasKey(fileId) {
  return sessionStorage.getItem(KEY_PREFIX + fileId) !== null;
}

/**
 * Clear all stored keys
 */
export function clearAllKeys() {
  try {
    const keys = Object.keys(sessionStorage).filter(k => k.startsWith(KEY_PREFIX));
    keys.forEach(k => sessionStorage.removeItem(k));
    console.log(`✅ Cleared ${keys.length} keys from sessionStorage`);
  } catch (error) {
    console.error('❌ Error clearing keys:', error);
  }
}
