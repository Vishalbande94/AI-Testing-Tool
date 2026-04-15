// ── Admin routes — requires role=admin ───────────────────────────────────────
const express     = require('express');
const path        = require('path');
const fs          = require('fs');
const userStore   = require('../services/userStore');
const activityLog = require('../services/activityLog');
const historyStore = require('../services/historyStore');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

// All /admin routes require an authenticated admin
router.use('/admin', requireAuth, requireRole('admin'));

// GET /api/admin/users — list all users
router.get('/admin/users', (req, res) => {
  const users = userStore.listAllPublic();
  const { entries: activity } = activityLog.getAll({ limit: 500 });
  // Attach last-seen / activity counts per user
  const userActivityMap = {};
  for (const e of activity) {
    if (!userActivityMap[e.userId]) userActivityMap[e.userId] = { lastSeen: null, count: 0, lastAction: null };
    const entry = userActivityMap[e.userId];
    entry.count += 1;
    if (!entry.lastSeen || new Date(e.timestamp) > new Date(entry.lastSeen)) {
      entry.lastSeen = e.timestamp;
      entry.lastAction = e.action;
    }
  }
  const enriched = users.map(u => ({
    ...u,
    activityCount: userActivityMap[u.id]?.count || 0,
    lastSeen:      userActivityMap[u.id]?.lastSeen || null,
    lastAction:    userActivityMap[u.id]?.lastAction || null,
  }));
  res.json({ users: enriched, total: enriched.length });
});

// GET /api/admin/users/:id — single user detail + their activity + their runs
router.get('/admin/users/:id', (req, res) => {
  const user = userStore.getById(req.params.id);
  if (!user) return res.status(404).json({ error: 'user not found' });
  const { entries: activity } = activityLog.getAll({ userId: req.params.id, limit: 50 });
  res.json({ user, activity });
});

// POST /api/admin/users/:id/role — promote/demote
router.post('/admin/users/:id/role', express.json(), (req, res) => {
  try {
    const { role } = req.body || {};
    const updated = userStore.updateRole(req.params.id, role);
    activityLog.log({
      userId: req.user.id, userEmail: req.user.email,
      action: 'admin.user.role_changed', resource: `user:${req.params.id}`,
      metadata: { newRole: role, targetEmail: updated.email }, ip: req.ip,
    });
    res.json({ user: updated });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// DELETE /api/admin/users/:id
router.delete('/admin/users/:id', (req, res) => {
  try {
    const removed = userStore.deleteUser(req.params.id);
    activityLog.log({
      userId: req.user.id, userEmail: req.user.email,
      action: 'admin.user.deleted', resource: `user:${req.params.id}`,
      metadata: { targetEmail: removed.email }, ip: req.ip,
    });
    res.json({ ok: true, removed });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// GET /api/admin/activity — global activity feed
router.get('/admin/activity', (req, res) => {
  const { action, userId, limit = 100, offset = 0 } = req.query;
  res.json(activityLog.getAll({
    action, userId,
    limit: parseInt(limit, 10),
    offset: parseInt(offset, 10),
  }));
});

// GET /api/admin/stats — system/usage stats for the dashboard
router.get('/admin/stats', (req, res) => {
  const users = userStore.listAllPublic();
  const actStats = activityLog.stats();
  const runs = historyStore.getHistory();

  const reportsDir = path.join(__dirname, '../reports');
  let reportsSize = 0;
  try {
    const getSize = (p) => {
      const s = fs.statSync(p);
      if (s.isFile()) return s.size;
      if (s.isDirectory()) {
        return fs.readdirSync(p).reduce((t, f) => t + getSize(path.join(p, f)), 0);
      }
      return 0;
    };
    if (fs.existsSync(reportsDir)) reportsSize = getSize(reportsDir);
  } catch {}

  res.json({
    server: {
      uptime:  process.uptime(),
      memory:  process.memoryUsage(),
      nodeVersion: process.version,
      platform: process.platform,
    },
    users: {
      total: users.length,
      admins: users.filter(u => u.role === 'admin').length,
      regular: users.filter(u => u.role === 'user').length,
    },
    activity: actStats,
    testing: {
      totalRuns: runs.length,
      totalTestCases: runs.reduce((s, r) => s + (r.total || 0), 0),
      totalPassed:    runs.reduce((s, r) => s + (r.passed || 0), 0),
      totalFailed:    runs.reduce((s, r) => s + (r.failed || 0), 0),
    },
    storage: {
      reportsDirBytes: reportsSize,
      reportsDirMB: Math.round(reportsSize / 1024 / 1024 * 100) / 100,
    },
  });
});

module.exports = router;
