# Database Migration Fix

## Problem

You're seeing errors about missing database columns:
- `column "last_ip_address" of relation "users" does not exist`
- `column "action_type" of relation "audit_logs" does not exist`
- `table "login_sessions" does not exist`

## Solution

Run the migration to add the missing columns and tables.

### Option 1: Run the Fix Migration (Recommended)

```bash
# Navigate to the project directory
cd nagarparishad-backend

# Run the migration using psql
psql -U postgres -d nagarparishad_db -f database/migrations/015_fix_missing_columns.sql
```

### Option 2: Use Complete Schema (For New Databases)

If you're setting up a new database, use the complete schema which includes all columns:

```bash
# Create database first
psql -U postgres -c "CREATE DATABASE nagarparishad_db WITH ENCODING 'UTF8';"

# Run complete schema
psql -U postgres -d nagarparishad_db -f database/complete_schema.sql
```

### Option 3: Run Original Migration 003

The missing columns are from migration 003. If you haven't run it yet:

```bash
psql -U postgres -d nagarparishad_db -f database/migrations/003_add_rbac_auth.sql
```

## What Gets Added

### Users Table
- `last_ip_address` - Last IP address from which user logged in
- `last_user_agent` - Last user agent from which user logged in
- `password_expires_at` - When the password expires
- `password_changed_at` - When the password was last changed
- `failed_login_attempts` - Number of failed login attempts
- `locked_until` - Account lock expiration time
- `otp_code` - OTP code for mobile authentication
- `otp_expires_at` - When the OTP expires
- `otp_verified` - Whether OTP was verified

### Audit Logs Table
- `action_type` - Type of action: 'view', 'add', 'update', 'delete', 'login', 'logout'
- `location` - Location of the action (city/region if available)

### New Tables
- `login_sessions` - Tracks active user sessions
- `record_visits` - Tracks document views

## Verification

After running the migration, verify the columns exist:

```sql
-- Check users table columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('last_ip_address', 'last_user_agent');

-- Check audit_logs columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'audit_logs' 
AND column_name IN ('action_type', 'location');

-- Check if login_sessions table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'login_sessions'
);
```

## Temporary Workaround

The code has been updated to gracefully handle missing columns. If the columns don't exist, the update will skip those fields and log a warning. However, you should still run the migration to enable full functionality.

## After Migration

After running the migration, restart your server:

```bash
npm run dev
# or
npm start
```

The login should now work without errors.

