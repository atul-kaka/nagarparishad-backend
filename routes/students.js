const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const { body, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { canAddDocument, canEditDocument, canDeleteDocument, canEdit, canDelete } = require('../middleware/rbac');
const { mapFieldsToSnakeCase } = require('../middleware/fieldMapper');

/**
 * @swagger
 * /api/students:
 *   get:
 *     summary: Get all students
 *     tags: [Students]
 *     responses:
 *       200:
 *         description: List of all students
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
 *                     $ref: '#/components/schemas/Student'
 */
router.get('/', async (req, res) => {
  try {
    // Support pagination and filters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const offset = (page - 1) * limit;
    
    const filters = {
      school_id: req.query.school_id,
      school_name: req.query.school_name,
      school_recognition_no: req.query.school_recognition_no,
      udise_no: req.query.udise_no,
      school_identifier: req.query.school_identifier, // Searches across all school identifiers
      status: req.query.status,
      search: req.query.search // General search across student and school fields
    };
    
    const students = await Student.findAll(filters, { limit, offset });
    const total = await Student.count(filters);
    
    res.json({
      success: true,
      data: students,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch students' });
  }
});

/**
 * @swagger
 * /api/students/{id}:
 *   get:
 *     summary: Get student by ID
 *     tags: [Students]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Student details
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }
    res.json({ success: true, data: student });
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch student' });
  }
});

/**
 * @swagger
 * /api/students/search/{identifier}:
 *   get:
 *     summary: Search student by Student ID or Aadhar number
 *     tags: [Students]
 *     parameters:
 *       - in: path
 *         name: identifier
 *         required: true
 *         schema:
 *           type: string
 *         description: Student ID or Aadhar number
 *     responses:
 *       200:
 *         description: Student found
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/search/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    let student = await Student.findByStudentId(identifier);
    
    if (!student) {
      student = await Student.findByAadhar(identifier);
    }
    
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }
    
    res.json({ success: true, data: student });
  } catch (error) {
    console.error('Error searching student:', error);
    res.status(500).json({ success: false, error: 'Failed to search student' });
  }
});

/**
 * @swagger
 * /api/students:
 *   post:
 *     summary: Create a new student
 *     tags: [Students]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - full_name
 *               - date_of_birth
 *             properties:
 *               full_name:
 *                 type: string
 *                 example: राजेश कुमार
 *               date_of_birth:
 *                 type: string
 *                 format: date
 *                 example: '2010-05-15'
 *               created_by:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Student created successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       409:
 *         description: Student ID or Aadhar already exists
 */
router.post(
  '/',
  mapFieldsToSnakeCase, // Transform camelCase to snake_case
  [
    body('full_name').notEmpty().withMessage('Full name is required'),
    body('date_of_birth').notEmpty().withMessage('Date of birth is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const student = await Student.create(req.body);
      res.status(201).json({ success: true, data: student });
    } catch (error) {
      console.error('Error creating student:', error);
      if (error.code === '23505') { // Unique violation
        return res.status(409).json({ 
          success: false, 
          error: 'Student ID or Aadhar number already exists' 
        });
      }
      res.status(500).json({ success: false, error: 'Failed to create student' });
    }
  }
);

/**
 * @swagger
 * /api/students/{id}:
 *   put:
 *     summary: Update student
 *     tags: [Students]
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
 *             $ref: '#/components/schemas/Student'
 *     responses:
 *       200:
 *         description: Student updated successfully
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/:id', authenticate, canEditDocument, async (req, res) => {
  try {
    // First, get the current student to check status
    const currentStudent = await Student.findById(req.params.id);
    if (!currentStudent) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    // Check if status allows editing
    const currentStatus = currentStudent.status || 'draft';
    if (!canEdit(currentStatus)) {
      return res.status(403).json({
        success: false,
        error: `Cannot edit record with status "${currentStatus}". Only draft and rejected records can be edited.`
      });
    }

    // Update the student
    const student = await Student.update(req.params.id, {
      ...req.body,
      updated_by: req.user.id
    });
    
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }
    
    res.json({ success: true, data: student });
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ success: false, error: 'Failed to update student' });
  }
});

/**
 * @swagger
 * /api/students/{id}:
 *   delete:
 *     summary: Delete student
 *     tags: [Students]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Student deleted successfully
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/:id', authenticate, canDeleteDocument, async (req, res) => {
  try {
    // First, get the current student to check status
    const currentStudent = await Student.findById(req.params.id);
    if (!currentStudent) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    // Check if status allows deletion
    const currentStatus = currentStudent.status || 'draft';
    if (!canDelete(currentStatus)) {
      return res.status(403).json({
        success: false,
        error: `Cannot delete record with status "${currentStatus}". Only draft and rejected records can be deleted. Approved records cannot be deleted.`
      });
    }

    // Delete the student
    const deleted = await Student.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }
    
    res.json({ success: true, message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ success: false, error: 'Failed to delete student' });
  }
});

module.exports = router;

