const express = require('express');
const router = express.Router();
const LeavingCertificate = require('../models/LeavingCertificate');
const { body, validationResult } = require('express-validator');
const { mapFieldsToSnakeCase } = require('../middleware/fieldMapper');
const { authenticate } = require('../middleware/auth');
const { 
  canAddDocument, 
  canViewDocument, 
  canEditDocument, 
  canApproveReject,
  filterByRole 
} = require('../middleware/rbac');
const { logAdd, logUpdate, logVisit, logDelete } = require('../middleware/auditEnhanced');
const { parsePagination, createPaginationMeta, formatPaginatedResponse } = require('../utils/pagination');
const pool = require('../config/database');

/**
 * Helper function to require admin or super role
 */
function requireAdmin(req, res, next) {
  if (!['admin', 'super'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      error: 'Only Admin and Super Admin can perform this action'
    });
  }
  next();
}

/**
 * @swagger
 * /api/certificates:
 *   get:
 *     summary: Get all certificates with pagination and filters (RBAC protected)
 *     tags: [Certificates]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', authenticate, canViewDocument, async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req);
    
    const filters = {};
    if (req.query.school_id) filters.school_id = parseInt(req.query.school_id);
    if (req.query.student_id) filters.student_id = parseInt(req.query.student_id);
    if (req.query.status) filters.status = req.query.status;
    if (req.query.search) filters.search = req.query.search;

    // For 'user' role, only show accepted documents
    if (req.user.role === 'user') {
      filters.status = 'accepted';
    }

    const certificates = await LeavingCertificate.findAll(filters, { limit, offset });
    const total = await LeavingCertificate.count(filters);

    // Filter by role if needed (already filtered in query for user role)
    const filteredCertificates = req.user.role === 'user' 
      ? certificates 
      : filterByRole(certificates, req.user.role);

    const paginationMeta = createPaginationMeta(page, limit, total);
    res.json(formatPaginatedResponse(filteredCertificates, paginationMeta));
  } catch (error) {
    console.error('Error fetching certificates:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch certificates' });
  }
});

/**
 * @swagger
 * /api/certificates/{id}:
 *   get:
 *     summary: Get certificate by ID (RBAC protected, logs visit)
 *     tags: [Certificates]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', authenticate, canViewDocument, async (req, res) => {
  try {
    const certificate = await LeavingCertificate.findById(req.params.id);
    
    if (!certificate) {
      return res.status(404).json({ success: false, error: 'Certificate not found' });
    }

    // Check if user can view this document
    if (req.user.role === 'user' && certificate.status !== 'accepted') {
      return res.status(403).json({ 
        success: false, 
        error: 'You can only view accepted documents' 
      });
    }

    // Log visit
    await logVisit(
      req.user.id, 
      'leaving_certificates', 
      parseInt(req.params.id), 
      req, 
      req.user.phone_no
    );

    res.json({ success: true, data: certificate });
  } catch (error) {
    console.error('Error fetching certificate:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch certificate' });
  }
});

/**
 * @swagger
 * /api/certificates:
 *   post:
 *     summary: Create a new certificate (Admin/Super only)
 *     tags: [Certificates]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/',
  authenticate,
  canAddDocument,
  mapFieldsToSnakeCase,
  [
    body('school_id').notEmpty().withMessage('School ID is required'),
    body('student_id').notEmpty().withMessage('Student ID is required'),
    body('serial_no').notEmpty().withMessage('Serial number is required'),
    body('leaving_date').notEmpty().withMessage('Leaving date is required'),
    body('leaving_class').notEmpty().withMessage('Leaving class is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      // Set status to 'new' for new certificates
      const certificateData = {
        ...req.body,
        status: 'new', // New status when adding by data entry person
        created_by: req.user.id
      };

      const certificate = await LeavingCertificate.create(certificateData);
      const fullCertificate = await LeavingCertificate.findById(certificate.id);

      // Log addition
      await logAdd(
        req.user.id,
        'leaving_certificates',
        certificate.id,
        req
      );

      res.status(201).json({ 
        success: true, 
        data: fullCertificate,
        message: 'Certificate created successfully'
      });
    } catch (error) {
      console.error('Error creating certificate:', error);
      if (error.code === '23505') {
        return res.status(409).json({ 
          success: false, 
          error: 'Certificate with this serial number already exists for this school' 
        });
      }
      if (error.code === '23503') {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid school_id or student_id' 
        });
      }
      res.status(500).json({ 
        success: false, 
        error: error.message || 'Failed to create certificate'
      });
    }
  }
);

/**
 * @swagger
 * /api/certificates/{id}:
 *   put:
 *     summary: Update certificate (Admin/Super only, cannot edit accepted)
 *     tags: [Certificates]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id', authenticate, canEditDocument, async (req, res) => {
  try {
    // Get current certificate to check status
    const currentCertificate = await LeavingCertificate.findById(req.params.id);
    
    if (!currentCertificate) {
      return res.status(404).json({ success: false, error: 'Certificate not found' });
    }

    // Cannot edit accepted documents (except super admin)
    if (currentCertificate.status === 'accepted' && req.user.role !== 'super') {
      return res.status(403).json({
        success: false,
        error: 'Cannot edit accepted documents. Only Super Admin can modify accepted documents.'
      });
    }

    // Store old data for audit
    const oldData = { ...currentCertificate };

    // Update certificate
    const updateData = {
      ...req.body,
      updated_by: req.user.id
    };

    const certificate = await LeavingCertificate.update(req.params.id, updateData);
    
    if (!certificate) {
      return res.status(404).json({ success: false, error: 'Certificate not found' });
    }

    const newCertificate = await LeavingCertificate.findById(req.params.id);

    // Log update
    await logUpdate(
      req.user.id,
      'leaving_certificates',
      parseInt(req.params.id),
      req,
      oldData,
      newCertificate
    );

    res.json({ success: true, data: newCertificate });
  } catch (error) {
    console.error('Error updating certificate:', error);
    res.status(500).json({ success: false, error: 'Failed to update certificate' });
  }
});

/**
 * @swagger
 * /api/certificates/{id}/status:
 *   patch:
 *     summary: Update certificate status (Super Admin only for approve/reject)
 *     tags: [Certificates]
 *     security:
 *       - bearerAuth: []
 */
