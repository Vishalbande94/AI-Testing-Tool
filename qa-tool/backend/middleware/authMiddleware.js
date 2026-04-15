// ── Auth middleware — extracts JWT from Authorization header ────────────────
const authService = require('../services/authService');
const userStore   = require('../services/userStore');

// Attaches req.user if a valid token is present. Does NOT reject.
function attachUser(req, res, next) {
  const header = req.headers.authorization || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (token) {
    const payload = authService.verify(token);
    if (payload?.sub) {
      const user = userStore.getById(payload.sub);
      if (user) req.user = user;
    }
  }
  next();
}

// Requires an authenticated user or returns 401.
function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Authentication required' });
  next();
}

// Requires a specific role or returns 403.
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Insufficient permissions' });
    next();
  };
}

module.exports = { attachUser, requireAuth, requireRole };
