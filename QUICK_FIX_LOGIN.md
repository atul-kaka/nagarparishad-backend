# Quick Fix for Login Error

## Problem

You're getting this error:
```
error: column "failed_login_attempts" of relation "users" does not exist
```

This means the database migration hasn't been run yet. The `users` table is missing the new authentication columns.

## Solution

### Step 1: Run the Migration

**Windows (PowerShell):**
```powershell
cd nagarparishad-backend
npm run migrate-rbac
```

**Windows (CMD):**
```cmd
cd nagarparishad-backend
npm run migrate-rbac
```

**Or directly:**
```cmd
cd nagarparishad-backend
node scripts\migrate-rbac.js
```

### Step 2: Verify Migration

```cmd
npm run check-db
```

You should see:
- ✅ All tables exist
- ✅ `users` table has new columns like `failed_login_attempts`, `password_expires_at`, etc.

### Step 3: Test Login

```bash
curl -X POST http://api.kaamlo.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

## What the Migration Adds

The migration adds these columns to the `users` table:
- `password_expires_at` - Password expiration date
- `password_changed_at` - When password was last changed
- `failed_login_attempts` - Count of failed login attempts
- `locked_until` - Account lock expiration
- `otp_code` - OTP for mobile authentication
- `otp_expires_at` - OTP expiration
- `otp_verified` - OTP verification status
- `last_ip_address` - Last login IP
- `last_user_agent` - Last login user agent

And creates these tables:
- `login_sessions` - Active user sessions
- `record_visits` - Document view tracking

## Temporary Workaround

If you can't run the migration right now, the code has been updated to handle missing columns gracefully. Login should work, but features like:
- Account locking after failed attempts
- Password expiration
- Session tracking

...won't work until the migration is run.

## After Migration

Once migration is complete:
1. Login will work properly
2. Account locking will work
3. Session tracking will work
4. All RBAC features will be fully functional

---

**Run the migration now:**
```cmd
cd nagarparishad-backend
npm run migrate-rbac
```




