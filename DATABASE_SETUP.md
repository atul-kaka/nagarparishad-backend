# How to Create Tables Using schema_with_audit.sql

This guide shows you how to run the SQL schema file to create all tables in PostgreSQL.

---

## Method 1: Using psql Command Line (Recommended)

### Step 1: Open Command Prompt or PowerShell

### Step 2: Navigate to your project directory

```cmd
cd C:\projects\nagarparishad-backend
```

### Step 3: Run the SQL file

**Option A: Using psql directly**
```cmd
psql -U postgres -d nagarparishad_db -f database/schema_with_audit.sql
```

**Option B: If you need to enter password**
```cmd
psql -U postgres -d nagarparishad_db -f database/schema_with_audit.sql
```
(Enter password when prompted)

**Option C: Set password in environment variable (Windows)**
```cmd
set PGPASSWORD=your_password
psql -U postgres -d nagarparishad_db -f database/schema_with_audit.sql
```

**Option D: Using PowerShell**
```powershell
$env:PGPASSWORD="your_password"
psql -U postgres -d nagarparishad_db -f database/schema_with_audit.sql
```

### Step 4: Verify Tables Created

```cmd
psql -U postgres -d nagarparishad_db -c "\dt"
```

You should see:
- users
- schools
- students
- leaving_certificates
- audit_logs
- certificate_status_history

---

## Method 2: Using pgAdmin (GUI Tool)

### Step 1: Open pgAdmin

1. Launch pgAdmin 4
2. Connect to your PostgreSQL server

### Step 2: Open Query Tool

1. Expand: **Servers** → **PostgreSQL** → **Databases** → **nagarparishad_db**
2. Right-click on **nagarparishad_db** → **Query Tool**

### Step 3: Open SQL File

1. Click **File** → **Open File**
2. Navigate to: `C:\projects\nagarparishad-backend\database\schema_with_audit.sql`
3. Click **Open**

### Step 4: Execute

1. Click the **Execute** button (▶) or press **F5**
2. Wait for "Query returned successfully" message

### Step 5: Verify

1. In the left panel, expand **nagarparishad_db** → **Schemas** → **public** → **Tables**
2. You should see all 6 tables listed

---

## Method 3: Copy-Paste SQL in psql

### Step 1: Connect to Database

```cmd
psql -U postgres -d nagarparishad_db
```

### Step 2: Copy SQL Content

1. Open `database/schema_with_audit.sql` in a text editor
2. Copy all the content (Ctrl+A, Ctrl+C)

### Step 3: Paste and Execute

1. In the psql prompt, paste the SQL (right-click or Ctrl+V)
2. Press **Enter**
3. Wait for completion

### Step 4: Verify

```sql
\dt
```

### Step 5: Exit

```sql
\q
```

---

## Method 4: Using Node.js Script

### Step 1: Run the Migration Script

```cmd
cd C:\projects\nagarparishad-backend
npm run migrate
```

**Note:** You may need to update `scripts/migrate.js` to use `schema_with_audit.sql` instead of `schema.sql`

---

## Troubleshooting

### Error: "database does not exist"

Create the database first:
```cmd
psql -U postgres
CREATE DATABASE nagarparishad_db;
\q
```

### Error: "permission denied"

Run as PostgreSQL superuser or ensure your user has CREATE privileges:
```cmd
psql -U postgres -d nagarparishad_db
GRANT ALL PRIVILEGES ON DATABASE nagarparishad_db TO your_username;
\q
```

### Error: "relation already exists"

If tables already exist, you can:
1. **Drop and recreate** (⚠️ deletes all data):
   ```sql
   DROP TABLE IF EXISTS certificate_status_history CASCADE;
   DROP TABLE IF EXISTS audit_logs CASCADE;
   DROP TABLE IF EXISTS leaving_certificates CASCADE;
   DROP TABLE IF EXISTS students CASCADE;
   DROP TABLE IF EXISTS schools CASCADE;
   DROP TABLE IF EXISTS users CASCADE;
   ```
   Then run the schema file again.

2. **Or use migration script** (safer):
   ```cmd
   psql -U postgres -d nagarparishad_db -f database/migrations/002_add_audit_tables.sql
   ```

### Error: "function already exists"

The triggers use `CREATE OR REPLACE FUNCTION`, so this should not be an issue. If it occurs, you can drop the function first:
```sql
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS log_audit_changes() CASCADE;
```

---

## Verify Tables Are Created

### Check All Tables

```sql
\dt
```

### Check Table Structure

```sql
\d users
\d schools
\d students
\d leaving_certificates
\d audit_logs
\d certificate_status_history
```

### Check Indexes

```sql
\di
```

### Check Functions

```sql
\df
```

### Check Triggers

```sql
SELECT trigger_name, event_object_table, action_statement 
FROM information_schema.triggers 
WHERE trigger_schema = 'public';
```

---

## Quick Reference Commands

```cmd
# Connect to database
psql -U postgres -d nagarparishad_db

# Run SQL file
\i database/schema_with_audit.sql

# Or from command line
psql -U postgres -d nagarparishad_db -f database/schema_with_audit.sql

# List tables
\dt

# Describe table
\d table_name

# Exit psql
\q
```

---

## Step-by-Step: Complete Setup

### 1. Create Database (if not exists)

```cmd
psql -U postgres
CREATE DATABASE nagarparishad_db;
\q
```

### 2. Run Schema

```cmd
cd C:\projects\nagarparishad-backend
psql -U postgres -d nagarparishad_db -f database/schema_with_audit.sql
```

### 3. Verify

```cmd
psql -U postgres -d nagarparishad_db -c "\dt"
```

### 4. Check One Table Structure

```cmd
psql -U postgres -d nagarparishad_db -c "\d users"
```

---

## Expected Output

After running the schema, you should see:

```
CREATE TABLE
CREATE TABLE
CREATE TABLE
CREATE TABLE
CREATE TABLE
CREATE TABLE
CREATE INDEX
CREATE INDEX
... (more indexes)
CREATE FUNCTION
CREATE TRIGGER
CREATE TRIGGER
... (more triggers)
```

No errors should appear. If you see errors, check the troubleshooting section above.

---

## Next Steps

After tables are created:

1. **Install dependencies:**
   ```cmd
   npm install
   ```

2. **Start the server:**
   ```cmd
   npm start
   ```

3. **Register first user:**
   ```cmd
   curl -X POST http://localhost:3000/api/users/register -H "Content-Type: application/json" -d "{\"username\":\"admin\",\"email\":\"admin@example.com\",\"password\":\"admin123\",\"full_name\":\"Admin User\"}"
   ```

Your database is now ready with audit trail support!

