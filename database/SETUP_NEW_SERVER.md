# Setting Up Database on New Server

This guide explains how to create the same database tables on another server machine.

## Prerequisites

- PostgreSQL installed on the new server
- Access to PostgreSQL (psql or pgAdmin)
- Database credentials (username, password)

## Method 1: Using Consolidated Schema (Recommended)

### Step 1: Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE nagarparishad_db 
  WITH ENCODING 'UTF8' 
  LC_COLLATE='en_US.UTF-8' 
  LC_CTYPE='en_US.UTF-8';

# Connect to the new database
\c nagarparishad_db
```

### Step 2: Run Consolidated Schema

```bash
# From your project directory
psql -U postgres -d nagarparishad_db -f database/schema_with_audit.sql
```

This creates all tables with audit fields in one go.

### Step 3: Run All Migrations

```bash
# Run migrations in order
psql -U postgres -d nagarparishad_db -f database/migrations/001_initial_schema.sql
psql -U postgres -d nagarparishad_db -f database/migrations/002_add_audit_tables.sql
psql -U postgres -d nagarparishad_db -f database/migrations/003_add_rbac_auth.sql
psql -U postgres -d nagarparishad_db -f database/migrations/004_add_password_reset.sql
psql -U postgres -d nagarparishad_db -f database/migrations/005_consolidate_certificate_to_student.sql
psql -U postgres -d nagarparishad_db -f database/migrations/006_add_performance_indexes.sql
psql -U postgres -d nagarparishad_db -f database/migrations/007_add_unique_constraints_schools.sql
psql -U postgres -d nagarparishad_db -f database/migrations/008_add_comment_to_students.sql
psql -U postgres -d nagarparishad_db -f database/migrations/009_add_medium_to_students.sql
psql -U postgres -d nagarparishad_db -f database/migrations/010_drop_student_medium.sql
psql -U postgres -d nagarparishad_db -f database/migrations/011_add_qr_code_hash.sql
psql -U postgres -d nagarparishad_db -f database/migrations/012_rename_general_register_ref_to_school_general_register_no.sql
psql -U postgres -d nagarparishad_db -f database/migrations/013_ensure_utf8_encoding.sql
```

---

## Method 2: Using Complete Schema Script (Easiest)

### Step 1: Create Database

```bash
psql -U postgres -c "CREATE DATABASE nagarparishad_db WITH ENCODING 'UTF8';"
```

### Step 2: Run Complete Schema

Use the `complete_schema.sql` script (see below) which includes all tables and migrations:

```bash
psql -U postgres -d nagarparishad_db -f database/complete_schema.sql
```

This single script creates everything in the correct order.

---

## Method 3: Using pg_dump (Copy from Existing Server)

If you want to copy the entire database structure (and optionally data) from your existing server:

### Step 1: Export Schema Only (No Data)

```bash
# On OLD server
pg_dump -U postgres -d nagarparishad_db --schema-only -f schema_backup.sql
```

### Step 2: Copy File to New Server

```bash
# Copy schema_backup.sql to new server
scp schema_backup.sql user@new-server:/path/to/
```

### Step 3: Import on New Server

```bash
# On NEW server
psql -U postgres -d nagarparishad_db -f schema_backup.sql
```

### Export with Data (Optional)

If you also want to copy data:

```bash
# Export schema + data
pg_dump -U postgres -d nagarparishad_db -f full_backup.sql

# Import on new server
psql -U postgres -d nagarparishad_db -f full_backup.sql
```

---

## Method 4: Remote Connection

If you have network access to the new server:

### From Your Local Machine

```bash
# Create database on remote server
psql -h new-server-ip -U postgres -c "CREATE DATABASE nagarparishad_db WITH ENCODING 'UTF8';"

# Run schema
psql -h new-server-ip -U postgres -d nagarparishad_db -f database/schema_with_audit.sql

