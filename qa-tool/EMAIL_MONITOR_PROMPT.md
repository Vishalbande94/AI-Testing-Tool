# Email-Triggered QA Testing Bot — Add to Any Application

## What This Does

Add an **Email Monitor Bot** to your existing QA testing tool. When someone sends an email (e.g. "deployment done") to a configured Gmail account:

1. Bot detects the email via IMAP polling
2. Extracts the **App URL** from the email body
3. Uses attached requirement doc (or default keywords)
4. Runs the full **Playwright test pipeline** automatically
5. Generates **HTML + Excel reports**
6. **Replies to the sender** with results + report attachments

## Prerequisites

Your app must already have these backend services (or equivalents):
- `testGenerator.js` — generates test cases from requirement text
- `playwrightRunner.js` — generates and executes Playwright specs
- `reportGenerator.js` — generates HTML reports
- `excelGenerator.js` — generates Excel reports

## NPM Dependencies to Add

```bash
npm install imap-simple mailparser nodemailer
```

---

## FILES TO CREATE

Create these 3 backend files, then wire them into your server and frontend.


---

### `backend/services/emailMonitor.js` — Email Monitor Service (IMAP Polling + Pipeline Trigger)

```js
// ── Email Monitor Service (Singleton) ────────────────────────────────────────
// Polls IMAP inbox, detects deployment emails, triggers QA pipeline, sends results
const imaps          = require('imap-simple');
const { simpleParser } = require('mailparser');
const { v4: uuidv4 } = require('uuid');
const fs             = require('fs');
const path           = require('path');

const testGenerator    = require('./testGenerator');
const playwrightRunner = require('./playwrightRunner');
const reportGenerator  = require('./reportGenerator');
const excelGenerator   = require('./excelGenerator');
const emailSender      = require('./emailSender');

// ── Singleton state ────────────────────────────────────────────────────────────
let isRunning      = false;
let isPolling      = false;  // prevent concurrent IMAP polls
let timer          = null;
let config         = null;
let logs           = [];
let processedUids  = new Set();
let currentJob     = null;   // { appUrl, from, subject, startTime }
let lastChecked    = null;

// ── Logging ────────────────────────────────────────────────────────────────────
function log(msg) {
  const entry = `[${new Date().toISOString()}] ${msg}`;
  console.log(entry);
  logs.push(entry);
  if (logs.length > 300) logs.shift();
}

// ── Start monitoring ───────────────────────────────────────────────────────────
function start(cfg) {
  if (isRunning) return { success: false, message: 'Monitor is already running' };

  config    = cfg;
  isRunning = true;
  logs      = [];
  processedUids.clear();

  log(`📧 Email monitor STARTED`);
  log(`   Account   : ${cfg.email}`);
  log(`   IMAP Host : ${cfg.imapHost}:${cfg.imapPort || 993}`);
  log(`   Keyword   : "${cfg.subjectKeyword}"`);
  log(`   Poll every: ${cfg.pollInterval || 120}s`);

  doPoll(); // immediate first check
  timer = setInterval(doPoll, (cfg.pollInterval || 120) * 1000);

  return { success: true, message: 'Monitor started' };
}

// ── Stop monitoring ────────────────────────────────────────────────────────────
function stop() {
  if (timer) { clearInterval(timer); timer = null; }
  isRunning  = false;
  currentJob = null;
  log('🛑 Email monitor STOPPED');
  return { success: true };
}

// ── Status ─────────────────────────────────────────────────────────────────────
function status() {
  return {
    isRunning,
    currentJob,
    lastChecked,
    logsCount: logs.length,
    logs: logs.slice(-80),
    config: config ? {
      email:          config.email,
      imapHost:       config.imapHost,
      subjectKeyword: config.subjectKeyword,
      pollInterval:   config.pollInterval,
    } : null,
  };
}

// ── Poll inbox ─────────────────────────────────────────────────────────────────
async function doPoll() {
  if (!isRunning || !config) return;
  if (currentJob) {
    log('⏳ Skipping poll — test pipeline already running');
    return;
  }
  if (isPolling) {
    log('⏳ Skipping poll — previous IMAP check still in progress');
    return;
  }

  isPolling   = true;
  lastChecked = new Date().toISOString();
  log(`🔍 Checking inbox (${new Date().toLocaleTimeString('en-IN')})...`);

  let connection;
  try {
    const connectPromise = imaps.connect({
      imap: {
        user:     config.email,
        password: config.password,
        host:     config.imapHost    || 'imap.gmail.com',
        port:     config.imapPort    || 993,
        tls:      true,
        tlsOptions:  { rejectUnauthorized: false },
        authTimeout: 15000,
        connTimeout: 20000,
      },
    });
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('IMAP connection timed out after 25s — check Gmail IMAP is enabled at gmail.com > Settings > See all settings > Forwarding and POP/IMAP')), 25000)
    );
    connection = await Promise.race([connectPromise, timeoutPromise]);

    log(`   📂 Opening INBOX...`);
    await connection.openBox('INBOX');
    log(`   ✅ INBOX opened`);

    // Step 1: fetch headers only for recent UNSEEN emails (last 7 days)
    const since = new Date();
    since.setDate(since.getDate() - 7);
    const sinceStr = since.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/(\d+)\/(\d+)\/(\d+)/, '$2-$1-$3');
    log(`   🔎 Searching unread messages since ${since.toDateString()}...`);
    const searchTimeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('IMAP search timed out after 20s')), 20000)
    );
    const messages = await Promise.race([
      connection.search([['UNSEEN'], ['SINCE', since]], {
        bodies:   ['HEADER.FIELDS (FROM TO SUBJECT DATE)'],
        markSeen: false,
      }),
      searchTimeout,
    ]);

    log(`   Unread messages: ${messages.length}`);

    for (const msg of messages) {
      if (!isRunning) break;

      const uid = msg.attributes.uid;
      if (processedUids.has(uid)) continue;

      // Parse header
      const headerPart = msg.parts.find(p => p.which.startsWith('HEADER'));
      const subject    = (headerPart?.body?.subject?.[0] || '').trim();
      const fromAddr   = (headerPart?.body?.from?.[0]    || '').trim();

      log(`   📩 Email: "${subject}" — from: ${fromAddr}`);

      // Check subject keyword
      if (!subject.toLowerCase().includes(config.subjectKeyword.toLowerCase())) {
        log(`      ↳ Subject does not contain "${config.subjectKeyword}" — skipping`);
        continue;
      }

      log(`   ✅ Trigger matched! Fetching full email body...`);
      processedUids.add(uid);

      // Step 2: fetch full body only for matching email
      const fullMsgs = await connection.search([['UID', String(uid)]], {
        bodies:   [''],
        markSeen: true,
        struct:   true,
      });

      const bodyPart = fullMsgs[0]?.parts?.find(p => p.which === '');
      let parsed;
      try {
        parsed = await simpleParser(bodyPart?.body || '');
      } catch (e) {
        log(`   ⚠️ Could not parse email body: ${e.message}`);
        continue;
      }

      // Extract URL from email body text
      const bodyText = parsed.text || '';
      const bodyHtml = parsed.html  || '';
      const appUrl   = extractUrl(bodyText) || extractUrl(bodyHtml);

      if (!appUrl) {
        log(`   ⚠️ No application URL found in email body. Reply with URL to test.`);
        log(`      Tip: Include a line like "URL: http://your-app.com" in email body`);
        continue;
      }

      log(`   🌐 Extracted URL: ${appUrl}`);

      // Get requirements — from attachment or default
      let requirementText = config.defaultRequirements ||
        'login register payment claims policy dashboard navigation search password profile logout form';

      const txtAttachment = (parsed.attachments || []).find(a =>
        a.filename && /\.(txt|md|pdf)$/i.test(a.filename)
      );
      if (txtAttachment) {
        log(`   📎 Using requirement attachment: ${txtAttachment.filename}`);
        requirementText = txtAttachment.content.toString('utf-8');
      } else {
        log(`   📝 No doc attachment found — using default requirements`);
      }

      // Close IMAP before running pipeline (long operation)
      try { connection.end(); } catch (e) { /* ignore */ }
      connection = null;

      // Run pipeline async (non-blocking for next poll)
      await runPipeline({ appUrl, requirementText, replyTo: fromAddr, originalSubject: subject });
      return; // process one email at a time
    }

  } catch (err) {
    log(`❌ IMAP connection error: ${err.message}`);
    if (err.message.includes('Invalid credentials')) {
      log('   💡 Tip: For Gmail, use an App Password (not your regular password)');
      log('   💡 Generate at: https://myaccount.google.com/apppasswords');
    }
  } finally {
    isPolling = false;
    if (connection) {
      try { connection.end(); } catch (e) { /* ignore */ }
    }
  }
}

// ── Extract URL from text ──────────────────────────────────────────────────────
function extractUrl(text) {
  if (!text) return null;

  // Look for labelled URL first: "URL: http://..."  or  "App URL: ..."
  const labelled = text.match(/(?:app\s*url|url|link|application)\s*[:=]\s*(https?:\/\/[^\s<>"'\n]+)/i);
  if (labelled) return labelled[1].replace(/[.,;)>\]]+$/, '');

  // Generic http/https
  const http = text.match(/https?:\/\/[^\s<>"'\n]+/i);
  if (http) return http[0].replace(/[.,;)>\]]+$/, '');

  // file:///
  const fileUrl = text.match(/file:\/\/\/[^\s<>"'\n]+/i);
  if (fileUrl) return fileUrl[0];

  // Windows path  C:\... or C:/...
  const winPath = text.match(/[A-Za-z]:[/\\][^\s<>"'\n]+\.html/i);
  if (winPath) return 'file:///' + winPath[0].replace(/\\/g, '/');

  return null;
}

// ── Run QA pipeline ────────────────────────────────────────────────────────────
async function runPipeline({ appUrl, requirementText, replyTo, originalSubject }) {
  const jobId     = uuidv4();
  const reportDir = path.join(__dirname, '../reports', jobId);
  fs.mkdirSync(reportDir, { recursive: true });

  currentJob = { jobId, appUrl, from: replyTo, subject: originalSubject, startTime: new Date().toISOString() };

  try {
    log(`\n${'═'.repeat(60)}`);
    log(`🚀 QA PIPELINE STARTED`);
    log(`   Job ID  : ${jobId}`);
    log(`   App URL : ${appUrl}`);
    log(`   Reply to: ${replyTo}`);
    log('═'.repeat(60));

    log('🧠 [1/5] Generating test cases...');
    const testCases = testGenerator.generate(requirementText);
    log(`   ✓ Generated ${testCases.length} test cases across ${[...new Set(testCases.map(t => t.module))].length} modules`);

    log('🎭 [2/5] Creating Playwright spec...');
    const specContent = playwrightRunner.generateSpec(appUrl, testCases);
    log(`   ✓ Spec ready (${testCases.length} test functions)`);

    log('⚡ [3/5] Executing Playwright tests...');
    const results = await playwrightRunner.execute(specContent, appUrl, (m) => log(`   ${m}`));
    log(`   ✓ ${results.passed} passed | ${results.failed} failed | ${results.skipped} skipped`);

    const updatedTCs = testGenerator.mergeResults(testCases, results.testResults);
    const stats = {
      total:    testCases.length,
      passed:   results.passed,
      failed:   results.failed,
      skipped:  results.skipped || 0,
      duration: results.duration || 0,
      passRate: testCases.length > 0 ? Math.round(results.passed / testCases.length * 100) : 0,
    };

    log('📊 [4/5] Generating HTML report + Excel...');
    const [htmlPath, xlsxPath] = await Promise.all([
      reportGenerator.generate({ jobId, appUrl, testCases: updatedTCs, executionStats: stats, reportDir }),
      excelGenerator.generate(updatedTCs, stats, appUrl, reportDir),
    ]);
    log(`   ✓ HTML: ${htmlPath}`);
    log(`   ✓ XLSX: ${xlsxPath}`);

    log(`📧 [5/5] Sending result email to ${replyTo}...`);
    await emailSender.sendReport({
      config,
      to: replyTo,
      originalSubject,
      appUrl,
      stats,
      htmlReportPath: htmlPath,
      excelPath:      xlsxPath,
      testCases:      updatedTCs,
    });

    log(`\n✅ PIPELINE COMPLETE — Pass Rate: ${stats.passRate}%`);
    log(`   Email sent to: ${replyTo}`);
    log('═'.repeat(60) + '\n');

  } catch (err) {
    log(`\n❌ PIPELINE ERROR: ${err.message}`);
    log(err.stack || '');
    try {
      await emailSender.sendError({ config, to: replyTo, originalSubject, appUrl, error: err.message });
      log(`   Error notification sent to ${replyTo}`);
    } catch (e2) {
      log(`   Could not send error email: ${e2.message}`);
    }
  } finally {
    currentJob = null;
  }
}

module.exports = { start, stop, status };
```


