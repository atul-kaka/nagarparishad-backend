const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { body, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');

/**
 * @swagger
 * /api/users/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *               - full_name
 *             properties:
 *               username:
 *                 type: string
 *                 example: john_doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 example: securepass123
 *               full_name:
 *                 type: string
 *                 example: John Doe
 *               role:
 *                 type: string
 *                 enum: [user, admin, clerk, headmaster]
 *                 default: user
 *               phone_no:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       409:
 *         description: Username or email already exists
 */
router.post(
  '/register',
  [
    body('username').notEmpty().withMessage('Username is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('full_name').notEmpty().withMessage('Full name is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      // Check if username or email already exists
      const existingUser = await User.findByUsername(req.body.username) || 
                          await User.findByEmail(req.body.email);
      
      if (existingUser) {
        return res.status(409).json({ 
          success: false, 
          error: 'Username or email already exists' 
        });
      }

      const user = await User.create(req.body);
      res.status(201).json({ 
        success: true, 
        data: user,
        message: 'User registered successfully' 
      });
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ success: false, error: 'Failed to create user' });
    }
  }
);

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: List of all users
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
 *                     $ref: '#/components/schemas/User'
 */
router.get('/', async (req, res) => {
  try {
    const users = await User.findAll();
    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
});

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User details
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch user' });
  }
});

/**
 * Middleware to require Admin or Super Admin role
 */
function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  if (!['admin', 'super'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      error: 'Only Admin or Super Admin can perform this action'
    });
  }

  next();
}

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update user (Admin/Super Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
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
 *             properties:
 *               username:
 *                 type: string
 *                 example: newuser
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 example: password123
 *               role:
 *                 type: string
 *                 enum: [user, admin, clerk, headmaster, super]
 *                 example: user
 *               full_name:
 *                 type: string
 *               phone_no:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Validation error or duplicate username/email
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin/Super Admin only
 *       404:
 *         description: User not found
 */
router.put(
  '/:id',
  authenticate,
  requireAdmin,
  [
    body('username').optional().notEmpty().withMessage('Username cannot be empty'),
    body('email').optional().isEmail().withMessage('Valid email is required'),
    body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').optional().isIn(['user', 'admin', 'clerk', 'headmaster', 'super']).withMessage('Invalid role'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      // Prevent non-super admins from creating/updating super admins
      if (req.body.role === 'super' && req.user.role !== 'super') {
        return res.status(403).json({
          success: false,
          error: 'Only Super Admin can create or update Super Admin users'
        });
      }

      // Prevent users from updating themselves to a different role (optional security measure)
      // You can remove this if you want admins to be able to change their own role
      if (parseInt(req.params.id) === req.user.id && req.body.role && req.body.role !== req.user.role) {
        return res.status(403).json({
          success: false,
          error: 'You cannot change your own role'
        });
      }

      // Only allow updating user-editable fields (exclude internal/system fields)
      const allowedApiFields = ['username', 'email', 'password', 'role', 'full_name', 'phone_no', 'is_active'];
      const updateData = {};
      for (const key of allowedApiFields) {
        if (req.body.hasOwnProperty(key)) {
          updateData[key] = req.body[key];
        }
      }

      // Check if any valid fields were provided
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No valid fields to update. Allowed fields: username, email, password, role, full_name, phone_no, is_active'
        });
      }

      const user = await User.update(req.params.id, updateData);
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }
      
      res.json({ 
        success: true, 
        data: user,
        message: 'User updated successfully'
      });
    } catch (error) {
      console.error('Error updating user:', error);
      
      // Handle duplicate username/email errors
      if (error.message.includes('already exists')) {
        return res.status(409).json({ 
          success: false, 
          error: error.message 
        });
      }
      
      res.status(500).json({ 
        success: false, 
        error: error.message || 'Failed to update user' 
      });
    }
  }
);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete user (Admin/Super Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin/Super Admin only
 *       404:
 *         description: User not found
 */
router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  async (req, res) => {
    try {
      const userId = parseInt(req.params.id);

      // Prevent users from deleting themselves
      if (userId === req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'You cannot delete your own account'
        });
      }

      // Check if user exists
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          error: 'User not found' 
        });
      }

      // Prevent non-super admins from deleting super admins
      if (user.role === 'super' && req.user.role !== 'super') {
        return res.status(403).json({
          success: false,
          error: 'Only Super Admin can delete Super Admin users'
        });
      }

      // Delete the user
      const deletedUser = await User.delete(userId);
      
      res.json({ 
        success: true, 
        data: deletedUser,
        message: 'User deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to delete user' 
      });
    }
  }
);

module.exports = router;

