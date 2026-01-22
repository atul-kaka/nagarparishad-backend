# Request/Response Encryption Guide

This guide explains how to use the encryption feature for API requests and responses.

## Overview

The API supports end-to-end encryption for request and response payloads using AES-256-GCM encryption. This ensures that sensitive data is encrypted in transit and can only be decrypted by parties with the correct encryption key.

## Configuration

### Environment Variables

Add the following to your `.env` file:

```env
# Encryption Configuration
ENCRYPTION_KEY=your-32-byte-or-longer-secret-key-here
ENABLE_ENCRYPTION=false
```

**Important:**
- `ENCRYPTION_KEY`: A secure random string (at least 32 characters recommended). Generate one using:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- `ENABLE_ENCRYPTION`: Set to `true` to enable encryption globally for all requests/responses, or `false` to use per-request headers

### Generating an Encryption Key

You can generate a secure encryption key using Node.js:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Or using OpenSSL:

```bash
openssl rand -hex 32
```

## Quick Start: Enable Global Encryption

To enable encryption for **ALL requests and responses**, simply set in your `.env` file:

```env
ENABLE_ENCRYPTION=true
ENCRYPTION_KEY=your-secure-encryption-key-here
```

Once enabled:
- ✅ **All incoming requests MUST be encrypted** (except GET requests and health check endpoints)
- ✅ **All outgoing responses WILL be encrypted automatically**
- ✅ No need to send headers - encryption is automatic

**Note:** When global encryption is enabled, unencrypted requests will be rejected with a 400 error.

## Usage Modes

### Mode 1: Global Encryption (Recommended for Production)

Set `ENABLE_ENCRYPTION=true` in your `.env` file. All requests and responses will be automatically encrypted/decrypted.

**Important:** When global encryption is enabled:
- All POST/PUT/PATCH/DELETE requests **must** send encrypted payloads
- GET requests are not encrypted (no body to encrypt)
- Health check endpoints (`/health`, `/`) are excluded from encryption
- All responses will be automatically encrypted

### Mode 2: Per-Request Encryption (Flexible)

Set `ENABLE_ENCRYPTION=false` and use headers to control encryption per request:

- **Request Encryption**: Send `X-Encrypt-Request: true` header to encrypt the request payload
- **Response Encryption**: Send `X-Encrypt-Response: true` header to request encrypted response

## Request Format

### Encrypted Request Body

When sending an encrypted request, wrap your payload in an `encrypted` field:

```json
{
  "encrypted": "salt:iv:authTag:encryptedData"
}
```

Or send the encrypted string directly if the entire body is encrypted.

### Example: Encrypted Registration Request

**Before Encryption:**
```json
{
  "username": "admin",
  "email": "admin@example.com",
  "password": "admin123",
  "role": "admin"
}
```

**After Encryption (what you send):**
```json
{
  "encrypted": "base64salt:base64iv:base64authTag:base64encryptedData"
}
```

## Response Format

### Encrypted Response Body

Encrypted responses will have the following format:

```json
{
  "encrypted": "salt:iv:authTag:encryptedData",
  "encrypted_at": "2024-01-15T10:30:00.000Z"
}
```

The `X-Response-Encrypted: true` header will be included in the response.

### Example: Decrypting Response

**Encrypted Response:**
```json
{
  "encrypted": "base64salt:base64iv:base64authTag:base64encryptedData",
  "encrypted_at": "2024-01-15T10:30:00.000Z"
}
```

**After Decryption:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com"
  }
}
```

## Client-Side Implementation

### JavaScript/Node.js Example

```javascript
const crypto = require('crypto');
const axios = require('axios');

// Encryption functions (same as server-side)
function deriveKey(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
}

function encrypt(text, encryptionKey) {
  const salt = crypto.randomBytes(64);
  const iv = crypto.randomBytes(16);
  const key = deriveKey(encryptionKey, salt);
  
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const authTag = cipher.getAuthTag();
  
  return [
    salt.toString('base64'),
    iv.toString('base64'),
    authTag.toString('base64'),
    encrypted
  ].join(':');
}

function decrypt(encryptedData, encryptionKey) {
  const parts = encryptedData.split(':');
  const salt = Buffer.from(parts[0], 'base64');
  const iv = Buffer.from(parts[1], 'base64');
  const authTag = Buffer.from(parts[2], 'base64');
  const encrypted = parts[3];
  
  const key = deriveKey(encryptionKey, salt);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

// Example: Send encrypted request
async function sendEncryptedRequest() {
  const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
  const payload = {
    username: "admin",
    email: "admin@example.com",
    password: "admin123"
  };
  
  // Encrypt the payload
  const encryptedPayload = {
    encrypted: encrypt(JSON.stringify(payload), ENCRYPTION_KEY)
  };
  
  // Send request
  const response = await axios.post('https://api.example.com/api/auth/register', encryptedPayload, {
    headers: {
      'Content-Type': 'application/json',
      'X-Encrypt-Request': 'true',
      'X-Encrypt-Response': 'true'
    }
  });
  
  // Decrypt response if encrypted
  if (response.headers['x-response-encrypted'] === 'true') {
    const decrypted = JSON.parse(decrypt(response.data.encrypted, ENCRYPTION_KEY));
    console.log('Decrypted response:', decrypted);
  } else {
    console.log('Response:', response.data);
  }
}
```

### cURL Example

```bash
# First, encrypt your payload (using Node.js script or your encryption library)
# Then send the encrypted payload:

curl -X POST https://api.example.com/api/auth/register \
  -H "Content-Type: application/json" \
  -H "X-Encrypt-Request: true" \
  -H "X-Encrypt-Response: true" \
  -d '{
    "encrypted": "your-encrypted-payload-here"
  }'
```

## Security Considerations

1. **Key Management**: 
   - Never commit the encryption key to version control
   - Use environment variables or secure key management services
   - Rotate keys periodically

2. **HTTPS**: 
   - Always use HTTPS in production, even with payload encryption
   - Encryption adds an extra layer but doesn't replace TLS

3. **Key Sharing**: 
   - Securely share the encryption key with authorized clients
   - Consider using different keys for different clients/environments

4. **Error Handling**: 
   - Failed decryption will return a 400 error
   - Log encryption/decryption errors for monitoring

## Testing

### Test with Encryption Disabled

```bash
# Normal request (no encryption)
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test",
    "email": "test@example.com",
    "password": "test123"
  }'
```

### Test with Per-Request Encryption

```bash
# Encrypted request (requires encryption library on client side)
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -H "X-Encrypt-Request: true" \
  -H "X-Encrypt-Response: true" \
  -d '{
    "encrypted": "encrypted-payload-here"
  }'
```

## Troubleshooting

### Error: "Failed to decrypt request payload"
- Check that the encryption key matches between client and server
- Verify the encrypted payload format is correct
- Ensure the payload hasn't been corrupted

### Error: "Invalid encrypted data format"
- The encrypted data must be in format: `salt:iv:authTag:encryptedData`
- All parts must be base64 encoded
- Check that the entire encrypted string is being sent

### Response not encrypted
- Verify `ENABLE_ENCRYPTION=true` or `X-Encrypt-Response: true` header is set
- Check server logs for encryption errors
- Ensure the response middleware is properly configured

## API Endpoints

All API endpoints support encryption when properly configured:
- `/api/auth/*` - Authentication endpoints
- `/api/schools/*` - School management
- `/api/students/*` - Student management
- `/api/certificates/*` - Certificate management
- `/api/users/*` - User management

## Support

For issues or questions about encryption, please check:
1. Server logs for encryption/decryption errors
2. Environment variable configuration
3. Client-side encryption implementation