---

### `backend/services/emailSender.js` — Email Sender (Nodemailer — Results + Error Notifications)

```js
// ── Email Sender Service ──────────────────────────────────────────────────────
// Sends QA result emails with HTML report + Excel attachments
const nodemailer = require('nodemailer');
const fs         = require('fs');
const path       = require('path');

/**
 * Build a nodemailer transporter from config.
 */
function createTransport(config) {
  return nodemailer.createTransport({
    host:   config.smtpHost || 'smtp.gmail.com',
    port:   config.smtpPort || 587,
    secure: false,
    auth: {
      user: config.email,
      pass: config.password,
    },
    tls: { rejectUnauthorized: false },
  });
}

// ── Send QA result email ───────────────────────────────────────────────────────
async function sendReport({ config, to, originalSubject, appUrl, stats, htmlReportPath, excelPath, testCases }) {
  const transport = createTransport(config);

  const passColor = stats.passRate >= 80 ? '#10b981' : stats.passRate >= 50 ? '#f59e0b' : '#ef4444';
  const statusEmoji = stats.passRate >= 80 ? '✅' : stats.passRate >= 50 ? '⚠️' : '❌';

  // Build module summary rows
  const moduleMap = {};
  testCases.forEach(tc => {
    if (!moduleMap[tc.module]) moduleMap[tc.module] = { pass: 0, fail: 0, total: 0 };
    moduleMap[tc.module].total++;
    if (tc.status === 'Pass') moduleMap[tc.module].pass++;
    else moduleMap[tc.module].fail++;
  });

  const moduleRows = Object.entries(moduleMap).map(([mod, m]) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #334155;color:#e2e8f0;">${mod}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #334155;text-align:center;color:#94a3b8;">${m.total}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #334155;text-align:center;color:#10b981;font-weight:600;">${m.pass}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #334155;text-align:center;color:#ef4444;font-weight:600;">${m.fail}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #334155;text-align:center;color:${m.fail === 0 ? '#10b981' : '#f59e0b'};">${Math.round(m.pass/m.total*100)}%</td>
    </tr>`).join('');

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',Arial,sans-serif;">

