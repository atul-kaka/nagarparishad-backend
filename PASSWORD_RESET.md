# Password Reset Service Documentation

## Overview

Password reset functionality for Admin and Super Admin users. Includes password reset via email and password change for authenticated users.

## Features

1. **Password Reset Request** - Request reset token via email (Admin/Super Admin only)
2. **Password Reset Verify** - Verify token and set new password
3. **Password Change** - Change password when logged in (all authenticated users)

---

## Endpoints

### 1. Request Password Reset

**POST** `/api/auth/password/reset/request`

Request a password reset token. Token is sent via email.

**Authentication Required:** No  
**Role Required:** Admin or Super Admin only

#### Request

```json
{
  "email": "admin@example.com"
}
```

#### Response

**Success (200):**
```json
{
  "success": true,
  "message": "Password reset link has been sent to your email"
}
```

**Development Mode:**
```json
{
  "success": true,
  "message": "Password reset link has been sent to your email",
  "token": "abc123def456...",
  "expires_at": "2024-01-19T18:00:00.000Z"
}
```

#### Example

```bash
curl -X POST http://api.kaamlo.com/api/auth/password/reset/request \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com"}'
```

---

### 2. Verify Reset Token and Reset Password

**POST** `/api/auth/password/reset/verify`

Verify the reset token and set a new password.

**Authentication Required:** No

#### Request

```json
{
  "token": "abc123def456...",
  "new_password": "NewSecurePassword123!"
}
```

#### Response

**Success (200):**
```json
{
  "success": true,
  "message": "Password has been reset successfully. Please login with your new password."
}
```

**Error (400):**
```json
{
  "success": false,
  "error": "Invalid reset token"
}
```

#### Example

```bash
curl -X POST http://api.kaamlo.com/api/auth/password/reset/verify \
  -H "Content-Type: application/json" \
  -d '{
    "token": "abc123def456...",
    "new_password": "NewSecurePassword123!"
  }'
```

---

### 3. Change Password (Authenticated)

**POST** `/api/auth/password/change`

Change password for authenticated users. Requires current password.

**Authentication Required:** Yes

#### Request

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Body:**
```json
{
  "current_password": "OldPassword123!",
  "new_password": "NewSecurePassword123!"
}
```

#### Response

**Success (200):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Error (400):**
```json
{
  "success": false,
  "error": "Current password is incorrect"
}
```

#### Example

```bash
curl -X POST http://api.kaamlo.com/api/auth/password/change \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "current_password": "OldPassword123!",
    "new_password": "NewSecurePassword123!"
  }'
```

---

## Setup Instructions

### Step 1: Run Migration

```bash
npm run migrate-password-reset
```

This adds:
- `reset_token` column to users table
- `reset_token_expires_at` column to users table
- Index for faster token lookups

### Step 2: Configure Email Service (Optional)

For production, integrate with an email service. The service includes a placeholder for Nodemailer.

**Example with Nodemailer:**

1. Install Nodemailer:
```bash
npm install nodemailer
```

2. Update `.env`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@nagarparishad.gov.in
FRONTEND_URL=https://your-frontend.com
```

3. Uncomment email code in `services/passwordResetService.js`

---

## Security Features

1. **Token Expiration**: Reset tokens expire after 1 hour
2. **Single Use**: Tokens are cleared after successful password reset
3. **Role Restriction**: Only Admin and Super Admin can request password reset
4. **Password Hashing**: Passwords are hashed with bcrypt
5. **Account Unlock**: Password reset automatically unlocks locked accounts
6. **Audit Logging**: All password changes are logged

---

## Password Reset Flow

### Flow 1: Email-Based Reset

1. User requests password reset with email
2. System generates secure token
3. Token is sent to user's email
4. User clicks link in email (contains token)
5. User enters new password
6. System verifies token and resets password
7. Token is invalidated

### Flow 2: Direct Token Reset

1. User requests password reset
2. System generates token (returned in dev mode)
3. User uses token directly to reset password
4. System verifies token and resets password

---

## Password Change Flow

1. User is logged in
2. User provides current password
3. System verifies current password
4. System updates to new password
5. Password change is logged

---

## Token Security

- **Length**: 64 characters (32 bytes hex)
- **Expiration**: 1 hour
- **Storage**: Hashed in database (optional enhancement)
- **Single Use**: Token cleared after use

---

## Error Handling

### Invalid Token
```json
{
  "success": false,
  "error": "Invalid reset token"
}
```

### Expired Token
```json
{
  "success": false,
  "error": "Reset token has expired"
}
```

### Role Restriction
```json
{
  "success": false,
  "error": "Password reset is only available for Admin and Super Admin"
}
```

### Weak Password
```json
{
  "success": false,
  "errors": [
    {
      "msg": "Password must be at least 6 characters",
      "param": "new_password"
    }
  ]
}
```

---

## Integration Example

### Frontend Integration

```javascript
// Request password reset
async function requestPasswordReset(email) {
  const response = await fetch('http://api.kaamlo.com/api/auth/password/reset/request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  return await response.json();
}

// Reset password with token
async function resetPassword(token, newPassword) {
  const response = await fetch('http://api.kaamlo.com/api/auth/password/reset/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, new_password: newPassword })
  });
  return await response.json();
}

// Change password (authenticated)
async function changePassword(currentPassword, newPassword, token) {
  const response = await fetch('http://api.kaamlo.com/api/auth/password/change', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword
    })
  });
  return await response.json();
}
```

---

## Testing

### Test Password Reset

```bash
# 1. Request reset
curl -X POST http://api.kaamlo.com/api/auth/password/reset/request \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com"}'

# 2. Use token from response (dev mode) or email
curl -X POST http://api.kaamlo.com/api/auth/password/reset/verify \
  -H "Content-Type: application/json" \
  -d '{
    "token": "TOKEN_FROM_EMAIL_OR_DEV_RESPONSE",
    "new_password": "NewPassword123!"
  }'
```

### Test Password Change

```bash
# 1. Login
TOKEN=$(curl -X POST http://api.kaamlo.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  | jq -r '.data.token')

# 2. Change password
curl -X POST http://api.kaamlo.com/api/auth/password/change \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "current_password": "admin123",
    "new_password": "NewPassword123!"
  }'
```

---

## Database Schema

### New Columns in `users` Table

- `reset_token` (VARCHAR 255) - Password reset token
- `reset_token_expires_at` (TIMESTAMP) - Token expiration

### Index

- `idx_users_reset_token` - Index on reset_token for faster lookups

---

## Notes

1. **Email Integration**: Currently logs to console. Integrate with email service for production.
2. **Token Security**: Tokens are stored in plain text. Consider hashing for enhanced security.
3. **Rate Limiting**: Consider adding rate limiting to prevent abuse.
4. **Password Policy**: Minimum 6 characters. Consider adding complexity requirements.
5. **Account Unlock**: Password reset automatically unlocks locked accounts.

---

## Environment Variables

```env
# Frontend URL for reset links
FRONTEND_URL=https://your-frontend.com

# Email service (if using Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@nagarparishad.gov.in
```

---

**Last Updated:** 2024



