# How to Enable Global Encryption

This is a quick guide to enable encryption for all API requests and responses.

## Step 1: Generate an Encryption Key

Generate a secure encryption key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Or using OpenSSL:

```bash
openssl rand -hex 32
```

## Step 2: Update .env File

Add these lines to your `.env` file:

```env
# Enable encryption for all requests/responses
ENABLE_ENCRYPTION=true

# Your encryption key (use the key generated in Step 1)
ENCRYPTION_KEY=your-generated-key-here
```

## Step 3: Restart the Server

Restart your server to apply the changes:

```bash
npm start
# or
npm run dev
```

You should see this message in the console:
```
🔐 Encryption: ENABLED (All requests must be encrypted)
```

## What Happens When Enabled?

✅ **All incoming requests** (POST, PUT, PATCH, DELETE) must be encrypted  
✅ **All outgoing responses** are automatically encrypted  
✅ **GET requests** are not affected (no body to encrypt)  
✅ **Health check endpoints** (`/health`, `/`) are excluded  

## Request Format

When encryption is enabled, you must send requests in this format:

```json
{
  "encrypted": "salt:iv:authTag:encryptedData"
}
```

## Response Format

All responses will be encrypted:

```json
{
  "encrypted": "salt:iv:authTag:encryptedData",
  "encrypted_at": "2024-01-15T10:30:00.000Z"
}
```

The response will include header: `X-Response-Encrypted: true`

## Testing

Use the encryption utility script to encrypt your payloads:

```bash
# Encrypt a payload
node scripts/encrypt-payload.js encrypt '{"username":"test","password":"test123"}'

# The output will show the encrypted format to use in your request
```

## Disable Encryption

To disable global encryption, set:

```env
ENABLE_ENCRYPTION=false
```

Or remove the line from `.env` file.

## Important Notes

1. **Key Security**: Never commit your `ENCRYPTION_KEY` to version control
2. **Key Sharing**: Securely share the encryption key with your clients
3. **HTTPS**: Always use HTTPS in production, even with payload encryption
4. **Error Handling**: Unencrypted requests will return 400 error when encryption is enabled

## Need Help?

See the full [ENCRYPTION_GUIDE.md](./ENCRYPTION_GUIDE.md) for detailed documentation and examples.

