const express = require('express');
const router = express.Router();
const AuditLog = require('../models/AuditLog');
const { authenticate } = require('../middleware/auth');

/**
 * @swagger
 * /api/audit:
 *   get:
 *     summary: Get audit logs with optional filters
 *     tags: [Audit]
 *     parameters:
 *       - in: query
 *         name: table_name
 *         schema:
 *           type: string
 *         description: Filter by table name (schools, students, leaving_certificates)
 *       - in: query
 *         name: record_id
 *         schema:
 *           type: integer
 *         description: Filter by record ID
 *       - in: query
 *         name: changed_by
 *         schema:
 *           type: integer
 *         description: Filter by user ID
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *           enum: [INSERT, UPDATE, DELETE]
 *         description: Filter by action type
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date filter
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: End date filter
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Limit number of results
 *     responses:
 *       200:
 *         description: List of audit logs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AuditLog'
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const filters = {
      table_name: req.query.table_name,
      record_id: req.query.record_id ? parseInt(req.query.record_id) : undefined,
      changed_by: req.query.changed_by ? parseInt(req.query.changed_by) : undefined,
      action: req.query.action,
      start_date: req.query.start_date,
      end_date: req.query.end_date
    };

    // Remove undefined filters
    Object.keys(filters).forEach(key => filters[key] === undefined && delete filters[key]);

    const logs = await AuditLog.findAll(filters, { limit, offset });
    const total = await AuditLog.count(filters);

    res.json({ 
      success: true, 
      data: logs,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch audit logs' });
  }
});

/**
 * @swagger
 * /api/audit/{table_name}/{record_id}:
 *   get:
 *     summary: Get audit logs for specific table and record
 *     tags: [Audit]
 *     parameters:
 *       - in: path
 *         name: table_name
 *         required: true
 *         schema:
 *           type: string
 *           enum: [schools, students, leaving_certificates]
 *         description: Table name
 *       - in: path
 *         name: record_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Record ID
 *     responses:
 *       200:
 *         description: Audit logs for the record
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AuditLog'
 */
router.get('/:table_name/:record_id', authenticate, async (req, res) => {
  try {
    const logs = await AuditLog.findByTableAndRecord(
      req.params.table_name,
      parseInt(req.params.record_id)
    );
    res.json({ success: true, data: logs });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch audit logs' });
  }
});

module.exports = router;

