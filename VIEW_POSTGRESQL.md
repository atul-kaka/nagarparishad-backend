# How to View Data in PostgreSQL Database

## Method 1: Using psql Command Line (Recommended)

### Step 1: Connect to PostgreSQL

**Windows (Command Prompt or PowerShell):**
```bash
psql -U postgres -d nagarparishad_db
```

**macOS/Linux:**
```bash
psql -U postgres -d nagarparishad_db
```

If you get a password prompt, enter your PostgreSQL password.

### Step 2: Once Connected, Run SQL Queries

```sql
-- View all tables
\dt

-- View all schools
SELECT * FROM schools;

-- View all students
SELECT * FROM students;

-- View all leaving certificates
SELECT * FROM leaving_certificates;
```

### Step 3: Useful psql Commands

```sql
-- List all tables
\dt

-- Describe a table structure
\d schools
\d students
\d leaving_certificates

-- View certificates with full details (joined query)
SELECT 
  lc.id as certificate_id,
  lc.serial_no,
  s.name as school_name,
  st.full_name as student_name,
  lc.leaving_class,
  lc.leaving_date,
  lc.status
FROM leaving_certificates lc
INNER JOIN schools s ON lc.school_id = s.id
INNER JOIN students st ON lc.student_id = st.id
ORDER BY lc.created_at DESC;

-- Count records in each table
SELECT 
  (SELECT COUNT(*) FROM schools) as total_schools,
  (SELECT COUNT(*) FROM students) as total_students,
  (SELECT COUNT(*) FROM leaving_certificates) as total_certificates;

-- View data in a formatted way (psql formatting)
\x  -- Toggle expanded display (on/off)
\pset border 2  -- Set border style
\pset format wrapped  -- Wrap long lines

-- Exit psql
\q
```

### Step 4: Export Data to CSV

```sql
-- Export schools to CSV
\copy schools TO 'C:\temp\schools.csv' CSV HEADER;

-- Export students to CSV
\copy students TO 'C:\temp\students.csv' CSV HEADER;

-- Export certificates to CSV
\copy (SELECT lc.*, s.name as school_name, st.full_name as student_name 
       FROM leaving_certificates lc
       JOIN schools s ON lc.school_id = s.id
       JOIN students st ON lc.student_id = st.id) 
TO 'C:\temp\certificates.csv' CSV HEADER;
```

---

## Method 2: Quick Connection Without Prompting for Password

### Option A: Set PGPASSWORD Environment Variable

**Windows (Command Prompt):**
```cmd
set PGPASSWORD=your_password
psql -U postgres -d nagarparishad_db
```

**Windows (PowerShell):**
```powershell
$env:PGPASSWORD="your_password"
psql -U postgres -d nagarparishad_db
```

**macOS/Linux:**
```bash
export PGPASSWORD=your_password
psql -U postgres -d nagarparishad_db
```

### Option B: Use .pgpass File (More Secure)

Create a file `%APPDATA%\postgresql\pgpass.conf` on Windows or `~/.pgpass` on Linux/Mac:

```
localhost:5432:nagarparishad_db:postgres:your_password
```

Then you can connect without password:
```bash
psql -U postgres -d nagarparishad_db -h localhost
```

---

## Method 3: Using pgAdmin (GUI Tool - Easiest for Beginners)

### Installation
1. Download pgAdmin from: https://www.pgadmin.org/download/
2. Install pgAdmin 4

### Connect to Database
1. Open pgAdmin
2. Right-click on "Servers" → "Register" → "Server"
3. Fill in the connection details:
   - **General Tab:**
     - Name: `Local PostgreSQL`
   - **Connection Tab:**
     - Host: `localhost`
     - Port: `5432`
     - Database: `nagarparishad_db`
     - Username: `postgres`
     - Password: (your password)
4. Click "Save"

### View Data
1. Expand: Servers → Local PostgreSQL → Databases → nagarparishad_db → Schemas → public → Tables
2. Right-click on a table (e.g., `schools`)
3. Select "View/Edit Data" → "All Rows"
4. Data will display in a spreadsheet-like view

### Run Queries in pgAdmin
1. Click "Tools" → "Query Tool"
2. Type your SQL query
3. Click "Execute" (F5) or press F5

---

## Method 4: Using DBeaver (Free Cross-Platform GUI)

