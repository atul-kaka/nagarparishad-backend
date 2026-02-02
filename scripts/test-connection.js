const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'nagarparishad_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

async function testConnection() {
  try {
    console.log('🔌 Testing database connection...');
    console.log(`Host: ${process.env.DB_HOST || 'localhost'}`);
    console.log(`Port: ${process.env.DB_PORT || 5432}`);
    console.log(`Database: ${process.env.DB_NAME || 'nagarparishad_db'}`);
    console.log(`User: ${process.env.DB_USER || 'postgres'}`);
    console.log('');
    
    const result = await pool.query('SELECT NOW(), version()');
    console.log('✅ Connection successful!');
    console.log('📅 Server time:', result.rows[0].now);
    console.log('🐘 PostgreSQL version:', result.rows[0].version.split(',')[0]);
    
    // Test table access
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    console.log('\n📊 Tables found:', tables.rows.length);
    if (tables.rows.length > 0) {
      console.log('   ' + tables.rows.map(r => r.table_name).join(', '));
    }
    
    // Test record counts
    const recordCounts = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM students) as students_count,
        (SELECT COUNT(*) FROM schools) as schools_count,
        (SELECT COUNT(*) FROM audit_logs) as audit_logs_count
    `);
    
    if (recordCounts.rows.length > 0) {
      const counts = recordCounts.rows[0];
      console.log('\n📈 Record counts:');
      console.log(`   Students: ${counts.students_count || 0}`);
      console.log(`   Schools: ${counts.schools_count || 0}`);
      console.log(`   Audit Logs: ${counts.audit_logs_count || 0}`);
    }
    
    await pool.end();
    console.log('\n✨ All tests passed!');
  } catch (error) {
    console.error('\n❌ Connection failed!');
    console.error('Error:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('  1. Is PostgreSQL running? (check services)');
    console.error('  2. Check .env file has correct credentials');
    console.error('  3. Does the database exist? (run: CREATE DATABASE nagarparishad_db)');
    console.error('  4. Is firewall blocking port 5432?');
    console.error('  5. For remote: Is pg_hba.conf configured?');
    console.error('\n📖 See POSTGRESQL_CONNECTION_GUIDE.md for detailed help');
    process.exit(1);
  }
}

testConnection();



