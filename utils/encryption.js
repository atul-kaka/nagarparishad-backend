const crypto = require('crypto');

/**
 * Encryption utility for request/response payload encryption
 * Uses AES-256-GCM for authenticated encryption
 */

// Get encryption key from environment variable
// If not set, generate a random key (for development only)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 16 bytes for AES
const AUTH_TAG_LENGTH = 16; // 16 bytes for GCM authentication tag
const SALT_LENGTH = 64; // 64 bytes for salt

/**
 * Derives a key from the encryption key using PBKDF2
 * @param {string} password - The encryption key
 * @param {Buffer} salt - Salt for key derivation
 * @returns {Buffer} - Derived key
 */
function deriveKey(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
}

/**
 * Encrypts a plaintext string
 * @param {string} text - Plaintext to encrypt
 * @returns {string} - Encrypted data in format: salt:iv:authTag:encryptedData (all base64)
 */
function encrypt(text) {
  try {
    if (!text) {
      return text;
    }

    // Convert text to string if it's an object
    const plaintext = typeof text === 'string' ? text : JSON.stringify(text);

    // Generate random salt and IV
    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);

    // Derive key from password and salt
    const key = deriveKey(ENCRYPTION_KEY, salt);

    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    // Encrypt the data
    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    // Get authentication tag
    const authTag = cipher.getAuthTag();

    // Combine salt:iv:authTag:encryptedData
    const result = [
      salt.toString('base64'),
      iv.toString('base64'),
      authTag.toString('base64'),
      encrypted
    ].join(':');

    return result;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypts an encrypted string
 * @param {string} encryptedData - Encrypted data in format: salt:iv:authTag:encryptedData
 * @returns {string} - Decrypted plaintext
 */
function decrypt(encryptedData) {
  try {
    if (!encryptedData) {
      return encryptedData;
    }

    // Split the encrypted data
    const parts = encryptedData.split(':');
    if (parts.length !== 4) {
      throw new Error('Invalid encrypted data format');
    }

    const [saltBase64, ivBase64, authTagBase64, encrypted] = parts;

    // Convert from base64
    const salt = Buffer.from(saltBase64, 'base64');
    const iv = Buffer.from(ivBase64, 'base64');
    const authTag = Buffer.from(authTagBase64, 'base64');

    // Derive key from password and salt
    const key = deriveKey(ENCRYPTION_KEY, salt);

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    // Decrypt the data
    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data. Invalid or corrupted encrypted data.');
  }
}

/**
 * Encrypts a JSON object
 * @param {object} obj - Object to encrypt
 * @returns {string} - Encrypted string
 */
function encryptObject(obj) {
  if (!obj) {
    return obj;
  }
  return encrypt(JSON.stringify(obj));
}

/**
 * Decrypts and parses a JSON object
 * @param {string} encryptedData - Encrypted string
 * @returns {object} - Decrypted object
 */
function decryptObject(encryptedData) {
  if (!encryptedData) {
    return encryptedData;
  }
  const decrypted = decrypt(encryptedData);
  try {
    return JSON.parse(decrypted);
  } catch (error) {
    // If it's not JSON, return as string
    return decrypted;
  }
}

/**
 * Checks if a string appears to be encrypted (has the expected format)
 * @param {string} data - Data to check
 * @returns {boolean} - True if data appears encrypted
 */
function isEncrypted(data) {
  if (typeof data !== 'string') {
    return false;
  }
  // Check if it matches the format: salt:iv:authTag:encryptedData
  const parts = data.split(':');
  return parts.length === 4 && parts.every(part => {
    try {
      Buffer.from(part, 'base64');
      return true;
    } catch {
      return false;
    }
  });
}

module.exports = {
  encrypt,
  decrypt,
  encryptObject,
  decryptObject,
  isEncrypted
};

