# PostgreSQL Connection Guide

Complete guide for connecting to PostgreSQL database from different methods.

---

## 🔌 Connection Methods

### 1. **From Node.js Application (Already Configured)**

Your application uses the `pg` library to connect. Configuration is in `config/database.js`:

```javascript
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'nagarparishad_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});
```

**Setup `.env` file:**

```bash
# Create .env file in nagarparishad-backend folder
DB_HOST=localhost          # or your server IP (e.g., 152.56.13.233)
DB_PORT=5432
DB_NAME=nagarparishad_db
DB_USER=postgres
DB_PASSWORD=your_password_here
PORT=3000
NODE_ENV=development
```

**For Remote Database (On-Premise Server):**
```bash
DB_HOST=152.56.13.233      # Your public IP
DB_PORT=5432
DB_NAME=nagarparishad_db
DB_USER=postgres
DB_PASSWORD=your_password
```

**Test Connection:**
```bash
npm run check-db
```

---

### 2. **Command Line (psql) - Windows**

#### Install PostgreSQL (if not installed)

**Option A: Download Installer**
1. Download from: https://www.postgresql.org/download/windows/
2. Run installer
3. Remember the password you set for `postgres` user

**Option B: Using Chocolatey**
```cmd
choco install postgresql
```

---

#### Connect via psql

**Basic Connection:**
```cmd
psql -U postgres -d nagarparishad_db
```
It will prompt for password.

**With Password:**
```cmd
set PGPASSWORD=your_password
psql -U postgres -d nagarparishad_db -h localhost
```

**For Remote Database:**
```cmd
psql -U postgres -d nagarparishad_db -h 152.56.13.233 -p 5432
```

**Full Connection String:**
```cmd
psql -h 152.56.13.233 -p 5432 -U postgres -d nagarparishad_db
```

---

#### Common psql Commands

```sql
-- List all databases
\l

-- Connect to a database
\c nagarparishad_db

-- List all tables
\dt

-- Describe a table structure
\d students
\d+ students  -- Detailed view

-- List all schemas
\dn

-- Show current user
SELECT current_user;

-- Show current database
SELECT current_database();

-- Exit psql
\q
```

---

### 3. **Connection String Format**

#### Standard Connection String

```
postgresql://username:password@host:port/database
```

**Examples:**

**Local Database:**
```
postgresql://postgres:password123@localhost:5432/nagarparishad_db
```

**Remote Database:**
```
postgresql://postgres:password123@152.56.13.233:5432/nagarparishad_db
```

**With SSL (for production):**
```
postgresql://postgres:password123@152.56.13.233:5432/nagarparishad_db?sslmode=require
```

**In `.env` file (if using connection string):**
```bash
DATABASE_URL=postgresql://postgres:password123@152.56.13.233:5432/nagarparishad_db
```

---

### 4. **GUI Tools**

#### Option A: pgAdmin (Most Popular)

**Installation:**
1. Download: https://www.pgadmin.org/download/
2. Install pgAdmin 4

**Connection Steps:**
1. Open pgAdmin
2. Right-click "Servers" → "Register" → "Server"

3. **General Tab:**
   - Name: `Nagar Parishad DB` (or any name)

4. **Connection Tab:**
   - **Host name/address:** `localhost` (or `152.56.13.233` for remote)
   - **Port:** `5432`
   - **Maintenance database:** `postgres`
   - **Username:** `postgres`
   - **Password:** `your_password`
   - ✅ **Save password** (check this box)

5. **SSL Tab (for remote):**
   - SSL mode: `Prefer` or `Require`

6. Click "Save"

**Using pgAdmin:**
- View tables: Expand → Databases → nagarparishad_db → Schemas → public → Tables
- View data: Right-click table → "View/Edit Data" → "All Rows"
- Run queries: Tools → Query Tool (F5 to execute)

---

#### Option B: DBeaver (Free, Cross-Platform)

**Installation:**
1. Download: https://dbeaver.io/download/
2. Install DBeaver Community Edition

**Connection Steps:**
1. Open DBeaver
2. Click "New Database Connection" (plug icon)
3. Select "PostgreSQL"
4. Fill connection details:
   - **Host:** `localhost` (or `152.56.13.233`)
   - **Port:** `5432`
   - **Database:** `nagarparishad_db`
   - **Username:** `postgres`
   - **Password:** `your_password`
5. Click "Test Connection"
6. Click "Finish"