### Installation
1. Download from: https://dbeaver.io/download/
2. Install DBeaver Community Edition

### Connect
1. Click "New Database Connection"
2. Select "PostgreSQL"
3. Enter connection details:
   - Host: `localhost`
   - Port: `5432`
   - Database: `nagarparishad_db`
   - Username: `postgres`
   - Password: (your password)
4. Click "Test Connection" → "Finish"

### View Data
1. Expand: nagarparishad_db → Schemas → public → Tables
2. Double-click any table to view data
3. Use SQL editor to write custom queries

---

## Common SQL Queries for Your Database

### View All Data with Relations
```sql
SELECT 
  lc.id,
  lc.serial_no,
  s.name as school_name,
  st.full_name as student_name,
  st.uid_aadhar_no,
  lc.leaving_class,
  lc.leaving_date,
  lc.status,
  lc.created_at
FROM leaving_certificates lc
INNER JOIN schools s ON lc.school_id = s.id
INNER JOIN students st ON lc.student_id = st.id
ORDER BY lc.created_at DESC;
```

### Search for Specific Student
```sql
SELECT * FROM students 
WHERE full_name ILIKE '%राजेश%' 
   OR student_id = 'STU001';
```

### View Certificates by Status
```sql
SELECT 
  lc.serial_no,
  s.name as school,
  st.full_name as student,
  lc.status
FROM leaving_certificates lc
JOIN schools s ON lc.school_id = s.id
JOIN students st ON lc.student_id = st.id
WHERE lc.status = 'issued';
```

### View Latest Certificates (Last 10)
```sql
SELECT 
  lc.serial_no,
  s.name as school_name,
  st.full_name as student_name,
  lc.leaving_date
FROM leaving_certificates lc
JOIN schools s ON lc.school_id = s.id
JOIN students st ON lc.student_id = st.id
ORDER BY lc.created_at DESC
LIMIT 10;
```

### Get Statistics
```sql
SELECT 
  'Schools' as type, COUNT(*) as count FROM schools
UNION ALL
SELECT 'Students', COUNT(*) FROM students
UNION ALL
SELECT 'Certificates (Total)', COUNT(*) FROM leaving_certificates
UNION ALL
SELECT 'Certificates (Issued)', COUNT(*) FROM leaving_certificates WHERE status = 'issued'
UNION ALL
SELECT 'Certificates (Draft)', COUNT(*) FROM leaving_certificates WHERE status = 'draft';
```

---

## Troubleshooting

### Cannot Connect to PostgreSQL

**Check if PostgreSQL is running:**
```bash
# Windows
sc query postgresql-x64-15  # Adjust version number

# Check if service is running
net start | findstr postgresql

# Linux/Mac
sudo systemctl status postgresql
# or
pg_isready
```

### Connection Refused Error

1. Check PostgreSQL is running
2. Verify port 5432 is not blocked
3. Check `postgresql.conf` - ensure `listen_addresses = 'localhost'`
4. Check `pg_hba.conf` - ensure local connections are allowed

### Authentication Failed

1. Verify username is `postgres` (or your configured user)
2. Check password is correct
3. Try connecting as superuser: `psql -U postgres`

### Database Does Not Exist

Create it first:
```bash
psql -U postgres
CREATE DATABASE nagarparishad_db;
\q
```

Then run migrations:
```bash
npm run migrate
```

---

## Quick Reference: psql Keyboard Shortcuts

- `\q` - Quit/Exit
- `\dt` - List all tables
- `\d table_name` - Describe table structure
- `\l` - List all databases
- `\c database_name` - Connect to database
- `\x` - Toggle expanded display (for wide tables)
- `\?` - Show help for psql commands
- `\h` - Show help for SQL commands
- `Up/Down arrows` - Navigate command history
- `Ctrl+C` - Cancel current query

---

## Example: Complete Workflow

```bash
# 1. Connect to database
psql -U postgres -d nagarparishad_db

# 2. List tables
\dt

# 3. View schools
SELECT * FROM schools;

# 4. View students
SELECT * FROM students;

# 5. View certificates with details
SELECT lc.id, lc.serial_no, s.name, st.full_name, lc.leaving_date
FROM leaving_certificates lc
JOIN schools s ON lc.school_id = s.id
JOIN students st ON lc.student_id = st.id;

# 6. Exit
\q
```

---

For more advanced queries and examples, see `VIEW_DATA.md`



