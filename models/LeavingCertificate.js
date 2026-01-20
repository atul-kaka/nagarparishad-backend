const pool = require('../config/database');

class LeavingCertificate {
  static async create(certificateData) {
    const {
      school_id, student_id, serial_no, previous_school, previous_class,
      admission_date, admission_class, progress_in_studies, conduct,
      leaving_date, leaving_class, studying_class_and_since,
      reason_for_leaving, remarks, general_register_ref,
      certificate_date, certificate_month, certificate_year,
      class_teacher_name, clerk_name, headmaster_name, status
    } = certificateData;

    // Ensure proper data types - convert to integers where needed
    const schoolIdInt = parseInt(school_id);
    const studentIdInt = parseInt(student_id);
    const certYearInt = certificate_year ? parseInt(certificate_year) : null;

    if (isNaN(schoolIdInt) || isNaN(studentIdInt)) {
      throw new Error('school_id and student_id must be valid integers');
    }

    const query = `
      INSERT INTO leaving_certificates (
        school_id, student_id, serial_no, previous_school, previous_class,
        admission_date, admission_class, progress_in_studies, conduct,
        leaving_date, leaving_class, studying_class_and_since,
        reason_for_leaving, remarks, general_register_ref,
        certificate_date, certificate_month, certificate_year,
        class_teacher_name, clerk_name, headmaster_name, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
      RETURNING *
    `;

    const values = [
      schoolIdInt, studentIdInt, serial_no || null, previous_school || null, previous_class || null,
      admission_date || null, admission_class || null, progress_in_studies || null, conduct || null,
      leaving_date, leaving_class, studying_class_and_since || null,
      reason_for_leaving || null, remarks || null, general_register_ref || null,
      certificate_date || null, certificate_month || null, certYearInt,
      class_teacher_name || null, clerk_name || null, headmaster_name || null, status || 'draft'
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findById(id) {
    const query = `
      SELECT 
        lc.*,
        s.name as school_name, s.address as school_address, s.taluka as school_taluka,
        s.district as school_district, s.state as school_state, s.phone_no as school_phone,
        s.email as school_email, s.general_register_no as school_general_register_no,
        s.school_recognition_no, s.udise_no, s.affiliation_no, s.board, s.medium,
        st.student_id as student_student_id, st.uid_aadhar_no, st.full_name as student_full_name,
        st.father_name, st.mother_name, st.surname, st.nationality, st.mother_tongue,
        st.religion, st.caste, st.sub_caste, st.birth_place_village, st.birth_place_taluka,
        st.birth_place_district, st.birth_place_state, st.birth_place_country,
        st.date_of_birth, st.date_of_birth_words
      FROM leaving_certificates lc
      INNER JOIN schools s ON lc.school_id = s.id
      INNER JOIN students st ON lc.student_id = st.id
      WHERE lc.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async findBySerialNo(schoolId, serialNo) {
    const query = 'SELECT * FROM leaving_certificates WHERE school_id = $1 AND serial_no = $2';
    const result = await pool.query(query, [parseInt(schoolId), serialNo]);
    return result.rows[0];
  }

  static async findAll(filters = {}, pagination = null) {
    let query = `
      SELECT 
        lc.*,
        s.name as school_name,
        st.full_name as student_full_name
      FROM leaving_certificates lc
      INNER JOIN schools s ON lc.school_id = s.id
      INNER JOIN students st ON lc.student_id = st.id
      WHERE 1=1
    `;
    const values = [];
    let paramCount = 1;

    if (filters.school_id) {
      query += ` AND lc.school_id = $${paramCount}`;
      values.push(parseInt(filters.school_id));
      paramCount++;
    }

    if (filters.student_id) {
      query += ` AND lc.student_id = $${paramCount}`;
      values.push(parseInt(filters.student_id));
      paramCount++;
    }

    if (filters.status) {
      query += ` AND lc.status = $${paramCount}`;
      values.push(filters.status);
      paramCount++;
    }

    // Search by student name or serial number
    if (filters.search) {
      query += ` AND (st.full_name ILIKE $${paramCount} OR lc.serial_no ILIKE $${paramCount})`;
      values.push(`%${filters.search}%`);
      paramCount++;
    }

    query += ' ORDER BY lc.created_at DESC';

    // Add pagination
    if (pagination) {
      query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
      values.push(pagination.limit, pagination.offset);
    }

    const result = await pool.query(query, values);
    return result.rows;
  }

  static async count(filters = {}) {
    let query = `
      SELECT COUNT(*) as total
      FROM leaving_certificates lc
      INNER JOIN schools s ON lc.school_id = s.id
      INNER JOIN students st ON lc.student_id = st.id
      WHERE 1=1
    `;
    const values = [];
    let paramCount = 1;

    if (filters.school_id) {
      query += ` AND lc.school_id = $${paramCount}`;
      values.push(parseInt(filters.school_id));
      paramCount++;
    }

    if (filters.student_id) {
      query += ` AND lc.student_id = $${paramCount}`;
      values.push(parseInt(filters.student_id));
      paramCount++;
    }

    if (filters.status) {
      query += ` AND lc.status = $${paramCount}`;
      values.push(filters.status);
      paramCount++;
    }

    if (filters.search) {
      query += ` AND (st.full_name ILIKE $${paramCount} OR lc.serial_no ILIKE $${paramCount})`;
      values.push(`%${filters.search}%`);
      paramCount++;
    }

    const result = await pool.query(query, values);
    return parseInt(result.rows[0].total);
  }

  static async update(id, certificateData) {
    const fields = Object.keys(certificateData);
    const values = Object.values(certificateData);
    values.push(id);

    const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
    const query = `
      UPDATE leaving_certificates 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${fields.length + 1}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM leaving_certificates WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = LeavingCertificate;

