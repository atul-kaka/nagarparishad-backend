/**
 * Utility script to encrypt/decrypt payloads for testing
 * Usage:
 *   node scripts/encrypt-payload.js encrypt '{"username":"test","password":"test123"}'
 *   node scripts/encrypt-payload.js decrypt 'encrypted-string-here'
 */

require('dotenv').config();
const crypto = require('crypto');

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-change-in-production';
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 64;

function deriveKey(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
}

function encrypt(text) {
  if (!text) {
    return text;
  }

  const plaintext = typeof text === 'string' ? text : JSON.stringify(text);
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = deriveKey(ENCRYPTION_KEY, salt);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const authTag = cipher.getAuthTag();

  const result = [
    salt.toString('base64'),
    iv.toString('base64'),
    authTag.toString('base64'),
    encrypted
  ].join(':');

  return result;
}

function decrypt(encryptedData) {
  if (!encryptedData) {
    return encryptedData;
  }

  const parts = encryptedData.split(':');
  if (parts.length !== 4) {
    throw new Error('Invalid encrypted data format');
  }

  const [saltBase64, ivBase64, authTagBase64, encrypted] = parts;
  const salt = Buffer.from(saltBase64, 'base64');
  const iv = Buffer.from(ivBase64, 'base64');
  const authTag = Buffer.from(authTagBase64, 'base64');
  const key = deriveKey(ENCRYPTION_KEY, salt);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'base64', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

// Command line interface
const command = process.argv[2];
const data = process.argv[3];

if (!command || !data) {
  console.log('Usage:');
  console.log('  Encrypt: node scripts/encrypt-payload.js encrypt \'{"key":"value"}\'');
  console.log('  Decrypt: node scripts/encrypt-payload.js decrypt \'encrypted-string\'');
  process.exit(1);
}

try {
  if (command === 'encrypt') {
    const encrypted = encrypt(data);
    console.log('\nEncrypted payload:');
    console.log(encrypted);
    console.log('\nJSON format (for API request):');
    console.log(JSON.stringify({ encrypted: encrypted }, null, 2));
  } else if (command === 'decrypt') {
    const decrypted = decrypt(data);
    console.log('\nDecrypted payload:');
    console.log(decrypted);
    // Try to parse as JSON
    try {
      const parsed = JSON.parse(decrypted);
      console.log('\nParsed JSON:');
      console.log(JSON.stringify(parsed, null, 2));
    } catch (e) {
      // Not JSON, that's okay
    }
  } else {
    console.error('Unknown command. Use "encrypt" or "decrypt"');
    process.exit(1);
  }
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}

