# Database Connection Troubleshooting Guide

## Error: ETIMEDOUT - Connection Timeout

If you're seeing connection timeout errors like:
```
Error: connect ETIMEDOUT 172.67.208.154:54331
Error: connect ETIMEDOUT 104.21.66.226:54331
```

### Common Causes

1. **Wrong Host/Port Configuration**
   - The IPs `172.67.208.154` and `104.21.66.226` are Cloudflare IPs
   - Port `54331` is unusual (PostgreSQL default is `5432`)
   - Your `.env` file might have incorrect values

2. **Database Server Not Running**
   - PostgreSQL service is stopped
   - Database server is down

3. **Firewall Blocking Connection**
   - Firewall rules blocking port 5432
   - Network restrictions

4. **Wrong Database Host**
   - Using a domain name that resolves to Cloudflare instead of actual database IP
   - Proxy/CDN in front of database (not recommended)

## Quick Fixes

### Step 1: Check Your .env File

```bash
# Check current database configuration
cat .env | grep DB_
```

**Expected values:**
```bash
DB_HOST=localhost          # or your actual database server IP
DB_PORT=5432              # PostgreSQL default port (NOT 54331)
DB_NAME=nagarparishad_db
DB_USER=postgres
DB_PASSWORD=your_password
```

**If you see:**
- `DB_HOST` pointing to a domain name → Use the actual IP address
- `DB_PORT=54331` → Change to `5432`
- Cloudflare IPs → Your DB_HOST is resolving incorrectly

### Step 2: Test Database Connection

```bash
# Run diagnostic script
npm run test:db

# Or
node scripts/test-db-connection.js
```

This will show:
- Current configuration
- Connection attempt
- Detailed error messages
- Suggested fixes

### Step 3: Verify Database Server

**For Local Database:**
```bash
# Check if PostgreSQL is running
# Windows:
sc query postgresql-x64-14  # or your PostgreSQL service name

# Linux:
sudo systemctl status postgresql

# Test connection directly
psql -U postgres -d nagarparishad_db -h localhost -p 5432
```

**For Remote Database:**
```bash
# Test connection from command line
psql -h YOUR_DB_HOST -p 5432 -U postgres -d nagarparishad_db

# Test network connectivity
ping YOUR_DB_HOST
telnet YOUR_DB_HOST 5432
```

### Step 4: Fix Configuration

**If using localhost:**
```bash
# .env file
DB_HOST=localhost
DB_PORT=5432
```

**If using remote server:**
```bash
# .env file - Use actual IP, not domain name
DB_HOST=152.56.13.233    # Your actual database server IP
DB_PORT=5432             # NOT 54331
```

**If database is behind Cloudflare:**
- ❌ **Don't use Cloudflare for database connections**
- ✅ Use direct IP address
- ✅ Or use Cloudflare Tunnel (Cloudflare Zero Trust) for secure access

## Common Issues and Solutions

### Issue 1: Port 54331 Instead of 5432

**Problem:** Your `.env` has `DB_PORT=54331`

**Solution:**
```bash
# Edit .env file
DB_PORT=5432
```

### Issue 2: Cloudflare IPs in Connection

**Problem:** `DB_HOST` is a domain that resolves to Cloudflare IPs

**Solution:**
```bash
# Find actual database server IP
nslookup your-database-domain.com

# Use direct IP in .env
DB_HOST=actual.database.ip.address
```

### Issue 3: Connection Timeout

**Problem:** Can't reach database server

**Solutions:**

1. **Check firewall:**
   ```bash
   # Linux
   sudo ufw status
   sudo ufw allow 5432/tcp
   
   # Windows Firewall
   # Allow PostgreSQL through Windows Firewall
   ```

2. **Check PostgreSQL is listening:**
   ```bash
   # On database server
   sudo netstat -tlnp | grep 5432
   # Should show: 0.0.0.0:5432 or your IP:5432
   ```

3. **Check pg_hba.conf:**
   ```bash
   # On database server
   # Edit /etc/postgresql/*/main/pg_hba.conf
   # Add line:
   host    all    all    0.0.0.0/0    md5
   # Then restart: sudo systemctl restart postgresql
   ```

4. **Increase timeout:**
   ```bash
   # In .env file
   DB_CONNECTION_TIMEOUT=30000  # 30 seconds
   ```

### Issue 4: Wrong Database Host

**Problem:** Using domain name that resolves incorrectly

**Solution:**
```bash
# Use IP address directly
DB_HOST=192.168.1.100  # Your actual database server IP

# Or use localhost if on same machine
DB_HOST=localhost
```

## Diagnostic Commands

### Test Connection Script

```bash
npm run test:db
```

This will:
- Show current configuration
- Attempt connection
- Show detailed error messages
- Provide specific solutions

### Manual Connection Test

```bash
# Test with psql
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME

# Test network connectivity
ping $DB_HOST
telnet $DB_HOST $DB_PORT
```

### Check Environment Variables

```bash
# Windows (PowerShell)
Get-Content .env | Select-String "DB_"

# Linux/Mac
grep "^DB_" .env
```

## Updated Configuration

The database configuration now includes:

- ✅ Connection timeout settings
- ✅ Retry logic with exponential backoff
- ✅ Better error messages
- ✅ Connection pool configuration
- ✅ SSL support

## Environment Variables

Add these to your `.env` file for better connection handling:

```bash
# Connection timeouts
DB_CONNECTION_TIMEOUT=10000      # 10 seconds to connect
DB_STATEMENT_TIMEOUT=30000       # 30 seconds for queries

# Connection pool
DB_POOL_MIN=2                    # Minimum connections
DB_POOL_MAX=20                   # Maximum connections
DB_POOL_IDLE_TIMEOUT=30000       # Close idle after 30s

# SSL (if needed)
DB_SSL=false                     # Enable SSL for remote
DB_SSL_REJECT_UNAUTHORIZED=true  # Verify SSL certificate
```

## Still Having Issues?

1. **Run diagnostic:**
   ```bash
   npm run test:db
   ```

2. **Check logs:**
   - Look at server console output
   - Check for specific error codes

3. **Verify database:**
   - Is PostgreSQL running?
   - Is it listening on the correct port?
   - Are firewall rules correct?

4. **Test from different location:**
   - Try connecting from database server itself
   - Try from another machine
   - Check if it's a network issue

## Quick Reference

```bash
# Test connection
npm run test:db

# Check configuration
cat .env | grep DB_

# Test with psql
psql -h localhost -p 5432 -U postgres -d nagarparishad_db

# Check PostgreSQL status (Linux)
sudo systemctl status postgresql

# Check listening ports
sudo netstat -tlnp | grep 5432
```

