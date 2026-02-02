/**
 * Migration script to consolidate certificate data into students table
 * Run: node scripts/migrate-consolidate.js
 */

const fs = require('fs');
const path = require('path');
const pool = require('../config/database');

async function runMigration() {
  try {
    console.log('Starting Certificate Consolidation migration...\n');
    
    const migrationFile = path.join(__dirname, '../database/migrations/005_consolidate_certificate_to_student.sql');
    const sql = fs.readFileSync(migrationFile, 'utf8');
    
    // Execute the entire SQL file
    try {
      await pool.query(sql);
      console.log('✅ Migration completed successfully!\n');
      console.log('Certificate fields have been added to students table.');
      console.log('Students can now be directly associated with schools.');
      process.exit(0);
    } catch (error) {
      // If it's a "already exists" error, that's okay
      if (error.message.includes('already exists') || 
          error.message.includes('duplicate') ||
          error.code === '42710' || // duplicate_object
          error.code === '42P07') { // duplicate_table
        console.log('⚠️  Some objects already exist, but migration may have partially completed.');
        console.log('Certificate fields should be available.\n');
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