<div style="max-width:680px;margin:0 auto;background:#0f172a;">

  <!-- Header -->
  <div style="background:linear-gradient(135deg,#1e1b4b,#312e81);padding:36px 40px;text-align:center;">
    <div style="font-size:40px;margin-bottom:10px;">🤖</div>
    <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">QA AI Testing Report</h1>
    <p style="margin:8px 0 0;color:#a5b4fc;font-size:13px;">
      Automated test execution triggered by deployment notification
    </p>
  </div>

  <!-- Status Banner -->
  <div style="background:${stats.passRate >= 80 ? '#064e3b' : stats.passRate >= 50 ? '#451a03' : '#450a0a'};
              padding:16px 40px;text-align:center;border-bottom:2px solid ${passColor};">
    <span style="color:${passColor};font-size:20px;font-weight:800;">
      ${statusEmoji} ${stats.passRate}% Pass Rate — ${stats.passRate >= 80 ? 'READY FOR RELEASE' : stats.passRate >= 50 ? 'NEEDS ATTENTION' : 'CRITICAL ISSUES FOUND'}
    </span>
  </div>

  <div style="padding:32px 40px;">

    <!-- App info -->
    <div style="background:#1e293b;border:1px solid #334155;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
      <div style="color:#94a3b8;font-size:12px;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px;">Application Tested</div>
      <div style="color:#6366f1;font-size:14px;font-weight:600;word-break:break-all;">${appUrl}</div>
      <div style="color:#64748b;font-size:12px;margin-top:4px;">Trigger: <em>${originalSubject}</em></div>
    </div>

    <!-- Stats grid -->
    <table width="100%" cellpadding="0" cellspacing="8" style="margin-bottom:24px;">
      <tr>
        ${[
          ['Total Tests', stats.total,   '#6366f1'],
          ['✅ Passed',   stats.passed,  '#10b981'],
          ['❌ Failed',   stats.failed,  '#ef4444'],
          ['Pass Rate',  stats.passRate + '%', passColor],
        ].map(([label, val, color]) => `
        <td style="background:#1e293b;border:1px solid ${color}33;border-radius:10px;
                   padding:16px;text-align:center;width:25%;">
          <div style="color:${color};font-size:28px;font-weight:800;line-height:1;">${val}</div>
          <div style="color:#94a3b8;font-size:11px;margin-top:6px;text-transform:uppercase;">${label}</div>
        </td>`).join('')}
      </tr>
    </table>

    <!-- Progress bar -->
    <div style="background:#1e293b;border:1px solid #334155;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
      <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
        <span style="color:#f1f5f9;font-weight:600;font-size:13px;">Overall Pass Rate</span>
        <span style="color:${passColor};font-weight:700;font-size:16px;">${stats.passRate}%</span>
      </div>
      <div style="background:#334155;border-radius:999px;height:10px;overflow:hidden;">
        <div style="width:${stats.passRate}%;height:100%;background:${passColor};border-radius:999px;"></div>
      </div>
    </div>

    <!-- Module table -->
    <h3 style="color:#f1f5f9;font-size:14px;margin:0 0 12px;">Module-wise Results</h3>
    <table width="100%" cellpadding="0" cellspacing="0"
           style="background:#1e293b;border:1px solid #334155;border-radius:10px;overflow:hidden;margin-bottom:24px;">
      <thead>
        <tr style="background:#334155;">
          <th style="padding:10px 12px;color:#94a3b8;font-size:11px;text-transform:uppercase;text-align:left;">Module</th>
          <th style="padding:10px 12px;color:#94a3b8;font-size:11px;text-transform:uppercase;text-align:center;">Total</th>
          <th style="padding:10px 12px;color:#94a3b8;font-size:11px;text-transform:uppercase;text-align:center;">Pass</th>
          <th style="padding:10px 12px;color:#94a3b8;font-size:11px;text-transform:uppercase;text-align:center;">Fail</th>
          <th style="padding:10px 12px;color:#94a3b8;font-size:11px;text-transform:uppercase;text-align:center;">Rate</th>
        </tr>
      </thead>
      <tbody>${moduleRows}</tbody>
    </table>

    <!-- Attachments note -->
    <div style="background:#1e3a5f;border:1px solid #1d4ed8;border-radius:10px;padding:14px 18px;margin-bottom:24px;">
      <div style="color:#93c5fd;font-weight:600;margin-bottom:4px;">📎 Attachments</div>
      <div style="color:#bfdbfe;font-size:13px;">
        • <strong>QA Report (HTML)</strong> — Open in browser, print to PDF<br>
        • <strong>QA Test Cases (Excel)</strong> — Detailed results with 3 worksheets
      </div>
    </div>

    <!-- Footer info -->
    <div style="color:#475569;font-size:12px;text-align:center;border-top:1px solid #334155;padding-top:20px;">
      <strong style="color:#6366f1;">QA AI Testing Tool</strong> — Powered by Playwright v1.55<br>
      Execution time: ${stats.duration}s &nbsp;|&nbsp; ${new Date().toLocaleString('en-IN')}
    </div>

  </div>
