const express = require('express');
const router = express.Router();
const User = require('../models/User');
const OTPService = require('../services/otpService');
const bcrypt = require('bcrypt');
const { 
  generateToken, 
  createSession, 
  invalidateSession,
  getClientIP,
  getUserAgent,
  authenticate,
  verifyTokenForRefresh
} = require('../middleware/auth');
const { logLogin, logLogout, logAdd, logUpdate } = require('../middleware/auditEnhanced');
const PasswordResetService = require('../services/passwordResetService');
const { body, validationResult } = require('express-validator');

/**
 * Middleware to require Super Admin role for registration
 */
function requireSuperAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  if (req.user.role !== 'super') {
    return res.status(403).json({
      success: false,
      error: 'Only Super Admin can register new users'
    });
  }

  next();
}

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user (Super Admin only)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/register',
  authenticate, // Require authentication
  requireSuperAdmin, // Only Super Admin can register users
  [
    body('username').notEmpty().withMessage('Username is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('full_name').notEmpty().withMessage('Full name is required'),
    body('role').isIn(['user', 'admin', 'super']).withMessage('Invalid role'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { username, email, password, full_name, role, phone_no } = req.body;

      // Check if user exists
      const existingUser = await User.findByUsername(username);
      if (existingUser) {
        return res.status(409).json({ success: false, error: 'Username already exists' });
      }

      const existingEmail = await User.findByEmail(email);
      if (existingEmail) {
        return res.status(409).json({ success: false, error: 'Email already exists' });
      }

      // Set password expiration (90 days from now, if enabled)
      const passwordExpiresAt = process.env.PASSWORD_EXPIRY_DAYS 
        ? new Date(Date.now() + (parseInt(process.env.PASSWORD_EXPIRY_DAYS) * 24 * 60 * 60 * 1000))
        : null;

      // Super Admin can create any role, but restrict super role creation
      // Only existing Super Admin can create another Super Admin
      if (role === 'super' && req.user.role !== 'super') {
        return res.status(403).json({
          success: false,
          error: 'Only Super Admin can create another Super Admin'
        });
      }

      const user = await User.create({
        username,
        email,
        password,
        full_name,
        role: role || 'user',
        phone_no
      });

      // Update password expiration if set
      if (passwordExpiresAt) {
        await User.update(user.id, { 
          password_expires_at: passwordExpiresAt,
          password_changed_at: new Date()
        });
      }

      // Log the user creation
      const { logAdd } = require('../middleware/auditEnhanced');
      await logAdd(req.user.id, 'users', user.id, req, {
        action: 'user_registered',
        registered_by: req.user.username,
        new_user_role: user.role
      });

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          registered_by: req.user.username
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ success: false, error: 'Failed to register user' });
    }
  }
);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login with username and password
 *     tags: [Authentication]
 */
