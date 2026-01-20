const pool = require('../config/database');

class Student {
  static async create(studentData) {
    const {
      student_id, uid_aadhar_no, full_name, father_name, mother_name,
      surname, nationality, mother_tongue, religion, caste, sub_caste,
      birth_place_village, birth_place_taluka, birth_place_district,
      birth_place_state, birth_place_country, date_of_birth, date_of_birth_words
    } = studentData;

    const query = `
      INSERT INTO students (
        student_id, uid_aadhar_no, full_name, father_name, mother_name,
        surname, nationality, mother_tongue, religion, caste, sub_caste,
        birth_place_village, birth_place_taluka, birth_place_district,
        birth_place_state, birth_place_country, date_of_birth, date_of_birth_words
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *
    `;

    const values = [
      student_id || null, uid_aadhar_no || null, full_name, father_name || null, mother_name || null,
      surname || null, nationality || null, mother_tongue || null, religion || null, caste || null, sub_caste || null,
      birth_place_village || null, birth_place_taluka || null, birth_place_district || null,
      birth_place_state || null, birth_place_country || 'India', date_of_birth, date_of_birth_words || null
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findById(id) {
    const query = 'SELECT * FROM students WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async findByStudentId(studentId) {
    const query = 'SELECT * FROM students WHERE student_id = $1';
    const result = await pool.query(query, [studentId]);
    return result.rows[0];
  }

  static async findByAadhar(aadharNo) {
    const query = 'SELECT * FROM students WHERE uid_aadhar_no = $1';
    const result = await pool.query(query, [aadharNo]);
    return result.rows[0];
  }

  static async findAll() {
    const query = 'SELECT * FROM students ORDER BY full_name';
    const result = await pool.query(query);
    return result.rows;
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

