# Troubleshooting Login Issues

## Common Issues and Solutions

### Issue: "Invalid credentials" Error

This error can occur for several reasons:

1. **User doesn't exist**
2. **Incorrect password**
3. **Account is locked**
4. **Account is inactive**
5. **Database connection issue**

---

## Step 1: Check if User Exists

### Option A: Using the Test Script

```bash
cd nagarparishad-backend
node scripts/test-login.js admin
```

This will show:
- If user exists
- User details
- Account status
- Lock status

### Option B: Using SQL

```sql
SELECT id, username, email, role, is_active, locked_until, failed_login_attempts
FROM users
WHERE username = 'admin';
```

---

## Step 2: Create Test Users

If no users exist, create them:

```bash
cd nagarparishad-backend
node scripts/create-test-user.js
```

This creates:
- **Super Admin**: `superadmin` / `admin123`
- **Admin**: `admin` / `admin123`
- **User**: `user` / `user123`

---

## Step 3: Test Login with cURL

```bash
# Test login
curl -X POST http://api.kaamlo.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

---

## Step 4: Check Account Status

### Account Locked

If account is locked after 5 failed attempts:

```sql
-- Check lock status
SELECT username, locked_until, failed_login_attempts
FROM users
WHERE username = 'admin';

-- Unlock account (if needed)
UPDATE users
SET locked_until = NULL, failed_login_attempts = 0
WHERE username = 'admin';
```

### Account Inactive

```sql
-- Check if account is active
SELECT username, is_active FROM users WHERE username = 'admin';

-- Activate account (if needed)
UPDATE users SET is_active = true WHERE username = 'admin';
```

---

## Step 5: Reset Password

If you need to reset a password:

### Option A: Create New User

```bash
node scripts/create-test-user.js
```

### Option B: Update Password in Database

**⚠️ Warning: This requires direct database access**

```sql
-- You'll need to hash the password first using Node.js
-- Or use this script:
```

```bash
node -e "
const bcrypt = require('bcrypt');
bcrypt.hash('newpassword', 10).then(hash => console.log(hash));
"
```

Then update in database:
```sql
UPDATE users
SET password_hash = '<hashed_password_from_above>',
    failed_login_attempts = 0,
    locked_until = NULL
WHERE username = 'admin';
```

---

## Step 6: Verify Database Connection

Check if the database is accessible:

```bash
cd nagarparishad-backend
node -e "
const pool = require('./config/database');
pool.query('SELECT NOW()').then(r => {
  console.log('✅ Database connected:', r.rows[0]);
  process.exit(0);
}).catch(e => {
  console.error('❌ Database error:', e.message);
  process.exit(1);
});
"
```

---

## Step 7: Check Server Logs

Look for error messages in the server console:

```bash
# If running with nodemon
npm run dev

# Check for errors like:
# - "User not found"
# - "Password verification failed"
# - "Database connection error"
```

---

## Step 8: Test Password Verification

Test if password hashing/verification works:

```bash
node scripts/test-login.js admin admin123
```

This will:
- Find the user
- Test password verification
- Show if password is correct

---

## Common Solutions

### Solution 1: User Doesn't Exist

**Create the user:**
```bash
node scripts/create-test-user.js
```

### Solution 2: Wrong Password

**Use correct password:**
- Default test passwords are: `admin123`, `user123`

**Or reset password** (see Step 5)

### Solution 3: Account Locked

**Unlock account:**
```sql
UPDATE users
SET locked_until = NULL, failed_login_attempts = 0
WHERE username = 'admin';
```

### Solution 4: Account Inactive

**Activate account:**
```sql
UPDATE users SET is_active = true WHERE username = 'admin';
```

### Solution 5: Database Migration Not Run

**Run migration:**
```bash
npm run migrate-rbac
```

---

## Quick Fix: Create and Test User

```bash
# 1. Create test users
cd nagarparishad-backend
node scripts/create-test-user.js

# 2. Test login
curl -X POST http://api.kaamlo.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

---

## Expected Response

**Success:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@example.com",
      "full_name": "Admin User",
      "role": "admin",
      "phone_no": "1234567891"
    }
  }
}
```

**Error:**
```json
{
  "success": false,
  "error": "Invalid credentials"
}
```

---

## Still Having Issues?

1. **Check server is running**: `curl http://api.kaamlo.com/health`
2. **Check database connection**: Run Step 6
3. **Check server logs**: Look for error messages
4. **Verify environment variables**: Check `.env` file has correct DB credentials
5. **Check migration**: Ensure `003_add_rbac_auth.sql` was run

---

## Debug Mode

Enable detailed logging in `routes/auth.js`:

```javascript
// Add after line 114
console.log('Login attempt:', { username, userFound: !!user });
```

This will help identify where the login is failing.




