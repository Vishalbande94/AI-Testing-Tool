// ── JIRA Integration Routes ──────────────────────────────────────────────────
const express     = require('express');
const jiraService = require('../services/jiraService');

const router = express.Router();

// ── POST /api/jira/config — Save JIRA config ────────────────────────────────
router.post('/jira/config', (req, res) => {
  const { baseUrl, email, apiToken, projectKey, issueType } = req.body;
  if (!baseUrl || !email || !apiToken || !projectKey) {
    return res.status(400).json({ error: 'baseUrl, email, apiToken, and projectKey are required' });
  }
  const result = jiraService.setConfig({
    baseUrl: baseUrl.replace(/\/+$/, ''),
    email,
    apiToken,
    projectKey: projectKey.toUpperCase(),
    issueType: issueType || 'Bug',
  });
  res.json(result);
});

// ── DELETE /api/jira/config — Clear JIRA config ──────────────────────────────
router.delete('/jira/config', (req, res) => {
  jiraService.clearConfig();
  res.json({ success: true });
});

// ── GET /api/jira/status — Check JIRA config status ─────────────────────────
router.get('/jira/status', (req, res) => {
  res.json(jiraService.getStatus());
});

// ── POST /api/jira/test — Test JIRA connection ──────────────────────────────
router.post('/jira/test', async (req, res) => {
  try {
    const result = await jiraService.testConnection();
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
