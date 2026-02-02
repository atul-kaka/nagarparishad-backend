const pool = require('../config/database');
const crypto = require('crypto');

class Student {
  /**
   * Generate QR code hash for public viewing
   */
  static generateQRCodeHash(studentId, timestamp = null) {
    const data = `${studentId}-${timestamp || Date.now()}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }
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
      reason_for_leaving, remarks, school_general_register_no,
      certificate_date, certificate_month, certificate_year,
      class_teacher_signature, clerk_signature, headmaster_signature,
      status, created_by, updated_by
    } = studentData;

    // Map school_general_register_no to general_register_ref for backward compatibility
    // until migration 012 is run
    const general_register_ref = school_general_register_no || studentData.general_register_ref;

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
        s.id, s.student_id, s.uid_aadhar_no, s.full_name, s.father_name, s.mother_name,
        s.surname, s.nationality, s.mother_tongue, s.religion, s.caste, s.sub_caste,
        s.birth_place_village, s.birth_place_taluka, s.birth_place_district,
        s.birth_place_state, s.birth_place_country, s.date_of_birth, s.date_of_birth_words,
        s.school_id, s.serial_no, s.previous_school, s.previous_class,
        s.admission_date, s.admission_class, s.progress_in_studies, s.conduct,
        s.leaving_date, s.leaving_class, s.studying_class_and_since,
        s.reason_for_leaving, s.remarks,
        s.certificate_date, s.certificate_month, s.certificate_year,
        s.class_teacher_signature, s.clerk_signature, s.headmaster_signature,
        s.status, s.created_by, s.updated_by, s.created_at, s.updated_at,
        s.qr_code_hash, s.comment,
        sch.name as school_name,
        sch.address as school_address,
        sch.taluka as school_taluka,
        sch.district as school_district,
        sch.state as school_state,
        sch.phone_no as school_phone_no,
        sch.email as school_email,
        sch.school_recognition_no,
        sch.udise_no as school_udise_no,
        sch.affiliation_no as school_affiliation_no,
        sch.board as school_board,
        sch.medium as medium,
        COALESCE(s.general_register_ref, sch.general_register_no) as school_general_register_no
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
        sch.school_recognition_no,
        sch.udise_no as school_udise_no,
        sch.affiliation_no as school_affiliation_no,
        COALESCE(s.general_register_ref, sch.general_register_no) as school_general_register_no
      FROM students s
      LEFT JOIN schools sch ON s.school_id = sch.id
      WHERE s.student_id = $1
    `;
    const result = await pool.query(query, [studentId]);
    return result.rows[0];
  }

  /**
   * Find student by Aadhar number
   */
  static async findByAadhar(aadharNo) {
    const query = `
      SELECT 
        s.*,
        sch.name as school_name,
        sch.school_recognition_no,
        sch.udise_no as school_udise_no,
        sch.affiliation_no as school_affiliation_no,
        COALESCE(s.general_register_ref, sch.general_register_no) as school_general_register_no
      FROM students s
      LEFT JOIN schools sch ON s.school_id = sch.id
      WHERE s.uid_aadhar_no = $1
    `;
    const result = await pool.query(query, [aadharNo]);
    return result.rows[0] || null;
  }

