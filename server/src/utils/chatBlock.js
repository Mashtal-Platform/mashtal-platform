const User = require('../models/User');

const PEER_ROLES = new Set(['visitor', 'business']);

async function areUsersBlocked(userIdA, userIdB) {
  const a = String(userIdA);
  const b = String(userIdB);
  if (a === b) return false;

  const [userA, userB] = await Promise.all([
    User.findById(a).select('blockedUsers role').lean(),
    User.findById(b).select('blockedUsers role').lean(),
  ]);

  // Admin cannot be blocked by others — only an admin's own block list applies.
  if (userA?.role === 'admin' || userB?.role === 'admin') {
    if (userA?.role === 'admin') {
      return (userA.blockedUsers || []).some((id) => String(id) === b);
    }
    return (userB.blockedUsers || []).some((id) => String(id) === a);
  }

  const aBlocked = (userA?.blockedUsers || []).map((id) => String(id));
  const bBlocked = (userB?.blockedUsers || []).map((id) => String(id));
  return aBlocked.includes(b) || bBlocked.includes(a);
}

/**
 * Who may block whom:
 * - Nobody can block an admin
 * - Admin can block anyone
 * - Visitors/businesses can block each other
 */
function canBlockTarget(blockerRole, targetRole) {
  if (!blockerRole || !targetRole) return false;
  if (targetRole === 'admin') return false;
  if (blockerRole === 'admin') return true;
  return PEER_ROLES.has(blockerRole) && PEER_ROLES.has(targetRole);
}

module.exports = { areUsersBlocked, canBlockTarget };
