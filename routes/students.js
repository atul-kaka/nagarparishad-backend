const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const { body, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { canAddDocument, canEditDocument, canDeleteDocument, canEdit, canDelete } = require('../middleware/rbac');
const { mapFieldsToSnakeCase, mapFieldsToCamelCase, toCamelCase } = require('../middleware/fieldMapper');

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
router.get('/', authenticate, mapFieldsToCamelCase, async (req, res) => {
  try {
    // Support pagination and filters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const offset = (page - 1) * limit;
    
    const filters = {
      // School filters
      school_id: req.query.school_id,
      school_name: req.query.school_name,
      school_recognition_no: req.query.school_recognition_no,
      udise_no: req.query.udise_no,
      school_identifier: req.query.school_identifier,
      district: req.query.district,
      taluka: req.query.taluka,
      
      // Student filters
      student_id: req.query.student_id,
      uid_aadhar_no: req.query.uid_aadhar_no || req.query.aadhaar || req.query.aadhar, // Support aadhaar/aadhar aliases
      aadhaar: req.query.aadhaar || req.query.aadhar || req.query.uid_aadhar_no, // Alias for uid_aadhar_no
      full_name: req.query.full_name || req.query.student_name, // student_name is an alias for full_name
      student_name: req.query.student_name || req.query.full_name, // Support both
      father_name: req.query.father_name,
      status: req.query.status,
      
      // Date filters
      date_of_birth: req.query.date_of_birth,
      date_of_birth_from: req.query.date_of_birth_from,
      date_of_birth_to: req.query.date_of_birth_to,
      leaving_date: req.query.leaving_date || req.query.date_of_leaving,
      date_of_leaving: req.query.date_of_leaving || req.query.leaving_date, // Alias for leaving_date
      leaving_date_from: req.query.leaving_date_from || req.query.date_of_leaving_from,
      date_of_leaving_from: req.query.date_of_leaving_from || req.query.leaving_date_from, // Alias
      leaving_date_to: req.query.leaving_date_to || req.query.date_of_leaving_to,
      date_of_leaving_to: req.query.date_of_leaving_to || req.query.leaving_date_to, // Alias
      
      // Certificate filters
      certificate_year: req.query.certificate_year,
      serial_no: req.query.serial_no,
      leaving_class: req.query.leaving_class,
      
      // Other filters
      caste: req.query.caste,
      religion: req.query.religion,
      created_by: req.query.created_by,
      created_at_from: req.query.created_at_from,
      created_at_to: req.query.created_at_to,
      updated_at_from: req.query.updated_at_from,
      updated_at_to: req.query.updated_at_to,
      
      // General search
      search: req.query.search
    };
    
    // Sorting parameters
    const sort_by = req.query.sort_by || 'created_at';
    const sort_order = req.query.sort_order || 'DESC';
    const sorting = { sort_by, sort_order };
    
    const students = await Student.findAll(filters, { limit, offset }, sorting);
    const total = await Student.count(filters);
    
    // Convert response to camelCase for frontend compatibility
    const studentsCamelCase = students.map(student => toCamelCase(student));
    
    res.json({
      success: true,
      data: studentsCamelCase,
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
 * /api/students/search:
 *   post:
 *     summary: Advanced search for students with multiple optional filters
 *     description: Use POST for complex filtering with many optional parameters. All filters are optional.
 *     tags: [Students]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               page:
 *                 type: integer
 *                 default: 1
 *                 minimum: 1
 *               limit:
 *                 type: integer
 *                 default: 100
 *                 minimum: 1
 *                 maximum: 1000
 *               filters:
 *                 type: object
 *                 properties:
 *                   school_id:
 *                     type: integer
 *                   school_name:
 *                     type: string
 *                   school_recognition_no:
 *                     type: string
 *                   udise_no:
 *                     type: string
 *                   school_identifier:
 *                     type: string
 *                   district:
 *                     type: string
 *                   taluka:
 *                     type: string
 *                   student_id:
 *                     type: string
 *                   uid_aadhar_no:
 *                     type: string
 *                   full_name:
 *                     type: string
 *                   father_name:
 *                     type: string
 *                   status:
 *                     type: string
 *                     enum: [draft, in_review, rejected, active]
 *                   date_of_birth:
 *                     type: string
 *                     format: date
 *                   date_of_birth_from:
 *                     type: string
 *                     format: date
 *                   date_of_birth_to:
 *                     type: string
 *                     format: date
 *                   leaving_date:
 *                     type: string
 *                     format: date
 *                   leaving_date_from:
 *                     type: string
 *                     format: date
 *                   leaving_date_to:
 *                     type: string
 *                     format: date
 *                   certificate_year:
 *                     type: integer
 *                   serial_no:
 *                     type: string
 *                   leaving_class:
 *                     type: string
 *                   caste:
 *                     type: string
 *                   religion:
 *                     type: string
 *                   created_by:
 *                     type: integer
 *                   created_at_from:
 *                     type: string
 *                     format: date-time
 *                   created_at_to:
 *                     type: string
 *                     format: date-time
 *                   updated_at_from:
 *                     type: string
 *                     format: date-time
 *                   updated_at_to:
 *                     type: string
 *                     format: date-time
 *                   search:
 *                     type: string
 *                     description: General search across student and school fields
 *     responses:
 *       200:
 *         description: List of students matching the filters
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
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     total_pages:
 *                       type: integer
 */
// GET /search - handle search via query parameters (must come before /:id)
router.get('/search', authenticate, mapFieldsToCamelCase, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const offset = (page - 1) * limit;
    
    // Build filters from query parameters
    const filters = {
      school_id: req.query.school_id,
      school_name: req.query.school_name,
      school_recognition_no: req.query.school_recognition_no,
      udise_no: req.query.udise_no,
      school_identifier: req.query.school_identifier,
      district: req.query.district,
      taluka: req.query.taluka,
      student_id: req.query.student_id,
      uid_aadhar_no: req.query.uid_aadhar_no || req.query.aadhaar || req.query.aadhar,
      full_name: req.query.full_name,
      father_name: req.query.father_name,
      mother_name: req.query.mother_name,
      date_of_birth: req.query.date_of_birth,
      date_of_birth_from: req.query.date_of_birth_from,
      date_of_birth_to: req.query.date_of_birth_to,
      leaving_date: req.query.leaving_date || req.query.date_of_leaving,
      leaving_date_from: req.query.leaving_date_from || req.query.date_of_leaving_from,
      leaving_date_to: req.query.leaving_date_to || req.query.date_of_leaving_to,
      leaving_class: req.query.leaving_class,
      status: req.query.status,
      serial_no: req.query.serial_no
    };
    
    // Remove undefined values
    Object.keys(filters).forEach(key => filters[key] === undefined && delete filters[key]);
    
    const sort_by = req.query.sort_by || 'created_at';
    const sort_order = req.query.sort_order || 'DESC';
    const sorting = { sort_by, sort_order };
    
    const students = await Student.findAll(filters, { limit, offset }, sorting);
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
    console.error('Error searching students:', error);
    res.status(500).json({ success: false, error: 'Failed to search students' });
  }
});

// POST /search - handle search via request body
router.post('/search', authenticate, mapFieldsToCamelCase, async (req, res) => {
  try {
    const { page = 1, limit = 100, filters = {}, sort_by = 'created_at', sort_order = 'DESC' } = req.body;
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 100;
    const offset = (pageNum - 1) * limitNum;
    
    // Handle date_of_leaving aliases
    if (filters.date_of_leaving && !filters.leaving_date) {
      filters.leaving_date = filters.date_of_leaving;
    }
    if (filters.date_of_leaving_from && !filters.leaving_date_from) {
      filters.leaving_date_from = filters.date_of_leaving_from;
    }
    if (filters.date_of_leaving_to && !filters.leaving_date_to) {
      filters.leaving_date_to = filters.date_of_leaving_to;
    }
    
    const sorting = { sort_by, sort_order };
    const students = await Student.findAll(filters, { limit: limitNum, offset }, sorting);
    const total = await Student.count(filters);
    
    res.json({
      success: true,
      data: students,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        total_pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error searching students:', error);
    res.status(500).json({ success: false, error: 'Failed to search students' });
  }
});

/**
 * @swagger
 * /api/students/stats:
 *   get:
 *     summary: Get student statistics
 *     tags: [Students]
 *     description: Returns total student records, updated records, and status modified records
 *     responses:
 *       200:
 *         description: Student statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     total_records:
 *                       type: integer
 *                       description: Total number of student records
 *                     updated_records:
 *                       type: integer
 *                       description: Number of student records that have been updated
 *                     status_modified_records:
 *                       type: integer
 *                       description: Number of student records with status changed from draft
 *       500:
 *         description: Server error
 */
router.get('/stats', authenticate, async (req, res) => {
  try {
    const stats = await Student.getStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching student stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch student statistics' });
  }
});

/**
 * @swagger
 * /api/students/view/{hash}:
 *   get:
 *     summary: View student by QR code hash (Public - No authentication required)
 *     tags: [Students]
 *     parameters:
 *       - in: path
 *         name: hash
 *         required: true
 *         schema:
 *           type: string
 *         description: 64-character QR code hash
 *     responses:
 *       200:
 *         description: Student details
 *       404:
 *         description: Student not found
 */
router.get('/view/:hash', async (req, res) => {
  try {
    const { hash } = req.params;
    
    if (!hash || hash.length !== 64) {
      return res.status(400).json({
        success: false,
        error: 'Invalid QR code hash. Must be 64 characters.'
      });
    }

    const student = await Student.findByQRCodeHash(hash);
    
    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student not found or QR code is invalid'
      });
    }

    // Only return public information (exclude sensitive data if needed)
    // For now, return all data as it's a school certificate system
    res.json({
      success: true,
      data: student
    });
  } catch (error) {
    console.error('Error fetching student by QR code:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch student'
    });
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
router.get('/:id', authenticate, async (req, res) => {
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
router.get('/search/:identifier', authenticate, async (req, res) => {
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
router.put('/:id', authenticate, canEditDocument, mapFieldsToSnakeCase, async (req, res) => {
  try {
    // Handle nested data structure: { data: {...} } or direct {...}
    const data = req.body.data || req.body;
    
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

    // Helper to convert empty strings/undefined to null
    const toNull = (val) => (val === '' || val === undefined || val === null) ? null : val;
    
    // Valid student table columns (excluding school-only fields)
    const validStudentFields = [
      'student_id', 'uid_aadhar_no', 'full_name', 'father_name', 'mother_name', 'surname',
      'nationality', 'mother_tongue', 'religion', 'caste', 'sub_caste',
      'birth_place_village', 'birth_place_taluka', 'birth_place_district',
      'birth_place_state', 'birth_place_country', 'date_of_birth', 'date_of_birth_words',
      'school_id', 'serial_no', 'previous_school', 'previous_class',
      'admission_date', 'admission_class', 'progress_in_studies', 'conduct',
      'leaving_date', 'leaving_class', 'studying_class_and_since',
      'reason_for_leaving', 'remarks', 'school_general_register_no',
      'certificate_date', 'certificate_month', 'certificate_year',
      'class_teacher_signature', 'clerk_signature', 'headmaster_signature',
      'status', 'created_by', 'updated_by'
    ];
    
    // Filter out school-only fields (these should not be in students table)
    const schoolOnlyFields = ['udise_no', 'general_register_no', 'affiliation_no', 'phone_no', 
                              'email', 'school_recognition_no', 'schoolName', 'schoolNameMarathi'];
    
    // If school_id or school_recognition_no is provided, find the school first
    let schoolId = data.school_id ? parseInt(data.school_id) : null;
    if (!schoolId && (data.school_recognition_no || data.schoolRecognitionNumber)) {
      const School = require('../models/School');
      const recognitionNo = data.school_recognition_no || data.schoolRecognitionNumber;
      const school = await School.findByRecognitionNo(recognitionNo);
      
      if (!school) {
        return res.status(404).json({
          success: false,
          error: `School with recognition number "${recognitionNo}" not found.`
        });
      }
      schoolId = school.id;
    }
    
    // Prepare update data - only include valid student fields
    const updateData = {
      updated_by: req.user.id
    };
    
    // Copy only valid student fields, filtering out school-only fields
    for (const [key, value] of Object.entries(data)) {
      // Skip school-only fields
      if (schoolOnlyFields.includes(key)) {
        continue;
      }
      
      // Only include valid student fields
      if (validStudentFields.includes(key)) {
        updateData[key] = toNull(value);
      }
    }
    
    // Set school_id if found
    if (schoolId) {
      updateData.school_id = schoolId;
    }
    
    // Convert certificate_year from Marathi numerals if needed
    const { convertMarathiYear } = require('../middleware/fieldMapper');
    if (updateData.certificate_year && typeof updateData.certificate_year === 'string') {
      updateData.certificate_year = convertMarathiYear(updateData.certificate_year);
    }

    // Update the student
    const student = await Student.update(req.params.id, updateData);
    
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }
    
    // Fetch full student data with school info
    const fullStudent = await Student.findById(student.id);
    
    res.json({ success: true, data: fullStudent });
  } catch (error) {
    console.error('Error updating student:', error);
    
    // Handle specific database errors
    if (error.code === '23505') { // Unique violation
      return res.status(409).json({
        success: false,
        error: 'Student ID or Aadhar number already exists',
        details: error.message
      });
    }
    
    // Return actual error message for debugging
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update student',
      details: error.message || error.toString()
    });
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

