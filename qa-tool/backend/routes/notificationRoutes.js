// ── Notification routes — configure + test webhooks ────────────────────────
const express = require('express');
const userStore = require('../services/userStore');
const notificationService = require('../services/notificationService');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/notifications — list configured destinations (redacted URLs)
router.get('/notifications', requireAuth, (req, res) => {
  const keys = ['slackWebhookUrl', 'teamsWebhookUrl', 'webhookUrl'];
  const out = {};
  for (const k of keys) {
    const v = userStore.getSecret(req.user.id, k);
    out[k] = v ? redact(v) : null;
  }
  res.json(out);
});

// POST /api/notifications — set a destination
router.post('/notifications', requireAuth, (req, res) => {
  const { kind, url } = req.body || {};
  const keyMap = { slack: 'slackWebhookUrl', teams: 'teamsWebhookUrl', webhook: 'webhookUrl' };
  const key = keyMap[kind];
  if (!key)  return res.status(400).json({ error: 'kind must be slack, teams, or webhook' });
  if (url && !/^https:\/\//.test(url)) return res.status(400).json({ error: 'url must be https://' });
  if (url) userStore.setSecret(req.user.id, key, url);
  else     userStore.deleteSecret(req.user.id, key);
  res.json({ ok: true });
});

// POST /api/notifications/test — fire a test notification
router.post('/notifications/test', requireAuth, async (req, res) => {
  try {
    const { kind } = req.body || {};
    const keyMap = { slack: 'slackWebhookUrl', teams: 'teamsWebhookUrl', webhook: 'webhookUrl' };
    const url = userStore.getSecret(req.user.id, keyMap[kind]);
    if (!url) return res.status(400).json({ error: `No ${kind} webhook configured` });
    await notificationService.testNotification(kind, url);
    res.json({ ok: true, message: 'Test notification sent' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function redact(url) {
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.host}/...redacted...`;
  } catch { return '...redacted...'; }
}

module.exports = router;
