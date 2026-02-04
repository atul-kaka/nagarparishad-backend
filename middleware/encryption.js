/**
 * Encryption Middleware
 * Handles request decryption and response encryption
 * 
 * IMPORTANT: This middleware must NOT interfere with CORS preflight (OPTIONS) requests
 */

const crypto = require('crypto');

// Get encryption key from environment
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-change-in-production';
const ENABLE_ENCRYPTION = process.env.ENABLE_ENCRYPTION === 'true';

// Derive encryption key from password
function deriveKey(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
}

/**
 * Encrypt data
 */
function encrypt(plaintext) {
  if (!plaintext) return plaintext;
  
  const salt = crypto.randomBytes(16);
  const key = deriveKey(ENCRYPTION_KEY, salt);
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  
  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  
  const authTag = cipher.getAuthTag();
  
  // Combine salt, iv, authTag, and encrypted data
  return [
    salt.toString('base64'),
    iv.toString('base64'),
    authTag.toString('base64'),
    encrypted
  ].join(':');
}

/**
 * Decrypt data
 */
function decrypt(encryptedData) {
  if (!encryptedData) return encryptedData;
  
  try {
    const parts = encryptedData.split(':');
    if (parts.length !== 4) {
      throw new Error('Invalid encrypted data format');
    }
    
    const [saltBase64, ivBase64, authTagBase64, encrypted] = parts;
    const salt = Buffer.from(saltBase64, 'base64');
    const iv = Buffer.from(ivBase64, 'base64');
    const authTag = Buffer.from(authTagBase64, 'base64');
    
    const key = deriveKey(ENCRYPTION_KEY, salt);
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error.message);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * List of public routes that should never use encryption
 * These are public endpoints that need to be accessible without encryption overhead
 */
const PUBLIC_ROUTES = [
  '/api/students/view/',  // QR code public viewing
  '/health',              // Health check
  '/',                    // API info
  '/api-docs'             // Swagger docs
];

/**
 * Check if the current route is a public route that should skip encryption
 */
function isPublicRoute(path) {
  return PUBLIC_ROUTES.some(route => path.startsWith(route));
}

/**
 * Encryption Middleware
 * 
 * IMPORTANT: 
 * - Skips OPTIONS requests (CORS preflight) - these must pass through unchanged
 * - Skips public routes (QR code viewing, health checks, etc.) - these should not be encrypted
 * - Only processes requests with X-Encrypt-Request header or when ENABLE_ENCRYPTION=true
 * - Preserves CORS headers
 */
const encryptionMiddleware = (req, res, next) => {
  // CRITICAL: Skip OPTIONS requests (CORS preflight)
  // These must pass through unchanged to allow CORS to work
  if (req.method === 'OPTIONS') {
    return next();
  }
  
  // CRITICAL: Skip public routes - these should never be encrypted
  // Public routes like QR code viewing need to be accessible without encryption
  if (isPublicRoute(req.path)) {
    return next();
  }
  
  // Skip if encryption is disabled and no encryption header
  const shouldEncryptRequest = req.headers['x-encrypt-request'] === 'true' || ENABLE_ENCRYPTION;
  const shouldEncryptResponse = req.headers['x-encrypt-response'] === 'true' || ENABLE_ENCRYPTION;
  
  if (!shouldEncryptRequest && !shouldEncryptResponse) {
    return next();
  }
  
  // Decrypt request body if needed
  if (shouldEncryptRequest && req.body) {
    try {
      let encryptedData = null;
      
      // Check different formats of encrypted data
      if (typeof req.body === 'string') {
        // Body is a string (encrypted)
        encryptedData = req.body;
      } else if (req.body && typeof req.body === 'object') {
        // Check for encrypted field in object
        if (req.body.encrypted && typeof req.body.encrypted === 'string') {
          // Format: { encrypted: "encrypted_string_here" }
          encryptedData = req.body.encrypted;
        } else if (req.body.data && typeof req.body.data === 'string' && req.body.encrypted === true) {
          // Format: { encrypted: true, data: "encrypted_string_here" }
          encryptedData = req.body.data;
        }
      }
      
      // If we found encrypted data, decrypt it
      if (encryptedData) {
        const decrypted = decrypt(encryptedData);
        try {
          // Try to parse as JSON
          const parsed = JSON.parse(decrypted);
          req.body = parsed;
        } catch (e) {
          // If not JSON, use as-is (shouldn't happen for API requests)
          console.warn('Decrypted data is not JSON:', decrypted.substring(0, 100));
          req.body = { raw: decrypted };
        }
      }
      // If no encrypted data found but encryption header is set, log warning
      // This might be intentional (some endpoints might not need encryption)
      else if (req.headers['x-encrypt-request'] === 'true') {
        // Header says encrypt, but body doesn't have encrypted data
        // This is okay - maybe the endpoint doesn't require encryption
        // Or the body is already in plain format
      }
    } catch (error) {
      console.error('Request decryption error:', error);
      console.error('Request details:', {
        path: req.path,
        method: req.method,
        bodyType: typeof req.body,
        hasEncrypted: req.body && typeof req.body === 'object' && 'encrypted' in req.body,
        bodyKeys: req.body && typeof req.body === 'object' ? Object.keys(req.body) : null,
        encryptedValueType: req.body?.encrypted ? typeof req.body.encrypted : null
      });
      return res.status(400).json({
        success: false,
        error: 'Failed to decrypt request data',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
  
  // Encrypt response if needed
  if (shouldEncryptResponse) {
    const originalJson = res.json;
    res.json = function(data) {
      try {
        // Don't encrypt error responses or if data is already a string
        if (!data || typeof data === 'string') {
          return originalJson.call(this, data);
        }
        
        // Convert to JSON string first
        const jsonString = JSON.stringify(data);
        
        // Encrypt the JSON string
        const encrypted = encrypt(jsonString);
        
        // Send encrypted response
        return originalJson.call(this, {
          encrypted: true,
          data: encrypted
        });
      } catch (error) {
        console.error('Response encryption error:', error);
        // Fall back to unencrypted response
        return originalJson.call(this, data);
      }
    };
  }
  
  next();
};

module.exports = {
  encryptionMiddleware,
  encrypt,
  decrypt
};

