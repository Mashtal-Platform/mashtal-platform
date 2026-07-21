const jwt = require('jsonwebtoken');
const { getCanonicalAdminId } = require('../utils/publicAdminIdentity');

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not set');
  }
  return secret;
}

function extractBearerToken(req) {
  const raw = req.header('Authorization') || req.header('authorization');
  if (!raw) return null;
  const [scheme, token] = raw.split(' ');
  if (!scheme || scheme.toLowerCase() !== 'bearer') return null;
  return token || null;
}

async function attachUserFromPayload(payload) {
  let id = payload.sub;
  let operatorId = payload.operatorId || null;
  let operatorEmail = payload.operatorEmail || null;
  let operatorName = payload.operatorName || null;
  let fullName = payload.fullName;
  let email = payload.email;

  // Every admin session acts as the shared canonical account
  if (payload.role === 'admin') {
    const canonicalId = await getCanonicalAdminId();
    if (canonicalId) {
      operatorId = payload.operatorId || payload.sub;
      operatorEmail = payload.operatorEmail || payload.email || null;
      operatorName = payload.operatorName || payload.fullName || 'Admin';
      id = canonicalId;
      fullName = 'Mashtal Support';
    }
  }

  return {
    id,
    role: payload.role,
    email,
    fullName,
    operatorId,
    operatorEmail,
    operatorName,
  };
}

function optionalAuth(req, _res, next) {
  (async () => {
    try {
      const token = extractBearerToken(req);
      if (!token) return next();
      const payload = jwt.verify(token, getJwtSecret());
      req.user = await attachUserFromPayload(payload);
      next();
    } catch (_err) {
      next();
    }
  })();
}

function requireAuth(req, res, next) {
  (async () => {
    try {
      const token = extractBearerToken(req);
      if (!token) return res.status(401).json({ message: 'Unauthorized' });
      const payload = jwt.verify(token, getJwtSecret());
      req.user = await attachUserFromPayload(payload);
      next();
    } catch (_err) {
      res.status(401).json({ message: 'Unauthorized' });
    }
  })();
}

function requireRole(roles) {
  const allowed = Array.isArray(roles) ? roles : [roles];
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    if (!allowed.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
}

module.exports = {
  optionalAuth,
  requireAuth,
  requireRole,
};
