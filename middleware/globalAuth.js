/**
 * Global Authentication Middleware
 * Protects all routes except public authentication endpoints
 */

const { authenticate } = require('./auth');

// Public endpoints that don't require authentication
const PUBLIC_PATHS = [
  '/health',
  '/',
  '/api-docs',
  '/api/auth/login',
  '/api/auth/otp/request',
  '/api/auth/otp/verify',
  '/api/auth/token/refresh',
  '/api/auth/password/reset/request',
  '/api/auth/password/reset/verify'
];

/**
 * Check if a path is public (doesn't require authentication)
 */
function isPublicPath(path) {
  // Exact match
  if (PUBLIC_PATHS.includes(path)) {
    return true;
  }
  
  // Check if path starts with any public path (for sub-routes)
  return PUBLIC_PATHS.some(publicPath => path.startsWith(publicPath));
}

/**
 * Global authentication middleware
 * Requires authentication for all routes except public endpoints
 */
function globalAuth(req, res, next) {
  // Skip authentication for public paths
  if (isPublicPath(req.path)) {
    return next();
  }

  // Apply authentication for all other routes
  authenticate(req, res, next);
}

module.exports = globalAuth;