router.post(
  '/login',
  [
    body('username').notEmpty().withMessage('Username is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { username, password } = req.body;

      const user = await User.findByUsername(username);
      if (!user) {
        // Log for debugging (remove in production if needed)
        console.log(`Login failed: User '${username}' not found`);
        return res.status(401).json({ 
          success: false, 
          error: 'Invalid credentials',
          hint: process.env.NODE_ENV === 'development' ? 'User not found. Run: npm run create-test-user' : undefined
        });
      }

      if (!user.is_active) {
        return res.status(403).json({ success: false, error: 'Account is deactivated' });
      }

      // Check if account is locked (only if column exists)
      if (user.hasOwnProperty('locked_until') && user.locked_until && new Date() < new Date(user.locked_until)) {
        return res.status(403).json({
          success: false,
          error: `Account is locked until ${new Date(user.locked_until).toLocaleString()}`,
          hint: 'Account locked due to too many failed login attempts. Please try again later or contact administrator.'
        });
      }

      // Check if password hash exists
      if (!user.password_hash) {
        console.log(`Login failed: User '${username}' has no password hash`);
        return res.status(401).json({ 
          success: false, 
          error: 'Invalid credentials',
          hint: process.env.NODE_ENV === 'development' ? 'User has no password. Please reset password.' : undefined
        });
      }

      const isValidPassword = await User.verifyPassword(password, user.password_hash);
      if (!isValidPassword) {
        // Check if new columns exist (migration may not have been run)
        const hasNewColumns = user.hasOwnProperty('failed_login_attempts');
        
        if (hasNewColumns) {
          // Increment failed login attempts
          const failedAttempts = (user.failed_login_attempts || 0) + 1;
          const updateData = { failed_login_attempts: failedAttempts };
          
          // Lock account after 5 failed attempts for 30 minutes
          if (failedAttempts >= 5) {
            updateData.locked_until = new Date(Date.now() + 30 * 60 * 1000);
            console.log(`Account '${username}' locked due to ${failedAttempts} failed login attempts`);
          }
          
          try {
            await User.update(user.id, updateData);
            console.log(`Login failed: Invalid password for user '${username}' (attempt ${failedAttempts})`);
          } catch (error) {
            // If columns don't exist in DB, just log the error but don't fail
            console.warn('Could not update failed login attempts (columns may not exist):', error.message);
            console.log(`Login failed: Invalid password for user '${username}'`);
          }
        } else {
          console.log(`Login failed: Invalid password for user '${username}'`);
        }

        return res.status(401).json({ 
          success: false, 
          error: 'Invalid credentials'
        });
      }

      // Reset failed login attempts on successful login (if columns exist)
      if (user.hasOwnProperty('failed_login_attempts')) {
        try {
          await User.update(user.id, { 
            failed_login_attempts: 0,
            locked_until: null
          });
        } catch (error) {
          // Non-critical, just log
          console.warn('Could not reset failed login attempts:', error.message);
        }
      }

      // Update last login
      await User.updateLastLogin(user.id);

      // Generate token
      const token = generateToken(user);

      // Create session
      const ipAddress = getClientIP(req);
      const userAgent = getUserAgent(req);
      const location = req.headers['x-location'] || null;
      await createSession(user.id, token, ipAddress, userAgent, location);

      // Log login
      await logLogin(user.id, req, 'password');

      // Update user's last IP and user agent
      await User.update(user.id, {
        last_ip_address: ipAddress,
        last_user_agent: userAgent
      });

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            full_name: user.full_name,
            role: user.role,
            phone_no: user.phone_no
          }
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      console.error('Error stack:', error.stack);
      
      // Provide more detailed error information
      let errorMessage = 'Login failed';
      let errorDetails = null;

      // Database connection errors
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        errorMessage = 'Database connection failed';
        errorDetails = 'Cannot connect to database. Please check database configuration.';
      }
      // JWT errors
      else if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        errorMessage = 'Token generation failed';
        errorDetails = error.message;
      }
      // Missing environment variables
      else if (error.message && error.message.includes('JWT_SECRET')) {
        errorMessage = 'Server configuration error';
        errorDetails = 'JWT_SECRET is not configured. Please set it in .env file.';
      }
      // Other errors
      else {
        errorDetails = process.env.NODE_ENV === 'development' ? error.message : undefined;
      }

      res.status(500).json({ 
        success: false, 
        error: errorMessage,
        details: errorDetails,
        hint: process.env.NODE_ENV === 'development' ? 'Check server logs for more details' : undefined
      });
    }
  }
);

/**
 * @swagger
 * /api/auth/otp/request:
 *   post:
 *     summary: Request OTP for mobile authentication
 *     tags: [Authentication]
 */
router.post(
  '/otp/request',
  [
    body('phone_no').notEmpty().withMessage('Phone number is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { phone_no } = req.body;

      // Find user by phone number
      const query = 'SELECT * FROM users WHERE phone_no = $1';
      const pool = require('../config/database');
      const result = await pool.query(query, [phone_no]);

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'User not found with this phone number' });
      }

      const user = result.rows[0];

      if (!user.is_active) {
        return res.status(403).json({ success: false, error: 'Account is deactivated' });
      }

      // Generate and send OTP
      await OTPService.generateAndStoreOTP(user.id, phone_no);

      res.json({
        success: true,
        message: 'OTP sent to your mobile number'
      });
    } catch (error) {
      console.error('OTP request error:', error);
      res.status(500).json({ success: false, error: 'Failed to send OTP' });
    }
  }
);