router.patch('/:id/status', authenticate, async (req, res) => {
  try {
    const { status, reason } = req.body;
    const validStatuses = ['new', 'in_review', 'rejected', 'accepted', 'draft', 'issued', 'archived', 'cancelled'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Valid status is required. Allowed: ${validStatuses.join(', ')}`
      });
    }

    const certificate = await LeavingCertificate.findById(req.params.id);
    if (!certificate) {
      return res.status(404).json({ success: false, error: 'Certificate not found' });
    }

    // Check permissions
    if (['accepted', 'rejected'].includes(status)) {
      // Only super admin can approve/reject
      if (req.user.role !== 'super') {
        return res.status(403).json({
          success: false,
          error: 'Only Super Admin can approve or reject documents'
        });
      }
    } else if (status === 'in_review') {
      // Admin and Super can submit for review
      if (!['admin', 'super'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          error: 'Only Admin and Super Admin can submit documents for review'
        });
      }
    }

    // Store old status
    const oldStatus = certificate.status;

    // Update status
    const updateData = {
      status,
      updated_by: req.user.id
    };

    if (status === 'accepted') {
      updateData.issued_by = req.user.id;
      updateData.issued_at = new Date();
    }

    await LeavingCertificate.update(req.params.id, updateData);

    // Log status change in certificate_status_history
    await pool.query(
      `INSERT INTO certificate_status_history (certificate_id, old_status, new_status, changed_by, reason)
       VALUES ($1, $2, $3, $4, $5)`,
      [req.params.id, oldStatus, status, req.user.id, reason || null]
    );

    // Log in audit_logs
    await logUpdate(
      req.user.id,
      'leaving_certificates',
      parseInt(req.params.id),
      req,
      { status: oldStatus },
      { status }
    );

    const updatedCertificate = await LeavingCertificate.findById(req.params.id);
    res.json({ 
      success: true, 
      data: updatedCertificate,
      message: `Certificate status updated to ${status}`
    });
  } catch (error) {
    console.error('Error updating certificate status:', error);
    res.status(500).json({ success: false, error: 'Failed to update certificate status' });
  }
});

/**
 * @swagger
 * /api/certificates/{id}:
 *   delete:
 *     summary: Delete certificate (Admin/Super only)
 *     tags: [Certificates]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const certificate = await LeavingCertificate.delete(req.params.id);
    if (!certificate) {
      return res.status(404).json({ success: false, error: 'Certificate not found' });
    }

    // Log deletion
    await logDelete(req.user.id, 'leaving_certificates', parseInt(req.params.id), req);

    res.json({ success: true, message: 'Certificate deleted successfully' });
  } catch (error) {
    console.error('Error deleting certificate:', error);
    res.status(500).json({ success: false, error: 'Failed to delete certificate' });
  }
});

module.exports = router;

