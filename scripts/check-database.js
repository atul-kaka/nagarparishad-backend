/**
 * Script to check database connection and table existence
 * Run: node scripts/check-database.js
 */

require('dotenv').config();
const pool = require('../config/database');

async function checkDatabase() {
  try {
    console.log('Checking database connection...\n');

    // Test connection
    const result = await pool.query('SELECT NOW() as current_time, version() as pg_version');
    console.log('✅ Database connected successfully');
    console.log(`   Current time: ${result.rows[0].current_time}`);
    console.log(`   PostgreSQL: ${result.rows[0].pg_version.split(' ')[0]} ${result.rows[0].pg_version.split(' ')[1]}\n`);

    // Check required tables
    const tables = [
      'users',
      'schools',
      'students',
      'leaving_certificates',
      'audit_logs',
      'certificate_status_history',
      'login_sessions',
      'record_visits'
    ];

    console.log('Checking tables...\n');
    for (const table of tables) {
      try {
        const checkResult = await pool.query(
          `SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
          )`,
          [table]
        );
        
        if (checkResult.rows[0].exists) {
          // Get row count
          const countResult = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
          console.log(`✅ ${table}: exists (${countResult.rows[0].count} rows)`);
        } else {
          console.log(`❌ ${table}: NOT FOUND`);
        }
      } catch (error) {
        console.log(`❌ ${table}: ERROR - ${error.message}`);
      }
    }

    // Check users table structure
    console.log('\nChecking users table structure...\n');
    try {
      const columnsResult = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'users'
        ORDER BY ordinal_position
      `);
      
      console.log('Users table columns:');
      columnsResult.rows.forEach(col => {
        console.log(`   - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
      });
    } catch (error) {
      console.log(`Error checking users structure: ${error.message}`);
    }

    // Check if any users exist
    console.log('\nChecking users...\n');
    try {
      const usersResult = await pool.query('SELECT id, username, email, role, is_active FROM users LIMIT 5');
      if (usersResult.rows.length > 0) {
        console.log(`Found ${usersResult.rows.length} user(s):`);
        usersResult.rows.forEach(user => {
          console.log(`   - ${user.username} (${user.email}) - Role: ${user.role}, Active: ${user.is_active}`);
        });
      } else {
        console.log('⚠️  No users found. Run: npm run create-test-user');
      }
    } catch (error) {
      console.log(`Error checking users: ${error.message}`);
    }

    console.log('\n✅ Database check complete!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database check failed:', error.message);
    console.error('\nPossible issues:');
    console.error('1. Database server is not running');
    console.error('2. Incorrect credentials in .env file');
    console.error('3. Database does not exist');
    console.error('\nCheck your .env file:');
    console.error(`   DB_HOST=${process.env.DB_HOST || 'not set'}`);
    console.error(`   DB_PORT=${process.env.DB_PORT || 'not set'}`);
    console.error(`   DB_NAME=${process.env.DB_NAME || 'not set'}`);
    console.error(`   DB_USER=${process.env.DB_USER || 'not set'}`);
    process.exit(1);
  }
}

checkDatabase();