/**
 * @swagger
 * /api/auth/otp/verify:
 *   post:
 *     summary: Verify OTP and login
 *     tags: [Authentication]
 */
router.post(
  '/otp/verify',
  [
    body('phone_no').notEmpty().withMessage('Phone number is required'),
    body('otp').notEmpty().withMessage('OTP is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { phone_no, otp } = req.body;

      // Find user by phone number
      const pool = require('../config/database');
      const result = await pool.query('SELECT * FROM users WHERE phone_no = $1', [phone_no]);

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      const user = result.rows[0];

      if (!user.is_active) {
        return res.status(403).json({ success: false, error: 'Account is deactivated' });
      }

      // Verify OTP
      const verification = await OTPService.verifyOTP(user.id, otp);
      if (!verification.valid) {
        return res.status(401).json({ success: false, error: verification.error });
      }

      // Clear OTP after successful verification
      await OTPService.clearOTP(user.id);

      // Update last login
      await User.updateLastLogin(user.id);

      // Generate token
      const token = generateToken(user);

      // Create session
      const ipAddress = getClientIP(req);
      const userAgent = getUserAgent(req);
      const location = req.headers['x-location'] || null;
      await createSession(user.id, token, ipAddress, userAgent, location);

      // Log login
      await logLogin(user.id, req, 'otp');

      // Update user's last IP and user agent
      await User.update(user.id, {
        last_ip_address: ipAddress,
        last_user_agent: userAgent
      });

      res.json({
        success: true,
        message: 'OTP verified successfully',
        data: {
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            full_name: user.full_name,
            role: user.role,
            phone_no: user.phone_no
          }
        }
      });
    } catch (error) {
      console.error('OTP verification error:', error);
      res.status(500).json({ success: false, error: 'OTP verification failed' });
    }
  }
);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user and invalidate session
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Logout failed
 */
