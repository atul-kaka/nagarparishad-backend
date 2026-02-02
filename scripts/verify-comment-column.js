/**
 * Script to verify if comment column exists in students table
 */

require('dotenv').config();
const pool = require('../config/database');

async function verifyCommentColumn() {
  try {
    console.log('🔍 Checking if comment column exists in students table...\n');
    
    // Check if column exists
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'students' 
      AND column_name = 'comment'
    `);
    
    if (result.rows.length === 0) {
      console.log('❌ Comment column does NOT exist in students table');
      console.log('\n💡 Run the migration:');
      console.log('   npm run migrate-comment\n');
      
      // Show all columns in students table
      const allColumns = await pool.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'students'
        ORDER BY ordinal_position
      `);
      
      console.log('📋 Current columns in students table:');
      allColumns.rows.forEach(col => {
        console.log(`   - ${col.column_name} (${col.data_type})`);
      });
      
      process.exit(1);
    } else {
      const col = result.rows[0];
      console.log('✅ Comment column EXISTS in students table!');
      console.log(`   - Column name: ${col.column_name}`);
      console.log(`   - Data type: ${col.data_type}`);
      console.log(`   - Nullable: ${col.is_nullable}`);
      console.log('\n✅ Column is ready to use in PATCH requests!');
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Error checking column:', error.message);
    console.error(error);
    process.exit(1);
  }
}

verifyCommentColumn();



