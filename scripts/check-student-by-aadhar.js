/**
 * Script to check if a student exists with a given Aadhar number
 * Usage: node scripts/check-student-by-aadhar.js <aadhar_number>
 */

require('dotenv').config();
const pool = require('../config/database');

async function checkStudentByAadhar(aadharNo) {
  try {
    console.log(`🔍 Checking for student with Aadhar: ${aadharNo}\n`);
    
    // Query directly
    const result = await pool.query(
      'SELECT id, student_id, uid_aadhar_no, full_name, status, created_at, updated_at FROM students WHERE uid_aadhar_no = $1',
      [aadharNo]
    );
    
    if (result.rows.length === 0) {
      console.log('✅ No student found with this Aadhar number');
      console.log('   This means you can create a new record with this Aadhar.\n');
      
      // Check all students to see what exists
      const allStudents = await pool.query(
        'SELECT id, student_id, uid_aadhar_no, full_name, status FROM students ORDER BY id DESC LIMIT 10'
      );
      console.log(`📊 Last 10 students in database:`);
      allStudents.rows.forEach(student => {
        console.log(`   ID: ${student.id}, Student ID: ${student.student_id}, Aadhar: ${student.uid_aadhar_no}, Status: ${student.status}`);
      });
    } else {
      console.log(`❌ Found ${result.rows.length} student(s) with this Aadhar number:\n`);
      result.rows.forEach((student, index) => {
        console.log(`Record ${index + 1}:`);
        console.log(`   ID: ${student.id}`);
        console.log(`   Student ID: ${student.student_id}`);
        console.log(`   Aadhar: ${student.uid_aadhar_no}`);
        console.log(`   Full Name: ${student.full_name}`);
        console.log(`   Status: ${student.status}`);
        console.log(`   Created: ${student.created_at}`);
        console.log(`   Updated: ${student.updated_at}`);
        console.log('');
      });
      
      console.log('💡 This record needs to be updated or deleted before creating a new one.');
    }
    
    // Also check by student_id if provided
    if (process.argv[3]) {
      const studentId = process.argv[3];
      console.log(`\n🔍 Also checking for student_id: ${studentId}\n`);
      const studentIdResult = await pool.query(
        'SELECT id, student_id, uid_aadhar_no, full_name, status FROM students WHERE student_id = $1',
        [studentId]
      );
      
      if (studentIdResult.rows.length === 0) {
        console.log('✅ No student found with this student_id');
      } else {
        console.log(`Found student with student_id:`);
        studentIdResult.rows.forEach(student => {
          console.log(`   ID: ${student.id}, Student ID: ${student.student_id}, Aadhar: ${student.uid_aadhar_no}, Status: ${student.status}`);
        });
      }
    }
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

const aadharNo = process.argv[2];
if (!aadharNo) {
  console.error('❌ Please provide an Aadhar number');
  console.error('Usage: node scripts/check-student-by-aadhar.js <aadhar_number> [student_id]');
  process.exit(1);
}

checkStudentByAadhar(aadharNo);



