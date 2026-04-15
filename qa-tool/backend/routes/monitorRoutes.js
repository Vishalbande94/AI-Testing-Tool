// ── Email Monitor Routes ──────────────────────────────────────────────────────
const express      = require('express');
const emailMonitor = require('../services/emailMonitor');
const emailSender  = require('../services/emailSender');

const router = express.Router();

// ── POST /api/monitor/start ───────────────────────────────────────────────────
router.post('/monitor/start', async (req, res) => {
  const {
    email, password, imapHost, imapPort,
    smtpHost, smtpPort, subjectKeyword,
    pollInterval, defaultRequirements,
  } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  const result = emailMonitor.start({
    email,
    password,
    imapHost:            imapHost    || 'imap.gmail.com',
    imapPort:            imapPort    || 993,
    smtpHost:            smtpHost    || 'smtp.gmail.com',
    smtpPort:            smtpPort    || 587,
    subjectKeyword:      subjectKeyword   || 'deployment done',
    pollInterval:        pollInterval     || 120,
    defaultRequirements: defaultRequirements || 'login register payment claims dashboard navigation',
  });

  res.json(result);
});

// ── POST /api/monitor/stop ────────────────────────────────────────────────────
router.post('/monitor/stop', (req, res) => {
  res.json(emailMonitor.stop());
});

// ── GET /api/monitor/status ───────────────────────────────────────────────────
router.get('/monitor/status', (req, res) => {
  res.json(emailMonitor.status());
});

// ── POST /api/monitor/test-email ─────────────────────────────────────────────
// Sends a test email to verify SMTP config is working
router.post('/monitor/test-email', async (req, res) => {
  const { email, password, smtpHost, smtpPort, subjectKeyword } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }
  try {
    await emailSender.sendTestEmail({
      email, password,
      smtpHost: smtpHost || 'smtp.gmail.com',
      smtpPort: smtpPort || 587,
      subjectKeyword: subjectKeyword || 'deployment done',
    });
    res.json({ success: true, message: `Test email sent to ${email}` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
