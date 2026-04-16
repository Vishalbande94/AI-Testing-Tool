// ── User Store — JSON-file backed user registry ─────────────────────────────
// Stores users with bcrypt-hashed passwords. Per-user encrypted secrets
// (Claude API key, JIRA creds) live in `secrets`.
const fs     = require('fs');
const path   = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const USERS_FILE = path.join(__dirname, '../reports/users.json');
const BCRYPT_ROUNDS = 10;

// ── AES-256-GCM encryption for secrets ──────────────────────────────────────
const ENCRYPTION_KEY = deriveKey(process.env.APP_SECRET || 'default-dev-secret-change-in-production');

function deriveKey(secret) {
  return crypto.createHash('sha256').update(String(secret)).digest();
}
function encrypt(plaintext) {
  if (!plaintext) return '';
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
  const enc = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('base64')}:${tag.toString('base64')}:${enc.toString('base64')}`;
}
function decrypt(token) {
  if (!token) return '';
  try {
    const [ivB64, tagB64, encB64] = token.split(':');
    const iv  = Buffer.from(ivB64,  'base64');
    const tag = Buffer.from(tagB64, 'base64');
    const enc = Buffer.from(encB64, 'base64');
    const decipher = crypto.createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
  } catch { return ''; }
}

// ── Persistence ─────────────────────────────────────────────────────────────
function loadAll() {
  try {
    if (fs.existsSync(USERS_FILE)) return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
  } catch {}
  return [];
}
function saveAll(users) {
  fs.mkdirSync(path.dirname(USERS_FILE), { recursive: true });
  const tmp = USERS_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(users, null, 2));
  fs.renameSync(tmp, USERS_FILE);
}

// ── Public API ──────────────────────────────────────────────────────────────
async function createUser({ email, password, name, role = 'user' }) {
  if (!email || !password) throw new Error('email and password are required');
  if (password.length < 8) throw new Error('password must be at least 8 characters');
  const users = loadAll();
  const normEmail = String(email).toLowerCase().trim();
  if (users.some(u => u.email === normEmail)) throw new Error('email already registered');

  const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const user = {
    id:        crypto.randomUUID(),
    email:     normEmail,
    name:      name || normEmail.split('@')[0],
    role:      users.length === 0 ? 'admin' : role, // first user = admin
    passwordHash: hash,
    secrets:   {}, // { claudeKey: "enc:...", jiraUrl: "enc:...", ... }
    preferences: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  users.push(user);
  saveAll(users);
  return publicUser(user);
}

async function authenticate(email, password) {
  const users = loadAll();
  const u = users.find(x => x.email === String(email).toLowerCase().trim());
  if (!u) return null;
  const ok = await bcrypt.compare(password, u.passwordHash);
  return ok ? publicUser(u) : null;
}

async function changePassword(userId, currentPassword, newPassword) {
  if (!currentPassword || !newPassword) throw new Error('currentPassword and newPassword are required');
  if (newPassword.length < 8) throw new Error('new password must be at least 8 characters');
  const users = loadAll();
  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) throw new Error('user not found');
  const ok = await bcrypt.compare(currentPassword, users[idx].passwordHash);
  if (!ok) throw new Error('current password is incorrect');
  users[idx].passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  users[idx].updatedAt = new Date().toISOString();
  saveAll(users);
  return publicUser(users[idx]);
}

function getById(id) {
  const users = loadAll();
  const u = users.find(x => x.id === id);
  return u ? publicUser(u) : null;
}

function publicUser(u) {
  const { passwordHash, secrets, ...rest } = u;
  return rest;
}

// ── Per-user encrypted secrets ──────────────────────────────────────────────
function setSecret(userId, key, value) {
  const users = loadAll();
  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) throw new Error('user not found');
  users[idx].secrets = users[idx].secrets || {};
  users[idx].secrets[key] = encrypt(value);
  users[idx].updatedAt = new Date().toISOString();
  saveAll(users);
}
function getSecret(userId, key) {
  const users = loadAll();
  const u = users.find(x => x.id === userId);
  return u?.secrets?.[key] ? decrypt(u.secrets[key]) : null;
}
function deleteSecret(userId, key) {
  const users = loadAll();
  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) return;
  if (users[idx].secrets) delete users[idx].secrets[key];
  saveAll(users);
}

// ── Preferences (non-sensitive) ─────────────────────────────────────────────
function setPreferences(userId, prefs) {
  const users = loadAll();
  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) throw new Error('user not found');
  users[idx].preferences = { ...(users[idx].preferences || {}), ...prefs };
  users[idx].updatedAt = new Date().toISOString();
  saveAll(users);
  return users[idx].preferences;
}

function count() { return loadAll().length; }

// ── Bulk delete users matching a pattern (never deletes admins) ────────────
// Used by e2e test cleanup. The HTTP endpoint gates access to loopback IPs.
function bulkDeleteByEmailPattern(pattern) {
  const re = pattern instanceof RegExp ? pattern : new RegExp(pattern);
  const users = loadAll();
  const remaining = users.filter(u => !re.test(u.email) || u.role === 'admin');
  saveAll(remaining);
  return users.length - remaining.length;
}

// ── Admin helpers ───────────────────────────────────────────────────────────
function listAllPublic() {
  return loadAll().map(publicUser);
}

function updateRole(id, role) {
  if (!['admin', 'user'].includes(role)) throw new Error('invalid role');
  const users = loadAll();
  const idx = users.findIndex(u => u.id === id);
  if (idx === -1) throw new Error('user not found');
  users[idx].role = role;
  users[idx].updatedAt = new Date().toISOString();
  saveAll(users);
  return publicUser(users[idx]);
}

function deleteUser(id) {
  const users = loadAll();
  const idx = users.findIndex(u => u.id === id);
  if (idx === -1) throw new Error('user not found');
  // Never allow deleting the last admin
  const isLastAdmin = users[idx].role === 'admin' && users.filter(u => u.role === 'admin').length === 1;
  if (isLastAdmin) throw new Error('cannot delete the last admin');
  const removed = users.splice(idx, 1)[0];
  saveAll(users);
  return publicUser(removed);
}

module.exports = {
  createUser, authenticate, changePassword, getById,
  setSecret, getSecret, deleteSecret,
  setPreferences, count, listAllPublic, updateRole, deleteUser,
  bulkDeleteByEmailPattern,
};