# Run migrations
for file in database/migrations/*.sql; do
  psql -h new-server-ip -U postgres -d nagarparishad_db -f "$file"
done
```

---

## Verification

After setup, verify tables were created:

```sql
-- Connect to database
\c nagarparishad_db

-- List all tables
\dt

-- Check specific table structure
\d students
\d schools
\d users
\d audit_logs

-- Count records (should be 0 for new database)
SELECT 
  (SELECT COUNT(*) FROM schools) as schools_count,
  (SELECT COUNT(*) FROM students) as students_count,
  (SELECT COUNT(*) FROM users) as users_count;
```

Expected tables:
- `schools`
- `students`
- `users`
- `audit_logs`
- `password_reset_tokens` (if migration 004 was run)

---

## Windows PowerShell Script

Create `setup-new-database.ps1`:

```powershell
# Setup Database on New Server
$DB_HOST = "localhost"  # or new server IP
$DB_USER = "postgres"
$DB_NAME = "nagarparishad_db"

# Create database
$env:PGPASSWORD = "your_password"
psql -h $DB_HOST -U $DB_USER -c "CREATE DATABASE $DB_NAME WITH ENCODING 'UTF8';"

# Run schema
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f database\schema_with_audit.sql

# Run migrations
Get-ChildItem database\migrations\*.sql | Sort-Object Name | ForEach-Object {
    Write-Host "Running $($_.Name)..."
    psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f $_.FullName
}

Write-Host "Database setup complete!"
```

---

## Linux/Mac Bash Script

Create `setup-new-database.sh`:

```bash
#!/bin/bash

# Setup Database on New Server
DB_HOST="localhost"  # or new server IP
DB_USER="postgres"
DB_NAME="nagarparishad_db"
DB_PASSWORD="your_password"

export PGPASSWORD=$DB_PASSWORD

# Create database
psql -h $DB_HOST -U $DB_USER -c "CREATE DATABASE $DB_NAME WITH ENCODING 'UTF8';"

# Run schema
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f database/schema_with_audit.sql

# Run migrations in order
for file in database/migrations/*.sql; do
    echo "Running $(basename $file)..."
    psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f "$file"
done

echo "Database setup complete!"
```

Make executable:
```bash
chmod +x setup-new-database.sh
./setup-new-database.sh
```

---

## Using pgAdmin (GUI)

1. **Connect to New Server**
   - Open pgAdmin
   - Right-click "Servers" → "Register" → "Server"
   - Enter connection details

2. **Create Database**
   - Right-click "Databases" → "Create" → "Database"
   - Name: `nagarparishad_db`
   - Encoding: `UTF8`
   - Click "Save"

3. **Run SQL Scripts**
   - Right-click `nagarparishad_db` → "Query Tool"
   - Open `database/schema_with_audit.sql`
   - Execute (F5)
   - Repeat for each migration file in order

---

## Troubleshooting

### Error: "database already exists"
```sql
-- Drop and recreate (WARNING: Deletes all data!)
DROP DATABASE IF EXISTS nagarparishad_db;
CREATE DATABASE nagarparishad_db WITH ENCODING 'UTF8';
```

### Error: "permission denied"
```sql
-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE nagarparishad_db TO postgres;
```

### Error: "relation already exists"
Migrations use `IF NOT EXISTS`, so this shouldn't happen. If it does:
```sql
-- Check what exists
\dt

-- Drop specific table if needed (WARNING: Deletes data!)
DROP TABLE IF EXISTS table_name CASCADE;
```

### Error: "encoding mismatch"
```sql
-- Recreate database with UTF-8
DROP DATABASE nagarparishad_db;
CREATE DATABASE nagarparishad_db 
  WITH ENCODING 'UTF8' 
  LC_COLLATE='en_US.UTF-8' 
  LC_CTYPE='en_US.UTF-8';
```

---

## Quick Reference

### Create Database
```sql
CREATE DATABASE nagarparishad_db WITH ENCODING 'UTF8';
```

### List Tables
```sql
\dt
```

### Check Table Structure
```sql
\d table_name
```

### Drop Database (WARNING: Deletes everything!)
```sql
DROP DATABASE nagarparishad_db;
```

---

## Next Steps

After creating tables:

1. **Update .env file** on new server:
   ```bash
   DB_HOST=localhost  # or new server IP
   DB_PORT=5432
   DB_NAME=nagarparishad_db
   DB_USER=postgres
   DB_PASSWORD=your_password
   ```

2. **Test Connection**:
   ```bash
   npm run check-db
   ```

3. **Create Initial Admin User** (if needed):
   ```sql
   INSERT INTO users (username, email, password_hash, full_name, role)
   VALUES ('admin', 'admin@example.com', '$2b$10$...', 'Admin User', 'admin');
   ```

4. **Verify Setup**:
   - Start your Node.js application
   - Test API endpoints
   - Check database connection

---

## Files Needed

Copy these files to the new server:
- `database/schema_with_audit.sql` (or `complete_schema.sql`)
- `database/migrations/*.sql` (all migration files)

Or use the complete schema script (see below) which includes everything.