  /**
   * Find student by QR code hash (public access)
   */
  static async findByQRCodeHash(hash) {
    const query = `
      SELECT 
        s.id, s.student_id, s.uid_aadhar_no, s.full_name, s.father_name, s.mother_name,
        s.surname, s.nationality, s.mother_tongue, s.religion, s.caste, s.sub_caste,
        s.birth_place_village, s.birth_place_taluka, s.birth_place_district,
        s.birth_place_state, s.birth_place_country, s.date_of_birth, s.date_of_birth_words,
        s.school_id, s.serial_no, s.previous_school, s.previous_class,
        s.admission_date, s.admission_class, s.progress_in_studies, s.conduct,
        s.leaving_date, s.leaving_class, s.studying_class_and_since,
        s.reason_for_leaving, s.remarks,
        s.certificate_date, s.certificate_month, s.certificate_year,
        s.class_teacher_signature, s.clerk_signature, s.headmaster_signature,
        s.status, s.created_by, s.updated_by, s.created_at, s.updated_at,
        s.qr_code_hash, s.comment,
        sch.name as school_name,
        sch.address as school_address,
        sch.taluka as school_taluka,
        sch.district as school_district,
        sch.state as school_state,
        sch.phone_no as school_phone_no,
        sch.email as school_email,
        sch.school_recognition_no,
        sch.udise_no as school_udise_no,
        sch.affiliation_no as school_affiliation_no,
        sch.board as school_board,
        sch.medium as school_medium,
        COALESCE(s.general_register_ref, sch.general_register_no) as school_general_register_no
      FROM students s
      LEFT JOIN schools sch ON s.school_id = sch.id
      WHERE s.qr_code_hash = $1
    `;
    const result = await pool.query(query, [hash]);
    return result.rows[0] || null;
  }

  static async findBySchoolAndSerial(schoolId, serialNo) {
    const query = `
      SELECT 
        s.*,
        sch.name as school_name,
        sch.school_recognition_no,
        sch.udise_no as school_udise_no,
        sch.affiliation_no as school_affiliation_no,
        COALESCE(s.general_register_ref, sch.general_register_no) as school_general_register_no
      FROM students s
      LEFT JOIN schools sch ON s.school_id = sch.id
      WHERE s.school_id = $1 AND s.serial_no = $2
    `;
    const result = await pool.query(query, [schoolId, serialNo]);
    return result.rows[0];
  }

