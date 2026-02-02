/**
 * Database Connection Test Script
 * Tests database connection with detailed diagnostics
 * 
 * Usage: node scripts/test-db-connection.js
 */

const { Pool } = require('pg');
require('dotenv').config();

console.log('🔍 Database Connection Diagnostic Tool\n');
console.log('Current Configuration:');
console.log(`  DB_HOST: ${process.env.DB_HOST || 'localhost (default)'}`);
console.log(`  DB_PORT: ${process.env.DB_PORT || '5432 (default)'}`);
console.log(`  DB_NAME: ${process.env.DB_NAME || 'nagarparishad_db (default)'}`);
console.log(`  DB_USER: ${process.env.DB_USER || 'postgres (default)'}`);
console.log(`  DB_PASSWORD: ${process.env.DB_PASSWORD ? '***' : '(not set)'}`);
console.log('');

// Create pool with timeout settings
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'nagarparishad_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  connectionTimeoutMillis: 10000, // 10 second timeout
  statement_timeout: 5000
});

async function testConnection() {
  let client;
  try {
    console.log('⏳ Attempting connection...');
    
    // Try to connect
    client = await pool.connect();
    console.log('✅ Connection successful!\n');
    
    // Test basic query
    console.log('📊 Running diagnostic queries...\n');
    
    // Get PostgreSQL version
    const versionResult = await client.query('SELECT version()');
    console.log('🐘 PostgreSQL Version:');
    console.log(`   ${versionResult.rows[0].version.split(',')[0]}\n`);
    
    // Get current database
    const dbResult = await client.query('SELECT current_database(), current_user');
    console.log('📁 Database Info:');
    console.log(`   Database: ${dbResult.rows[0].current_database}`);
    console.log(`   User: ${dbResult.rows[0].current_user}\n`);
    
    // Get encoding
    const encodingResult = await client.query('SHOW client_encoding');
    console.log('🔤 Encoding:');
    console.log(`   ${encodingResult.rows[0].client_encoding}\n`);
    
    // Check tables
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    console.log(`📋 Tables (${tablesResult.rows.length}):`);
    if (tablesResult.rows.length > 0) {
      tablesResult.rows.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });
    } else {
      console.log('   (No tables found)');
    }
    console.log('');
    
    // Test a simple query
    try {
      const testQuery = await client.query('SELECT COUNT(*) as count FROM students');
      console.log('✅ Test query successful');
      console.log(`   Students count: ${testQuery.rows[0].count}`);
    } catch (err) {
      console.log('⚠️  Test query failed (table might not exist):');
      console.log(`   ${err.message}`);
    }
    
    console.log('\n✨ All diagnostics passed!');
    
  } catch (err) {
    console.error('\n❌ Connection failed!\n');
    console.error('Error Details:');
    console.error(`   Code: ${err.code || 'N/A'}`);
    console.error(`   Message: ${err.message}`);
    
    if (err.code === 'ETIMEDOUT') {
      console.error('\n🔍 Diagnosis: Connection Timeout');
      console.error('   Possible causes:');
      console.error('   1. Database server is not running');
      console.error('   2. Wrong host/port in .env file');
      console.error('   3. Firewall blocking the connection');
      console.error('   4. Database server not accepting connections');
      console.error('   5. Network connectivity issues');
      console.error('\n💡 Solutions:');
      console.error('   - Verify DB_HOST and DB_PORT in .env file');
      console.error('   - Check if PostgreSQL is running: sudo systemctl status postgresql');
      console.error('   - Test connection: psql -h <host> -p <port> -U <user> -d <database>');
      console.error('   - Check firewall: sudo ufw status');
      console.error('   - Verify pg_hba.conf allows your connection');
    } else if (err.code === 'ECONNREFUSED') {
      console.error('\n🔍 Diagnosis: Connection Refused');
      console.error('   The database server is not accepting connections.');
      console.error('   Check if PostgreSQL is running and listening on the correct port.');
    } else if (err.code === 'ENOTFOUND') {
      console.error('\n🔍 Diagnosis: Host Not Found');
      console.error(`   Cannot resolve hostname: ${process.env.DB_HOST}`);
      console.error('   Check your DB_HOST value in .env file.');
    } else if (err.code === '28P01') {
      console.error('\n🔍 Diagnosis: Authentication Failed');
      console.error('   Wrong username or password.');
      console.error('   Check DB_USER and DB_PASSWORD in .env file.');
    } else if (err.code === '3D000') {
      console.error('\n🔍 Diagnosis: Database Not Found');
      console.error(`   Database "${process.env.DB_NAME}" does not exist.`);
      console.error('   Create it: CREATE DATABASE nagarparishad_db;');
    } else {
      console.error('\n🔍 Full Error:');
      console.error(err);
    }
    
    process.exit(1);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

// Run test
testConnection();

