const pool = require('../config/database');

class AuditLog {
  static async create(auditData) {
    const {
      table_name, record_id, action, field_name,
      old_value, new_value, changed_by, ip_address, user_agent, notes
    } = auditData;

    const query = `
      INSERT INTO audit_logs (
        table_name, record_id, action, field_name,
        old_value, new_value, changed_by, ip_address, user_agent, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const values = [
      table_name, record_id, action, field_name,
      old_value, new_value, changed_by, ip_address, user_agent, notes
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findByTableAndRecord(tableName, recordId) {
    const query = `
      SELECT 
        al.*,
        u.username as changed_by_username,
        u.full_name as changed_by_name
      FROM audit_logs al
      LEFT JOIN users u ON al.changed_by = u.id
      WHERE al.table_name = $1 AND al.record_id = $2
      ORDER BY al.changed_at DESC
    `;
    const result = await pool.query(query, [tableName, recordId]);
    return result.rows;
  }

  static async findAll(filters = {}) {
    let query = `
      SELECT 
        al.*,
        u.username as changed_by_username,
        u.full_name as changed_by_name
      FROM audit_logs al
      LEFT JOIN users u ON al.changed_by = u.id
      WHERE 1=1
    `;
    const values = [];
    let paramCount = 1;

    if (filters.table_name) {
      query += ` AND al.table_name = $${paramCount}`;
      values.push(filters.table_name);
      paramCount++;
    }

    if (filters.record_id) {
      query += ` AND al.record_id = $${paramCount}`;
      values.push(filters.record_id);
      paramCount++;
    }

    if (filters.changed_by) {
      query += ` AND al.changed_by = $${paramCount}`;
      values.push(filters.changed_by);
      paramCount++;
    }

    if (filters.action) {
      query += ` AND al.action = $${paramCount}`;
      values.push(filters.action);
      paramCount++;
    }

    if (filters.start_date) {
      query += ` AND al.changed_at >= $${paramCount}`;
      values.push(filters.start_date);
      paramCount++;
    }

    if (filters.end_date) {
      query += ` AND al.changed_at <= $${paramCount}`;
      values.push(filters.end_date);
      paramCount++;
    }

    query += ' ORDER BY al.changed_at DESC LIMIT $' + paramCount;
    values.push(filters.limit || 100);

    const result = await pool.query(query, values);
    return result.rows;
  }
}

module.exports = AuditLog;