</div>
</body>
</html>`;

  const attachments = [];
  if (htmlReportPath && fs.existsSync(htmlReportPath)) {
    attachments.push({ filename: 'QA_Report.html',       path: htmlReportPath });
  }
  if (excelPath && fs.existsSync(excelPath)) {
    attachments.push({ filename: 'QA_Test_Cases.xlsx',   path: excelPath });
  }

  await transport.sendMail({
    from:    `"QA AI Bot 🤖" <${config.email}>`,
    to,
    subject: `${statusEmoji} QA Testing Complete | ${stats.passRate}% Pass | RE: ${originalSubject}`,
    html,
    attachments,
  });
}

// ── Send error notification ────────────────────────────────────────────────────
async function sendError({ config, to, originalSubject, appUrl, error }) {
  const transport = createTransport(config);

  await transport.sendMail({
    from:    `"QA AI Bot 🤖" <${config.email}>`,
    to,
    subject: `❌ QA Testing Failed | RE: ${originalSubject}`,
    html: `
      <div style="font-family:Arial,sans-serif;background:#0f172a;color:#f1f5f9;padding:32px;border-radius:12px;">
        <h2 style="color:#ef4444;">❌ QA Pipeline Error</h2>
        <p><strong>Application:</strong> ${appUrl}</p>
        <p><strong>Trigger:</strong> ${originalSubject}</p>
        <p><strong>Error:</strong></p>
        <pre style="background:#1e293b;padding:16px;border-radius:8px;color:#fca5a5;font-size:12px;">${error}</pre>
        <p style="color:#64748b;font-size:12px;">— QA AI Testing Tool</p>
      </div>`,
  });
}

// ── Send test email (connection check) ────────────────────────────────────────
async function sendTestEmail(config) {
  const transport = createTransport(config);
  await transport.sendMail({
    from:    `"QA AI Bot 🤖" <${config.email}>`,
    to:      config.email,
    subject: '✅ QA Bot Email Config Test',
    html:    `<div style="font-family:Arial;padding:20px;">
                <h2>✅ Connection Successful!</h2>
                <p>Your QA AI Testing Bot email is configured correctly.</p>
                <p>It will now monitor for emails with subject: <strong>"${config.subjectKeyword}"</strong></p>
              </div>`,
  });
}

module.exports = { sendReport, sendError, sendTestEmail };
```


