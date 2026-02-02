const express = require('express');
const router = express.Router();
const LeavingCertificate = require('../models/LeavingCertificate');
const { body, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { mapFieldsToSnakeCase } = require('../middleware/fieldMapper');

/**
 * @swagger
 * /api/certificates:
 *   get:
 *     summary: Get all certificates with optional filters
 *     tags: [Certificates]
 *     parameters:
 *       - in: query
 *         name: school_id
 *         schema:
 *           type: integer
 *         description: Filter by school ID
 *       - in: query
 *         name: student_id
 *         schema:
 *           type: integer
 *         description: Filter by student ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, issued, archived, cancelled]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: List of certificates
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
 *                     $ref: '#/components/schemas/LeavingCertificate'
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const filters = {};
    if (req.query.school_id) filters.school_id = parseInt(req.query.school_id);
    if (req.query.student_id) filters.student_id = parseInt(req.query.student_id);
    if (req.query.status) filters.status = req.query.status;

    const certificates = await LeavingCertificate.findAll(filters);
    res.json({ success: true, data: certificates });
  } catch (error) {
    console.error('Error fetching certificates:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch certificates' });
  }
});

/**
 * @swagger
 * /api/certificates/{id}:
 *   get:
 *     summary: Get certificate by ID with full details
 *     tags: [Certificates]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Certificate details with school and student information
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const certificate = await LeavingCertificate.findById(req.params.id);
    if (!certificate) {
      return res.status(404).json({ success: false, error: 'Certificate not found' });
    }
    res.json({ success: true, data: certificate });
  } catch (error) {
    console.error('Error fetching certificate:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch certificate' });
  }
});

/**
 * @swagger
 * /api/certificates/school/{schoolId}/serial/{serialNo}:
 *   get:
 *     summary: Get certificate by serial number and school
 *     tags: [Certificates]
 *     parameters:
 *       - in: path
 *         name: schoolId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: serialNo
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Certificate found
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/school/:schoolId/serial/:serialNo', authenticate, async (req, res) => {
  try {
    const certificate = await LeavingCertificate.findBySerialNo(
      req.params.schoolId,
      req.params.serialNo
    );
    if (!certificate) {
      return res.status(404).json({ success: false, error: 'Certificate not found' });
    }
    const fullCertificate = await LeavingCertificate.findById(certificate.id);
    res.json({ success: true, data: fullCertificate });
  } catch (error) {
    console.error('Error fetching certificate:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch certificate' });
  }
});

/**
 * @swagger
 * /api/certificates:
 *   post:
 *     summary: Create a new leaving certificate
 *     tags: [Certificates]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - school_id
 *               - student_id
 *               - serial_no
 *               - leaving_date
 *               - leaving_class
 *             properties:
 *               school_id:
 *                 type: integer
 *               student_id:
 *                 type: integer
 *               serial_no:
 *                 type: string
 *                 example: '101'
 *               leaving_date:
 *                 type: string
 *                 format: date
 *                 example: '2024-03-31'
 *               leaving_class:
 *                 type: string
 *                 example: 'Class 5'
 *               created_by:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Certificate created successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       409:
 *         description: Certificate with this serial number already exists
 */
router.post(
  '/',
  authenticate,
  mapFieldsToSnakeCase, // Transform camelCase to snake_case
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
      const certificate = await LeavingCertificate.create(req.body);
      const fullCertificate = await LeavingCertificate.findById(certificate.id);
      res.status(201).json({ success: true, data: fullCertificate });
    } catch (error) {
      console.error('Error creating certificate:', error);
      if (error.code === '23505') { // Unique violation
        return res.status(409).json({ 
          success: false, 
          error: 'Certificate with this serial number already exists for this school' 
        });
      }
      if (error.code === '23503') { // Foreign key violation
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid school_id or student_id' 
        });
      }
      // Handle data type errors
      if (error.message && error.message.includes('must be valid integers')) {
        return res.status(400).json({ 
          success: false, 
          error: error.message 
        });
      }
      res.status(500).json({ 
        success: false, 
        error: error.message || 'Failed to create certificate',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
);

/**
 * @swagger
 * /api/certificates/{id}:
 *   put:
 *     summary: Update certificate
 *     tags: [Certificates]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LeavingCertificate'
 *     responses:
 *       200:
 *         description: Certificate updated successfully
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/:id', authenticate, async (req, res) => {
  try {
    const certificate = await LeavingCertificate.update(req.params.id, req.body);
    if (!certificate) {
      return res.status(404).json({ success: false, error: 'Certificate not found' });
    }
    const fullCertificate = await LeavingCertificate.findById(certificate.id);
    res.json({ success: true, data: fullCertificate });
  } catch (error) {
    console.error('Error updating certificate:', error);
    res.status(500).json({ success: false, error: 'Failed to update certificate' });
  }
});

/**
 * @swagger
 * /api/certificates/{id}/status:
 *   patch:
 *     summary: Update certificate status (deprecated - use certificates-status route)
 *     tags: [Certificates]
 *     deprecated: true
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
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
 *                 enum: [draft, issued, archived]
 *     responses:
 *       200:
 *         description: Status updated
 */
router.patch('/:id/status', authenticate, async (req, res) => {
  try {
    const { status } = req.body;
    if (!status || !['draft', 'issued', 'archived'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Valid status (draft, issued, archived) is required' 
      });
    }
    const certificate = await LeavingCertificate.update(req.params.id, { status });
    if (!certificate) {
      return res.status(404).json({ success: false, error: 'Certificate not found' });
    }
    const fullCertificate = await LeavingCertificate.findById(certificate.id);
    res.json({ success: true, data: fullCertificate });
  } catch (error) {
    console.error('Error updating certificate status:', error);
    res.status(500).json({ success: false, error: 'Failed to update certificate status' });
  }
});

/**
 * @swagger
 * /api/certificates/{id}:
 *   delete:
 *     summary: Delete certificate
 *     tags: [Certificates]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Certificate deleted successfully
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const certificate = await LeavingCertificate.delete(req.params.id);
    if (!certificate) {
      return res.status(404).json({ success: false, error: 'Certificate not found' });
    }
    res.json({ success: true, message: 'Certificate deleted successfully' });
  } catch (error) {
    console.error('Error deleting certificate:', error);
    res.status(500).json({ success: false, error: 'Failed to delete certificate' });
  }
});

module.exports = router;

