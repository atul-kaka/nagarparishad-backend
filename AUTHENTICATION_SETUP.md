# Global Authentication Setup

All API endpoints are now protected by authentication. Users must login before accessing any API endpoint.

## Public Endpoints (No Authentication Required)

The following endpoints are publicly accessible and do not require authentication:

1. **Health Check**
   - `GET /health` - Server health check
   - `GET /` - API information

2. **Authentication Endpoints**
   - `POST /api/auth/login` - User login
   - `POST /api/auth/otp/request` - Request OTP for login
   - `POST /api/auth/otp/verify` - Verify OTP and login
   - `POST /api/auth/token/refresh` - Refresh access token
   - `POST /api/auth/password/reset/request` - Request password reset
   - `POST /api/auth/password/reset/verify` - Verify password reset token

3. **Documentation**
   - `GET /api-docs` - Swagger API documentation

## Protected Endpoints (Authentication Required)

All other endpoints require a valid JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Examples of Protected Endpoints:

- `GET /api/schools` - List schools
- `POST /api/schools` - Create school
- `GET /api/students` - List students
- `POST /api/students` - Create student
- `GET /api/certificates` - List certificates
- `POST /api/certificates` - Create certificate
- `POST /api/auth/register` - Register new user (Super Admin only)
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/password/change` - Change password
- All `/api/users/*` endpoints
- All `/api/audit/*` endpoints

## How It Works

1. **Global Authentication Middleware** (`middleware/globalAuth.js`)
   - Applied to all routes automatically
   - Checks if the requested path is in the public paths list
   - If public, allows the request to proceed
   - If protected, requires valid JWT token

2. **Authentication Flow**
   ```
   Client → API Request
   ↓
   Global Auth Middleware checks path
   ↓
   If public → Allow
   If protected → Check JWT token
   ↓
   Valid token → Allow
   Invalid/Missing token → Return 401 Unauthorized
   ```

## Error Responses

### Missing Token
```json
{
  "success": false,
  "error": "Authentication required. Please provide a valid token."
}
```
Status: `401 Unauthorized`

### Invalid/Expired Token
```json
{
  "success": false,
  "error": "Invalid or expired token"
}
```
Status: `401 Unauthorized`

### Deactivated Account
```json
{
  "success": false,
  "error": "Account is deactivated"
}
```
Status: `403 Forbidden`

## Usage Example

### 1. Login to get token
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

Response:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": { ... }
  }
}
```

### 2. Use token for protected endpoints
```bash
curl -X GET http://localhost:3000/api/schools \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## Configuration

The authentication is enabled by default. No configuration needed.

To modify public endpoints, edit `middleware/globalAuth.js`:

```javascript
const PUBLIC_PATHS = [
  '/health',
  '/',
  '/api-docs',
  '/api/auth/login',
  // Add more public paths here
];
```

## Security Notes

1. **Always use HTTPS** in production to protect tokens in transit
2. **Token Expiration**: Tokens expire after 15 minutes (configurable via `JWT_EXPIRES_IN`)
3. **Token Refresh**: Use `/api/auth/token/refresh` to get a new token
4. **Session Management**: Active sessions are tracked in the database
5. **Account Status**: Deactivated accounts cannot access the API

## Testing

### Test Public Endpoint (Should Work)
```bash
curl http://localhost:3000/health
```

### Test Protected Endpoint Without Token (Should Fail)
```bash
curl http://localhost:3000/api/schools
# Returns: 401 Unauthorized
```

### Test Protected Endpoint With Token (Should Work)
```bash
curl http://localhost:3000/api/schools \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Troubleshooting

### "Authentication required" error on public endpoint
- Check that the path is exactly as listed in `PUBLIC_PATHS`
- Verify the middleware is correctly configured

### Token works but still getting 401
- Check token expiration (tokens expire after 15 minutes)
- Verify account is active (`is_active = true`)
- Check password expiration if enabled

### Can't access after login
- Verify token is being sent in `Authorization: Bearer <token>` header
- Check server logs for authentication errors
- Ensure token format is correct (no extra spaces or quotes)

