/**
 * Migration script for Password Reset functionality
 * Run: node scripts/migrate-password-reset.js
 */

const fs = require('fs');
const path = require('path');
const pool = require('../config/database');

async function runMigration() {
  try {
    console.log('Starting Password Reset migration...\n');
    
    const migrationFile = path.join(__dirname, '../database/migrations/004_add_password_reset.sql');
    const sql = fs.readFileSync(migrationFile, 'utf8');
    
    // Execute the entire SQL file
    try {
      await pool.query(sql);
      console.log('✅ Migration completed successfully!\n');
      console.log('Password reset functionality is now available.');
      process.exit(0);
    } catch (error) {
      // If it's a "already exists" error, that's okay
      if (error.message.includes('already exists') || 
          error.message.includes('duplicate') ||
          error.code === '42710' || // duplicate_object
          error.code === '42P07') { // duplicate_table
        console.log('⚠️  Some objects already exist, but migration may have partially completed.');
        console.log('Password reset fields should be available.\n');
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



