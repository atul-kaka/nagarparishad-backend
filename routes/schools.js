const express = require('express');
const router = express.Router();
const School = require('../models/School');
const { body, validationResult } = require('express-validator');
const { mapFieldsToSnakeCase } = require('../middleware/fieldMapper');

/**
 * @swagger
 * /api/schools:
 *   get:
 *     summary: Get all schools
 *     tags: [Schools]
 *     responses:
 *       200:
 *         description: List of all schools
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
 *                     $ref: '#/components/schemas/School'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/', async (req, res) => {
  try {
    const schools = await School.findAll();
    res.json({ success: true, data: schools });
  } catch (error) {
    console.error('Error fetching schools:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch schools' });
  }
});

/**
 * @swagger
 * /api/schools/{id}:
 *   get:
 *     summary: Get school by ID
 *     tags: [Schools]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: School ID
 *     responses:
 *       200:
 *         description: School details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/School'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', async (req, res) => {
  try {
    const school = await School.findById(req.params.id);
    if (!school) {
      return res.status(404).json({ success: false, error: 'School not found' });
    }
    res.json({ success: true, data: school });
  } catch (error) {
    console.error('Error fetching school:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch school' });
  }
});

/**
 * @swagger
 * /api/schools:
 *   post:
 *     summary: Create a new school
 *     tags: [Schools]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - district
 *             properties:
 *               name:
 *                 type: string
 *                 example: स्व. जतिरामजी बर्वे नगर परिषद प्राथमिक शाळा, रामटेक
 *               district:
 *                 type: string
 *                 example: नागपूर
 *               state:
 *                 type: string
 *                 example: महाराष्ट्र
 *               created_by:
 *                 type: integer
 *                 description: User ID who created this record
 *     responses:
 *       201:
 *         description: School created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/School'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post(
  '/',
  mapFieldsToSnakeCase, // Transform camelCase to snake_case
  [
    body('name').notEmpty().withMessage('School name is required'),
    body('district').notEmpty().withMessage('District is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const school = await School.create(req.body);
      res.status(201).json({ success: true, data: school });
    } catch (error) {
      console.error('Error creating school:', error);
      
      // Handle validation errors (missing identifier)
      if (error.validationErrors && error.validationErrors.length > 0) {
        return res.status(400).json({
          success: false,
          error: error.message || 'Validation failed',
          validationErrors: error.validationErrors
        });
      }
      
      // Handle duplicate errors
      if (error.duplicateErrors && error.duplicateErrors.length > 0) {
        return res.status(409).json({
          success: false,
          error: 'Duplicate record found',
          duplicates: error.duplicateErrors
        });
      }
      
      res.status(500).json({ success: false, error: 'Failed to create school' });
    }
  }
);

/**
 * @swagger
 * /api/schools/{id}:
 *   put:
 *     summary: Update school
 *     tags: [Schools]
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
 *             $ref: '#/components/schemas/School'
 *     responses:
 *       200:
 *         description: School updated successfully
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/:id', async (req, res) => {
  try {
    const school = await School.update(req.params.id, req.body);
    if (!school) {
      return res.status(404).json({ success: false, error: 'School not found' });
    }
    res.json({ success: true, data: school });
  } catch (error) {
    console.error('Error updating school:', error);
    
    // Handle validation errors (missing identifier)
    if (error.validationErrors && error.validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: error.message || 'Validation failed',
        validationErrors: error.validationErrors
      });
    }
    
    // Handle duplicate errors
    if (error.duplicateErrors && error.duplicateErrors.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Duplicate record found',
        duplicates: error.duplicateErrors
      });
    }
    
    res.status(500).json({ success: false, error: 'Failed to update school' });
  }
});

/**
 * @swagger
 * /api/schools/{id}:
 *   delete:
 *     summary: Delete school
 *     tags: [Schools]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: School deleted successfully
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/:id', async (req, res) => {
  try {
    const school = await School.delete(req.params.id);
    if (!school) {
      return res.status(404).json({ success: false, error: 'School not found' });
    }
    res.json({ success: true, message: 'School deleted successfully' });
  } catch (error) {
    console.error('Error deleting school:', error);
    res.status(500).json({ success: false, error: 'Failed to delete school' });
  }
});

module.exports = router;

