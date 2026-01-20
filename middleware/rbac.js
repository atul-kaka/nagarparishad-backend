/**
 * Role-Based Access Control (RBAC) Middleware
 * Enforces permissions based on user roles
 */

/**
 * Role definitions:
 * - user: Read-only access, can only view accepted documents
 * - admin: Read and write access, can add/view/search
 * - super: Read-only + approval access, can review (accept/reject), view, search
 */

/**
 * Check if user has required role
 */
function hasRole(user, requiredRoles) {
  if (!user || !user.role) return false;
  if (Array.isArray(requiredRoles)) {
    return requiredRoles.includes(user.role);
  }
  return user.role === requiredRoles;
}

/**
 * Check if user can edit based on document status
 */
function canEdit(status) {
  // Can edit: new, in_review, rejected
  // Cannot edit: accepted
  return ['new', 'in_review', 'rejected', 'draft'].includes(status);
}

/**
 * Check if user can view document based on role and status
 */
function canView(userRole, status) {
  if (userRole === 'user') {
    // Users can only view accepted documents
    return status === 'accepted';
  }
  // Admin and Super can view all documents
  return true;
}

/**
 * Require specific role(s)
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (!hasRole(req.user, roles)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Required role: ${roles.join(' or ')}`
      });
    }

    next();
  };
}

/**
 * Require admin or super role
 */
function requireAdmin(req, res, next) {
  return requireRole('admin', 'super')(req, res, next);
}

/**
 * Require super role only
 */
function requireSuper(req, res, next) {
  return requireRole('super')(req, res, next);
}

/**
 * Check if user can edit the document
 */
function canEditDocument(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  // Super and Admin can always edit (except accepted documents)
  if (['admin', 'super'].includes(req.user.role)) {
    // Check if document status allows editing
    const status = req.body.status || req.query.status || req.params.status;
    
    if (status === 'accepted' && req.user.role !== 'super') {
      return res.status(403).json({
        success: false,
        error: 'Cannot edit accepted documents. Only Super Admin can modify accepted documents.'
      });
    }
    
    return next();
  }

  // Regular users cannot edit
  return res.status(403).json({
    success: false,
    error: 'You do not have permission to edit documents'
  });
}

/**
 * Check if user can view the document
 */
function canViewDocument(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  // Admin and Super can view all
  if (['admin', 'super'].includes(req.user.role)) {
    return next();
  }

  // For user role, we need to check document status in the route handler
  // This middleware just ensures they're authenticated
  next();
}

/**
 * Filter documents based on user role
 * Call this in route handlers to filter results
 */
function filterByRole(documents, userRole) {
  if (userRole === 'user') {
    // Users can only see accepted documents
    return documents.filter(doc => doc.status === 'accepted');
  }
  // Admin and Super see all
  return documents;
}

/**
 * Check if user can approve/reject documents
 */
function canApproveReject(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  if (req.user.role !== 'super') {
    return res.status(403).json({
      success: false,
      error: 'Only Super Admin can approve or reject documents'
    });
  }

  next();
}

/**
 * Check if user can add documents
 */
function canAddDocument(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  if (!['admin', 'super'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      error: 'Only Admin and Super Admin can add documents'
    });
  }

  next();
}

module.exports = {
  requireRole,
  requireAdmin,
  requireSuper,
  canEditDocument,
  canViewDocument,
  canApproveReject,
  canAddDocument,
  filterByRole,
  hasRole,
  canEdit,
  canView
};

