const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const { authenticate } = require('../middleware/auth');
const { logUpdate } = require('../middleware/auditEnhanced');
const { validateTransition } = require('../utils/statusStateMachine');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');

/**
 * @swagger
 * /api/students/{id}/status:
 *   patch:
 *     summary: Update student/certificate status with state machine validation
 *     tags: [Students]
 *     description: Updates status following proper state machine rules. Draft/rejected can go to in_review. Only in_review can be accepted or rejected.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Student ID
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
 *                 enum: [draft, in_review, rejected, accepted, issued, archived, cancelled]
 *                 example: in_review
 *               reason:
 *                 type: string
 *                 description: Reason for status change
 *                 example: Submitted for review
 *               notes:
 *                 type: string
 *                 description: Additional notes
 *     responses:
 *       200:
 *         description: Status updated successfully
 *       400:
 *         description: Invalid status transition
 *       403:
 *         description: Not authorized for this action
 *       404:
 *         description: Student not found
 */
router.patch(
  '/:id/status',
  authenticate,
  [
    body('status').notEmpty().withMessage('Status is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { status, reason, notes } = req.body;
      const studentId = parseInt(req.params.id);
      const userId = req.user.id;
      const userRole = req.user.role;

      // Get current student
      const currentStudent = await Student.findById(studentId);
      if (!currentStudent) {
        return res.status(404).json({ success: false, error: 'Student not found' });
      }

      const currentStatus = currentStudent.status || 'draft';

      // Validate state transition
      const validation = validateTransition(currentStatus, status);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: validation.error
        });
      }

      // Role-based validation
      // Only Admin can submit for review (draft → in_review)
      if (currentStatus === 'draft' && status === 'in_review') {
        if (userRole !== 'admin') {
          return res.status(403).json({
            success: false,
            error: 'Only Admin can submit records for review'
          });
        }
      }

      // Only Admin can resubmit rejected records (rejected → in_review)
      if (currentStatus === 'rejected' && status === 'in_review') {
        if (userRole !== 'admin') {
          return res.status(403).json({
            success: false,
            error: 'Only Admin can resubmit rejected records for review'
          });
        }
      }

      // Only Super Admin can approve/reject (in_review → accepted/rejected)
      if (currentStatus === 'in_review' && ['accepted', 'rejected'].includes(status)) {
        if (userRole !== 'super') {
          return res.status(403).json({
            success: false,
            error: 'Only Super Admin can approve or reject records'
          });
        }
      }

      // Update status and optional comment
      const updateData = {
        status,
        updated_by: userId
      };
      
      // Store comment if provided
      if (req.body.comment) {
        updateData.comment = req.body.comment;
      }

      const updatedStudent = await Student.update(studentId, updateData);

      // Log status change in certificate_status_history (if table exists)
      if (currentStatus !== status) {
        try {
          await pool.query(
            `INSERT INTO certificate_status_history 
             (certificate_id, old_status, new_status, changed_by, reason, notes)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [studentId, currentStatus, status, userId, reason || null, notes || null]
          );
        } catch (error) {
          // If table doesn't exist, log warning but continue
          if (error.code !== '42P01') {
            console.warn('Could not log status history:', error.message);
          }
        }
      }

      // Log audit trail
      try {
        await logUpdate(
          userId,
          'students',
          studentId,
          req,
          { status: currentStatus },
          { status: status }
        );
      } catch (error) {
        console.warn('Could not log audit trail:', error.message);
      }

      const fullStudent = await Student.findById(studentId);

      res.json({
        success: true,
        data: fullStudent,
        message: `Status updated from ${currentStatus} to ${status}`
      });
    } catch (error) {
      console.error('Error updating student status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update student status'
      });
    }
  }
);

/**
 * @swagger
 * /api/students/{id}/status/transitions:
 *   get:
 *     summary: Get allowed status transitions for a student
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Student ID
 *     responses:
 *       200:
 *         description: Allowed transitions
 *       404:
 *         description: Student not found
 */
router.get('/:id/status/transitions', authenticate, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    const { getAllowedTransitions, canEdit, isFinalState } = require('../utils/statusStateMachine');
    const currentStatus = student.status || 'draft';
    const allowedTransitions = getAllowedTransitions(currentStatus);

    res.json({
      success: true,
      data: {
        current_status: currentStatus,
        allowed_transitions: allowedTransitions,
        can_edit: canEdit(currentStatus),
        is_final_state: isFinalState(currentStatus)
      }
    });
  } catch (error) {
    console.error('Error fetching status transitions:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch status transitions' });
  }
});

module.exports = router;

