const fs = require('fs');
const path = require('path');
const pool = require('../config/database');

async function migrateUniqueConstraints() {
  try {
    console.log('🔒 Starting unique constraints migration...');
    console.log('');
    
    // First, check for existing duplicates
    console.log('🔍 Checking for existing duplicate records...');
    
    const duplicates = {
      school_recognition_no: [],
      general_register_no: [],
      affiliation_no: []
    };
    
    // Check school_recognition_no duplicates
    const recogResult = await pool.query(`
      SELECT school_recognition_no, COUNT(*) as cnt, array_agg(id) as ids
      FROM schools
      WHERE school_recognition_no IS NOT NULL AND school_recognition_no != ''
      GROUP BY school_recognition_no
      HAVING COUNT(*) > 1
    `);
    
    if (recogResult.rows.length > 0) {
      console.log('⚠️  WARNING: Found duplicate school_recognition_no values:');
      recogResult.rows.forEach(row => {
        console.log(`   - "${row.school_recognition_no}" appears ${row.cnt} times (IDs: ${row.ids.join(', ')})`);
      });
      duplicates.school_recognition_no = recogResult.rows;
    }
    
    // Check general_register_no duplicates
    const generalResult = await pool.query(`
      SELECT general_register_no, COUNT(*) as cnt, array_agg(id) as ids
      FROM schools
      WHERE general_register_no IS NOT NULL AND general_register_no != ''
      GROUP BY general_register_no
      HAVING COUNT(*) > 1
    `);
    
    if (generalResult.rows.length > 0) {
      console.log('⚠️  WARNING: Found duplicate general_register_no values:');
      generalResult.rows.forEach(row => {
        console.log(`   - "${row.general_register_no}" appears ${row.cnt} times (IDs: ${row.ids.join(', ')})`);
      });
      duplicates.general_register_no = generalResult.rows;
    }
    
    // Check affiliation_no duplicates
    const affilResult = await pool.query(`
      SELECT affiliation_no, COUNT(*) as cnt, array_agg(id) as ids
      FROM schools
      WHERE affiliation_no IS NOT NULL AND affiliation_no != ''
      GROUP BY affiliation_no
      HAVING COUNT(*) > 1
    `);
    
    if (affilResult.rows.length > 0) {
      console.log('⚠️  WARNING: Found duplicate affiliation_no values:');
      affilResult.rows.forEach(row => {
        console.log(`   - "${row.affiliation_no}" appears ${row.cnt} times (IDs: ${row.ids.join(', ')})`);
      });
      duplicates.affiliation_no = affilResult.rows;
    }
    
    const hasDuplicates = recogResult.rows.length > 0 || 
                         generalResult.rows.length > 0 || 
                         affilResult.rows.length > 0;
    
    if (hasDuplicates) {
      console.log('');
      console.log('❌ Cannot add unique constraints while duplicates exist.');
      console.log('💡 Please resolve duplicates first by:');
      console.log('   1. Reviewing duplicate records');
      console.log('   2. Updating or deleting duplicate entries');
      console.log('   3. Re-running this migration');
      process.exit(1);
    }
    
    console.log('✅ No duplicates found. Proceeding with migration...');
    console.log('');
    
    // Read and execute the migration SQL
    const sqlFile = path.join(__dirname, '../database/migrations/007_add_unique_constraints_schools.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    // Execute the SQL
    await pool.query(sql);
    
    console.log('✅ Unique constraints created successfully!');
    console.log('');
    console.log('📋 Constraints added:');
    console.log('   - school_recognition_no must be unique (allows NULL)');
    console.log('   - general_register_no must be unique (allows NULL)');
    console.log('   - affiliation_no must be unique (allows NULL)');
    console.log('');
    console.log('🔒 Duplicate records will now be prevented at the database level.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    if (error.code === '23505') { // Unique violation
      console.error('💡 This error indicates duplicate values exist. Please resolve them first.');
    }
    console.error(error);
    process.exit(1);
  }
}

migrateUniqueConstraints();


