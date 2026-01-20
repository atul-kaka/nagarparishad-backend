/**
 * Enhanced Audit Middleware
 * Tracks all user actions with location, IP, and timestamps
 */

const pool = require('../config/database');
const { getClientIP, getUserAgent } = require('./auth');

/**
 * Log record visit (view action)
 */
async function logVisit(userId, tableName, recordId, req, mobileNumber = null) {
  try {
    const ipAddress = getClientIP(req);
    const userAgent = getUserAgent(req);
    const location = req.headers['x-location'] || req.body.location || null; // Can be sent from frontend

    await pool.query(
      `INSERT INTO record_visits (user_id, table_name, record_id, ip_address, user_agent, location, mobile_number)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userId, tableName, recordId, ipAddress, userAgent, location, mobileNumber]
    );
  } catch (error) {
    console.error('Error logging visit:', error);
    // Don't throw - audit logging shouldn't break the request
  }
}

/**
 * Log data addition
 */
async function logAdd(userId, tableName, recordId, req, data = {}) {
  try {
    const ipAddress = getClientIP(req);
    const userAgent = getUserAgent(req);
    const location = req.headers['x-location'] || req.body.location || null;

    await pool.query(
      `INSERT INTO audit_logs (table_name, record_id, action, action_type, changed_by, ip_address, user_agent, location, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [tableName, recordId, 'INSERT', 'add', userId, ipAddress, userAgent, location, JSON.stringify(data)]
    );
  } catch (error) {
    console.error('Error logging add:', error);
  }
}

/**
 * Log data update
 */
async function logUpdate(userId, tableName, recordId, req, oldData = {}, newData = {}) {
  try {
    const ipAddress = getClientIP(req);
    const userAgent = getUserAgent(req);
    const location = req.headers['x-location'] || req.body.location || null;

    // Log each changed field
    for (const [field, newValue] of Object.entries(newData)) {
      const oldValue = oldData[field];
      if (oldValue !== newValue) {
        await pool.query(
          `INSERT INTO audit_logs (table_name, record_id, action, action_type, field_name, old_value, new_value, changed_by, ip_address, user_agent, location)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            tableName, recordId, 'UPDATE', 'update', field,
            oldValue ? String(oldValue) : null,
            newValue ? String(newValue) : null,
            userId, ipAddress, userAgent, location
          ]
        );
      }
    }
  } catch (error) {
    console.error('Error logging update:', error);
  }
}

/**
 * Log data deletion
 */
async function logDelete(userId, tableName, recordId, req) {
  try {
    const ipAddress = getClientIP(req);
    const userAgent = getUserAgent(req);
    const location = req.headers['x-location'] || req.body.location || null;

    await pool.query(
      `INSERT INTO audit_logs (table_name, record_id, action, action_type, changed_by, ip_address, user_agent, location)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [tableName, recordId, 'DELETE', 'delete', userId, ipAddress, userAgent, location]
    );
  } catch (error) {
    console.error('Error logging delete:', error);
  }
}

/**
 * Log login action
 */
async function logLogin(userId, req, loginMethod = 'password') {
  try {
    const ipAddress = getClientIP(req);
    const userAgent = getUserAgent(req);
    const location = req.headers['x-location'] || req.body.location || null;

    await pool.query(
      `INSERT INTO audit_logs (table_name, record_id, action, action_type, changed_by, ip_address, user_agent, location, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      ['users', userId, 'UPDATE', 'login', userId, ipAddress, userAgent, location, `Login method: ${loginMethod}`]
    );
  } catch (error) {
    // Don't fail login if audit logging fails
    console.error('Error logging login (non-critical):', error.message);
    // If table doesn't exist, it's okay - migration might not be run yet
  }
}

/**
 * Log logout action
 */
async function logLogout(userId, req) {
  try {
    const ipAddress = getClientIP(req);
    const userAgent = getUserAgent(req);
    const location = req.headers['x-location'] || req.body.location || null;

    await pool.query(
      `INSERT INTO audit_logs (table_name, record_id, action, action_type, changed_by, ip_address, user_agent, location, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      ['users', userId, 'UPDATE', 'logout', userId, ipAddress, userAgent, location, 'User logged out']
    );
  } catch (error) {
    console.error('Error logging logout:', error);
  }
}

/**
 * Middleware to automatically log visits on GET requests
 */
function auditVisits(tableName) {
  return async (req, res, next) => {
    // Store original json method
    const originalJson = res.json.bind(res);
    
    // Override json to log after response
    res.json = function(data) {
      // Log visit if user is authenticated and record ID exists
      if (req.user && req.params.id) {
        logVisit(req.user.id, tableName, req.params.id, req, req.user.phone_no)
          .catch(err => console.error('Visit logging error:', err));
      }
      return originalJson(data);
    };
    
    next();
  };
}

module.exports = {
  logVisit,
  logAdd,
  logUpdate,
  logDelete,
  logLogin,
  logLogout,
  auditVisits
};