---

### `backend/routes/monitorRoutes.js` — Monitor API Routes (Start / Stop / Status / Test-Email)

```js
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
```


---

### Wire Into Your Server (`server.js`)

Add these 2 lines to your existing Express server:

```js
// At the top with other requires
const monitorRoutes = require('./routes/monitorRoutes');

// With your other routes
app.use('/api', monitorRoutes);
```


---

## Frontend Integration (React)

Add these to your existing React app to get the full Email Monitor page with config panel and live log viewer.

### State Variables

```jsx
const [monEmail,     setMonEmail]     = useState('');
const [monPassword,  setMonPassword]  = useState('');
const [monImapHost,  setMonImapHost]  = useState('imap.gmail.com');
const [monSmtpHost,  setMonSmtpHost]  = useState('smtp.gmail.com');
const [monKeyword,   setMonKeyword]   = useState('deployment done');
const [monInterval,  setMonInterval]  = useState('120');
const [monStatus,    setMonStatus]    = useState(null);
const [monAction,    setMonAction]    = useState('');
const [showPassword, setShowPassword] = useState(false);
const monLogsRef  = useRef();
const monPollRef  = useRef();
```

### Monitor Status Polling (useEffect)

```jsx
useEffect(() => {
  const poll = async () => {
    try {
      const res  = await fetch('/api/monitor/status');
      const data = await res.json();
      setMonStatus(data);
      if (monLogsRef.current) monLogsRef.current.scrollTop = monLogsRef.current.scrollHeight;
    } catch (e) { /* ignore */ }
  };
  poll();
  monPollRef.current = setInterval(poll, 3000);
  return () => clearInterval(monPollRef.current);
}, []);
```

