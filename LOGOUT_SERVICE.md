# Logout Service Documentation

## Overview

The logout service provides secure session management and logout functionality for authenticated users.

## Endpoints

### 1. Logout (Current Session)

**POST** `/api/auth/logout`

Logs out the user from the current session and invalidates the token.

**Authentication Required:** Yes

#### Request

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

#### Response

**Success (200):**
```json
{
  "success": true,
  "message": "Logged out successfully",
  "data": {
    "user_id": 1,
    "username": "admin",
    "logged_out_at": "2024-01-19T16:30:00.000Z"
  }
}
```

**Error (401):**
```json
{
  "success": false,
  "error": "Authentication required"
}
```

#### Example

```bash
curl -X POST http://api.kaamlo.com/api/auth/logout \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

### 2. Logout from All Devices

**POST** `/api/auth/logout/all`

Logs out the user from all active sessions across all devices.

**Authentication Required:** Yes

#### Request

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

#### Response

**Success (200):**
```json
{
  "success": true,
  "message": "Logged out from all devices successfully",
  "data": {
    "user_id": 1,
    "username": "admin",
    "logged_out_at": "2024-01-19T16:30:00.000Z"
  }
}
```

#### Example

```bash
curl -X POST http://api.kaamlo.com/api/auth/logout/all \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Features

### 1. Session Invalidation
- Invalidates the current session token
- Marks session as inactive in the database
- Prevents further use of the token

### 2. Audit Logging
- Logs all logout actions
- Records IP address and location
- Tracks logout timestamp

### 3. Multi-Device Support
- Logout from current device only
- Logout from all devices at once
- Track active sessions per user

### 4. Error Handling
- Graceful handling of missing tables
- Non-blocking audit logging
- Clear error messages

---

## How It Works

### Single Logout Flow

1. User sends logout request with token
2. System validates token and identifies user
3. Session is marked as inactive in `login_sessions` table
4. Logout action is recorded in audit logs
5. Success response is returned

### Logout All Flow

1. User sends logout all request with token
2. System validates token and identifies user
3. All sessions for the user are marked as inactive
4. Logout action is recorded in audit logs
5. Success response is returned

---

## Security Features

1. **Token Validation**: Only valid tokens can be used to logout
2. **Session Tracking**: All sessions are tracked in the database
3. **Audit Trail**: All logout actions are logged
4. **Multi-Device Management**: Users can logout from all devices

---

## Use Cases

### Use Case 1: Normal Logout
User wants to logout from the current device/session.

```bash
POST /api/auth/logout
Authorization: Bearer {token}
```

### Use Case 2: Security Logout
User suspects unauthorized access and wants to logout from all devices.

```bash
POST /api/auth/logout/all
Authorization: Bearer {token}
```

### Use Case 3: Session Management
User wants to see active sessions and logout from specific devices.

```bash
# Get active sessions
GET /api/auth/sessions
Authorization: Bearer {token}

# Logout from all
POST /api/auth/logout/all
Authorization: Bearer {token}
```

---

## Integration Example

### Frontend Integration

```javascript
// Logout function
async function logout() {
  try {
    const response = await fetch('http://api.kaamlo.com/api/auth/logout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Remove token from storage
      localStorage.removeItem('token');
      // Redirect to login
      window.location.href = '/login';
    }
  } catch (error) {
    console.error('Logout error:', error);
  }
}

// Logout from all devices
async function logoutAll() {
  try {
    const response = await fetch('http://api.kaamlo.com/api/auth/logout/all', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
  } catch (error) {
    console.error('Logout all error:', error);
  }
}
```

---

## Database Tables

### login_sessions
Stores active user sessions:
- `session_token`: JWT token
- `user_id`: User ID
- `is_active`: Session status
- `expires_at`: Session expiration

### audit_logs
Logs logout actions:
- `action_type`: 'logout'
- `changed_by`: User ID
- `ip_address`: Client IP
- `location`: Geographic location

---

## Notes

1. **Token After Logout**: Tokens become invalid after logout, but JWT tokens themselves don't expire until their expiration time. The session tracking ensures they can't be used.

2. **Graceful Degradation**: If `login_sessions` table doesn't exist, logout still works but session tracking is skipped.

3. **Audit Logging**: Logout actions are logged even if session invalidation fails.

4. **Multi-Device**: Use `/logout/all` when user wants to logout from all devices (e.g., after password change or security incident).

---

## Testing

### Test Single Logout
```bash
# 1. Login
TOKEN=$(curl -X POST http://api.kaamlo.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  | jq -r '.data.token')

# 2. Logout
curl -X POST http://api.kaamlo.com/api/auth/logout \
  -H "Authorization: Bearer $TOKEN"
```

### Test Logout All
```bash
# 1. Login
TOKEN=$(curl -X POST http://api.kaamlo.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  | jq -r '.data.token')

# 2. Logout from all devices
curl -X POST http://api.kaamlo.com/api/auth/logout/all \
  -H "Authorization: Bearer $TOKEN"
```

---

## Error Handling

The logout service handles errors gracefully:

- **Missing Tables**: Continues without session tracking
- **Database Errors**: Returns error but doesn't crash
- **Invalid Tokens**: Returns 401 Unauthorized
- **Network Issues**: Returns 500 with error details (in development)

---

**Last Updated:** 2024




