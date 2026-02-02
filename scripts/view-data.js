const pool = require('../config/database');

async function viewData() {
  try {
    console.log('\n' + '='.repeat(80));
    console.log('NAGAR PARISHAD DATABASE VIEWER');
    console.log('='.repeat(80));

    // View all schools
    console.log('\n=== SCHOOLS ===');
    const schools = await pool.query('SELECT * FROM schools ORDER BY id');
    if (schools.rows.length === 0) {
      console.log('No schools found.');
    } else {
      console.table(schools.rows.map(s => ({
        id: s.id,
        name: s.name,
        district: s.district,
        phone: s.phone_no,
        email: s.email
      })));
      console.log(`Total: ${schools.rows.length} school(s)`);
    }

    // View all students
    console.log('\n=== STUDENTS ===');
    const students = await pool.query('SELECT * FROM students ORDER BY id');
    if (students.rows.length === 0) {
      console.log('No students found.');
    } else {
      console.table(students.rows.map(s => ({
        id: s.id,
        student_id: s.student_id,
        full_name: s.full_name,
        father_name: s.father_name,
        aadhar: s.uid_aadhar_no ? s.uid_aadhar_no.substring(0, 4) + '****' : null,
        dob: s.date_of_birth
      })));
      console.log(`Total: ${students.rows.length} student(s)`);
    }

    // View all certificates with joins
    console.log('\n=== LEAVING CERTIFICATES ===');
    const certs = await pool.query(`
      SELECT 
        lc.id,
        lc.serial_no,
        s.name as school_name,
        st.full_name as student_name,
        lc.leaving_class,
        lc.leaving_date,
        lc.status,
        lc.created_at
      FROM leaving_certificates lc
      INNER JOIN schools s ON lc.school_id = s.id
      INNER JOIN students st ON lc.student_id = st.id
      ORDER BY lc.id DESC
    `);
    if (certs.rows.length === 0) {
      console.log('No certificates found.');
    } else {
      console.table(certs.rows);
      console.log(`Total: ${certs.rows.length} certificate(s)`);
    }

    // Summary statistics
    console.log('\n=== SUMMARY ===');
    const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM schools) as total_schools,
        (SELECT COUNT(*) FROM students) as total_students,
        (SELECT COUNT(*) FROM leaving_certificates) as total_certificates,
        (SELECT COUNT(*) FROM leaving_certificates WHERE status = 'issued') as issued_certificates,
        (SELECT COUNT(*) FROM leaving_certificates WHERE status = 'draft') as draft_certificates
    `);
    console.table(stats.rows[0]);

    console.log('\n' + '='.repeat(80));
    process.exit(0);
  } catch (error) {
    console.error('\nError viewing data:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('Cannot connect to database. Make sure PostgreSQL is running and check your .env file.');
    }
    process.exit(1);
  }
}

viewData();