### Action Handlers

```jsx
const handleMonitorStart = async () => {
  if (!monEmail || !monPassword) { alert('Email and password are required'); return; }
  setMonAction('starting');
  try {
    await fetch('/api/monitor/start', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: monEmail, password: monPassword,
        imapHost: monImapHost, smtpHost: monSmtpHost,
        subjectKeyword: monKeyword, pollInterval: parseInt(monInterval),
      }),
    });
  } catch (e) { alert('Failed to start: ' + e.message); }
  setMonAction('');
};

const handleMonitorStop = async () => {
  setMonAction('stopping');
  await fetch('/api/monitor/stop', { method: 'POST' }).catch(() => {});
  setMonAction('');
};

const handleTestEmail = async () => {
  if (!monEmail || !monPassword) { alert('Email and password required'); return; }
  setMonAction('testing');
  try {
    const res  = await fetch('/api/monitor/test-email', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: monEmail, password: monPassword, smtpHost: monSmtpHost, subjectKeyword: monKeyword }),
    });
    const data = await res.json();
    if (data.success) alert('Test email sent to ' + monEmail);
    else alert('Failed: ' + data.error);
  } catch (e) { alert('Error: ' + e.message); }
  setMonAction('');
};
```

### JSX — Email Monitor Page

Add a navigation button in your top bar:

```jsx
<button onClick={() => setPage('monitor')}>
  📧 Email Monitor
  {monStatus?.isRunning && <span className="live-dot" />}
</button>
```

Then render this when `page === 'monitor'`:

