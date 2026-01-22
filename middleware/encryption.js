const { encrypt, decrypt, encryptObject, decryptObject, isEncrypted } = require('../utils/encryption');

/**
 * Middleware to handle request/response encryption
 * 
 * Configuration:
 * - Set ENABLE_ENCRYPTION=true in .env to enable encryption globally
 * - Or use X-Encrypt-Request header to enable per-request encryption
 * - Set X-Encrypt-Response header to enable response encryption
 */

// Check if encryption is enabled globally
const ENCRYPTION_ENABLED = process.env.ENABLE_ENCRYPTION === 'true';

// Endpoints that should skip encryption (health checks, etc.)
const SKIP_ENCRYPTION_PATHS = ['/health', '/', '/api-docs'];

// Log encryption status on startup
if (ENCRYPTION_ENABLED) {
  console.log('🔐 Encryption is ENABLED globally - All requests must be encrypted');
} else {
  console.log('🔓 Encryption is DISABLED - Use headers or enable globally');
}

/**
 * Middleware to decrypt incoming request bodies
 */
function decryptRequest(req, res, next) {
  try {
    // Skip encryption for certain paths
    if (SKIP_ENCRYPTION_PATHS.includes(req.path)) {
      return next();
    }

    // Check if encryption is enabled globally or via header
    const shouldDecrypt = ENCRYPTION_ENABLED || req.headers['x-encrypt-request'] === 'true';

    if (!shouldDecrypt) {
      return next();
    }

    // For GET requests or requests without body, skip decryption
    if (req.method === 'GET' || !req.body || Object.keys(req.body).length === 0) {
      return next();
    }

    // Check if body contains encrypted data
    // The encrypted data might be in a specific field or the entire body might be encrypted
    let decrypted = null;
    
    if (req.body.encrypted) {
      // If body has an 'encrypted' field, decrypt it
      try {
        decrypted = decryptObject(req.body.encrypted);
      } catch (error) {
        return res.status(400).json({
          success: false,
          error: 'Failed to decrypt request payload: ' + error.message
        });
      }
    } else if (typeof req.body === 'string' && isEncrypted(req.body)) {
      // If the entire body is a string and appears encrypted, decrypt it
      try {
        decrypted = decryptObject(req.body);
      } catch (error) {
        return res.status(400).json({
          success: false,
          error: 'Failed to decrypt request payload: ' + error.message
        });
      }
    } else if (req.body.data && typeof req.body.data === 'string' && isEncrypted(req.body.data)) {
      // If body has a 'data' field that's encrypted, decrypt it
      try {
        decrypted = decryptObject(req.body.data);
      } catch (error) {
        return res.status(400).json({
          success: false,
          error: 'Failed to decrypt request payload: ' + error.message
        });
      }
    } else if (ENCRYPTION_ENABLED) {
      // If global encryption is enabled but body doesn't appear encrypted, return error
      return res.status(400).json({
        success: false,
        error: 'Encryption is required. Request body must be encrypted. Expected format: {"encrypted": "encrypted-data"}'
      });
    }

    // Replace body with decrypted data if decryption was successful
    if (decrypted) {
      req.body = decrypted;
    }

    next();
  } catch (error) {
    console.error('Request decryption error:', error);
    return res.status(500).json({
      success: false,
      error: 'Request decryption failed'
    });
  }
}

/**
 * Middleware to encrypt outgoing response bodies
 */
function encryptResponse(req, res, next) {
  // Skip encryption for certain paths
  if (SKIP_ENCRYPTION_PATHS.includes(req.path)) {
    return next();
  }

  // Store original json method
  const originalJson = res.json.bind(res);

  // Override res.json to encrypt the response
  res.json = function (data) {
    try {
      // Check if encryption is enabled globally or via header
      const shouldEncrypt = ENCRYPTION_ENABLED || req.headers['x-encrypt-response'] === 'true';

      if (!shouldEncrypt) {
        return originalJson(data);
      }

      // Encrypt the response data
      let encryptedData;
      if (data && typeof data === 'object') {
        encryptedData = {
          encrypted: encryptObject(data),
          encrypted_at: new Date().toISOString()
        };
      } else {
        encryptedData = {
          encrypted: encrypt(String(data)),
          encrypted_at: new Date().toISOString()
        };
      }

      // Set header to indicate encrypted response
      res.setHeader('X-Response-Encrypted', 'true');

      return originalJson(encryptedData);
    } catch (error) {
      console.error('Response encryption error:', error);
      // If encryption fails, send original response
      return originalJson(data);
    }
  };

  next();
}

/**
 * Combined middleware for both request decryption and response encryption
 */
function encryptionMiddleware(req, res, next) {
  // First decrypt the request
  decryptRequest(req, res, (err) => {
    if (err) {
      return next(err);
    }
    // Then set up response encryption
    encryptResponse(req, res, next);
  });
}

module.exports = {
  decryptRequest,
  encryptResponse,
  encryptionMiddleware
};

