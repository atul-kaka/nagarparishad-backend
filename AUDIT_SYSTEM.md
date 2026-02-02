# Audit System Documentation

This document describes the audit trail system for tracking all changes to certificate data.

---

## Database Tables

### 1. Users Table
Stores user registration and authentication data.

**Fields:**
- `id` - Primary key
- `username` - Unique username
- `email` - Unique email
- `password_hash` - Hashed password
- `full_name` - User's full name
- `role` - User role (user, admin, clerk, headmaster)
- `phone_no` - Contact number
- `is_active` - Account status
- `last_login` - Last login timestamp
- `created_at`, `updated_at` - Timestamps

### 2. Audit Logs Table
Tracks all changes to database records.

**Fields:**
- `id` - Primary key
- `table_name` - Name of the table (schools, students, leaving_certificates)
- `record_id` - ID of the record that changed
- `action` - Action type (INSERT, UPDATE, DELETE)
- `field_name` - Field that changed (for UPDATE)
- `old_value` - Previous value (JSON)
- `new_value` - New value (JSON)
- `changed_by` - User ID who made the change
- `changed_at` - Timestamp of change
- `ip_address` - IP address of requester
- `user_agent` - Browser/client information
- `notes` - Additional notes

### 3. Certificate Status History Table
Tracks status changes for certificates.

**Fields:**
- `id` - Primary key
- `certificate_id` - Reference to certificate
- `old_status` - Previous status
- `new_status` - New status
- `changed_by` - User ID
- `changed_at` - Timestamp
- `reason` - Reason for status change
- `notes` - Additional notes

---

## Audit Fields in Main Tables

All main tables (schools, students, leaving_certificates) now include:

- `created_by` - User ID who created the record
- `updated_by` - User ID who last updated the record
- `status` - Record status (active, inactive, archived, etc.)
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

---

## API Endpoints

### User Registration

**POST** `/api/users/register`

```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securepassword123",
  "full_name": "John Doe",
  "role": "clerk",
  "phone_no": "1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "full_name": "John Doe",
    "role": "clerk",
    "is_active": true
  },
  "message": "User registered successfully"
}
```

### Update Certificate Status (with Audit)

**PATCH** `/api/certificates/:id/status`

```json
{
  "status": "issued",
  "reason": "Certificate verified and approved",
  "notes": "All documents verified",
  "user_id": 1
}
```

**Response:**
```json
{
  "success": true,
  "data": { /* certificate data */ },
  "message": "Certificate status updated from draft to issued"
}
```

### Get Certificate Status History

**GET** `/api/certificates/:id/status-history`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "certificate_id": 1,
      "old_status": "draft",
      "new_status": "issued",
      "changed_by": 1,
      "changed_by_username": "john_doe",
      "changed_by_name": "John Doe",
      "changed_at": "2026-01-19T10:30:00Z",
      "reason": "Certificate verified",
      "notes": "All documents verified"
    }
  ]
}
```

### Get Audit Logs

**GET** `/api/audit`

**Query Parameters:**
- `table_name` - Filter by table name
- `record_id` - Filter by record ID
- `changed_by` - Filter by user ID
- `action` - Filter by action (INSERT, UPDATE, DELETE)
- `start_date` - Start date filter
- `end_date` - End date filter
- `limit` - Limit results (default: 100)

**Example:**
```
GET /api/audit?table_name=leaving_certificates&record_id=1&limit=50
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "table_name": "leaving_certificates",
      "record_id": 1,
      "action": "UPDATE",
      "field_name": "status",
      "old_value": "draft",
      "new_value": "issued",
      "changed_by": 1,
      "changed_by_username": "john_doe",
      "changed_by_name": "John Doe",
      "changed_at": "2026-01-19T10:30:00Z",
      "ip_address": "192.168.1.100",
      "user_agent": "Mozilla/5.0...",
      "notes": "Status changed from draft to issued"
    }
  ]
}
```

### Get Audit Logs for Specific Record

**GET** `/api/audit/:table_name/:record_id`

**Example:**
```
GET /api/audit/leaving_certificates/1
```

---

## Usage Examples

### Creating a Certificate with Audit

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

### Updating Certificate Status

```bash
curl -X PATCH http://localhost:3000/api/certificates/1/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "issued",
    "reason": "All documents verified",
    "user_id": 1
  }'
```

### Viewing Audit Trail

```bash
# Get all audit logs for a certificate
curl http://localhost:3000/api/audit/leaving_certificates/1

# Get status history
curl http://localhost:3000/api/certificates/1/status-history
```

---

## Migration Instructions

### Step 1: Run Migration

```bash
# If starting fresh, use the complete schema
psql -U postgres -d nagarparishad_db -f database/schema_with_audit.sql

# If updating existing database, use migration
psql -U postgres -d nagarparishad_db -f database/migrations/002_add_audit_tables.sql
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install `bcrypt` for password hashing.

### Step 3: Create First Admin User

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

---

## Best Practices

1. **Always include user_id** when creating/updating records
2. **Provide reason** when changing certificate status
3. **Use status history** to track certificate lifecycle
4. **Review audit logs** regularly for compliance
5. **Keep audit logs** for required retention period

---

## Audit Trail Queries

### Find all changes by a user

```sql
SELECT * FROM audit_logs 
WHERE changed_by = 1 
ORDER BY changed_at DESC;
```

### Find all changes to a certificate

```sql
SELECT * FROM audit_logs 
WHERE table_name = 'leaving_certificates' 
AND record_id = 1 
ORDER BY changed_at DESC;
```

### Find status changes in date range

```sql
SELECT * FROM certificate_status_history 
WHERE changed_at BETWEEN '2026-01-01' AND '2026-01-31'
ORDER BY changed_at DESC;
```

---

## Security Considerations

- Passwords are hashed using bcrypt
- Audit logs include IP addresses for security tracking
- User roles can be used for access control
- All changes are timestamped and attributed

---

## Future Enhancements

- JWT authentication for API access
- Role-based access control (RBAC)
- Automated audit report generation
- Export audit logs to CSV/PDF
- Real-time audit notifications