```jsx
{page === 'monitor' && (
  <div>
    {/* Status banner */}
    <div className={`monitor-banner ${monStatus?.isRunning ? 'banner-live' : 'banner-off'}`}>
      <div className="monitor-banner-left">
        {monStatus?.isRunning
          ? <><span className="live-dot large" /> <strong>LIVE — Monitoring inbox</strong></>
          : <><span>⏸️</span> <strong>Monitor Stopped</strong></>}
        {monStatus?.isRunning && monStatus.config && (
          <span className="banner-meta">
            &nbsp;| Watching: <em>{monStatus.config.email}</em>
            &nbsp;| Keyword: <em>"{monStatus.config.subjectKeyword}"</em>
            &nbsp;| Every: {monStatus.config.pollInterval}s
          </span>
        )}
      </div>
      {monStatus?.currentJob && (
        <div className="banner-job">
          <span className="spinner small" /> Running tests for {monStatus.currentJob.appUrl}
        </div>
      )}
    </div>

    <div className="monitor-grid">
      {/* ── Config Panel ── */}
      <div className="panel">
        <div className="panel-header">
          <h2>📧 Email Configuration</h2>
          <p>Configure IMAP (read) and SMTP (send) settings. Gmail recommended.</p>
        </div>

        <div className="field">
          <label className="field-label">Gmail Address</label>
          <input className="field-input" type="email" placeholder="yourname@gmail.com"
            value={monEmail} onChange={e => setMonEmail(e.target.value)} />
        </div>

        <div className="field">
          <label className="field-label">
            App Password
            <a href="https://myaccount.google.com/apppasswords" target="_blank"
               rel="noreferrer" style={{ marginLeft: 8, fontSize: 11, color: '#6366f1' }}>
              Generate →
            </a>
          </label>
          <div style={{ position: 'relative' }}>
            <input className="field-input" type={showPassword ? 'text' : 'password'}
              placeholder="xxxx xxxx xxxx xxxx"
              value={monPassword} onChange={e => setMonPassword(e.target.value)}
              style={{ paddingRight: 44 }} />
            <button onClick={() => setShowPassword(s => !s)}
              style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)',
                       background:'none', border:'none', cursor:'pointer', color:'#94a3b8', fontSize:16 }}>
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
          <div style={{ fontSize:11, color:'#64748b', marginTop:4 }}>
            ⚠️ Use App Password (not Google password). Requires 2FA enabled.
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <div className="field">
            <label className="field-label">IMAP Host</label>
            <input className="field-input" value={monImapHost} onChange={e => setMonImapHost(e.target.value)} />
          </div>
          <div className="field">
            <label className="field-label">SMTP Host</label>
            <input className="field-input" value={monSmtpHost} onChange={e => setMonSmtpHost(e.target.value)} />
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <div className="field">
            <label className="field-label">Trigger Keyword <span className="field-hint">(in subject)</span></label>
            <input className="field-input" value={monKeyword} onChange={e => setMonKeyword(e.target.value)} />
          </div>
          <div className="field">
            <label className="field-label">Poll Every <span className="field-hint">(seconds)</span></label>
            <input className="field-input" type="number" min="30" value={monInterval}
              onChange={e => setMonInterval(e.target.value)} />
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display:'flex', gap:10, marginTop:8, flexWrap:'wrap' }}>
          {!monStatus?.isRunning ? (
            <button className="btn btn-execute"
              style={{ flex:1, padding:'12px', fontSize:14 }}
              onClick={handleMonitorStart}
              disabled={monAction === 'starting'}>
              {monAction === 'starting' ? '⏳ Starting…' : '▶️ Start Monitoring'}
            </button>
          ) : (
            <button className="btn"
              style={{ flex:1, padding:'12px', fontSize:14, background:'#450a0a', color:'#fca5a5', border:'1px solid #7f1d1d' }}
              onClick={handleMonitorStop}
              disabled={monAction === 'stopping'}>
              {monAction === 'stopping' ? '⏳ Stopping…' : '⏹ Stop Monitoring'}
            </button>
          )}
          <button className="btn btn-ghost"
            onClick={handleTestEmail}
            disabled={monAction === 'testing'}>
            {monAction === 'testing' ? '⏳ Sending…' : '📨 Test Email'}
          </button>
        </div>

        {/* How it works */}
        <div className="steps-preview" style={{ marginTop:20 }}>
          <div className="steps-title">🔄 Automated Flow</div>
          <div className="steps-list">
            {[
              ['📨', 'Someone sends email with trigger keyword in subject'],
              ['🌐', 'Bot extracts App URL from email body'],
              ['📎', 'Uses attached requirement doc (or default keywords)'],
              ['⚡', 'Runs full Playwright test suite automatically'],
              ['📊', 'Generates HTML report + Excel file'],
              ['📧', 'Replies to sender with results + attachments'],
            ].map(([icon, text]) => (
              <div key={text} className="step-item"><span>{icon}</span><span>{text}</span></div>
            ))}
          </div>
        </div>

        {/* Email format tip */}
        <div style={{ background:'#1e3a5f', border:'1px solid #1d4ed8', borderRadius:10, padding:14, marginTop:16, fontSize:12 }}>
          <div style={{ color:'#93c5fd', fontWeight:600, marginBottom:6 }}>📩 Trigger Email Format</div>
          <div style={{ color:'#bfdbfe', fontFamily:'monospace', lineHeight:1.8 }}>
            <div><strong>To:</strong> {monEmail || 'yourname@gmail.com'}</div>
            <div><strong>Subject:</strong> {monKeyword || 'deployment done'} - v2.0</div>
            <div><strong>Body:</strong></div>
            <div style={{ paddingLeft:12 }}>
              Hi QA Bot,<br/>
              Deployment is complete.<br/>
              <span style={{ color:'#60a5fa' }}>URL: http://your-app.com</span><br/>
              Please run the tests.
            </div>
            <div><strong>Attachment:</strong> requirements.txt (optional)</div>
          </div>
        </div>
      </div>

      {/* ── Live Log Panel ── */}
      <div className="panel" style={{ display:'flex', flexDirection:'column' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <h2 style={{ margin:0 }}>📜 Live Monitor Log</h2>
          {monStatus?.lastChecked && (
            <span style={{ color:'#64748b', fontSize:12 }}>
              Last check: {new Date(monStatus.lastChecked).toLocaleTimeString('en-IN')}
            </span>
          )}
        </div>

        <div className="logs-box" style={{ flex:1, minHeight:400 }}>
          <div className="logs-title">
            {monStatus?.isRunning
              ? `🟢 Live — ${monStatus.logsCount || 0} log entries`
              : '⏸️ Monitor stopped'}
          </div>
          <div className="logs-content" ref={monLogsRef} style={{ maxHeight:480 }}>
            {(monStatus?.logs || []).length === 0 ? (
              <div style={{ color:'#475569', fontStyle:'italic', padding:'20px 0' }}>
                No logs yet. Start the monitor to begin.
              </div>
            ) : (
              (monStatus?.logs || []).map((l, i) => (
                <div key={i} className={`log-line ${l.includes('❌') ? 'log-error' : l.includes('✅') || l.includes('COMPLETE') ? 'log-success' : l.includes('🚀') || l.includes('📧') ? 'log-highlight' : ''}`}>
                  {l}
                </div>
              ))
            )}
          </div>
        </div>

        {monStatus?.currentJob && (
          <div style={{ marginTop:12, background:'#1e3a5f', border:'1px solid #3b82f6', borderRadius:10, padding:14 }}>
            <div style={{ color:'#93c5fd', fontWeight:600, marginBottom:8 }}>
              ⚡ Currently Running Test Pipeline
            </div>
            <div style={{ fontSize:12, color:'#bfdbfe' }}>
              <div><strong>URL:</strong> {monStatus.currentJob.appUrl}</div>
              <div><strong>Triggered by:</strong> {monStatus.currentJob.from}</div>
              <div><strong>Subject:</strong> {monStatus.currentJob.subject}</div>
              <div><strong>Started:</strong> {new Date(monStatus.currentJob.startTime).toLocaleTimeString('en-IN')}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
)}
```


