#!/usr/bin/env node

/**
 * Script to generate QR code hashes for existing students that don't have one
 * 
 * Usage:
 *   node scripts/generate-qr-codes.js
 */

const pool = require('../config/database');
const crypto = require('crypto');
require('dotenv').config();

/**
 * Generate QR code hash
 */
function generateQRCodeHash(studentId, timestamp) {
  const data = `${studentId}-${timestamp}`;
  return crypto.createHash('sha256').update(data).digest('hex');
}

async function generateQRCodes() {
  try {
    console.log('🔍 Finding students without QR code hash...\n');
    
    // Find students without QR code hash
    const result = await pool.query(
      'SELECT id, student_id, created_at FROM students WHERE qr_code_hash IS NULL ORDER BY id'
    );
    
    if (result.rows.length === 0) {
      console.log('✅ All students already have QR code hashes!');
      process.exit(0);
    }
    
    console.log(`📊 Found ${result.rows.length} students without QR code hash\n`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const student of result.rows) {
      try {
        // Generate hash using student ID and creation timestamp
        const studentId = student.student_id || student.id.toString();
        const timestamp = student.created_at ? new Date(student.created_at).getTime() : Date.now();
        const hash = generateQRCodeHash(studentId, timestamp);
        
        // Update student with QR code hash
        await pool.query(
          'UPDATE students SET qr_code_hash = $1 WHERE id = $2',
          [hash, student.id]
        );
        
        console.log(`✅ Generated QR code for student ${student.id} (${studentId}): ${hash.substring(0, 20)}...`);
        successCount++;
      } catch (error) {
        console.error(`❌ Error generating QR code for student ${student.id}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 SUMMARY');
    console.log('='.repeat(80));
    console.log(`✅ Success: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📝 Total: ${result.rows.length}`);
    console.log('='.repeat(80));
    
    if (errorCount === 0) {
      console.log('\n✅ All QR codes generated successfully!');
    } else {
      console.log(`\n⚠️  ${errorCount} error(s) occurred. Check logs above.`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the script
generateQRCodes();

