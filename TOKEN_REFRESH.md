# Token Refresh API Documentation

## Overview

JWT tokens expire after **15 minutes** for security. Use the token refresh endpoint to get a new token without re-authenticating.

---

## Token Expiration

- **Access Token**: Expires in **15 minutes** (`JWT_EXPIRES_IN=15m`)
- **Session Grace Period**: 7 days (allows refresh of expired tokens within this period)
- **Refresh Window**: Expired tokens can be refreshed if the user session is still active

---

## Refresh Token Endpoint

### POST `/api/auth/token/refresh`

Get a new access token using your current token (even if it's expired).

**Authentication:** Current token (can be expired, within grace period)

#### Request

**Option 1: Token in Authorization Header (Recommended)**
```bash
curl -X POST http://api.kaamlo.com/api/auth/token/refresh \
  -H "Authorization: Bearer YOUR_CURRENT_TOKEN"
```

**Option 2: Token in Request Body**
```bash
curl -X POST http://api.kaamlo.com/api/auth/token/refresh \
  -H "Content-Type: application/json" \
  -d '{"token": "YOUR_CURRENT_TOKEN"}'
```

#### Response

**Success (200):**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": "15m",
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@example.com",
      "full_name": "Admin User",
      "role": "admin"
    }
  }
}
```

**Error (401):**
```json
{
  "success": false,
  "error": "Invalid token"
}
```

**Error (403):**
```json
{
  "success": false,
  "error": "Account is deactivated"
}
```

---

## How It Works

1. **Client sends expired token** to refresh endpoint
2. **Server validates** the token (even if expired)
3. **Server checks** user status and session validity
4. **Server generates** a new token with fresh 15-minute expiration
5. **Server updates** session with new token
6. **Client receives** new token and continues using the API

---

## Frontend Integration

### Automatic Token Refresh

```javascript
// API client with automatic token refresh
class APIClient {
  constructor(baseURL, token) {
    this.baseURL = baseURL;
    this.token = token;
  }

  async refreshToken() {
    try {
      const response = await fetch(`${this.baseURL}/api/auth/token/refresh`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        this.token = data.data.token;
        localStorage.setItem('token', this.token);
        return this.token;
      } else {
        // Refresh failed, redirect to login
        throw new Error('Token refresh failed');
      }
    } catch (error) {
      // Redirect to login
      window.location.href = '/login';
      throw error;
    }
  }

  async request(endpoint, options = {}) {
    let response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${this.token}`
      }
    });

    // If token expired, try to refresh
    if (response.status === 401) {
      await this.refreshToken();
      // Retry request with new token
      response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${this.token}`
        }
      });
    }

    return response;
  }
}

// Usage
const client = new APIClient('http://api.kaamlo.com', localStorage.getItem('token'));
const response = await client.request('/api/certificates');
```

### Axios Interceptor Example

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://api.kaamlo.com',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and haven't tried refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const token = localStorage.getItem('token');
        const response = await axios.post(
          `${api.defaults.baseURL}/api/auth/token/refresh`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        const newToken = response.data.data.token;
        localStorage.setItem('token', newToken);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
```

### React Hook Example

```javascript
import { useState, useEffect } from 'react';

function useTokenRefresh() {
  const [token, setToken] = useState(localStorage.getItem('token'));

  const refreshToken = async () => {
    try {
      const response = await fetch('http://api.kaamlo.com/api/auth/token/refresh', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const newToken = data.data.token;
        setToken(newToken);
        localStorage.setItem('token', newToken);
        return newToken;
      } else {
        throw new Error('Token refresh failed');
      }
    } catch (error) {
      localStorage.removeItem('token');
      window.location.href = '/login';
      throw error;
    }
  };

  // Auto-refresh token every 14 minutes (before 15 min expiration)
  useEffect(() => {
    if (!token) return;

    const interval = setInterval(() => {
      refreshToken();
    }, 14 * 60 * 1000); // 14 minutes

    return () => clearInterval(interval);
  }, [token]);

  return { token, refreshToken };
}
```

---

## Token Lifecycle

```
1. Login
   └─> Get token (expires in 15 minutes)
   └─> Store token

2. Make API requests (within 15 minutes)
   └─> Token valid
   └─> Request succeeds

3. Token expires (after 15 minutes)
   └─> Request returns 401
   └─> Call refresh endpoint
   └─> Get new token
   └─> Retry request

4. Refresh fails (session expired after 7 days)
   └─> Redirect to login
```

---

## Configuration

### Environment Variables

```env
# Access token expiration (default: 15 minutes)
JWT_EXPIRES_IN=15m

# Refresh grace period (default: 7 days)
JWT_REFRESH_EXPIRES_IN=7d

# JWT secret key
JWT_SECRET=your-secret-key-change-in-production
```

### Token Expiration Formats

- `15m` - 15 minutes
- `1h` - 1 hour
- `24h` - 24 hours
- `7d` - 7 days

---

## Security Features

1. **Short Token Lifetime**: 15-minute expiration limits damage if token is compromised
2. **Session Validation**: Refresh validates active user session
3. **Account Status Check**: Deactivated accounts cannot refresh
4. **Password Expiration Check**: Expired passwords prevent refresh
5. **Single Token Per Session**: New token invalidates old one in active session

---

## Error Handling

### Invalid Token
```json
{
  "success": false,
  "error": "Invalid token"
}
```

### Token Not Provided
```json
{
  "success": false,
  "error": "Token is required. Provide it in Authorization header or request body."
}
```

### Account Deactivated
```json
{
  "success": false,
  "error": "Account is deactivated"
}
```

### Password Expired
```json
{
  "success": false,
  "error": "Password has expired. Please reset your password."
}
```

---

## Best Practices

1. **Store Token Securely**: Use `localStorage` or `sessionStorage` (or httpOnly cookies)
2. **Refresh Before Expiry**: Refresh token before 15 minutes (e.g., at 14 minutes)
3. **Handle Errors Gracefully**: Redirect to login on refresh failure
4. **Avoid Multiple Refresh Calls**: Implement request queue to prevent concurrent refreshes
5. **Logout on Refresh Failure**: Clear tokens and redirect to login

---

## Testing

### Test Token Refresh

```bash
# 1. Login to get token
TOKEN=$(curl -X POST http://api.kaamlo.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  | jq -r '.data.token')

# 2. Use token for API call
curl -X GET http://api.kaamlo.com/api/certificates \
  -H "Authorization: Bearer $TOKEN"

# 3. Refresh token (even if expired)
NEW_TOKEN=$(curl -X POST http://api.kaamlo.com/api/auth/token/refresh \
  -H "Authorization: Bearer $TOKEN" \
  | jq -r '.data.token')

# 4. Use new token
curl -X GET http://api.kaamlo.com/api/certificates \
  -H "Authorization: Bearer $NEW_TOKEN"
```

---

**Last Updated:** 2024




