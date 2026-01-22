const fs = require('fs');
const path = require('path');
const pool = require('../config/database');

async function migrateMediumDrop() {
  try {
    console.log('🗑️ Dropping medium column from students...');

    const sqlFile = path.join(__dirname, '../database/migrations/010_drop_student_medium.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    await pool.query(sql);

    console.log('✅ medium column removed from students table.');
    console.log('ℹ️  medium remains on schools table and is returned as `medium` in student responses via join.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

migrateMediumDrop();



