# Quick Setup Guide: Audit System

## Overview

The audit system tracks:
- ✅ Who created/updated each record (created_by, updated_by)
- ✅ When records were created/updated (timestamps)
- ✅ Status changes with history
- ✅ Complete audit trail for compliance

---

## Step 1: Run Database Migration

### Option A: Fresh Installation

```bash
psql -U postgres -d nagarparishad_db -f database/schema_with_audit.sql
```

### Option B: Update Existing Database

```bash
psql -U postgres -d nagarparishad_db -f database/migrations/002_add_audit_tables.sql
```

---

## Step 2: Install Dependencies

```bash
npm install
```

This installs `bcrypt` for password hashing.

---

## Step 3: Create First User

```bash
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@nagarparishad.gov.in",
    "password": "admin123",
    "full_name": "System Administrator",
    "role": "admin"
  }'
```

**Save the user ID** from the response (e.g., `"id": 1`)

---

## Step 4: Create Records with Audit Fields

### Create School with Creator

```bash
curl -X POST http://localhost:3000/api/schools \
  -H "Content-Type: application/json" \
  -d '{
    "name": "स्व. जतिरामजी बर्वे नगर परिषद प्राथमिक शाळा, रामटेक",
    "district": "नागपूर",
    "state": "महाराष्ट्र",
    "created_by": 1
  }'
```

### Create Student with Creator

```bash
curl -X POST http://localhost:3000/api/students \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "राजेश कुमार",
    "date_of_birth": "2010-05-15",
    "created_by": 1
  }'
```

### Create Certificate with Creator

```bash
curl -X POST http://localhost:3000/api/certificates \
  -H "Content-Type: application/json" \
  -d '{
    "school_id": 1,
    "student_id": 1,
    "serial_no": "101",
    "leaving_date": "2024-03-31",
    "leaving_class": "Class 5",
    "created_by": 1
  }'
```

---

## Step 5: Update Certificate Status (with Audit)

```bash
curl -X PATCH http://localhost:3000/api/certificates/1/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "issued",
    "reason": "All documents verified and approved",
    "notes": "Certificate ready for issue",
    "user_id": 1
  }'
```

This will:
- ✅ Update certificate status
- ✅ Log status change in `certificate_status_history`
- ✅ Create audit log entry
- ✅ Track who made the change and when

---

## Step 6: View Audit Trail

### View Status History

```bash
curl http://localhost:3000/api/certificates/1/status-history
```

### View All Audit Logs for Certificate

```bash
curl http://localhost:3000/api/audit/leaving_certificates/1
```

### View All Audit Logs (with filters)

```bash
# All logs
curl http://localhost:3000/api/audit

# Filter by table
curl http://localhost:3000/api/audit?table_name=leaving_certificates

# Filter by user
curl http://localhost:3000/api/audit?changed_by=1

# Filter by date range
curl "http://localhost:3000/api/audit?start_date=2026-01-01&end_date=2026-01-31"
```

---

## Database Tables Created

1. **users** - User registration and authentication
2. **audit_logs** - Complete audit trail
3. **certificate_status_history** - Status change history

### Updated Tables (with audit fields)

- **schools** - Added: `status`, `created_by`, `updated_by`
- **students** - Added: `status`, `created_by`, `updated_by`
- **leaving_certificates** - Added: `created_by`, `updated_by`, `issued_by`, `issued_at`

---

## API Endpoints Summary

### Users
- `POST /api/users/register` - Register new user
- `GET /api/users` - List all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user

### Certificates (Status Management)
- `PATCH /api/certificates/:id/status` - Update status with audit
- `GET /api/certificates/:id/status-history` - View status history

### Audit
- `GET /api/audit` - List audit logs (with filters)
- `GET /api/audit/:table_name/:record_id` - Get logs for specific record

---

## Example: Complete Workflow

### 1. Register User
```bash
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"username":"clerk1","email":"clerk@example.com","password":"pass123","full_name":"Clerk User","role":"clerk"}'
```
**Response:** `{"id": 2, ...}`

### 2. Create Certificate (with creator)
```bash
curl -X POST http://localhost:3000/api/certificates \
  -H "Content-Type: application/json" \
  -d '{"school_id":1,"student_id":1,"serial_no":"102","leaving_date":"2024-03-31","leaving_class":"Class 5","created_by":2}'
```

### 3. Update Status to Issued
```bash
curl -X PATCH http://localhost:3000/api/certificates/2/status \
  -H "Content-Type: application/json" \
  -d '{"status":"issued","reason":"Verified","user_id":2}'
```

### 4. View Audit Trail
```bash
curl http://localhost:3000/api/certificates/2/status-history
curl http://localhost:3000/api/audit/leaving_certificates/2
```

---

## Important Notes

1. **Always include `user_id`** when creating/updating records for audit trail
2. **Status changes** are automatically logged in `certificate_status_history`
3. **All changes** can be tracked via `audit_logs` table
4. **Timestamps** are automatically maintained
5. **IP addresses** and user agents are logged for security

---

## Next Steps

- ✅ Database schema with audit fields
- ✅ User registration API
- ✅ Status update API with audit
- ✅ Audit log viewing API
- ⚠️ Add JWT authentication (optional)
- ⚠️ Add role-based access control (optional)

Your audit system is now ready! All changes will be tracked with user information and timestamps.