**Using DBeaver:**
- Browse tables in left panel
- Double-click table to view data
- Right-click → "View Data" for filtered views
- SQL Editor: Ctrl+` or File → New → SQL Editor

---

#### Option C: TablePlus (Windows/Mac - Paid/Free)

**Installation:**
1. Download: https://tableplus.com/
2. Install TablePlus

**Connection:**
1. Click "Create a new connection"
2. Select "PostgreSQL"
3. Enter credentials (same as above)
4. Click "Test" → "Connect"

---

### 5. **Remote Connection Setup**

To connect to your on-premise database (152.56.13.233):

#### Step 1: Configure PostgreSQL (On Server)

**Edit `postgresql.conf`:**
```conf
# Find and uncomment/edit:
listen_addresses = '*'  # or '0.0.0.0' to listen on all interfaces
port = 5432
```

**Location on Windows:**
```
C:\Program Files\PostgreSQL\15\data\postgresql.conf
```

#### Step 2: Configure Firewall (On Server)

**Windows Firewall:**
1. Open "Windows Defender Firewall with Advanced Security"
2. Click "Inbound Rules" → "New Rule"
3. Select "Port" → Next
4. TCP, Port 5432 → Next
5. Allow connection → Next
6. Check all profiles → Next
7. Name: "PostgreSQL" → Finish

**Or via Command:**
```cmd
netsh advfirewall firewall add rule name="PostgreSQL" dir=in action=allow protocol=TCP localport=5432
```

#### Step 3: Configure pg_hba.conf (Authentication)

**Edit `pg_hba.conf`:**
```conf
# Allow remote connections (IPv4)
host    all             all             0.0.0.0/0               md5

# Or specific IP (more secure)
host    all             all             192.168.1.0/24          md5
```

**Location on Windows:**
```
C:\Program Files\PostgreSQL\15\data\pg_hba.conf
```

**Restart PostgreSQL after changes:**
```cmd
# Windows Services
services.msc
# Find "postgresql-x64-15" → Right-click → Restart

# Or via command:
net stop postgresql-x64-15
net start postgresql-x64-15
```

#### Step 4: Router Port Forwarding

On your router, forward port 5432:
- **External Port:** 5432
- **Internal IP:** Your Windows machine IP (e.g., 192.168.31.47)
- **Internal Port:** 5432
- **Protocol:** TCP

**How to find router settings:**
1. Open browser → `192.168.1.1` or `192.168.0.1`
2. Login (usually admin/admin or check router label)
3. Find "Port Forwarding" or "Virtual Server"
4. Add rule as above

#### Step 5: Test Remote Connection

**From another machine:**
```cmd
psql -h 152.56.13.233 -p 5432 -U postgres -d nagarparishad_db
```

**Or from your application:**
```bash
DB_HOST=152.56.13.233
DB_PORT=5432
DB_NAME=nagarparishad_db
DB_USER=postgres
DB_PASSWORD=your_password
```

---

### 6. **Test Connection Scripts**

#### Test from Node.js

Create `test-connection.js`:
```javascript
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'nagarparishad_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

async function testConnection() {
  try {
    console.log('🔌 Testing database connection...');
    console.log(`Host: ${process.env.DB_HOST || 'localhost'}`);
    console.log(`Port: ${process.env.DB_PORT || 5432}`);
    console.log(`Database: ${process.env.DB_NAME || 'nagarparishad_db'}`);
    console.log(`User: ${process.env.DB_USER || 'postgres'}`);
    
    const result = await pool.query('SELECT NOW(), version()');
    console.log('✅ Connection successful!');
    console.log('📅 Server time:', result.rows[0].now);
    console.log('🐘 PostgreSQL version:', result.rows[0].version.split(',')[0]);
    
    // Test table access
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    console.log('\n📊 Tables found:', tables.rows.map(r => r.table_name).join(', '));
    
    await pool.end();
  } catch (error) {
    console.error('❌ Connection failed!');
    console.error('Error:', error.message);
    console.error('\n💡 Check:');
    console.error('  1. PostgreSQL is running');
    console.error('  2. .env file has correct credentials');
    console.error('  3. Database exists');
    console.error('  4. Firewall allows connection');
    process.exit(1);
  }
}

testConnection();
```

**Run:**
```bash
node test-connection.js
```

---

### 7. **Troubleshooting Common Issues**

#### ❌ Error: "Connection refused"

**Possible causes:**
- PostgreSQL not running
- Wrong port number
- Firewall blocking

**Solutions:**
```cmd
# Check if PostgreSQL is running (Windows)
sc query postgresql-x64-15

