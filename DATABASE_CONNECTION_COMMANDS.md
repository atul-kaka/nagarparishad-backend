# Database Connection Commands for ramtek_cert_db

## Quick Connection Commands

### Local Database (on same machine as PostgreSQL)

```cmd
psql -U postgres -d ramtek_cert_db
```

### Remote Database (from another machine)

```cmd
psql -h 152.56.13.233 -p 5432 -U postgres -d ramtek_cert_db
```

### With Password (no prompt)

**Windows Command Prompt:**
```cmd
set PGPASSWORD=your_password
psql -U postgres -d ramtek_cert_db -h localhost
```

**Windows PowerShell:**
```powershell
$env:PGPASSWORD="your_password"
psql -U postgres -d ramtek_cert_db -h localhost
```

**For Remote:**
```cmd
set PGPASSWORD=your_password
psql -h 152.56.13.233 -p 5432 -U postgres -d ramtek_cert_db
```

---

## Update .env File

If your database name is `ramtek_cert_db` instead of `nagarparishad_db`, update your `.env`:

```bash
DB_HOST=localhost              # For local
# OR
DB_HOST=152.56.13.233         # For remote

DB_PORT=5432
DB_NAME=ramtek_cert_db        # Updated database name
DB_USER=postgres
DB_PASSWORD=your_password
```

---

## Test Connection

**From Node.js:**
```bash
npm run test-db
```

**From Command Line:**
```cmd
psql -h 152.56.13.233 -p 5432 -U postgres -d ramtek_cert_db -c "SELECT version();"
```

---

## Common psql Commands After Connection

```sql
-- List all tables
\dt

-- Describe a table
\d students
\d schools

-- List all databases
\l

-- Show current database
SELECT current_database();

-- Count records
SELECT COUNT(*) FROM students;

-- Exit
\q
```


