const jwt = require('jsonwebtoken');

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

function optionalAuth(req, _res, next) {
  try {
    const token = extractBearerToken(req);
    if (!token) return next();
    const payload = jwt.verify(token, getJwtSecret());
    req.user = {
      id: payload.sub,
      role: payload.role,
      email: payload.email,
      fullName: payload.fullName,
    };
    next();
  } catch (_err) {
    next();
  }
}

function requireAuth(req, res, next) {
  try {
    const token = extractBearerToken(req);
    if (!token) return res.status(401).json({ message: 'Unauthorized' });
    const payload = jwt.verify(token, getJwtSecret());
    req.user = {
      id: payload.sub,
      role: payload.role,
      email: payload.email,
      fullName: payload.fullName,
    };
    next();
  } catch (_err) {
    res.status(401).json({ message: 'Unauthorized' });
  }
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

