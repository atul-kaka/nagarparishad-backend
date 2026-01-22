# User Registration Guide

## Overview

Only **Super Admin** can register new users. This ensures proper access control and user management.

## Registration Endpoint

**POST** `/api/auth/register`

**Authentication Required:** Yes (Super Admin only)

## Request

### Headers
```
Authorization: Bearer {super_admin_token}
Content-Type: application/json
```

### Body
```json
{
  "username": "newadmin",
  "email": "admin@example.com",
  "password": "SecurePassword123!",
  "full_name": "New Admin User",
  "role": "admin",
  "phone_no": "1234567890"
}
```

### Fields
- `username` (required): Unique username
- `email` (required): Valid email address
- `password` (required): Minimum 6 characters
- `full_name` (required): User's full name
- `role` (required): One of `user`, `admin`, or `super`
- `phone_no` (optional): Phone number for OTP authentication

## Response

### Success (201)
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": 2,
    "username": "newadmin",
    "email": "admin@example.com",
    "full_name": "New Admin User",
    "role": "admin",
    "registered_by": "superadmin"
  }
}
```

### Error (403) - Not Super Admin
```json
{
  "success": false,
  "error": "Only Super Admin can register new users"
}
```

### Error (401) - Not Authenticated
```json
{
  "success": false,
  "error": "Authentication required"
}
```

## Example: Register Admin User

### Step 1: Login as Super Admin
```bash
curl -X POST http://api.kaamlo.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "superadmin",
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

### Step 2: Register New Admin
```bash
curl -X POST http://api.kaamlo.com/api/auth/register \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newadmin",
    "email": "newadmin@example.com",
    "password": "SecurePassword123!",
    "full_name": "New Admin User",
    "role": "admin",
    "phone_no": "1234567890"
  }'
```

## Role Permissions

### Super Admin
- ✅ Can register users with any role (`user`, `admin`, `super`)
- ✅ Can create another Super Admin

### Admin
- ❌ Cannot register users
- ❌ Cannot access registration endpoint

### User
- ❌ Cannot register users
- ❌ Cannot access registration endpoint

## Audit Trail

All user registrations are logged in the audit system:
- Who registered the user (`registered_by`)
- When the user was registered
- What role was assigned
- IP address and location

## Security Features

1. **Authentication Required**: Must be logged in as Super Admin
2. **Role Validation**: Only Super Admin can access
3. **Password Hashing**: Passwords are automatically hashed
4. **Password Expiration**: Configurable via `PASSWORD_EXPIRY_DAYS` in `.env`
5. **Audit Logging**: All registrations are tracked

## Initial Setup

For the first Super Admin, you can use the test user creation script:

```bash
npm run create-test-user
```

This creates:
- Super Admin: `superadmin` / `admin123`
- Admin: `admin` / `admin123`
- User: `user` / `user123`

After that, only Super Admin can register new users through the API.

## Notes

- Username and email must be unique
- Password must be at least 6 characters
- Role must be one of: `user`, `admin`, `super`
- All registrations are logged for audit purposes



