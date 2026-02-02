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
    const allowedFields = [
      'username', 
      'email', 
      'password', 
      'role', 
      'full_name', 
      'phone_no', 
      'is_active',
      // Internal fields (for login tracking, password management)
      'last_ip_address',
      'last_user_agent',
      'failed_login_attempts',
      'locked_until',
      'password_expires_at',
      'password_changed_at'
    ];
    const fields = [];
    const values = [];

    // Only allow updating specific fields
    for (const [key, value] of Object.entries(userData)) {
      if (allowedFields.includes(key)) {
        if (key === 'password') {
          // Hash password if provided
          const saltRounds = 10;
          const password_hash = await bcrypt.hash(value, saltRounds);
          fields.push('password_hash');
          values.push(password_hash);
        } else {
          fields.push(key);
          values.push(value);
        }
      }
    }

    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }

    // Check for duplicate username if username is being updated
    if (userData.username) {
      const existingUser = await this.findByUsername(userData.username);
      if (existingUser && existingUser.id !== parseInt(id)) {
        throw new Error('Username already exists');
      }
    }

    // Check for duplicate email if email is being updated
    if (userData.email) {
      const existingUser = await this.findByEmail(userData.email);
      if (existingUser && existingUser.id !== parseInt(id)) {
        throw new Error('Email already exists');
      }
    }

    values.push(id);
    const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
    const query = `
      UPDATE users 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${fields.length + 1}
      RETURNING id, username, email, full_name, role, phone_no, is_active, created_at, updated_at
    `;

    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      // If column doesn't exist (error code 42703), try without the problematic fields
      if (error.code === '42703') {
        // Fields that might not exist in older database schemas
        const optionalFields = [
          'last_ip_address', 'last_user_agent', 'password_expires_at', 
          'password_changed_at', 'failed_login_attempts', 'locked_until',
          'otp_code', 'otp_expires_at', 'otp_verified'
        ];
        
        // Filter out optional fields that might not exist
        const safeFields = fields.filter(f => !optionalFields.includes(f));
        if (safeFields.length > 0) {
          const safeValues = safeFields.map(f => {
            const idx = fields.indexOf(f);
            return values[idx];
          });
          safeValues.push(id);
          const safeSetClause = safeFields.map((field, index) => `${field} = $${index + 1}`).join(', ');
          const safeQuery = `
            UPDATE users 
            SET ${safeSetClause}, updated_at = CURRENT_TIMESTAMP
            WHERE id = $${safeFields.length + 1}
            RETURNING id, username, email, full_name, role, phone_no, is_active, created_at, updated_at
          `;
          const result = await pool.query(safeQuery, safeValues);
          console.warn('⚠️  Some user fields were skipped because columns do not exist. Run migration 015 to add them: npm run migrate');
          return result.rows[0];
        } else {
          // All fields were optional, just update updated_at
          const minimalQuery = `
            UPDATE users 
            SET updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING id, username, email, full_name, role, phone_no, is_active, created_at, updated_at
          `;
          const result = await pool.query(minimalQuery, [id]);
          console.warn('⚠️  All requested fields were skipped because columns do not exist. Run migration 015 to add them: npm run migrate');
          return result.rows[0];
        }
      }
      throw error;
    }
  }

  static async updateLastLogin(id) {
    const query = 'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1';
    await pool.query(query, [id]);
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  static async delete(id) {
    // Start a transaction to handle foreign key constraints
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // 1. Update audit_logs to set changed_by to NULL (preserve audit history)
      await client.query(
        'UPDATE audit_logs SET changed_by = NULL WHERE changed_by = $1',
        [id]
      );

      // 2. Update certificate_status_history to set changed_by to NULL
      await client.query(
        'UPDATE certificate_status_history SET changed_by = NULL WHERE changed_by = $1',
        [id]
      );

      // 3. Delete login sessions for this user
      await client.query(
        'DELETE FROM login_sessions WHERE user_id = $1',
        [id]
      );

      // 4. Update records where user is referenced as created_by, updated_by, or issued_by
      // Schools
      await client.query(
        'UPDATE schools SET created_by = NULL WHERE created_by = $1',
        [id]
      );
      await client.query(
        'UPDATE schools SET updated_by = NULL WHERE updated_by = $1',
        [id]
      );

      // Students
      await client.query(
        'UPDATE students SET created_by = NULL WHERE created_by = $1',
        [id]
      );
      await client.query(
        'UPDATE students SET updated_by = NULL WHERE updated_by = $1',
        [id]
      );

      // Leaving certificates
      await client.query(
        'UPDATE leaving_certificates SET created_by = NULL WHERE created_by = $1',
        [id]
      );
      await client.query(
        'UPDATE leaving_certificates SET updated_by = NULL WHERE updated_by = $1',
        [id]
      );
      await client.query(
        'UPDATE leaving_certificates SET issued_by = NULL WHERE issued_by = $1',
        [id]
      );

      // 5. Now delete the user
      const result = await client.query(
        'DELETE FROM users WHERE id = $1 RETURNING id, username, email',
        [id]
      );

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async softDelete(id) {
    // Soft delete - deactivate user
    const query = 'UPDATE users SET is_active = false WHERE id = $1 RETURNING id, username, email, is_active';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = User;



