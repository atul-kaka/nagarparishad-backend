const express = require('express');
const router = express.Router();
const LeavingCertificate = require('../models/LeavingCertificate');
const School = require('../models/School');
const Student = require('../models/Student');
const { authenticate } = require('../middleware/auth');
const { mapFieldsToSnakeCase, toSnakeCase } = require('../middleware/fieldMapper');
const { body, validationResult } = require('express-validator');

/**
 * @swagger
 * /api/certificates/bulk:
 *   post:
 *     summary: Create certificate with school and student data in one request
 *     tags: [Certificates]
 *     description: Accepts frontend format (camelCase) and creates school, student, and certificate
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               data:
 *                 type: object
 *                 description: Certificate data in frontend format
 *     responses:
 *       201:
 *         description: Certificate created successfully
 */
router.post(
  '/bulk',
  authenticate,
  async (req, res) => {
    try {
      const frontendData = req.body.data || req.body;
      
      // Transform camelCase to snake_case
      const transformed = toSnakeCase(frontendData);
      
      // Extract and create school data
      // Note: School name should be provided separately or we'll use a default
      // For now, we'll try to find existing school by recognition number or create with minimal data
      const schoolData = {
        name: transformed.school_name || 'नगर परिषद प्राथमिक शाळा', // Default or from form
        phone_no: transformed.phone_no,
        email: transformed.email,
        school_recognition_no: transformed.school_recognition_no,
        udise_no: transformed.udise_no,
        general_register_no: transformed.general_register_no,
        affiliation_no: transformed.affiliation_no,
        medium: transformed.medium,
        district: transformed.district || 'नागपूर',
        state: transformed.state || 'महाराष्ट्र',
        taluka: transformed.taluka,
        created_by: transformed.created_by ? (typeof transformed.created_by === 'string' ? null : parseInt(transformed.created_by)) : null
      };
      
      // Create or find school
      let school;
      if (transformed.school_id) {
        school = await School.findById(transformed.school_id);
        if (!school) {
          return res.status(404).json({ success: false, error: 'School not found' });
        }
      } else {
        // Try to find school by recognition number or UDISE number
        if (transformed.school_recognition_no) {
          const existingSchools = await School.findAll();
          school = existingSchools.find(s => 
            s.school_recognition_no === transformed.school_recognition_no ||
            s.udise_no === transformed.udise_no
          );
        }
        
        if (!school) {
          // Create new school
          school = await School.create(schoolData);
        }
      }
      
      // Extract and create student data
      const studentData = {
        student_id: transformed.student_id,
        uid_aadhar_no: transformed.uid_aadhar_no,
        full_name: transformed.full_name,
        father_name: transformed.father_name,
        mother_name: transformed.mother_name,
        surname: transformed.surname,
        nationality: transformed.nationality,
        mother_tongue: transformed.mother_tongue,
        religion: transformed.religion,
        caste: transformed.caste,
        sub_caste: transformed.sub_caste,
        birth_place_village: transformed.birth_place_village || transformed.place_of_birth,
        birth_place_taluka: transformed.birth_place_taluka || transformed.taluka,
        birth_place_district: transformed.birth_place_district || transformed.district,
        birth_place_state: transformed.birth_place_state || transformed.state,
        birth_place_country: transformed.birth_place_country || transformed.country || 'India',
        date_of_birth: transformed.date_of_birth,
        date_of_birth_words: transformed.date_of_birth_words,
        created_by: transformed.created_by ? (typeof transformed.created_by === 'string' ? null : parseInt(transformed.created_by)) : null
      };
      
      // Create or find student
      let student;
      if (transformed.student_id_db) { // If you have database student ID
        student = await Student.findById(transformed.student_id_db);
        if (!student) {
          return res.status(404).json({ success: false, error: 'Student not found' });
        }
      } else {
        // Check if student exists by student_id or aadhar
        if (transformed.student_id) {
          student = await Student.findByStudentId(transformed.student_id);
        }
        if (!student && transformed.uid_aadhar_no) {
          student = await Student.findByAadhar(transformed.uid_aadhar_no);
        }
        
        if (!student) {
          // Create new student
          student = await Student.create(studentData);
        }
      }
      
      // Helper to convert certificate year (handles Marathi numerals)
      let certificateYear = null;
      if (transformed.certificate_year) {
        if (typeof transformed.certificate_year === 'string') {
          // Try to convert Marathi numerals or parse as integer
          const marathiToArabic = {
            '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
            '५': '5', '६': '6', '७': '7', '८': '8', '९': '9'
          };
          let converted = '';
          for (const char of transformed.certificate_year) {
            converted += marathiToArabic[char] || char;
          }
          certificateYear = parseInt(converted) || null;
        } else {
          certificateYear = parseInt(transformed.certificate_year) || null;
        }
      }
      
      // Create certificate
      const certificateData = {
        school_id: school.id,
        student_id: student.id,
        serial_no: transformed.serial_no,
        previous_school: transformed.previous_school,
        previous_class: transformed.previous_class,
        admission_date: transformed.admission_date,
        admission_class: transformed.admission_class,
        progress_in_studies: transformed.progress_in_studies || transformed.academic_progress,
        conduct: transformed.conduct,
        leaving_date: transformed.leaving_date,
        leaving_class: transformed.leaving_class,
        studying_class_and_since: transformed.studying_class_and_since || transformed.class_studying_details,
        reason_for_leaving: transformed.reason_for_leaving,
        remarks: transformed.remarks,
        general_register_ref: transformed.general_register_ref || transformed.general_register_reference,
        certificate_date: transformed.certificate_date,
        certificate_month: transformed.certificate_month,
        certificate_year: certificateYear,
        class_teacher_name: transformed.class_teacher_name || transformed.class_teacher_signature,
        clerk_name: transformed.clerk_name || transformed.clerk_signature,
        headmaster_name: transformed.headmaster_name || transformed.headmaster_signature,
        status: transformed.status || 'draft',
        created_by: transformed.created_by ? (typeof transformed.created_by === 'string' ? null : parseInt(transformed.created_by)) : null
      };
      
      const certificate = await LeavingCertificate.create(certificateData);
      const fullCertificate = await LeavingCertificate.findById(certificate.id);
      
      res.status(201).json({ 
        success: true, 
        data: fullCertificate,
        message: 'Certificate created successfully with school and student data'
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

module.exports = router;