router.post('/logout', authenticate, async (req, res) => {
  try {
    // Invalidate current session
    try {
      await invalidateSession(req.token);
    } catch (error) {
      // If login_sessions table doesn't exist, log warning but continue
      if (error.code === '42P01') {
        console.warn('Warning: login_sessions table not found. Session invalidation skipped.');
      } else {
        throw error;
      }
    }

    // Log logout action
    try {
      await logLogout(req.user.id, req);
    } catch (error) {
      // Non-critical, just log
      console.warn('Could not log logout action:', error.message);
    }

    res.json({
      success: true,
      message: 'Logged out successfully',
      data: {
        user_id: req.user.id,
        username: req.user.username,
        logged_out_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Logout failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @swagger
 * /api/auth/logout/all:
 *   post:
 *     summary: Logout from all devices/sessions
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out from all sessions
 */
router.post('/logout/all', authenticate, async (req, res) => {
  try {
    const pool = require('../config/database');
    
    // Invalidate all sessions for this user
    try {
      await pool.query(
        'UPDATE login_sessions SET is_active = false WHERE user_id = $1',
        [req.user.id]
      );
    } catch (error) {
      if (error.code === '42P01') {
        console.warn('Warning: login_sessions table not found. Session invalidation skipped.');
      } else {
        throw error;
      }
    }

    // Log logout from all devices
    try {
      await logLogout(req.user.id, req);
    } catch (error) {
      console.warn('Could not log logout action:', error.message);
    }

    res.json({
      success: true,
      message: 'Logged out from all devices successfully',
      data: {
        user_id: req.user.id,
        username: req.user.username,
        logged_out_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Logout all error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Logout from all devices failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user information
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    const { getActiveSessionsCount } = require('../middleware/auth');
    const activeSessions = await getActiveSessionsCount(req.user.id);

    res.json({
      success: true,
      data: {
        user: {
          id: req.user.id,
          username: req.user.username,
          email: req.user.email,
          full_name: req.user.full_name,
          role: req.user.role,
          phone_no: req.user.phone_no,
          is_active: req.user.is_active,
          last_login: req.user.last_login
        },
        active_sessions: activeSessions
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ success: false, error: 'Failed to get user information' });
  }
});

/**
 * @swagger
 * /api/auth/password/reset/request:
 *   post:
 *     summary: Request password reset (Admin/Super Admin only)
 *     tags: [Authentication]
 */
router.post(
  '/password/reset/request',
  [
    body('email').isEmail().withMessage('Valid email is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { email } = req.body;

      // Find user by email
      const user = await User.findByEmail(email);
      if (!user) {
        // Don't reveal if user exists for security
        return res.json({
          success: true,
          message: 'If the email exists, a password reset link has been sent'
        });
      }

      // Check if user is admin or super admin
      if (!['admin', 'super'].includes(user.role)) {
        return res.status(403).json({
          success: false,
          error: 'Password reset is only available for Admin and Super Admin'
        });
      }

      // Generate reset token
      const { token, expiresAt } = await PasswordResetService.createResetToken(user.id);

      // Send reset email
      await PasswordResetService.sendResetEmail(user.email, token, user.username);

      res.json({
        success: true,
        message: 'Password reset link has been sent to your email',
        // In development, return token for testing
        ...(process.env.NODE_ENV === 'development' && {
          token: token,
          expires_at: expiresAt
        })
      });
    } catch (error) {
      console.error('Password reset request error:', error);
      res.status(500).json({ success: false, error: 'Failed to process password reset request' });
    }
  }
);

/**
 * @swagger
 * /api/auth/password/reset/verify:
 *   post:
 *     summary: Verify reset token and reset password
 *     tags: [Authentication]
 */
router.post(
  '/password/reset/verify',
  [
    body('token').notEmpty().withMessage('Reset token is required'),
    body('new_password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { token, new_password } = req.body;

      // Reset password
      const result = await PasswordResetService.resetPassword(token, new_password);
      
      if (!result.success) {
        return res.status(400).json({ success: false, error: result.error });
      }

      // Get user for audit logging
      const user = await User.findById(result.userId);

      // Log password reset
      await logUpdate(
        result.userId,
        'users',
        result.userId,
        req,
        { password: '***' },
        { password: '***' }
      );

      res.json({
        success: true,
        message: 'Password has been reset successfully. Please login with your new password.'
      });
    } catch (error) {
      console.error('Password reset verify error:', error);
      res.status(500).json({ success: false, error: 'Failed to reset password' });
    }
  }
);

/**
 * @swagger
 * /api/auth/password/change:
 *   post:
 *     summary: Change password (for authenticated users)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/password/change',
  authenticate,
  [
    body('current_password').notEmpty().withMessage('Current password is required'),
    body('new_password').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { current_password, new_password } = req.body;

      // Get full user with password hash
      const user = await User.findByUsername(req.user.username);
      
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      // Verify current password
      const isValidPassword = await User.verifyPassword(current_password, user.password_hash);
      if (!isValidPassword) {
        return res.status(400).json({ success: false, error: 'Current password is incorrect' });
      }

      // Hash new password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(new_password, saltRounds);

      // Update password
      const updateData = {
        password_hash: passwordHash,
        password_changed_at: new Date()
      };

      // Set password expiration if enabled
      if (process.env.PASSWORD_EXPIRY_DAYS) {
        updateData.password_expires_at = new Date(
          Date.now() + (parseInt(process.env.PASSWORD_EXPIRY_DAYS) * 24 * 60 * 60 * 1000)
        );
      }

      await User.update(req.user.id, updateData);

      // Log password change
      await logUpdate(
        req.user.id,
        'users',
        req.user.id,
        req,
        { password: '***' },
        { password: '***' }
      );

      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      console.error('Password change error:', error);
      res.status(500).json({ success: false, error: 'Failed to change password' });
    }
  }
);

/**
 * @swagger
 * /api/auth/token/refresh:
 *   post:
 *     summary: Refresh JWT token
 *     description: Get a new access token using the current token (even if expired, within grace period)
 *     tags: [Authentication]
 *     requestBody:
 *       required: false
 *       description: Token can be provided in Authorization header or body
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *                 description: Current JWT token (optional if provided in header)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       description: New JWT access token
 *                     expires_in:
 *                       type: string
 *                       description: Token expiration time (e.g., "15m")
 *       401:
 *         description: Invalid or expired token
 */
router.post('/token/refresh', async (req, res) => {
  try {
    // Get token from header or body
    const authHeader = req.headers.authorization;
    let token = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.body.token) {
      token = req.body.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token is required. Provide it in Authorization header or request body.'
      });
    }

    // Verify token (allows expired tokens for refresh)
    const verification = verifyTokenForRefresh(token);
    
    if (!verification.decoded) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }

    const decoded = verification.decoded;

    // Get user from database
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        error: 'Account is deactivated'
      });
    }

    // Check password expiration (if enabled)
    if (user.password_expires_at && new Date() > new Date(user.password_expires_at)) {
      return res.status(403).json({
        success: false,
        error: 'Password has expired. Please reset your password.'
      });
    }

    // Check if session is still valid (if session table exists)
    try {
      const pool = require('../config/database');
      const sessionCheck = await pool.query(
        `SELECT id FROM login_sessions 
         WHERE session_token = $1 
         AND user_id = $2 
         AND is_active = true 
         AND expires_at > CURRENT_TIMESTAMP`,
        [token, user.id]
      );

      // If session doesn't exist or expired, we can still refresh if token decode was successful
      // But we'll create/update the session with the new token
    } catch (error) {
      // Session table might not exist, that's okay
      if (error.code !== '42P01') {
        console.warn('Session check error:', error.message);
      }
    }

    // Generate new token
    const newToken = generateToken(user);

    // Update or create session with new token
    const ipAddress = getClientIP(req);
    const userAgent = getUserAgent(req);
    const location = req.headers['x-location'] || null;

    try {
      const pool = require('../config/database');
      // Try to update existing session (update first active session for this user)
      const sessionToUpdate = await pool.query(
        `SELECT id FROM login_sessions 
         WHERE user_id = $1 AND is_active = true 
         ORDER BY last_activity DESC 
         LIMIT 1`,
        [user.id]
      );

      if (sessionToUpdate.rows.length > 0) {
        await pool.query(
          `UPDATE login_sessions 
           SET session_token = $1,
               last_activity = CURRENT_TIMESTAMP,
               ip_address = COALESCE($2, ip_address),
               user_agent = COALESCE($3, user_agent),
               expires_at = CURRENT_TIMESTAMP + INTERVAL '7 days'
           WHERE id = $4`,
          [newToken, ipAddress, userAgent, sessionToUpdate.rows[0].id]
        );
      } else {
        // If no active session found, create new session
        await createSession(user.id, newToken, ipAddress, userAgent, location);
      }
    } catch (error) {
      // If session table doesn't exist, continue without session tracking
      if (error.code === '42P01') {
        console.warn('Warning: login_sessions table not found. Session tracking skipped.');
      } else {
        console.warn('Session update error:', error.message);
      }
    }

    // Log token refresh (optional audit)
    try {
      await logUpdate(
        user.id,
        'users',
        user.id,
        req,
        { token: '***' },
        { token: '***' }
      );
    } catch (error) {
      // Non-critical, just log
      console.warn('Could not log token refresh:', error.message);
    }

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        token: newToken,
        expires_in: process.env.JWT_EXPIRES_IN || '15m',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          full_name: user.full_name,
          role: user.role
        }
      }
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to refresh token'
    });
  }
});

module.exports = router;

