# Align Database with Backup Schema

## Overview

This guide helps you align your current database structure with the backup schema file (`schema_backup.sql`).

## What's Different

The backup schema includes:
1. **Users table**: `reset_token` and `reset_token_expires_at` columns
2. **Students table**: Uses `general_register_ref` (we renamed it to `school_general_register_no` in code)
3. **All indexes and constraints** from the backup

## Migration Steps

### Option 1: Run the Migration (Recommended)

```bash
# Navigate to project directory
cd nagarparishad-backend

# Run the migration
psql -U postgres -d nagarparishad_db -f database/migrations/016_align_with_backup_schema.sql
```

### Option 2: Manual Steps

If you prefer to run commands manually:

```sql
-- 1. Add reset_token columns to users table
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255),
  ADD COLUMN IF NOT EXISTS reset_token_expires_at TIMESTAMP;

-- 2. Create index for reset_token
CREATE INDEX IF NOT EXISTS idx_users_reset_token 
  ON users(reset_token) WHERE reset_token IS NOT NULL;

-- 3. Add comments
COMMENT ON COLUMN users.reset_token IS 'Password reset token';
COMMENT ON COLUMN users.reset_token_expires_at IS 'When the reset token expires';
```

## Column Name Handling

**Important**: The backup schema uses `general_register_ref` in the students table, but our code uses `school_general_register_no`. 

The application code handles this mapping automatically:
- When reading: Uses `COALESCE(school_general_register_no, general_register_ref)`
- When writing: Maps `school_general_register_no` to `general_register_ref` if the column exists

**You don't need to rename the column** - the code handles both names.

## Verification

After running the migration, verify the changes:

```sql
-- Check reset_token columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('reset_token', 'reset_token_expires_at');

-- Check index exists
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'users' 
AND indexname = 'idx_users_reset_token';

-- Check all indexes match backup
SELECT indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename, indexname;
```

## What Gets Added

### Users Table
- ✅ `reset_token` VARCHAR(255) - Password reset token
- ✅ `reset_token_expires_at` TIMESTAMP - Token expiration
- ✅ `idx_users_reset_token` - Index for faster token lookups

### All Indexes
The migration ensures all indexes from the backup exist:
- Users: username, email, reset_token
- Students: uid_aadhar, student_id, school_id, status, serial_no, qr_code_hash
- Schools: status, recognition_no, udise_no, general_register_no
- Leaving certificates: school_id, student_id, serial_no, status
- Audit logs: table_name+record_id, changed_by, changed_at
- Login sessions: user_id, token, active
- Record visits: user_id, record, visited_at

### Constraints
- ✅ Users role check: ('user', 'admin', 'super')
- ✅ Leaving certificates status check
- ✅ Unique constraints on students (student_id, uid_aadhar_no, qr_code_hash)
- ✅ Unique constraint on leaving_certificates (school_id, serial_no)
- ✅ Unique constraint on login_sessions (session_token)

## After Migration

1. **Restart your server**:
   ```bash
   npm run dev
   # or
   npm start
   ```

2. **Test password reset functionality**:
   ```bash
   # Request password reset
   curl -X POST http://localhost:3000/api/auth/password/reset/request \
     -H "Content-Type: application/json" \
     -d '{"email": "admin@example.com"}'
   ```

## Notes

1. **No Data Loss**: This migration only adds columns and indexes. No existing data is modified.

2. **Backward Compatible**: The code handles both `general_register_ref` and `school_general_register_no` column names.

3. **Idempotent**: The migration uses `IF NOT EXISTS` and `ADD COLUMN IF NOT EXISTS`, so it's safe to run multiple times.

4. **Index Performance**: The `idx_users_reset_token` index uses a partial index (WHERE reset_token IS NOT NULL) for better performance.

## Troubleshooting

### Error: Column already exists
This is normal - the migration checks if columns exist before adding them. You can safely ignore this.

### Error: Index already exists
This is also normal - indexes are created with `IF NOT EXISTS`.

### Error: Constraint already exists
The migration drops and recreates constraints to ensure they match the backup. This is safe.

## Summary

✅ **Migration adds**:
- Reset token columns to users table
- Index for reset_token
- All missing indexes
- All missing constraints

✅ **Code compatibility**:
- Handles both `general_register_ref` and `school_general_register_no`
- No breaking changes

✅ **Safe to run**:
- Idempotent (can run multiple times)
- No data loss
- Only adds, doesn't modify existing data

