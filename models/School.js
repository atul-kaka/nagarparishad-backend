const pool = require('../config/database');

class School {
  static async create(schoolData) {
    const {
      name, address, taluka, district, state, phone_no, email,
      general_register_no, school_recognition_no, udise_no,
      affiliation_no, board, medium
    } = schoolData;

    const query = `
      INSERT INTO schools (
        name, address, taluka, district, state, phone_no, email,
        general_register_no, school_recognition_no, udise_no,
        affiliation_no, board, medium
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;

    const values = [
      name, address, taluka, district, state, phone_no, email,
      general_register_no, school_recognition_no, udise_no,
      affiliation_no, board || 'Maharashtra State', medium || 'Marathi'
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findById(id) {
    const query = 'SELECT * FROM schools WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async findAll() {
    const query = 'SELECT * FROM schools ORDER BY name';
    const result = await pool.query(query);
    return result.rows;
  }

  static async update(id, schoolData) {
    const fields = Object.keys(schoolData);
    const values = Object.values(schoolData);
    values.push(id);

    const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
    const query = `
      UPDATE schools 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${fields.length + 1}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM schools WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = School;

