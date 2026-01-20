const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const School = require('../models/School');
const { mapFieldsToSnakeCase, toSnakeCase, convertMarathiYear } = require('../middleware/fieldMapper');
const { body, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { canAddDocument, canEditDocument, canEdit } = require('../middleware/rbac');

/**
 * @swagger
 * /api/students/consolidated:
 *   post:
 *     summary: Create student with all certificate data in one request
 *     tags: [Students]
 *     description: Accepts frontend format (camelCase) and creates school and student with certificate data
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               data:
 *                 type: object
 *                 description: Student and certificate data in frontend format
 *     responses:
 *       201:
 *         description: Student created successfully
 */
router.post(
  '/consolidated',
  authenticate,
  canAddDocument,
  mapFieldsToSnakeCase,
  async (req, res) => {
    try {
      const data = req.body;
      
      // Find school by ID or recognition number (required - do not auto-create)
      // Handle both camelCase (schoolId) and snake_case (school_id)
      let school = null;
      const schoolId = data.school_id || data.schoolId;
      const recognitionNo = data.school_recognition_no || data.schoolRecognitionNumber;
      
      if (schoolId) {
        // Find by school ID
        school = await School.findById(parseInt(schoolId));
        if (!school) {
          return res.status(404).json({
            success: false,
            error: `School with ID ${schoolId} not found. Please select a valid school.`
          });
        }
      } else if (recognitionNo) {
        // Find by recognition number
        school = await School.findByRecognitionNo(recognitionNo);
        if (!school) {
          return res.status(404).json({
            success: false,
            error: `School with recognition number "${recognitionNo}" not found. Please select a valid school or create the school first.`
          });
        }
      } else {
        return res.status(400).json({
          success: false,
          error: 'School is required. Please provide school_id or school_recognition_no.'
        });
      }
      
      // Helper to convert empty strings/undefined to null
      const toNull = (val) => (val === '' || val === undefined || val === null) ? null : val;
      
      // Prepare student data with all certificate fields
      const studentData = {
        // Basic student info
        student_id: toNull(data.student_id || data.studentId),
        uid_aadhar_no: toNull(data.uid_aadhar_no || data.uidAadhaarNumber),
        full_name: data.full_name || data.studentFullName, // Required field
        father_name: toNull(data.father_name || data.fatherName),
        mother_name: toNull(data.mother_name || data.motherName),
        surname: toNull(data.surname),
        nationality: toNull(data.nationality),
        mother_tongue: toNull(data.mother_tongue || data.motherTongue),
        religion: toNull(data.religion),
        caste: toNull(data.caste),
        sub_caste: toNull(data.sub_caste || data.subCaste),
        birth_place_village: toNull(data.birth_place_village || data.placeOfBirth),
        birth_place_taluka: toNull(data.birth_place_taluka || data.taluka),
        birth_place_district: toNull(data.birth_place_district || data.district),
        birth_place_state: toNull(data.birth_place_state || data.state),
        birth_place_country: toNull(data.birth_place_country || data.country) || 'भारत',
        date_of_birth: data.date_of_birth || data.dateOfBirth, // Required field
        date_of_birth_words: toNull(data.date_of_birth_words || data.dateOfBirthInWords),
        
        // School reference (required - school must exist)
        school_id: school.id,
        
        // Certificate fields
        serial_no: toNull(data.serial_no || data.serialNumber),
        previous_school: toNull(data.previous_school || data.previousSchool),
        previous_class: toNull(data.previous_class || data.previousClass),
        admission_date: toNull(data.admission_date || data.admissionDate),
        admission_class: toNull(data.admission_class || data.admissionClass),
        progress_in_studies: toNull(data.progress_in_studies || data.academicProgress),
        conduct: toNull(data.conduct),
        leaving_date: toNull(data.leaving_date || data.leavingDate),
        leaving_class: toNull(data.leaving_class || data.leavingClass),
        studying_class_and_since: toNull(data.studying_class_and_since || data.classStudyingDetails),
        reason_for_leaving: toNull(data.reason_for_leaving || data.reasonForLeaving),
        remarks: toNull(data.remarks),
        general_register_ref: toNull(data.general_register_ref || data.generalRegisterReference),
        certificate_date: toNull(data.certificate_date || data.certificateDate),
        certificate_month: toNull(data.certificate_month || data.certificateMonth),
        certificate_year: (data.certificate_year && data.certificate_year !== '') 
          ? convertMarathiYear(data.certificate_year) 
          : null,
        class_teacher_signature: toNull(data.class_teacher_signature || data.classTeacherSignature),
        clerk_signature: toNull(data.clerk_signature || data.clerkSignature),
        headmaster_signature: toNull(data.headmaster_signature || data.headmasterSignature),
        status: data.status || 'draft',
        created_by: toNull(data.created_by || (typeof data.createdBy === 'string' ? null : data.createdBy)),
        updated_by: toNull(data.updated_by || (typeof data.updatedBy === 'string' ? null : data.updatedBy))
      };
      
      // Check if student already exists
      let student = null;
      if (studentData.student_id) {
        student = await Student.findByStudentId(studentData.student_id);
      }
      if (!student && studentData.uid_aadhar_no) {
        student = await Student.findByAadhar(studentData.uid_aadhar_no);
      }
      
      if (student) {
        // Check if status allows editing
        const currentStatus = student.status || 'draft';
        if (!canEdit(currentStatus)) {
          return res.status(403).json({
            success: false,
            error: `Cannot edit record with status "${currentStatus}". Only draft and rejected records can be edited.`
          });
        }
        
        // Update existing student
        studentData.updated_by = req.user.id;
        student = await Student.update(student.id, studentData);
      } else {
        // Create new student
        studentData.created_by = req.user.id;
        student = await Student.create(studentData);
      }
      
      // Fetch full student data with school info
      const fullStudent = await Student.findById(student.id);
      
      res.status(201).json({
        success: true,
        data: fullStudent,
        message: 'Student created successfully with certificate data'
      });
    } catch (error) {
      console.error('Error creating student:', error);
      if (error.code === '23505') {
        return res.status(409).json({
          success: false,
          error: 'Student with this ID or Aadhar number already exists'
        });
      }
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create student'
      });
    }
  }
);

module.exports = router;

