const express = require('express');
const router = express.Router();
const LeavingCertificate = require('../models/LeavingCertificate');
const AuditLog = require('../models/AuditLog');
const pool = require('../config/database');

/**
 * @swagger
 * /api/certificates/{id}/status:
 *   patch:
 *     summary: Update certificate status with audit trail
 *     tags: [Certificates]
 *     description: Updates certificate status and logs the change in audit trail and status history
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Certificate ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [draft, issued, archived, cancelled]
 *                 example: issued
 *               reason:
 *                 type: string
 *                 example: All documents verified and approved
 *               notes:
 *                 type: string
 *                 example: Certificate ready for issue
 *               user_id:
 *                 type: integer
 *                 description: User ID making the change (for audit trail)
 *                 example: 1
 *     responses:
 *       200:
 *         description: Status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/LeavingCertificate'
 *                 message:
 *                   type: string
 *                   example: Certificate status updated from draft to issued
 *       400:
 *         description: Invalid status value
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.patch('/:id/status', async (req, res) => {
  try {
    const { status, reason, notes, user_id } = req.body;
    
    if (!status || !['draft', 'issued', 'archived', 'cancelled'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Valid status (draft, issued, archived, cancelled) is required' 
      });
    }

    // Get current certificate
    const currentCert = await LeavingCertificate.findById(req.params.id);
    if (!currentCert) {
      return res.status(404).json({ success: false, error: 'Certificate not found' });
    }

    const oldStatus = currentCert.status;

    // Update certificate status
    const updateData = { status };
    if (status === 'issued' && user_id) {
      updateData.issued_by = user_id;
      updateData.issued_at = new Date();
    }
    if (user_id) {
      updateData.updated_by = user_id;
    }

    const certificate = await LeavingCertificate.update(req.params.id, updateData);
    
    if (!certificate) {
      return res.status(404).json({ success: false, error: 'Certificate not found' });
    }

    // Log status change in certificate_status_history
    if (oldStatus !== status) {
      await pool.query(
        `INSERT INTO certificate_status_history 
         (certificate_id, old_status, new_status, changed_by, reason, notes)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [req.params.id, oldStatus, status, user_id || null, reason || null, notes || null]
      );
    }

    // Log audit trail
    if (user_id) {
      await AuditLog.create({
        table_name: 'leaving_certificates',
        record_id: parseInt(req.params.id),
        action: 'UPDATE',
        field_name: 'status',
        old_value: oldStatus,
        new_value: status,
        changed_by: user_id,
        ip_address: req.ip || req.connection.remoteAddress,
        user_agent: req.get('user-agent'),
        notes: notes || `Status changed from ${oldStatus} to ${status}`
      });
    }

    const fullCertificate = await LeavingCertificate.findById(certificate.id);
    res.json({ 
      success: true, 
      data: fullCertificate,
      message: `Certificate status updated from ${oldStatus} to ${status}` 
    });
  } catch (error) {
    console.error('Error updating certificate status:', error);
    res.status(500).json({ success: false, error: 'Failed to update certificate status' });
  }
});

/**
 * @swagger
 * /api/certificates/{id}/status-history:
 *   get:
 *     summary: Get certificate status change history
 *     tags: [Certificates]
 *     description: Returns complete history of status changes for a certificate
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Certificate ID
 *     responses:
 *       200:
 *         description: Status history
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
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       certificate_id:
 *                         type: integer
 *                       old_status:
 *                         type: string
 *                       new_status:
 *                         type: string
 *                       changed_by:
 *                         type: integer
 *                       changed_by_username:
 *                         type: string
 *                       changed_by_name:
 *                         type: string
 *                       changed_at:
 *                         type: string
 *                         format: date-time
 *                       reason:
 *                         type: string
 *                       notes:
 *                         type: string
 */
router.get('/:id/status-history', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        csh.*,
        u.username as changed_by_username,
        u.full_name as changed_by_name
       FROM certificate_status_history csh
       LEFT JOIN users u ON csh.changed_by = u.id
       WHERE csh.certificate_id = $1
       ORDER BY csh.changed_at DESC`,
      [req.params.id]
    );
    
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching status history:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch status history' });
  }
});

module.exports = router;

