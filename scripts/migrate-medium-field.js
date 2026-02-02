const fs = require('fs');
const path = require('path');
const pool = require('../config/database');

async function migrateMediumField() {
  try {
    console.log('📝 Starting medium field migration...');
    
    const sqlFile = path.join(__dirname, '../database/migrations/009_add_medium_to_students.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    // Execute the SQL file
    await pool.query(sql);
    
    console.log('✅ Medium field added successfully!');
    console.log('');
    console.log('📋 Changes:');
    console.log('   - Added `medium` VARCHAR(100) column to students table');
    console.log('   - Medium field can now be used in student records');
    console.log('');
    console.log('💡 Usage:');
    console.log('   POST /api/students/consolidated');
    console.log('   { "medium": "Marathi", ... }');
    console.log('');
    console.log('📝 Valid values: Marathi, Hindi, English, etc.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    if (error.code === '42701') { // Column already exists
      console.log('⚠️  Medium column already exists. Skipping...');
      process.exit(0);
    }
    console.error(error);
    process.exit(1);
  }
}

migrateMediumField();



