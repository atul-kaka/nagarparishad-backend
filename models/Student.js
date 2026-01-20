const pool = require('../config/database');

class Student {
  static async create(studentData) {
    const {
      student_id, uid_aadhar_no, full_name, father_name, mother_name,
      surname, nationality, mother_tongue, religion, caste, sub_caste,
      birth_place_village, birth_place_taluka, birth_place_district,
      birth_place_state, birth_place_country, date_of_birth, date_of_birth_words,
      // Certificate fields
      school_id, serial_no, previous_school, previous_class,
      admission_date, admission_class, progress_in_studies, conduct,
      leaving_date, leaving_class, studying_class_and_since,
      reason_for_leaving, remarks, general_register_ref,
      certificate_date, certificate_month, certificate_year,
      class_teacher_signature, clerk_signature, headmaster_signature,
      status, created_by, updated_by
    } = studentData;

    const query = `
      INSERT INTO students (
        student_id, uid_aadhar_no, full_name, father_name, mother_name,
        surname, nationality, mother_tongue, religion, caste, sub_caste,
        birth_place_village, birth_place_taluka, birth_place_district,
        birth_place_state, birth_place_country, date_of_birth, date_of_birth_words,
        school_id, serial_no, previous_school, previous_class,
        admission_date, admission_class, progress_in_studies, conduct,
        leaving_date, leaving_class, studying_class_and_since,
        reason_for_leaving, remarks, general_register_ref,
        certificate_date, certificate_month, certificate_year,
        class_teacher_signature, clerk_signature, headmaster_signature,
        status, created_by, updated_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18,
        $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35,
        $36, $37, $38, $39, $40, $41
      )
      RETURNING *
    `;

    // Helper to ensure null instead of undefined or empty string
    const ensureNull = (val) => (val === undefined || val === null || val === '') ? null : val;
    
    const values = [
      ensureNull(student_id), ensureNull(uid_aadhar_no), full_name || null, ensureNull(father_name), ensureNull(mother_name),
      ensureNull(surname), ensureNull(nationality), ensureNull(mother_tongue), ensureNull(religion), ensureNull(caste), ensureNull(sub_caste),
      ensureNull(birth_place_village), ensureNull(birth_place_taluka), ensureNull(birth_place_district),
      ensureNull(birth_place_state), ensureNull(birth_place_country) || 'India', date_of_birth || null, ensureNull(date_of_birth_words),
      ensureNull(school_id), ensureNull(serial_no), ensureNull(previous_school), ensureNull(previous_class),
      ensureNull(admission_date), ensureNull(admission_class), ensureNull(progress_in_studies), ensureNull(conduct),
      ensureNull(leaving_date), ensureNull(leaving_class), ensureNull(studying_class_and_since),
      ensureNull(reason_for_leaving), ensureNull(remarks), ensureNull(general_register_ref),
      ensureNull(certificate_date), ensureNull(certificate_month), ensureNull(certificate_year),
      ensureNull(class_teacher_signature), ensureNull(clerk_signature), ensureNull(headmaster_signature),
      status || 'draft', ensureNull(created_by), ensureNull(updated_by)
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findById(id) {
    const query = `
      SELECT 
        s.*,
        sch.name as school_name,
        sch.address as school_address,
        sch.taluka as school_taluka,
        sch.district as school_district,
        sch.state as school_state,
        sch.phone_no as school_phone_no,
        sch.email as school_email,
        sch.general_register_no as school_general_register_no,
        sch.school_recognition_no,
        sch.udise_no,
        sch.affiliation_no,
        sch.board as school_board,
        sch.medium as school_medium
      FROM students s
      LEFT JOIN schools sch ON s.school_id = sch.id
      WHERE s.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async findByStudentId(studentId) {
    const query = `
      SELECT 
        s.*,
        sch.name as school_name,
        sch.school_recognition_no
      FROM students s
      LEFT JOIN schools sch ON s.school_id = sch.id
      WHERE s.student_id = $1
    `;
    const result = await pool.query(query, [studentId]);
    return result.rows[0];
  }

  static async findByAadhar(aadharNo) {
    const query = `
      SELECT 
        s.*,
        sch.name as school_name,
        sch.school_recognition_no
      FROM students s
      LEFT JOIN schools sch ON s.school_id = sch.id
      WHERE s.uid_aadhar_no = $1
    `;
    const result = await pool.query(query, [aadharNo]);
    return result.rows[0];
  }

  static async findBySchoolAndSerial(schoolId, serialNo) {
    const query = `
      SELECT 
        s.*,
        sch.name as school_name,
        sch.school_recognition_no
      FROM students s
      LEFT JOIN schools sch ON s.school_id = sch.id
      WHERE s.school_id = $1 AND s.serial_no = $2
    `;
    const result = await pool.query(query, [schoolId, serialNo]);
    return result.rows[0];
  }

  static async findAll(filters = {}, pagination = {}) {
    const { limit, offset } = pagination;
    let query = `
      SELECT 
        s.*,
        sch.name as school_name,
        sch.school_recognition_no,
        sch.udise_no as school_udise_no,
        sch.email as school_email,
        sch.phone_no as school_phone_no,
        sch.address as school_address
      FROM students s
      LEFT JOIN schools sch ON s.school_id = sch.id
      WHERE 1=1
    `;
    const values = [];
    let paramCount = 1;

    if (filters.school_id) {
      query += ` AND s.school_id = $${paramCount}`;
      values.push(parseInt(filters.school_id));
      paramCount++;
    }

    // Filter by school name
    if (filters.school_name) {
      query += ` AND LOWER(sch.name) LIKE LOWER($${paramCount})`;
      values.push(`%${filters.school_name}%`);
      paramCount++;
    }

    // Filter by school recognition number
    if (filters.school_recognition_no) {
      query += ` AND sch.school_recognition_no = $${paramCount}`;
      values.push(filters.school_recognition_no);
      paramCount++;
    }

    // Filter by UDISE number
    if (filters.udise_no) {
      query += ` AND sch.udise_no = $${paramCount}`;
      values.push(filters.udise_no);
      paramCount++;
    }

    // Filter by school identifier (searches in name, recognition_no, udise_no)
    if (filters.school_identifier) {
      query += ` AND (
        LOWER(sch.name) LIKE LOWER($${paramCount}) OR
        sch.school_recognition_no = $${paramCount} OR
        sch.udise_no = $${paramCount} OR
        sch.general_register_no = $${paramCount} OR
        sch.affiliation_no = $${paramCount}
      )`;
      values.push(`%${filters.school_identifier}%`);
      paramCount++;
    }

    if (filters.status) {
      query += ` AND s.status = $${paramCount}`;
      values.push(filters.status);
      paramCount++;
    }

    if (filters.search) {
      query += ` AND (
        LOWER(s.full_name) LIKE LOWER($${paramCount}) OR
        LOWER(s.student_id) LIKE LOWER($${paramCount}) OR
        LOWER(s.serial_no) LIKE LOWER($${paramCount}) OR
        LOWER(sch.name) LIKE LOWER($${paramCount}) OR
        sch.school_recognition_no LIKE $${paramCount} OR
        sch.udise_no LIKE $${paramCount}
      )`;
      values.push(`%${filters.search}%`);
      paramCount++;
    }

    query += ' ORDER BY s.created_at DESC';

    if (limit) {
      query += ` LIMIT $${paramCount}`;
      values.push(limit);
      paramCount++;
    }
    if (offset) {
      query += ` OFFSET $${paramCount}`;
      values.push(offset);
      paramCount++;
    }

    const result = await pool.query(query, values);
    return result.rows;
  }

  static async count(filters = {}) {
    let query = `
      SELECT COUNT(*) FROM students s
      LEFT JOIN schools sch ON s.school_id = sch.id
      WHERE 1=1
    `;
    const values = [];
    let paramCount = 1;

    if (filters.school_id) {
      query += ` AND s.school_id = $${paramCount}`;
      values.push(parseInt(filters.school_id));
      paramCount++;
    }

    // Filter by school name
    if (filters.school_name) {
      query += ` AND LOWER(sch.name) LIKE LOWER($${paramCount})`;
      values.push(`%${filters.school_name}%`);
      paramCount++;
    }

    // Filter by school recognition number
    if (filters.school_recognition_no) {
      query += ` AND sch.school_recognition_no = $${paramCount}`;
      values.push(filters.school_recognition_no);
      paramCount++;
    }

    // Filter by UDISE number
    if (filters.udise_no) {
      query += ` AND sch.udise_no = $${paramCount}`;
      values.push(filters.udise_no);
      paramCount++;
    }

    // Filter by school identifier (searches in name, recognition_no, udise_no)
    if (filters.school_identifier) {
      query += ` AND (
        LOWER(sch.name) LIKE LOWER($${paramCount}) OR
        sch.school_recognition_no = $${paramCount} OR
        sch.udise_no = $${paramCount} OR
        sch.general_register_no = $${paramCount} OR
        sch.affiliation_no = $${paramCount}
      )`;
      values.push(`%${filters.school_identifier}%`);
      paramCount++;
    }

    if (filters.status) {
      query += ` AND s.status = $${paramCount}`;
      values.push(filters.status);
      paramCount++;
    }

    if (filters.search) {
      query += ` AND (
        LOWER(s.full_name) LIKE LOWER($${paramCount}) OR
        LOWER(s.student_id) LIKE LOWER($${paramCount}) OR
        LOWER(s.serial_no) LIKE LOWER($${paramCount}) OR
        LOWER(sch.name) LIKE LOWER($${paramCount}) OR
        sch.school_recognition_no LIKE $${paramCount} OR
        sch.udise_no LIKE $${paramCount}
      )`;
      values.push(`%${filters.search}%`);
      paramCount++;
    }

    const result = await pool.query(query, values);
    return parseInt(result.rows[0].count);
  }

  static async update(id, studentData) {
    const fields = Object.keys(studentData);
    const values = Object.values(studentData);
    values.push(id);

    const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
    const query = `
      UPDATE students 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${fields.length + 1}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM students WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = Student;
