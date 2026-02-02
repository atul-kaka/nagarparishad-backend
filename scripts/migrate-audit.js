const fs = require('fs');
const path = require('path');
const pool = require('../config/database');

async function runMigration() {
  try {
    const schemaPath = path.join(__dirname, '../database/schema_with_audit.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('Running database migration with audit tables...');
    console.log('This will create: users, schools, students, leaving_certificates, audit_logs, certificate_status_history');
    console.log('');
    
    await pool.query(schema);
    console.log('✅ Migration completed successfully!');
    console.log('');
    console.log('Tables created:');
    console.log('  - users');
    console.log('  - schools (with audit fields)');
    console.log('  - students (with audit fields)');
    console.log('  - leaving_certificates (with audit fields)');
    console.log('  - audit_logs');
    console.log('  - certificate_status_history');
    console.log('');
    console.log('Next steps:');
    console.log('  1. npm install (to install bcrypt)');
    console.log('  2. Register first user: POST /api/users/register');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    if (error.code === '42P07') {
      console.error('Some tables already exist. Use migration script 002_add_audit_tables.sql instead.');
    }
    process.exit(1);
  }
}

runMigration();