---

## CSS Styles for Email Monitor

Add these to your stylesheet:

```css
/* Live dot */
.live-dot {
  width: 8px; height: 8px; background: #10b981; border-radius: 50%;
  display: inline-block; animation: pulse 1.5s infinite;
}
.live-dot.large { width: 12px; height: 12px; margin-right: 4px; }
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: .6; transform: scale(1.2); }
}

/* Monitor banner */
.monitor-banner {
  border-radius: 12px; padding: 12px 20px; margin-bottom: 20px;
  display: flex; align-items: center; justify-content: space-between;
  flex-wrap: wrap; gap: 8px; font-size: 13px;
}
.banner-live { background: rgba(16,185,129,.1); border: 1px solid #065f46; color: #34d399; }
.banner-off  { background: rgba(148,163,184,.06); border: 1px solid var(--border); color: var(--muted); }
.monitor-banner-left { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.banner-meta { color: inherit; opacity: .8; font-size: 12px; }
.banner-job  { display: flex; align-items: center; gap: 8px; color: #93c5fd; font-size: 12px; }

/* Monitor grid */
.monitor-grid {
  display: grid; grid-template-columns: 420px 1fr; gap: 20px; align-items: start;
}
@media (max-width: 900px) { .monitor-grid { grid-template-columns: 1fr; } }

/* Spinner small */
.spinner.small { width: 14px; height: 14px; border-width: 2px; }

/* Log highlight */
.log-highlight { color: #a5b4fc; }
```


---

## How to Use

### Gmail Setup (One-time)
1. Enable **2-Step Verification** on your Google account
2. Go to https://myaccount.google.com/apppasswords
3. Generate an **App Password** (select "Mail" > "Other" > name it "QA Bot")
4. Copy the 16-character password

### In the App
1. Navigate to the **Email Monitor** page
2. Enter your Gmail address and the App Password
3. Set the **trigger keyword** (default: "deployment done")
4. Set **poll interval** (default: 120 seconds)
5. Click **Start Monitoring**
6. Click **Test Email** to verify SMTP works

### Trigger a Test Run

Send an email to your configured Gmail:

```
To: yourname@gmail.com
Subject: deployment done - v2.0 release
Body:
  Hi QA Bot,
  Deployment is complete.
  URL: http://your-app.com
  Please run the tests.
Attachment: requirements.txt (optional)
```

The bot will:
- Detect the email (keyword match in subject)
- Extract the URL from body
- Run Playwright tests
- Reply with HTML report + Excel attachment

### Key Technical Details
- Checks **unread emails from the last 7 days** only
- Each email processed once (tracked by UID)
- One pipeline at a time (concurrent emails are queued)
- IMAP connection timeout: 25s
- IMAP search timeout: 20s
- Headers fetched first, full body only for matching emails (performance optimization)
- If no URL found in email body, the email is skipped with a log warning
