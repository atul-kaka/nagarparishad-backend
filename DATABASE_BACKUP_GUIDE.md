# Database Backup Guide

This guide covers multiple approaches for scheduling automated PostgreSQL database backups.

## Table of Contents

1. [Quick Start - Automated Backup Script](#quick-start)
2. [PostgreSQL Backup Methods](#backup-methods)
3. [Scheduling Backups](#scheduling-backups)
4. [Backup Storage & Retention](#backup-storage)
5. [Restore Procedures](#restore-procedures)
6. [Best Practices](#best-practices)

---

## Quick Start

### Option 1: Automated Backup Script (Recommended)

Create a backup script that can be scheduled:

**File: `scripts/backup-database.js`**

```javascript
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 5432;
const DB_NAME = process.env.DB_NAME || 'nagarparishad_db';
const DB_USER = process.env.DB_USER || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD || '';

// Backup directory
const BACKUP_DIR = process.env.BACKUP_DIR || path.join(__dirname, '../backups');
const RETENTION_DAYS = parseInt(process.env.BACKUP_RETENTION_DAYS || '30');

// Create backup directory if it doesn't exist
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Generate backup filename with timestamp
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + 
                  new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
const backupFile = path.join(BACKUP_DIR, `nagarparishad_db_${timestamp}.sql`);

// Set PGPASSWORD environment variable for pg_dump
process.env.PGPASSWORD = DB_PASSWORD;

// pg_dump command
const dumpCommand = `pg_dump -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -F c -f "${backupFile}.dump"`;

// Alternative: SQL format (uncomment if you prefer SQL format)
// const dumpCommand = `pg_dump -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -F p -f "${backupFile}"`;

console.log(`Starting backup: ${backupFile}`);
console.log(`Database: ${DB_NAME}@${DB_HOST}:${DB_PORT}`);

exec(dumpCommand, (error, stdout, stderr) => {
  if (error) {
    console.error(`Backup failed: ${error.message}`);
    process.exit(1);
  }

  if (stderr) {
    console.error(`Backup warnings: ${stderr}`);
  }

  // Compress backup (optional but recommended)
  const gzipCommand = `gzip "${backupFile}.dump"`;
  exec(gzipCommand, (gzipError) => {
    if (gzipError) {
      console.warn(`Compression failed: ${gzipError.message}`);
      console.log(`Backup saved (uncompressed): ${backupFile}.dump`);
    } else {
      console.log(`✅ Backup completed successfully: ${backupFile}.dump.gz`);
    }

    // Clean up old backups
    cleanupOldBackups();
  });
});

function cleanupOldBackups() {
  console.log(`Cleaning up backups older than ${RETENTION_DAYS} days...`);
  
  fs.readdir(BACKUP_DIR, (err, files) => {
    if (err) {
      console.error(`Error reading backup directory: ${err.message}`);
      return;
    }

    const now = Date.now();
    const maxAge = RETENTION_DAYS * 24 * 60 * 60 * 1000; // Convert days to milliseconds

    files.forEach(file => {
      const filePath = path.join(BACKUP_DIR, file);
      fs.stat(filePath, (statErr, stats) => {
        if (statErr) return;

        const fileAge = now - stats.mtime.getTime();
        if (fileAge > maxAge) {
          fs.unlink(filePath, (unlinkErr) => {
            if (unlinkErr) {
              console.error(`Error deleting old backup ${file}: ${unlinkErr.message}`);
            } else {
              console.log(`Deleted old backup: ${file}`);
            }
          });
        }
      });
    });
  });
}
```

**Add to package.json:**
```json
{
  "scripts": {
    "backup": "node scripts/backup-database.js"
  }
}
```

---

## Backup Methods

### Method 1: pg_dump (Recommended for Small to Medium Databases)

**Pros:**
- ✅ Simple and reliable
- ✅ Creates consistent backups
- ✅ Can backup specific tables/schemas
- ✅ Works while database is running

**Cons:**
- ⚠️ Can be slow for very large databases
- ⚠️ Requires database access

**Usage:**
```bash
# Custom format (compressed, recommended)
pg_dump -h localhost -U postgres -d nagarparishad_db -F c -f backup.dump

# SQL format (readable, uncompressed)
pg_dump -h localhost -U postgres -d nagarparishad_db -F p -f backup.sql

# Compress SQL backup
pg_dump -h localhost -U postgres -d nagarparishad_db -F p | gzip > backup.sql.gz
```

### Method 2: pg_dumpall (For All Databases)

Backs up all databases including system databases:

```bash
pg_dumpall -h localhost -U postgres -f all_databases.sql
```

### Method 3: Continuous Archiving (For Large Databases)

Uses WAL (Write-Ahead Logging) for point-in-time recovery:

```bash
# Requires PostgreSQL configuration changes
# See PostgreSQL documentation for setup
```

---

## Scheduling Backups

### Windows: Task Scheduler

#### Step 1: Create Backup Script

**File: `scripts/backup-database.bat`**

```batch
@echo off
cd /d "C:\projects\nagarparishad-backend"
call npm run backup
echo Backup completed at %date% %time%
```

#### Step 2: Schedule with Task Scheduler

1. Open **Task Scheduler** (search in Start menu)
2. Click **Create Basic Task**
3. **Name**: `Nagar Parishad DB Backup`
4. **Trigger**: Daily (or your preferred schedule)
5. **Time**: Choose off-peak hours (e.g., 2:00 AM)
6. **Action**: Start a program
7. **Program**: `C:\projects\nagarparishad-backend\scripts\backup-database.bat`
8. **Start in**: `C:\projects\nagarparishad-backend`
9. Click **Finish**

#### Step 3: Advanced Settings (Optional)

1. Right-click task → **Properties**
2. **General** tab:
   - ✅ Run whether user is logged on or not
   - ✅ Run with highest privileges
3. **Conditions** tab:
   - ✅ Start the task only if the computer is on AC power (uncheck if on battery is OK)
4. **Settings** tab:
   - ✅ Allow task to be run on demand
   - ✅ If the task fails, restart every: 10 minutes (max 3 times)

### Linux/macOS: Cron Job

#### Step 1: Make Script Executable

```bash
chmod +x scripts/backup-database.js
```

#### Step 2: Edit Crontab

```bash
crontab -e
```

#### Step 3: Add Backup Schedule

```bash
# Daily backup at 2:00 AM
0 2 * * * cd /path/to/nagarparishad-backend && /usr/bin/node scripts/backup-database.js >> /var/log/db-backup.log 2>&1

# Multiple backups per day (every 6 hours)
0 */6 * * * cd /path/to/nagarparishad-backend && /usr/bin/node scripts/backup-database.js >> /var/log/db-backup.log 2>&1

# Weekly backup on Sunday at 3:00 AM
0 3 * * 0 cd /path/to/nagarparishad-backend && /usr/bin/node scripts/backup-database.js >> /var/log/db-backup.log 2>&1
```

**Cron Schedule Format:**
```
* * * * *
│ │ │ │ │
│ │ │ │ └─── Day of week (0-7, 0 or 7 = Sunday)
│ │ │ └───── Month (1-12)
│ │ └─────── Day of month (1-31)
│ └───────── Hour (0-23)
└─────────── Minute (0-59)
```

**Examples:**
- `0 2 * * *` - Every day at 2:00 AM
- `0 */6 * * *` - Every 6 hours
- `0 0 * * 0` - Every Sunday at midnight
- `0 0 1 * *` - First day of every month at midnight

### Using PM2 (Node.js Process Manager)

If you're using PM2 to run your Node.js app:

```bash
# Install PM2
npm install -g pm2

# Create PM2 ecosystem file: ecosystem.config.js
```

**File: `ecosystem.config.js`**
```javascript
module.exports = {
  apps: [
    {
      name: 'nagarparishad-api',
      script: './server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production'
      }
    }
  ],
  // PM2 Cron Jobs
  cron_restart: '0 2 * * *', // Restart at 2 AM daily (optional)
};
```

**Schedule backup with PM2:**
```bash
# Install pm2-cron
pm2 install pm2-cron

# Schedule backup
pm2 cron "0 2 * * * node /path/to/scripts/backup-database.js"
```

---

## Backup Storage & Retention

### Local Storage Structure

```
backups/
├── daily/
│   ├── nagarparishad_db_2024-01-15_02-00-00.sql.gz
│   ├── nagarparishad_db_2024-01-16_02-00-00.sql.gz
│   └── ...
├── weekly/
│   ├── nagarparishad_db_2024-01-14_03-00-00.sql.gz
│   └── ...
└── monthly/
    ├── nagarparishad_db_2024-01-01_00-00-00.sql.gz
    └── ...
```

### Enhanced Backup Script with Multiple Retention Policies

**File: `scripts/backup-database-advanced.js`**

```javascript
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 5432;
const DB_NAME = process.env.DB_NAME || 'nagarparishad_db';
const DB_USER = process.env.DB_USER || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD || '';

const BACKUP_BASE_DIR = process.env.BACKUP_DIR || path.join(__dirname, '../backups');
const DAILY_RETENTION = parseInt(process.env.BACKUP_DAILY_RETENTION || '7'); // Keep 7 daily backups
const WEEKLY_RETENTION = parseInt(process.env.BACKUP_WEEKLY_RETENTION || '4'); // Keep 4 weekly backups
const MONTHLY_RETENTION = parseInt(process.env.BACKUP_MONTHLY_RETENTION || '12'); // Keep 12 monthly backups

// Create backup directories
const dirs = {
  daily: path.join(BACKUP_BASE_DIR, 'daily'),
  weekly: path.join(BACKUP_BASE_DIR, 'weekly'),
  monthly: path.join(BACKUP_BASE_DIR, 'monthly')
};

Object.values(dirs).forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Determine backup type based on schedule
function getBackupType() {
  const now = new Date();
  const day = now.getDate();
  const dayOfWeek = now.getDay();
  
  // First day of month = monthly backup
  if (day === 1) return 'monthly';
  // Sunday = weekly backup
  if (dayOfWeek === 0) return 'weekly';
  // Otherwise = daily backup
  return 'daily';
}

const backupType = getBackupType();
const backupDir = dirs[backupType];
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + 
                  new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
const backupFile = path.join(backupDir, `nagarparishad_db_${timestamp}.dump`);

process.env.PGPASSWORD = DB_PASSWORD;

const dumpCommand = `pg_dump -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -F c -f "${backupFile}"`;

console.log(`Starting ${backupType} backup: ${backupFile}`);

exec(dumpCommand, (error, stdout, stderr) => {
  if (error) {
    console.error(`Backup failed: ${error.message}`);
    process.exit(1);
  }

  if (stderr) {
    console.error(`Backup warnings: ${stderr}`);
  }

  // Compress backup
  const gzipCommand = `gzip "${backupFile}"`;
  exec(gzipCommand, (gzipError) => {
    if (gzipError) {
      console.warn(`Compression failed: ${gzipError.message}`);
      console.log(`Backup saved (uncompressed): ${backupFile}`);
    } else {
      console.log(`✅ ${backupType} backup completed: ${backupFile}.gz`);
    }

    // Clean up old backups
    cleanupOldBackups();
  });
});

function cleanupOldBackups() {
  const retentionPolicies = {
    daily: DAILY_RETENTION,
    weekly: WEEKLY_RETENTION,
    monthly: MONTHLY_RETENTION
  };

  Object.entries(dirs).forEach(([type, dir]) => {
    const retention = retentionPolicies[type];
    console.log(`Cleaning up ${type} backups (keeping ${retention} latest)...`);

    fs.readdir(dir, (err, files) => {
      if (err) {
        console.error(`Error reading ${dir}: ${err.message}`);
        return;
      }

      // Filter backup files and sort by modification time
      const backupFiles = files
        .filter(file => file.endsWith('.dump.gz') || file.endsWith('.dump'))
        .map(file => ({
          name: file,
          path: path.join(dir, file),
          time: fs.statSync(path.join(dir, file)).mtime.getTime()
        }))
        .sort((a, b) => b.time - a.time); // Newest first

      // Delete files beyond retention limit
      if (backupFiles.length > retention) {
        const filesToDelete = backupFiles.slice(retention);
        filesToDelete.forEach(file => {
          fs.unlink(file.path, (unlinkErr) => {
            if (unlinkErr) {
              console.error(`Error deleting ${file.name}: ${unlinkErr.message}`);
            } else {
              console.log(`Deleted old ${type} backup: ${file.name}`);
            }
          });
        });
      }
    });
  });
}
```

### Cloud Backup Storage

#### Option 1: AWS S3

**Install AWS CLI:**
```bash
# Windows
# Download from: https://aws.amazon.com/cli/

# Linux/macOS
pip install awscli
```

**Add to backup script:**
```javascript
const { exec } = require('child_process');

// After backup is created
const s3Command = `aws s3 cp "${backupFile}.gz" s3://your-bucket-name/backups/${backupType}/`;

exec(s3Command, (error) => {
  if (error) {
    console.error(`S3 upload failed: ${error.message}`);
  } else {
    console.log(`✅ Backup uploaded to S3`);
  }
});
```

#### Option 2: Azure Blob Storage

```javascript
const { BlobServiceClient } = require('@azure/storage-blob');

async function uploadToAzure(backupFile) {
  const blobServiceClient = BlobServiceClient.fromConnectionString(
    process.env.AZURE_STORAGE_CONNECTION_STRING
  );
  const containerClient = blobServiceClient.getContainerClient('backups');
  const blobName = path.basename(backupFile);
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  
  await blockBlobClient.uploadFile(backupFile);
  console.log(`✅ Backup uploaded to Azure: ${blobName}`);
}
```

#### Option 3: Google Cloud Storage

```bash
# Install gsutil
# Then in backup script:
gsutil cp "${backupFile}.gz" gs://your-bucket-name/backups/
```

---

## Restore Procedures

### Restore from Backup

#### Method 1: Restore Custom Format Backup (.dump)

```bash
# Drop existing database (CAUTION: This deletes all data!)
dropdb -h localhost -U postgres nagarparishad_db

# Create new database
createdb -h localhost -U postgres nagarparishad_db

# Restore backup
pg_restore -h localhost -U postgres -d nagarparishad_db backup.dump

# Or if compressed
gunzip < backup.dump.gz | pg_restore -h localhost -U postgres -d nagarparishad_db
```

#### Method 2: Restore SQL Format Backup (.sql)

```bash
# Drop and recreate database
dropdb -h localhost -U postgres nagarparishad_db
createdb -h localhost -U postgres nagarparishad_db

# Restore SQL backup
psql -h localhost -U postgres -d nagarparishad_db < backup.sql

# Or if compressed
gunzip < backup.sql.gz | psql -h localhost -U postgres -d nagarparishad_db
```

### Restore Script

**File: `scripts/restore-database.js`**

```javascript
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const backupFile = process.argv[2];

if (!backupFile) {
  console.error('Usage: node restore-database.js <backup-file>');
  process.exit(1);
}

if (!fs.existsSync(backupFile)) {
  console.error(`Backup file not found: ${backupFile}`);
  process.exit(1);
}

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 5432;
const DB_NAME = process.env.DB_NAME || 'nagarparishad_db';
const DB_USER = process.env.DB_USER || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD || '';

process.env.PGPASSWORD = DB_PASSWORD;

console.log(`⚠️  WARNING: This will replace all data in ${DB_NAME}`);
console.log(`Restoring from: ${backupFile}`);

// Determine backup format
const isCompressed = backupFile.endsWith('.gz');
const isCustomFormat = backupFile.endsWith('.dump') || backupFile.endsWith('.dump.gz');

let restoreCommand;

if (isCustomFormat) {
  if (isCompressed) {
    restoreCommand = `gunzip -c "${backupFile}" | pg_restore -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -c`;
  } else {
    restoreCommand = `pg_restore -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -c "${backupFile}"`;
  }
} else {
  if (isCompressed) {
    restoreCommand = `gunzip -c "${backupFile}" | psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME}`;
  } else {
    restoreCommand = `psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} < "${backupFile}"`;
  }
}

exec(restoreCommand, (error, stdout, stderr) => {
  if (error) {
    console.error(`Restore failed: ${error.message}`);
    process.exit(1);
  }

  if (stderr) {
    console.warn(`Restore warnings: ${stderr}`);
  }

  console.log(`✅ Database restored successfully from ${backupFile}`);
});
```

**Usage:**
```bash
npm run restore backups/daily/nagarparishad_db_2024-01-15_02-00-00.dump.gz
```

---

## Best Practices

### 1. Backup Frequency

- **Daily backups**: For active production databases
- **Hourly backups**: For critical systems with high transaction volume
- **Weekly backups**: For development/test databases
- **Monthly backups**: Long-term archival

### 2. Backup Storage

- ✅ **3-2-1 Rule**: 3 copies, 2 different media, 1 off-site
- ✅ Store backups on different server/storage
- ✅ Use cloud storage for off-site backups
- ✅ Encrypt sensitive backups

### 3. Testing

- ✅ **Test restores regularly** (monthly)
- ✅ Verify backup integrity
- ✅ Document restore procedures
- ✅ Practice disaster recovery

### 4. Monitoring

- ✅ Monitor backup job success/failure
- ✅ Alert on backup failures
- ✅ Check backup file sizes (unexpectedly small = problem)
- ✅ Monitor disk space for backup storage

### 5. Security

- ✅ Encrypt backups containing sensitive data
- ✅ Restrict access to backup files
- ✅ Use strong passwords for database
- ✅ Secure backup storage location

### 6. Environment Variables

Add to `.env`:

```env
# Backup Configuration
BACKUP_DIR=./backups
BACKUP_DAILY_RETENTION=7
BACKUP_WEEKLY_RETENTION=4
BACKUP_MONTHLY_RETENTION=12

# Cloud Storage (Optional)
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_S3_BUCKET=your-bucket-name

# Or Azure
AZURE_STORAGE_CONNECTION_STRING=your_connection_string
```

---

## Quick Reference

### Backup Commands

```bash
# Manual backup
npm run backup

# List backups
ls -lh backups/daily/

# Restore backup
npm run restore backups/daily/nagarparishad_db_2024-01-15_02-00-00.dump.gz
```

### Check Backup Size

```bash
# Linux/macOS
du -sh backups/*

# Windows
dir backups /s
```

### Verify Backup Integrity

```bash
# For custom format
pg_restore --list backup.dump

# For SQL format
head -n 20 backup.sql
```

---

## Troubleshooting

### Backup Fails: Permission Denied

```bash
# Linux: Ensure pg_dump is in PATH and user has permissions
which pg_dump
sudo -u postgres pg_dump -h localhost -U postgres -d nagarparishad_db
```

### Backup Fails: Connection Refused

- Check PostgreSQL is running
- Verify DB_HOST, DB_PORT in .env
- Check firewall rules
- Verify database credentials

### Backup File is Empty or Too Small

- Check database has data
- Verify pg_dump completed successfully
- Check disk space
- Review error logs

---

## Recommended Schedule

For production database:

```
Daily:   2:00 AM (keep 7 days)
Weekly:  Sunday 3:00 AM (keep 4 weeks)
Monthly: 1st of month, 4:00 AM (keep 12 months)
```

This provides:
- Quick recovery from recent issues (daily)
- Weekly snapshots for longer-term recovery
- Monthly archives for compliance/audit

---

## Next Steps

1. ✅ Create backup script
2. ✅ Set up scheduling (Cron/Task Scheduler)
3. ✅ Configure retention policies
4. ✅ Test backup and restore
5. ✅ Set up monitoring/alerts
6. ✅ Document procedures
7. ✅ Set up cloud backup (optional but recommended)

