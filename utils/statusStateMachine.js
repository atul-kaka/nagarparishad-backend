/**
 * Status State Machine for Certificate/Student Records
 * Enforces proper state transitions
 */

const VALID_STATUSES = ['draft', 'in_review', 'rejected', 'accepted', 'issued', 'archived', 'cancelled'];

// Valid state transitions
const VALID_TRANSITIONS = {
  draft: ['in_review', 'cancelled'],
  in_review: ['rejected', 'accepted', 'cancelled'],
  rejected: ['in_review', 'cancelled'],
  accepted: ['issued', 'archived'],
  issued: ['archived'],
  archived: [], // Final state
  cancelled: [] // Final state
};

/**
 * Check if a status transition is valid
 * @param {string} currentStatus - Current status
 * @param {string} newStatus - Desired new status
 * @returns {object} { valid: boolean, error?: string }
 */
function validateTransition(currentStatus, newStatus) {
  // Check if statuses are valid
  if (!VALID_STATUSES.includes(currentStatus)) {
    return {
      valid: false,
      error: `Invalid current status: ${currentStatus}. Valid statuses are: ${VALID_STATUSES.join(', ')}`
    };
  }

  if (!VALID_STATUSES.includes(newStatus)) {
    return {
      valid: false,
      error: `Invalid new status: ${newStatus}. Valid statuses are: ${VALID_STATUSES.join(', ')}`
    };
  }

  // Same status is always valid (no-op)
  if (currentStatus === newStatus) {
    return { valid: true };
  }

  // Check if transition is allowed
  const allowedTransitions = VALID_TRANSITIONS[currentStatus];
  if (!allowedTransitions.includes(newStatus)) {
    return {
      valid: false,
      error: `Cannot transition from "${currentStatus}" to "${newStatus}". ` +
             `Valid transitions from "${currentStatus}" are: ${allowedTransitions.length > 0 ? allowedTransitions.join(', ') : 'none (final state)'}`
    };
  }

  return { valid: true };
}

/**
 * Get allowed transitions for a given status
 * @param {string} status - Current status
 * @returns {string[]} Array of allowed next statuses
 */
function getAllowedTransitions(status) {
  return VALID_TRANSITIONS[status] || [];
}

/**
 * Check if a status is a final state (cannot be changed)
 * @param {string} status - Status to check
 * @returns {boolean}
 */
function isFinalState(status) {
  return ['archived', 'cancelled'].includes(status);
}

/**
 * Check if a status can be edited
 * @param {string} status - Status to check
 * @returns {boolean}
 */
function canEdit(status) {
  // Only draft, in_review, and rejected can be edited
  return ['draft', 'in_review', 'rejected'].includes(status);
}

/**
 * Check if a status requires review
 * @param {string} status - Status to check
 * @returns {boolean}
 */
function requiresReview(status) {
  return status === 'in_review';
}

/**
 * Check if a status is approved/accepted
 * @param {string} status - Status to check
 * @returns {boolean}
 */
function isApproved(status) {
  return ['accepted', 'issued'].includes(status);
}

module.exports = {
  validateTransition,
  getAllowedTransitions,
  isFinalState,
  canEdit,
  requiresReview,
  isApproved,
  VALID_STATUSES,
  VALID_TRANSITIONS
};




