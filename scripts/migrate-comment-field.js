const fs = require('fs');
const path = require('path');
const pool = require('../config/database');

async function migrateCommentField() {
  try {
    console.log('📝 Starting comment field migration...');
    
    const sqlFile = path.join(__dirname, '../database/migrations/008_add_comment_to_students.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    // Execute the SQL file
    await pool.query(sql);
    
    console.log('✅ Comment field added successfully!');
    console.log('');
    console.log('📋 Changes:');
    console.log('   - Added `comment` TEXT column to students table');
    console.log('   - Comment field can now be used in PATCH requests');
    console.log('');
    console.log('💡 Usage:');
    console.log('   PATCH /api/students/{id}/status');
    console.log('   { "status": "in_review", "comment": "Updated student details" }');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    if (error.code === '42701') { // Column already exists
      console.log('⚠️  Comment column already exists. Skipping...');
      process.exit(0);
    }
    console.error(error);
    process.exit(1);
  }
}

migrateCommentField();



