// ── Agent Configuration Routes ────────────────────────────────────────────────
const express      = require('express');
const claudeClient = require('../services/agents/claudeClient');

const router = express.Router();

// ── POST /api/agent/apikey — Set Anthropic API key ──────────────────────────
router.post('/agent/apikey', (req, res) => {
  const { apiKey } = req.body;
  if (!apiKey || !apiKey.startsWith('sk-ant-')) {
    return res.status(400).json({ error: 'Invalid API key. Must start with sk-ant-' });
  }
  const result = claudeClient.setApiKey(apiKey);
  res.json({ ...result, message: 'API key configured. AI agents are now active.' });
});

// ── DELETE /api/agent/apikey — Clear API key ────────────────────────────────
router.delete('/agent/apikey', (req, res) => {
  claudeClient.clearApiKey();
  res.json({ success: true, message: 'API key cleared. Falling back to rule-based mode.' });
});

// ── GET /api/agent/status — Check AI configuration ──────────────────────────
router.get('/agent/status', (req, res) => {
  res.json(claudeClient.getStatus());
});

module.exports = router;
