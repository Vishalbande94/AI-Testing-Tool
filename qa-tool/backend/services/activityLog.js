// ── Activity Log — append-only JSON store ───────────────────────────────────
// Records auditable events (logins, signups, test runs, config changes).
const fs   = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, '../reports/activity-log.json');
const MAX_ENTRIES = 5000;

function load() {
  try {
    if (fs.existsSync(LOG_FILE)) return JSON.parse(fs.readFileSync(LOG_FILE, 'utf-8'));
  } catch {}
  return [];
}

function saveAll(entries) {
  try {
    fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
    const tmp = LOG_FILE + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(entries, null, 2));
    fs.renameSync(tmp, LOG_FILE);
  } catch {}
}

/**
 * Log an event.
 * @param {object} event
 * @param {string} event.userId     - user performing the action (or 'anon')
 * @param {string} event.userEmail  - email for display
 * @param {string} event.action     - e.g. 'login', 'signup', 'test.run', 'notification.set'
 * @param {string} event.resource   - e.g. 'user:abc', 'run:xyz'
 * @param {string} event.status     - 'success' | 'failure'
 * @param {object} event.metadata   - any additional context
 * @param {string} event.ip         - client IP
 */
function log(event) {
  const entry = {
    id:        `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    userId:    event.userId    || 'anon',
    userEmail: event.userEmail || null,
    action:    event.action,
    resource:  event.resource  || null,
    status:    event.status    || 'success',
    metadata:  event.metadata  || {},
    ip:        event.ip        || null,
  };
  const entries = load();
  entries.unshift(entry);
  // Keep only the most recent MAX_ENTRIES
  if (entries.length > MAX_ENTRIES) entries.length = MAX_ENTRIES;
  saveAll(entries);
  return entry;
}

function getAll({ userId, action, limit = 100, offset = 0 } = {}) {
  let entries = load();
  if (userId) entries = entries.filter(e => e.userId === userId);
  if (action) entries = entries.filter(e => e.action === action);
  const total = entries.length;
  const page = entries.slice(offset, offset + Math.min(limit, 500));
  return { entries: page, total, limit, offset };
}

function count() { return load().length; }

function stats() {
  const entries = load();
  const byAction = {};
  const byUser   = {};
  const byStatus = { success: 0, failure: 0 };
  const now = Date.now();
  let last24h = 0;
  let last7d = 0;

  for (const e of entries) {
    byAction[e.action] = (byAction[e.action] || 0) + 1;
    byUser[e.userEmail || e.userId] = (byUser[e.userEmail || e.userId] || 0) + 1;
    byStatus[e.status] = (byStatus[e.status] || 0) + 1;
    const age = now - new Date(e.timestamp).getTime();
    if (age < 86400000)     last24h++;
    if (age < 7 * 86400000) last7d++;
  }

  return { total: entries.length, last24h, last7d, byAction, byUser, byStatus };
}

module.exports = { log, getAll, count, stats };
