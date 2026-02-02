# How to View Data in the Database

There are several ways to view your data. Here are the most common methods:

---

## Method 1: Using API Endpoints (Easiest)

### View All Schools
```bash
curl http://localhost:3000/api/schools
```

### View All Students
```bash
curl http://localhost:3000/api/students
```

### View All Certificates
```bash
curl http://localhost:3000/api/certificates
```

### View Specific Data by ID

**Get school by ID:**
```bash
curl http://localhost:3000/api/schools/1
```

**Get student by ID:**
```bash
curl http://localhost:3000/api/students/1
```

**Get certificate by ID (with full details):**
```bash
curl http://localhost:3000/api/certificates/1
```

### Search Student by Student ID or Aadhar
```bash
curl http://localhost:3000/api/students/search/STU001
# or
curl http://localhost:3000/api/students/search/123456789012
```

### Filter Certificates
```bash
# By school
curl http://localhost:3000/api/certificates?school_id=1

# By student
curl http://localhost:3000/api/certificates?student_id=1

# By status
curl http://localhost:3000/api/certificates?status=issued

# Combined filters
curl http://localhost:3000/api/certificates?school_id=1&status=issued
```

---

## Method 2: Using PostgreSQL Command Line (psql)

### Connect to Database
```bash
psql -U postgres -d nagarparishad_db
```

### View All Tables
```sql
\dt
```

### View All Schools
```sql
SELECT * FROM schools;
```

### View All Students
```sql
SELECT * FROM students;
```

### View All Certificates
```sql
SELECT * FROM leaving_certificates;
```

### View Certificates with School and Student Details
```sql
SELECT 
  lc.id,
  lc.serial_no,
  s.name as school_name,
  st.full_name as student_name,
  lc.leaving_date,
  lc.leaving_class,
  lc.status
FROM leaving_certificates lc
INNER JOIN schools s ON lc.school_id = s.id
INNER JOIN students st ON lc.student_id = st.id
ORDER BY lc.created_at DESC;
```

### Count Records
```sql
SELECT 
  (SELECT COUNT(*) FROM schools) as total_schools,
  (SELECT COUNT(*) FROM students) as total_students,
  (SELECT COUNT(*) FROM leaving_certificates) as total_certificates;
```

### View Specific Record
```sql
-- View school by ID
SELECT * FROM schools WHERE id = 1;

-- View student by ID
SELECT * FROM students WHERE id = 1;

-- View certificate by ID
SELECT * FROM leaving_certificates WHERE id = 1;
```

### Exit psql
```sql
\q
```

---

## Method 3: Using a Database GUI Tool

### pgAdmin (Recommended)
1. Download and install pgAdmin from https://www.pgadmin.org/
2. Add your PostgreSQL server connection:
   - Host: localhost
   - Port: 5432
   - Database: nagarparishad_db
   - Username: postgres
   - Password: (your password)
3. Browse tables in the left panel
4. Right-click on a table → View/Edit Data → All Rows

### DBeaver (Free Cross-Platform)
1. Download from https://dbeaver.io/
2. Create new PostgreSQL connection
3. Enter connection details
4. Browse and view tables

### TablePlus (Mac/Windows)
1. Download from https://tableplus.com/
2. Create new PostgreSQL connection
3. View tables in the GUI

---

## Method 4: Using a Quick Query Script

Create a simple Node.js script to view data:

```javascript
// view-data.js
const pool = require('./config/database');

async function viewData() {
  try {
    // View all schools
    console.log('\n=== SCHOOLS ===');
    const schools = await pool.query('SELECT * FROM schools');
    console.table(schools.rows);

    // View all students
    console.log('\n=== STUDENTS ===');
    const students = await pool.query('SELECT * FROM students');
    console.table(students.rows);

    // View all certificates
    console.log('\n=== CERTIFICATES ===');
    const certs = await pool.query(`
      SELECT 
        lc.id, lc.serial_no, lc.leaving_date, lc.leaving_class, lc.status,
        s.name as school_name,
        st.full_name as student_name
      FROM leaving_certificates lc
      INNER JOIN schools s ON lc.school_id = s.id
      INNER JOIN students st ON lc.student_id = st.id
    `);
    console.table(certs.rows);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

viewData();
```

Run it:
```bash
node view-data.js
```

---

## Method 5: Pretty Print JSON (Windows PowerShell)

For better readability when using curl in PowerShell:

```powershell
# Get all schools and format JSON
curl http://localhost:3000/api/schools | ConvertFrom-Json | ConvertTo-Json -Depth 10

# Get all students
curl http://localhost:3000/api/students | ConvertFrom-Json | ConvertTo-Json -Depth 10

# Get all certificates
curl http://localhost:3000/api/certificates | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

---

## Quick Reference: Useful SQL Queries

```sql
-- View all data at once
SELECT 'Schools' as table_name, COUNT(*) as count FROM schools
UNION ALL
SELECT 'Students', COUNT(*) FROM students
UNION ALL
SELECT 'Certificates', COUNT(*) FROM leaving_certificates;

-- Find certificates issued today
SELECT * FROM leaving_certificates 
WHERE DATE(created_at) = CURRENT_DATE;

-- Find students by birth year
SELECT full_name, date_of_birth 
FROM students 
WHERE EXTRACT(YEAR FROM date_of_birth) = 2010;

-- List all certificates with full details (one query)
SELECT 
  lc.serial_no,
  s.name as school,
  st.full_name as student,
  st.uid_aadhar_no,
  lc.leaving_class,
  lc.leaving_date,
  lc.status,
  lc.created_at
FROM leaving_certificates lc
JOIN schools s ON lc.school_id = s.id
JOIN students st ON lc.student_id = st.id
ORDER BY lc.created_at DESC
LIMIT 10;
```

---

## Tips

1. **For quick checks**: Use the API endpoints with curl
2. **For detailed analysis**: Use psql or a GUI tool
3. **For automation**: Use the API or create custom scripts
4. **For large datasets**: Add pagination or LIMIT clauses in queries