  static async findAll(filters = {}, pagination = {}, sorting = {}) {
    const { limit, offset } = pagination;
    const { sort_by = 'created_at', sort_order = 'DESC' } = sorting;
    let query = `
      SELECT 
        s.id, s.student_id, s.uid_aadhar_no, s.full_name, s.father_name, s.mother_name,
        s.surname, s.nationality, s.mother_tongue, s.religion, s.caste, s.sub_caste,
        s.birth_place_village, s.birth_place_taluka, s.birth_place_district,
        s.birth_place_state, s.birth_place_country, s.date_of_birth, s.date_of_birth_words,
        s.school_id, s.serial_no, s.previous_school, s.previous_class,
        s.admission_date, s.admission_class, s.progress_in_studies, s.conduct,
        s.leaving_date, s.leaving_class, s.studying_class_and_since,
        s.reason_for_leaving, s.remarks,
        s.certificate_date, s.certificate_month, s.certificate_year,
        s.class_teacher_signature, s.clerk_signature, s.headmaster_signature,
        s.status, s.created_by, s.updated_by, s.created_at, s.updated_at,
        s.qr_code_hash, s.comment,
        sch.name as school_name,
        sch.school_recognition_no,
        sch.udise_no as school_udise_no,
        sch.affiliation_no as school_affiliation_no,
        sch.email as school_email,
        sch.phone_no as school_phone_no,
        sch.address as school_address,
        sch.medium as medium,
        COALESCE(s.general_register_ref, sch.general_register_no) as school_general_register_no
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

    // Filter by student_id
    if (filters.student_id) {
      query += ` AND s.student_id = $${paramCount}`;
      values.push(filters.student_id);
      paramCount++;
    }

    // Filter by uid_aadhar_no
    if (filters.uid_aadhar_no) {
      query += ` AND s.uid_aadhar_no = $${paramCount}`;
      values.push(filters.uid_aadhar_no);
      paramCount++;
    }

    // Filter by full_name (partial match)
    if (filters.full_name) {
      query += ` AND LOWER(s.full_name) LIKE LOWER($${paramCount})`;
      values.push(`%${filters.full_name}%`);
      paramCount++;
    }

    // Filter by father_name (partial match)
    if (filters.father_name) {
      query += ` AND LOWER(s.father_name) LIKE LOWER($${paramCount})`;
      values.push(`%${filters.father_name}%`);
      paramCount++;
    }

    // Filter by date_of_birth (exact match)
    if (filters.date_of_birth) {
      query += ` AND s.date_of_birth = $${paramCount}`;
      values.push(filters.date_of_birth);
      paramCount++;
    }

    // Filter by date_of_birth range
    if (filters.date_of_birth_from) {
      query += ` AND s.date_of_birth >= $${paramCount}`;
      values.push(filters.date_of_birth_from);
      paramCount++;
    }
    if (filters.date_of_birth_to) {
      query += ` AND s.date_of_birth <= $${paramCount}`;
      values.push(filters.date_of_birth_to);
      paramCount++;
    }

    // Filter by leaving_date (exact match)
    if (filters.leaving_date) {
      query += ` AND s.leaving_date = $${paramCount}`;
      values.push(filters.leaving_date);
      paramCount++;
    }

    // Filter by leaving_date range
    if (filters.leaving_date_from) {
      query += ` AND s.leaving_date >= $${paramCount}`;
      values.push(filters.leaving_date_from);
      paramCount++;
    }
    if (filters.leaving_date_to) {
      query += ` AND s.leaving_date <= $${paramCount}`;
      values.push(filters.leaving_date_to);
      paramCount++;
    }

    // Filter by certificate_year
    if (filters.certificate_year) {
      query += ` AND s.certificate_year = $${paramCount}`;
      values.push(parseInt(filters.certificate_year));
      paramCount++;
    }

    // Filter by district
    if (filters.district) {
      query += ` AND LOWER(sch.district) LIKE LOWER($${paramCount})`;
      values.push(`%${filters.district}%`);
      paramCount++;
    }

    // Filter by taluka
    if (filters.taluka) {
      query += ` AND LOWER(sch.taluka) LIKE LOWER($${paramCount})`;
      values.push(`%${filters.taluka}%`);
      paramCount++;
    }

    // Filter by caste
    if (filters.caste) {
      query += ` AND LOWER(s.caste) LIKE LOWER($${paramCount})`;
      values.push(`%${filters.caste}%`);
      paramCount++;
    }

    // Filter by religion
    if (filters.religion) {
      query += ` AND LOWER(s.religion) LIKE LOWER($${paramCount})`;
      values.push(`%${filters.religion}%`);
      paramCount++;
    }

    // Filter by serial_no
    if (filters.serial_no) {
      query += ` AND s.serial_no = $${paramCount}`;
      values.push(filters.serial_no);
      paramCount++;
    }

    // Filter by leaving_class
    if (filters.leaving_class) {
      query += ` AND LOWER(s.leaving_class) LIKE LOWER($${paramCount})`;
      values.push(`%${filters.leaving_class}%`);
      paramCount++;
    }

    // Filter by created_by
    if (filters.created_by) {
      query += ` AND s.created_by = $${paramCount}`;
      values.push(parseInt(filters.created_by));
      paramCount++;
    }

    // Filter by created_at range
    if (filters.created_at_from) {
      query += ` AND s.created_at >= $${paramCount}`;
      values.push(filters.created_at_from);
      paramCount++;
    }
    if (filters.created_at_to) {
      query += ` AND s.created_at <= $${paramCount}`;
      values.push(filters.created_at_to);
      paramCount++;
    }

    // Filter by updated_at range
    if (filters.updated_at_from) {
      query += ` AND s.updated_at >= $${paramCount}`;
      values.push(filters.updated_at_from);
      paramCount++;
    }
    if (filters.updated_at_to) {
      query += ` AND s.updated_at <= $${paramCount}`;
      values.push(filters.updated_at_to);
      paramCount++;
    }

    // General search across multiple fields (includes Aadhaar number search)
    if (filters.search) {
      query += ` AND (
        LOWER(s.full_name) LIKE LOWER($${paramCount}) OR
        LOWER(s.student_id) LIKE LOWER($${paramCount}) OR
        s.uid_aadhar_no LIKE $${paramCount} OR
        LOWER(s.serial_no) LIKE LOWER($${paramCount}) OR
        LOWER(s.father_name) LIKE LOWER($${paramCount}) OR
        LOWER(s.mother_name) LIKE LOWER($${paramCount}) OR
        LOWER(s.surname) LIKE LOWER($${paramCount}) OR
        LOWER(sch.name) LIKE LOWER($${paramCount}) OR
        sch.school_recognition_no LIKE $${paramCount} OR
        sch.udise_no LIKE $${paramCount}
      )`;
      values.push(`%${filters.search}%`);
      paramCount++;
    }

    // Validate sort_by field to prevent SQL injection
    const allowedSortFields = {
      'created_at': 's.created_at',
      'updated_at': 's.updated_at',
      'full_name': 's.full_name',
      'student_id': 's.student_id',
      'date_of_birth': 's.date_of_birth',
      'leaving_date': 's.leaving_date',
      'date_of_leaving': 's.leaving_date', // alias
      'certificate_year': 's.certificate_year',
      'status': 's.status',
      'serial_no': 's.serial_no'
    };
    
    const sortField = allowedSortFields[sort_by.toLowerCase()] || 's.created_at';
    const sortDirection = (sort_order && sort_order.toUpperCase() === 'ASC') ? 'ASC' : 'DESC';
    
    query += ` ORDER BY ${sortField} ${sortDirection}`;

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

    // Filter by student_id
    if (filters.student_id) {
      query += ` AND s.student_id = $${paramCount}`;
      values.push(filters.student_id);
      paramCount++;
    }

    // Filter by uid_aadhar_no or aadhaar (exact match) - aadhaar is an alias for uid_aadhar_no
    const aadharFilter = filters.uid_aadhar_no || filters.aadhaar || filters.aadhar;
    if (aadharFilter) {
      query += ` AND s.uid_aadhar_no = $${paramCount}`;
      values.push(aadharFilter);
      paramCount++;
    }

    // Filter by full_name or student_name (partial match) - student_name is an alias for full_name
    const studentNameFilterCount = filters.full_name || filters.student_name;
    if (studentNameFilterCount) {
      query += ` AND LOWER(s.full_name) LIKE LOWER($${paramCount})`;
      values.push(`%${studentNameFilterCount}%`);
      paramCount++;
    }

    // Filter by father_name (partial match)
    if (filters.father_name) {
      query += ` AND LOWER(s.father_name) LIKE LOWER($${paramCount})`;
      values.push(`%${filters.father_name}%`);
      paramCount++;
    }

    // Filter by date_of_birth (exact match)
    if (filters.date_of_birth) {
      query += ` AND s.date_of_birth = $${paramCount}`;
      values.push(filters.date_of_birth);
      paramCount++;
    }

    // Filter by date_of_birth range
    if (filters.date_of_birth_from) {
      query += ` AND s.date_of_birth >= $${paramCount}`;
      values.push(filters.date_of_birth_from);
      paramCount++;
    }
    if (filters.date_of_birth_to) {
      query += ` AND s.date_of_birth <= $${paramCount}`;
      values.push(filters.date_of_birth_to);
      paramCount++;
    }

    // Filter by leaving_date or date_of_leaving (exact match) - date_of_leaving is an alias for leaving_date
    const leavingDateFilterCount = filters.leaving_date || filters.date_of_leaving;
    if (leavingDateFilterCount) {
      query += ` AND s.leaving_date = $${paramCount}`;
      values.push(leavingDateFilterCount);
      paramCount++;
    }

    // Filter by leaving_date range (supports date_of_leaving_from/to as aliases)
    const leavingDateFromCount = filters.leaving_date_from || filters.date_of_leaving_from;
    if (leavingDateFromCount) {
      query += ` AND s.leaving_date >= $${paramCount}`;
      values.push(leavingDateFromCount);
      paramCount++;
    }
    const leavingDateToCount = filters.leaving_date_to || filters.date_of_leaving_to;
    if (leavingDateToCount) {
      query += ` AND s.leaving_date <= $${paramCount}`;
      values.push(leavingDateToCount);
      paramCount++;
    }

    // Filter by certificate_year
    if (filters.certificate_year) {
      query += ` AND s.certificate_year = $${paramCount}`;
      values.push(parseInt(filters.certificate_year));
      paramCount++;
    }

    // Filter by district
    if (filters.district) {
      query += ` AND LOWER(sch.district) LIKE LOWER($${paramCount})`;
      values.push(`%${filters.district}%`);
      paramCount++;
    }

    // Filter by taluka
    if (filters.taluka) {
      query += ` AND LOWER(sch.taluka) LIKE LOWER($${paramCount})`;
      values.push(`%${filters.taluka}%`);
      paramCount++;
    }

    // Filter by caste
    if (filters.caste) {
      query += ` AND LOWER(s.caste) LIKE LOWER($${paramCount})`;
      values.push(`%${filters.caste}%`);
      paramCount++;
    }

    // Filter by religion
    if (filters.religion) {
      query += ` AND LOWER(s.religion) LIKE LOWER($${paramCount})`;
      values.push(`%${filters.religion}%`);
      paramCount++;
    }

    // Filter by serial_no
    if (filters.serial_no) {
      query += ` AND s.serial_no = $${paramCount}`;
      values.push(filters.serial_no);
      paramCount++;
    }

    // Filter by leaving_class
    if (filters.leaving_class) {
      query += ` AND LOWER(s.leaving_class) LIKE LOWER($${paramCount})`;
      values.push(`%${filters.leaving_class}%`);
      paramCount++;
    }

    // Filter by created_by
    if (filters.created_by) {
      query += ` AND s.created_by = $${paramCount}`;
      values.push(parseInt(filters.created_by));
      paramCount++;
    }

    // Filter by created_at range
    if (filters.created_at_from) {
      query += ` AND s.created_at >= $${paramCount}`;
      values.push(filters.created_at_from);
      paramCount++;
    }
    if (filters.created_at_to) {
      query += ` AND s.created_at <= $${paramCount}`;
      values.push(filters.created_at_to);
      paramCount++;
    }

    // Filter by updated_at range
    if (filters.updated_at_from) {
      query += ` AND s.updated_at >= $${paramCount}`;
      values.push(filters.updated_at_from);
      paramCount++;
    }
    if (filters.updated_at_to) {
      query += ` AND s.updated_at <= $${paramCount}`;
      values.push(filters.updated_at_to);
      paramCount++;
    }

    // General search across multiple fields (includes Aadhaar number search)
    if (filters.search) {
      query += ` AND (
        LOWER(s.full_name) LIKE LOWER($${paramCount}) OR
        LOWER(s.student_id) LIKE LOWER($${paramCount}) OR
        s.uid_aadhar_no LIKE $${paramCount} OR
        LOWER(s.serial_no) LIKE LOWER($${paramCount}) OR
        LOWER(s.father_name) LIKE LOWER($${paramCount}) OR
        LOWER(s.mother_name) LIKE LOWER($${paramCount}) OR
        LOWER(s.surname) LIKE LOWER($${paramCount}) OR
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
    // Map school_general_register_no to general_register_ref for backward compatibility
    // until migration 012 is run
    const updateData = { ...studentData };
    if (updateData.school_general_register_no !== undefined) {
      updateData.general_register_ref = updateData.school_general_register_no;
      delete updateData.school_general_register_no;
    }
    
    const fields = Object.keys(updateData);
    const values = Object.values(updateData);
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

  static async getStats() {
    const query = `
      SELECT 
        COUNT(*) as total_records,
        COUNT(CASE WHEN updated_at != created_at OR updated_by IS NOT NULL THEN 1 END) as updated_records,
        COUNT(CASE WHEN status != 'draft' THEN 1 END) as status_modified_records
      FROM students
    `;
    const result = await pool.query(query);
    return {
      total_records: parseInt(result.rows[0].total_records),
      updated_records: parseInt(result.rows[0].updated_records),
      status_modified_records: parseInt(result.rows[0].status_modified_records)
    };
  }
}

module.exports = Student;
