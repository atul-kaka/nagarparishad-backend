const pool = require('../config/database');
const bcrypt = require('bcrypt');

class User {
  static async create(userData) {
    const {
      username, email, password, full_name, role, phone_no
    } = userData;

    // Hash password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    const query = `
      INSERT INTO users (
        username, email, password_hash, full_name, role, phone_no
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, username, email, full_name, role, phone_no, is_active, created_at
    `;

    const values = [
      username, email, password_hash, full_name, role || 'user', phone_no
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findByUsername(username) {
    const query = 'SELECT * FROM users WHERE username = $1';
    const result = await pool.query(query, [username]);
    return result.rows[0];
  }

  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0];
  }

  static async findById(id) {
    const query = 'SELECT id, username, email, full_name, role, phone_no, is_active, created_at, last_login FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async findAll() {
    const query = 'SELECT id, username, email, full_name, role, phone_no, is_active, created_at, last_login FROM users ORDER BY created_at DESC';
    const result = await pool.query(query);
    return result.rows;
  }

  static async update(id, userData) {
    const fields = Object.keys(userData);
    const values = Object.values(userData);
    values.push(id);

    const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
    const query = `
      UPDATE users 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${fields.length + 1}
      RETURNING id, username, email, full_name, role, phone_no, is_active
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async updateLastLogin(id) {
    const query = 'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1';
    await pool.query(query, [id]);
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  static async delete(id) {
    const query = 'UPDATE users SET is_active = false WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = User;

