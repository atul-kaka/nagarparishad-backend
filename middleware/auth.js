/**
 * Authentication Middleware
 * Handles JWT-based authentication and OTP verification
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const pool = require('../config/database');

// Get JWT secret from environment (default for development)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m'; // 15 minutes
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d'; // 7 days for refresh grace period

/**
 * Generate JWT token for authenticated user
 */
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
      email: user.email
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * Verify JWT token
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Verify JWT token (allows expired tokens for refresh)
 * Returns decoded token even if expired, with error info
 */
function verifyTokenForRefresh(token) {
  try {
    return { valid: true, decoded: jwt.verify(token, JWT_SECRET), error: null };
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      // Token is expired but we can decode it for refresh
      try {
        const decoded = jwt.decode(token);
        return { valid: false, decoded, error: 'expired' };
      } catch (decodeError) {
        return { valid: false, decoded: null, error: 'invalid' };
      }
    }
    return { valid: false, decoded: null, error: 'invalid' };
  }
}

/**
 * Extract token from Authorization header
 */
function extractToken(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

/**
 * Get client IP address
 */
function getClientIP(req) {
  return req.ip || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
         'unknown';
}

/**
 * Get user agent
 */
function getUserAgent(req) {
  return req.headers['user-agent'] || 'unknown';
}

/**
 * Main authentication middleware
 * Verifies JWT token and attaches user to request
 */
async function authenticate(req, res, next) {
  try {
    const token = extractToken(req);
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. Please provide a valid token.'
      });
    }

    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }

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

    // Attach user to request
    req.user = user;
    req.token = token;
    
    // Update session activity
    await updateSessionActivity(token, getClientIP(req), getUserAgent(req));
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
}

/**
 * Update session activity timestamp
 */
async function updateSessionActivity(token, ipAddress, userAgent) {
  try {
    await pool.query(
      `UPDATE login_sessions 
       SET last_activity = CURRENT_TIMESTAMP,
           ip_address = COALESCE($1, ip_address),
           user_agent = COALESCE($2, user_agent)
       WHERE session_token = $3 AND is_active = true`,
      [ipAddress, userAgent, token]
    );
  } catch (error) {
    // Silently fail - session update is not critical
    console.error('Session update error:', error);
  }
}

/**
 * Optional authentication - doesn't fail if no token
 * Useful for endpoints that work with or without auth
 */
async function optionalAuthenticate(req, res, next) {
  try {
    const token = extractToken(req);
    
    if (token) {
      const decoded = verifyToken(token);
      if (decoded) {
        const user = await User.findById(decoded.id);
        if (user && user.is_active) {
          req.user = user;
          req.token = token;
        }
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
}

/**
 * Create login session
 */
async function createSession(userId, token, ipAddress, userAgent, location = null) {
  try {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour session

    await pool.query(
      `INSERT INTO login_sessions (user_id, session_token, ip_address, user_agent, location, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, token, ipAddress, userAgent, location, expiresAt]
    );
  } catch (error) {
    // If login_sessions table doesn't exist, log warning but don't fail login
    if (error.code === '42P01') { // Table doesn't exist
      console.warn('Warning: login_sessions table not found. Run migration: npm run migrate-rbac');
      // Continue without session tracking
    } else {
      throw error; // Re-throw other errors
    }
  }
}

/**
 * Invalidate session
 */
async function invalidateSession(token) {
  try {
    await pool.query(
      'UPDATE login_sessions SET is_active = false WHERE session_token = $1',
      [token]
    );
  } catch (error) {
    // If table doesn't exist, that's okay
    if (error.code === '42P01') {
      return; // Silently return
    }
    throw error;
  }
}

/**
 * Invalidate all sessions for a user
 */
async function invalidateAllSessions(userId) {
  try {
    await pool.query(
      'UPDATE login_sessions SET is_active = false WHERE user_id = $1',
      [userId]
    );
  } catch (error) {
    if (error.code === '42P01') {
      return; // Silently return if table doesn't exist
    }
    throw error;
  }
}

/**
 * Get active sessions count for a user
 */
async function getActiveSessionsCount(userId) {
  const result = await pool.query(
    `SELECT COUNT(*) as count 
     FROM login_sessions 
     WHERE user_id = $1 AND is_active = true AND expires_at > CURRENT_TIMESTAMP`,
    [userId]
  );
  return parseInt(result.rows[0].count);
}

module.exports = {
  authenticate,
  optionalAuthenticate,
  generateToken,
  verifyToken,
  verifyTokenForRefresh,
  createSession,
  invalidateSession,
  invalidateAllSessions,
  getActiveSessionsCount,
  getClientIP,
  getUserAgent,
  JWT_EXPIRES_IN
};

