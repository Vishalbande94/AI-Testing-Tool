// ── Auth routes — signup, login, me ─────────────────────────────────────────
const express = require('express');
const userStore = require('../services/userStore');
const authService = require('../services/authService');
const activityLog = require('../services/activityLog');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

// POST /api/auth/signup
router.post('/auth/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'email and password are required' });

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'invalid email format' });
    }

    const user = await userStore.createUser({ email, password, name });
    const token = authService.sign(user);
    activityLog.log({
      userId: user.id, userEmail: user.email,
      action: 'auth.signup', resource: `user:${user.id}`,
      status: 'success', metadata: { role: user.role }, ip: req.ip,
    });
    res.status(201).json({ user, token });
  } catch (err) {
    activityLog.log({
      action: 'auth.signup', status: 'failure',
      metadata: { email: req.body?.email, error: err.message }, ip: req.ip,
    });
    res.status(400).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post('/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password are required' });

  const user = await userStore.authenticate(email, password);
  if (!user) {
    activityLog.log({
      action: 'auth.login', status: 'failure',
      metadata: { email, reason: 'invalid credentials' }, ip: req.ip,
    });
    return res.status(401).json({ error: 'invalid credentials' });
  }

  const token = authService.sign(user);
  activityLog.log({
    userId: user.id, userEmail: user.email,
    action: 'auth.login', resource: `user:${user.id}`,
    status: 'success', metadata: { role: user.role }, ip: req.ip,
  });
  res.json({ user, token });
});

// GET /api/auth/me — current user
router.get('/auth/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// GET /api/auth/status — whether any user exists (for first-run setup)
router.get('/auth/status', (req, res) => {
  res.json({ userCount: userStore.count() });
});

// POST /api/auth/change-password
router.post('/auth/change-password', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    await userStore.changePassword(req.user.id, currentPassword, newPassword);
    activityLog.log({
      userId: req.user.id, userEmail: req.user.email,
      action: 'auth.password_changed', resource: `user:${req.user.id}`,
      status: 'success', ip: req.ip,
    });
    res.json({ ok: true });
  } catch (err) {
    activityLog.log({
      userId: req.user?.id, userEmail: req.user?.email,
      action: 'auth.password_changed', status: 'failure',
      metadata: { error: err.message }, ip: req.ip,
    });
    res.status(400).json({ error: err.message });
  }
});

// POST /api/auth/preferences — update user preferences
router.post('/auth/preferences', requireAuth, (req, res) => {
  try {
    const prefs = userStore.setPreferences(req.user.id, req.body || {});
    res.json({ preferences: prefs });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ── Test cleanup endpoint ──────────────────────────────────────────────────
// Removes users whose email matches e2e-test prefixes. Never deletes admins.
// Gated to loopback IPs only (localhost) so external clients can't abuse it.
router.post('/auth/test-cleanup', (req, res) => {
  const ip = req.ip || req.socket?.remoteAddress || '';
  const isLoopback = ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
  if (!isLoopback) {
    return res.status(403).json({ error: 'cleanup only allowed from loopback' });
  }
  try {
    const patterns = [
      /^test_\d+_[a-z0-9]+@example\.com$/i,
      /^sec_\d+@example\.com$/i,
      /^journey_\d+@example\.com$/i,
      /^unicode_\d+@example\.com$/i,
      /^special_\d+@example\.com$/i,
      /^concurrent_\d+_\d+@example\.com$/i,
      /^race_\d+@example\.com$/i,
      /^xss_\d+@example\.com$/i,
      /^bad_\d+@test\.com$/i,
      /^admin_\d+@example\.com$/i,
      /^user_\d+@example\.com$/i,
      /^a{50,}@example\.com$/i,
    ];
    let total = 0;
    for (const p of patterns) total += userStore.bulkDeleteByEmailPattern(p);
    res.json({ ok: true, removed: total });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
