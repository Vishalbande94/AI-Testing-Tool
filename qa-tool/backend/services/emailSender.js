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
