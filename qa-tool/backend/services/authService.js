// ── Auth Service — JWT signing & verification ────────────────────────────────
const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'dev-secret-CHANGE-IN-PRODUCTION-via-env';
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

function sign(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role, name: user.name },
    SECRET,
    { expiresIn: EXPIRES_IN }
  );
}

function verify(token) {
  try { return jwt.verify(token, SECRET); }
  catch { return null; }
}

module.exports = { sign, verify };
