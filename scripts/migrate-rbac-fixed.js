/**
 * Migration script for RBAC and Authentication features (Fixed version)
 * Run: node scripts/migrate-rbac-fixed.js
 */

const fs = require('fs');
const path = require('path');
const pool = require('../config/database');

async function runMigration() {
  try {
    console.log('Starting RBAC and Authentication migration...\n');
    
    const migrationFile = path.join(__dirname, '../database/migrations/003_add_rbac_auth.sql');
    const sql = fs.readFileSync(migrationFile, 'utf8');
    
    // Execute the entire SQL file - PostgreSQL can handle multiple statements
    // This avoids issues with function definitions and dollar quoting
    try {
      await pool.query(sql);
      console.log('✅ Migration completed successfully!\n');
      console.log('Next steps:');
      console.log('1. Verify migration: npm run check-db');
      console.log('2. Test login: curl -X POST http://api.kaamlo.com/api/auth/login -H "Content-Type: application/json" -d \'{"username":"admin","password":"admin123"}\'');
      process.exit(0);
    } catch (error) {
      // If it's a "already exists" error, that's okay
      if (error.message.includes('already exists') || 
          error.message.includes('duplicate') ||
          error.code === '42710' || // duplicate_object
          error.code === '42P07') { // duplicate_table
        console.log('⚠️  Some objects already exist, but migration may have partially completed.');
        console.log('Run: npm run check-db to verify what was created.\n');
        process.exit(0);
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\nError details:', error);
    process.exit(1);
  }
}

runMigration();



