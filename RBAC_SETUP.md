# RBAC and Authentication Setup Guide

This guide explains the Role-Based Access Control (RBAC) system, authentication, and audit features.

## Table of Contents

1. [Roles and Permissions](#roles-and-permissions)
2. [Authentication](#authentication)
3. [Document Status](#document-status)
4. [Audit Logging](#audit-logging)
5. [Pagination](#pagination)
6. [Setup Instructions](#setup-instructions)

---

## Roles and Permissions

### 1. User (Read-Only)
- **View**: Only accepted documents
- **Cannot**: Add, edit, delete, or approve documents

### 2. Admin (Read and Write)
- **Add**: Create new certificates
- **View**: All documents
- **Search**: All documents
- **Edit**: Can edit documents (except accepted)
- **Cannot**: Approve or reject documents

### 3. Super Admin (Read, Write, and Approval)
- **Review**: Accept or reject documents
- **View**: All documents
- **Search**: All documents
- **Edit**: Can edit all documents (including accepted)

---

## Authentication

### Password-Based Authentication

**Login:**
```bash
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@example.com",
      "full_name": "Admin User",
      "role": "admin",
      "phone_no": "1234567890"
    }
  }
}
```

### Mobile OTP Authentication

**Step 1: Request OTP**
```bash
POST /api/auth/otp/request
Content-Type: application/json

{
  "phone_no": "1234567890"
}
```

**Step 2: Verify OTP**
```bash
POST /api/auth/otp/verify
Content-Type: application/json

{
  "phone_no": "1234567890",
  "otp": "123456"
}
```

### Using Authentication Token

Include the token in the Authorization header:

```bash
GET /api/certificates
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Document Status

### Status Flow

1. **New** (`new`)
   - When: Document is created by data entry person (Admin)
   - Can Edit: Yes
   - Can View: Admin, Super Admin

2. **In Review** (`in_review`)
   - When: Document is submitted for review
   - Can Edit: Yes
   - Can View: Admin, Super Admin

3. **Rejected** (`rejected`)
   - When: Document is rejected by Super Admin
   - Can Edit: Yes
   - Can View: Admin, Super Admin

4. **Accepted** (`accepted`)
   - When: Document is approved by Super Admin
   - Can Edit: No (only Super Admin can modify)
   - Can View: All users (including regular users)

### Update Status

**Submit for Review:**
```bash
PATCH /api/certificates/{id}/status
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "in_review"
}
```

**Approve (Super Admin only):**
```bash
PATCH /api/certificates/{id}/status
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "accepted",
  "reason": "All documents verified"
}
```

**Reject (Super Admin only):**
```bash
PATCH /api/certificates/{id}/status
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "rejected",
  "reason": "Missing documents"
}
```

---

## Audit Logging

### What is Logged

1. **Record Visits**
   - User who viewed
   - Record ID and table name
   - IP address and location
   - Mobile number
   - Timestamp

2. **Data Addition**
   - User who added
   - Record details
   - IP address and location
   - Timestamp

3. **Data Updates**
   - User who updated
   - Old and new values for each field
   - IP address and location
   - Timestamp

4. **Login/Logout**
   - User ID
   - Login method (password/OTP)
   - IP address and location
   - Timestamp

### View Audit Logs

**Get audit logs:**
```bash
GET /api/audit/logs?table_name=leaving_certificates&record_id=1
Authorization: Bearer {token}
```

**Get record visits:**
```bash
GET /api/audit/visits?table_name=leaving_certificates&record_id=1
Authorization: Bearer {token}
```

**Get active sessions:**
```bash
GET /api/auth/sessions
Authorization: Bearer {token}
```

---

## Pagination

All list endpoints support pagination:

```bash
GET /api/certificates?page=1&limit=10&status=accepted&search=student_name
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Pagination Parameters

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)
- `search`: Search term (searches student name and serial number)
- `status`: Filter by status
- `school_id`: Filter by school
- `student_id`: Filter by student

---

## Setup Instructions

### 1. Run Database Migration

```bash
npm run migrate
```

This will create:
- Enhanced users table with authentication fields
- Login sessions table
- Record visits table
- Enhanced audit logs with location tracking

### 2. Install Dependencies

```bash
npm install
```

New dependencies:
- `jsonwebtoken`: JWT token generation and verification

### 3. Configure Environment Variables

Add to `.env`:

```env
# JWT Configuration
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=24h

# Password Expiration (optional, in days)
PASSWORD_EXPIRY_DAYS=90

# OTP Configuration (for SMS gateway integration)
# TWILIO_ACCOUNT_SID=your_twilio_sid
# TWILIO_AUTH_TOKEN=your_twilio_token
# TWILIO_PHONE_NUMBER=your_twilio_number
```

### 4. Create Initial Users

**Create Super Admin:**
```bash
POST /api/auth/register
Content-Type: application/json

{
  "username": "superadmin",
  "email": "super@example.com",
  "password": "SecurePassword123!",
  "full_name": "Super Admin",
  "role": "super",
  "phone_no": "1234567890"
}
```

**Create Admin:**
```bash
POST /api/auth/register
Content-Type: application/json

{
  "username": "admin",
  "email": "admin@example.com",
  "password": "SecurePassword123!",
  "full_name": "Admin User",
  "role": "admin",
  "phone_no": "1234567891"
}
```

**Create Regular User:**
```bash
POST /api/auth/register
Content-Type: application/json

{
  "username": "user",
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "full_name": "Regular User",
  "role": "user",
  "phone_no": "1234567892"
}
```

### 5. Test Authentication

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "SecurePassword123!"}'

# Use token in subsequent requests
curl http://localhost:3000/api/certificates \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## API Endpoints Summary

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with username/password
- `POST /api/auth/otp/request` - Request OTP
- `POST /api/auth/otp/verify` - Verify OTP and login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user info

### Certificates (RBAC Protected)
- `GET /api/certificates` - List certificates (paginated)
- `GET /api/certificates/:id` - Get certificate by ID (logs visit)
- `POST /api/certificates` - Create certificate (Admin/Super)
- `PUT /api/certificates/:id` - Update certificate (Admin/Super)
- `PATCH /api/certificates/:id/status` - Update status
- `DELETE /api/certificates/:id` - Delete certificate (Admin/Super)

### Audit
- `GET /api/audit/logs` - Get audit logs
- `GET /api/audit/visits` - Get record visits
- `GET /api/auth/sessions` - Get active sessions

---

## Security Features

1. **Password Expiration**: Configurable password expiry
2. **Account Locking**: Account locked after 5 failed login attempts
3. **Session Management**: Track active sessions
4. **IP Tracking**: Log IP addresses for all actions
5. **Location Tracking**: Optional location tracking via headers

---

## Next Steps

1. Integrate SMS gateway for OTP (Twilio, AWS SNS, etc.)
2. Configure password expiration policy
3. Set up location detection (IP geolocation service)
4. Configure rate limiting for API endpoints
5. Set up monitoring and alerts for security events

