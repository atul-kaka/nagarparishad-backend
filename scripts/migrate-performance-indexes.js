const fs = require('fs');
const path = require('path');
const pool = require('../config/database');

async function migratePerformanceIndexes() {
  try {
    console.log('🚀 Starting performance indexes migration...');
    
    const sqlFile = path.join(__dirname, '../database/migrations/006_add_performance_indexes.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    // Execute the SQL file
    await pool.query(sql);
    
    console.log('✅ Performance indexes created successfully!');
    console.log('');
    console.log('📊 Indexes created:');
    console.log('  - Students table: status, school_id, student_id, search_vector, etc.');
    console.log('  - Audit logs: table_name, record_id, created_at, etc.');
    console.log('  - Schools: recognition_no, udise_no, name');
    console.log('  - Full-text search index for student names');
    console.log('');
    console.log('⚡ Query performance should improve significantly!');
    console.log('💡 Run ANALYZE on tables if needed: ANALYZE students; ANALYZE audit_logs;');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

migratePerformanceIndexes();




