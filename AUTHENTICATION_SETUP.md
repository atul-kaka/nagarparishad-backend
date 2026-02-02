# Authentication Setup Summary

## Overview

All API endpoints now require authentication (JWT token) **except** the QR code scan API.

## Public Endpoints (No Authentication Required)

### 1. QR Code Scan API
- **Route**: `GET /api/students/view/:hash`
- **Purpose**: Public access to student data via QR code
- **Authentication**: ❌ Not required
- **Example**: 
  ```bash
  GET /api/students/view/8cc502f56d04e9d61c33e7ea332399b8dc1528ba516bc1ee2e7afc7d6e128337
  ```

### 2. Authentication Endpoints
- **Routes**: `/api/auth/*`
  - `POST /api/auth/register` - Register (requires Super Admin token)
  - `POST /api/auth/login` - Login (no auth required)
  - `POST /api/auth/otp/send` - Send OTP (no auth required)
  - `POST /api/auth/otp/verify` - Verify OTP (no auth required)
  - `POST /api/auth/refresh` - Refresh token (requires token)
  - `POST /api/auth/logout` - Logout (requires token)

### 3. Health Check
- **Route**: `GET /health`
- **Purpose**: Server health check
- **Authentication**: ❌ Not required

### 4. API Info
- **Route**: `GET /`
- **Purpose**: API information
- **Authentication**: ❌ Not required

## Protected Endpoints (Authentication Required)

All other endpoints require a valid JWT token in the request header.

### Students Routes (`/api/students`)
- ✅ `GET /api/students` - List all students
- ✅ `GET /api/students/search` - Search students (query params)
- ✅ `POST /api/students/search` - Search students (body)
- ✅ `GET /api/students/stats` - Get statistics
- ✅ `GET /api/students/:id` - Get student by ID
- ✅ `GET /api/students/search/:identifier` - Search by identifier
- ✅ `POST /api/students/consolidated` - Create student
- ✅ `PUT /api/students/:id` - Update student
- ✅ `DELETE /api/students/:id` - Delete student
- ❌ `GET /api/students/view/:hash` - **PUBLIC** (QR code scan)

### Schools Routes (`/api/schools`)
- ✅ `GET /api/schools` - List all schools
- ✅ `GET /api/schools/:id` - Get school by ID
- ✅ `POST /api/schools` - Create school
- ✅ `PUT /api/schools/:id` - Update school
- ✅ `DELETE /api/schools/:id` - Delete school

### Users Routes (`/api/users`)
- ✅ `GET /api/users` - List all users
- ✅ `GET /api/users/:id` - Get user by ID
- ✅ `POST /api/users` - Create user (requires Super Admin)
- ✅ `PUT /api/users/:id` - Update user
- ✅ `DELETE /api/users/:id` - Delete user

### Audit Routes (`/api/audit`)
- ✅ `GET /api/audit` - Get audit logs
- ✅ `GET /api/audit/:table_name/:record_id` - Get audit logs for record

### Certificate Routes (`/api/certificates`)
- ✅ `GET /api/certificates` - List certificates
- ✅ `GET /api/certificates/:id` - Get certificate by ID
- ✅ `GET /api/certificates/school/:schoolId/serial/:serialNo` - Get by serial
- ✅ `POST /api/certificates` - Create certificate
- ✅ `PUT /api/certificates/:id` - Update certificate
- ✅ `PATCH /api/certificates/:id/status` - Update status
- ✅ `DELETE /api/certificates/:id` - Delete certificate

### Certificate Status Routes (`/api/certificates`)
- ✅ `PATCH /api/certificates/:id/status` - Update status
- ✅ `GET /api/certificates/:id/status-history` - Get status history

### Certificate Bulk Routes (`/api/certificates`)
- ✅ `POST /api/certificates/bulk` - Bulk create certificates

## How to Use Authentication

### 1. Login to Get Token

```bash
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "your_password"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "admin"
  }
}
```

### 2. Use Token in Requests

```bash
GET /api/students
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Or in headers:
```bash
Authorization: Bearer <your_token>
```

### 3. QR Code Scan (No Token Required)

```bash
GET /api/students/view/8cc502f56d04e9d61c33e7ea332399b8dc1528ba516bc1ee2e7afc7d6e128337
# No Authorization header needed
```

## Error Responses

### Missing Token
```json
{
  "success": false,
  "error": "Authentication required. Please provide a valid token."
}
```
**Status Code:** 401

### Invalid/Expired Token
```json
{
  "success": false,
  "error": "Invalid or expired token"
}
```
**Status Code:** 401

### Account Deactivated
```json
{
  "success": false,
  "error": "Account is deactivated"
}
```
**Status Code:** 403

## Frontend Integration

### Store Token After Login

```javascript
// After successful login
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username, password })
});

const data = await response.json();
if (data.success) {
  localStorage.setItem('token', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));
}
```

### Include Token in Requests

```javascript
// For authenticated requests
const token = localStorage.getItem('token');
const response = await fetch('/api/students', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

### QR Code Scan (No Token)

```javascript
// Public endpoint - no token needed
const response = await fetch(`/api/students/view/${qrCodeHash}`);
const data = await response.json();
```

## Testing

### Test Authenticated Endpoint

```bash
# Get token first
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}' \
  | jq -r '.token')

# Use token
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/students
```

### Test QR Code (No Auth)

```bash
curl http://localhost:3000/api/students/view/8cc502f56d04e9d61c33e7ea332399b8dc1528ba516bc1ee2e7afc7d6e128337
```

## Summary

✅ **All APIs require authentication** except:
- QR code scan API (`/api/students/view/:hash`)
- Authentication endpoints (`/api/auth/login`, `/api/auth/otp/*`)
- Health check (`/health`)
- API info (`/`)

✅ **QR code scan remains public** for easy access via QR code scanning

✅ **All other endpoints** require valid JWT token in `Authorization: Bearer <token>` header

