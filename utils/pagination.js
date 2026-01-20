/**
 * Pagination Utility
 * Helper functions for paginating database queries
 */

/**
 * Parse pagination parameters from request query
 */
function parsePagination(req) {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10)); // Max 100 per page
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

/**
 * Create pagination metadata
 */
function createPaginationMeta(page, limit, total) {
  const totalPages = Math.ceil(total / limit);
  
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1
  };
}

/**
 * Format paginated response
 */
function formatPaginatedResponse(data, paginationMeta) {
  return {
    success: true,
    data,
    pagination: paginationMeta
  };
}

module.exports = {
  parsePagination,
  createPaginationMeta,
  formatPaginatedResponse
};

