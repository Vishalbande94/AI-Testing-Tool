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
