const AuditLog = require('../models/AuditLog');

// Middleware to log audit trail
const logAudit = async (req, res, next) => {
  // Store original json method
  const originalJson = res.json;

  // Override json method to capture response
  res.json = function(data) {
    // Log audit after response is sent
    if (req.user && req.method !== 'GET') {
      const auditData = {
        table_name: req.auditTable || req.route.path.split('/')[2], // Extract table name from route
        record_id: req.auditRecordId || data.data?.id,
        action: req.method,
        changed_by: req.user.id,
        ip_address: req.ip || req.connection.remoteAddress,
        user_agent: req.get('user-agent'),
        notes: `API: ${req.method} ${req.originalUrl}`
      };

      // Only log if there's a record ID
      if (auditData.record_id) {
        AuditLog.create(auditData).catch(err => {
          console.error('Error logging audit:', err);
        });
      }
    }

    // Call original json method
    return originalJson.call(this, data);
  };

  next();
};

module.exports = logAudit;




