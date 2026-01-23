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

// pg_dump command - using custom format (compressed, recommended)
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

  if (stderr && !stderr.includes('NOTICE')) {
    console.error(`Backup warnings: ${stderr}`);
  }

  // Compress backup (optional but recommended)
  // Note: On Windows, you may need to install gzip or use 7-Zip
  const isWindows = process.platform === 'win32';
  
  if (isWindows) {
    // Windows: Use PowerShell compression or 7-Zip if available
    const compressCommand = `powershell Compress-Archive -Path "${backupFile}.dump" -DestinationPath "${backupFile}.dump.zip" -Force`;
    exec(compressCommand, (compressError) => {
      if (compressError) {
        console.warn(`Compression failed: ${compressError.message}`);
        console.log(`Backup saved (uncompressed): ${backupFile}.dump`);
      } else {
        // Delete uncompressed file after compression
        fs.unlinkSync(`${backupFile}.dump`);
        console.log(`✅ Backup completed successfully: ${backupFile}.dump.zip`);
      }
      cleanupOldBackups();
    });
  } else {
    // Linux/macOS: Use gzip
    const gzipCommand = `gzip "${backupFile}.dump"`;
    exec(gzipCommand, (gzipError) => {
      if (gzipError) {
        console.warn(`Compression failed: ${gzipError.message}`);
        console.log(`Backup saved (uncompressed): ${backupFile}.dump`);
      } else {
        console.log(`✅ Backup completed successfully: ${backupFile}.dump.gz`);
      }
      cleanupOldBackups();
    });
  }
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