# Start PostgreSQL
net start postgresql-x64-15

# Check if port is listening
netstat -an | findstr 5432
```

---

#### ❌ Error: "password authentication failed"

**Solutions:**
1. Reset password:
   ```sql
   ALTER USER postgres WITH PASSWORD 'new_password';
   ```
2. Check `pg_hba.conf` - ensure `md5` or `scram-sha-256` is used

---

#### ❌ Error: "database does not exist"

**Solutions:**
```sql
-- Connect to postgres database first
psql -U postgres -d postgres

-- Create database
CREATE DATABASE nagarparishad_db;

-- Exit and reconnect
\q
psql -U postgres -d nagarparishad_db
```

---

#### ❌ Error: "could not connect to server"

**For Remote Connection:**
1. Check `listen_addresses` in `postgresql.conf` = `'*'`
2. Check `pg_hba.conf` allows your IP
3. Check Windows Firewall allows port 5432
4. Check router port forwarding is set
5. Test with: `telnet 152.56.13.233 5432`

---

#### ❌ Error: "too many clients already"

**Solution:**
Increase `max_connections` in `postgresql.conf`:
```conf
max_connections = 200  # Default is 100
```

Then restart PostgreSQL.

---

### 8. **Quick Reference - Connection Examples**

#### Local Database

**Command Line:**
```cmd
psql -U postgres -d nagarparishad_db
```

**Application (.env):**
```bash
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nagarparishad_db
DB_USER=postgres
DB_PASSWORD=your_password
```

**Connection String:**
```
postgresql://postgres:password@localhost:5432/nagarparishad_db
```

---

#### Remote Database (On-Premise)

**Command Line:**
```cmd
psql -h 152.56.13.233 -p 5432 -U postgres -d nagarparishad_db
```

**Application (.env):**
```bash
DB_HOST=152.56.13.233
DB_PORT=5432
DB_NAME=nagarparishad_db
DB_USER=postgres
DB_PASSWORD=your_password
```

**Connection String:**
```
postgresql://postgres:password@152.56.13.233:5432/nagarparishad_db
```

---

#### Cloud Database (Azure)

**Application (.env):**
```bash
DB_HOST=your-server.postgres.database.azure.com
DB_PORT=5432
DB_NAME=nagarparishad_db
DB_USER=adminuser@your-server
DB_PASSWORD=your_password
```

**Connection String (with SSL):**
```
postgresql://adminuser%40your-server:password@your-server.postgres.database.azure.com:5432/nagarparishad_db?sslmode=require
```

---

### 9. **Security Best Practices**

#### ✅ DO:
- Use strong passwords
- Limit remote access to specific IPs in `pg_hba.conf`
- Use SSL for remote connections
- Keep PostgreSQL updated
- Use firewall rules

#### ❌ DON'T:
- Don't use default `postgres` user in production (create dedicated user)
- Don't expose PostgreSQL to public internet without SSL
- Don't use weak passwords
- Don't allow connections from `0.0.0.0/0` unless necessary

#### Create Application-Specific User:
```sql
-- Create read-write user
CREATE USER nagarparishad_app WITH PASSWORD 'strong_password';
GRANT CONNECT ON DATABASE nagarparishad_db TO nagarparishad_app;
GRANT USAGE ON SCHEMA public TO nagarparishad_app;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO nagarparishad_app;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO nagarparishad_app;

-- Then use this user in .env:
DB_USER=nagarparishad_app
DB_PASSWORD=strong_password
```

---

### 10. **Quick Test Commands**

**Check PostgreSQL is running:**
```cmd
pg_isready -U postgres
```

**List all databases:**
```cmd
psql -U postgres -c "\l"
```

**Connect and run a query:**
```cmd
psql -U postgres -d nagarparishad_db -c "SELECT COUNT(*) FROM students;"
```

**Check current connections:**
```sql
SELECT * FROM pg_stat_activity;
```

---

## 🎯 Summary

**For Local Development:**
```bash
# .env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nagarparishad_db
DB_USER=postgres
DB_PASSWORD=your_password
```

**For Remote Database (Your Server):**
```bash
# .env
DB_HOST=152.56.13.233
DB_PORT=5432
DB_NAME=nagarparishad_db
DB_USER=postgres
DB_PASSWORD=your_password
```

**Test Connection:**
```bash
npm run check-db
```

**GUI Tool:** Use pgAdmin or DBeaver for easy management!



