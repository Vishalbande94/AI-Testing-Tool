// ── HTML Report Generator ─────────────────────────────────────────────────────
const fs   = require('fs');
const path = require('path');

/**
 * Generate a professional HTML QA report.
 * @param {{ jobId, appUrl, testCases, executionStats, reportDir }} opts
 * @returns {string} Path to generated report
 */
async function generate({ jobId, appUrl, testCases, executionStats, reportDir }) {
  const now        = new Date();
  const reportPath = path.join(reportDir, 'report.html');

  const modules    = groupByModule(testCases);
  const passRate   = executionStats.total > 0
    ? Math.round((executionStats.passed / executionStats.total) * 100)
    : 0;

  const html = buildHtml({
    jobId, appUrl, testCases, executionStats, modules, passRate,
    timestamp: now.toISOString(),
    dateStr: now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true }),
  });

  fs.writeFileSync(reportPath, html, 'utf-8');
  return reportPath;
}

// ── Group test cases by module ─────────────────────────────────────────────────
function groupByModule(testCases) {
  const groups = {};
  for (const tc of testCases) {
    if (!groups[tc.module]) groups[tc.module] = { icon: tc.icon, tests: [] };
    groups[tc.module].tests.push(tc);
  }
  return groups;
}

// ── Status helpers ─────────────────────────────────────────────────────────────
function badgeClass(status) {
  switch (status) {
    case 'Pass':         return 'badge-pass';
    case 'Fail':         return 'badge-fail';
    case 'Skipped':      return 'badge-skip';
    case 'Not Executed': return 'badge-not-run';
    default:             return 'badge-not-run';
  }
}

function priorityClass(priority) {
  switch (priority) {
    case 'Critical': return 'pri-critical';
    case 'High':     return 'pri-high';
    case 'Medium':   return 'pri-medium';
    default:         return 'pri-low';
  }
}

function typeClass(type) {
  switch (type) {
    case 'Positive': return 'type-pos';
    case 'Negative': return 'type-neg';
    case 'Edge':     return 'type-edge';
    default:         return 'type-pos';
  }
}

function statusIcon(status) {
  switch (status) {
    case 'Pass':    return '✅';
    case 'Fail':    return '❌';
    case 'Skipped': return '⏭️';
    default:        return '⏸️';
  }
}

// ── Build complete HTML ────────────────────────────────────────────────────────
function buildHtml({ jobId, appUrl, testCases, executionStats, modules, passRate, timestamp, dateStr }) {

  const moduleRows = Object.entries(modules).map(([mod, { icon, tests }]) => {
    const mp = tests.filter(t => t.status === 'Pass').length;
    const mf = tests.filter(t => t.status === 'Fail').length;
    const mt = tests.length;
    const mr = mt > 0 ? Math.round(mp / mt * 100) : 0;
    return `
    <tr>
      <td>${icon} ${escHtml(mod)}</td>
      <td class="tc">${mt}</td>
      <td class="tc pass-col">${mp}</td>
      <td class="tc fail-col">${mf}</td>
      <td>
        <div class="mini-bar">
          <div class="mini-fill" style="width:${mr}%; background:${mr >= 80 ? '#10b981' : mr >= 50 ? '#f59e0b' : '#ef4444'}"></div>
        </div>
        <span class="mini-pct">${mr}%</span>
      </td>
    </tr>`;
  }).join('');

  const testRows = testCases.map((tc, idx) => `
    <tr class="tc-row ${tc.status === 'Fail' ? 'row-fail' : tc.status === 'Pass' ? 'row-pass' : ''}">
      <td class="tc-num">${idx + 1}</td>
      <td><span class="tc-id">${escHtml(tc.id)}</span></td>
      <td class="tc-module">${escHtml(tc.module)}</td>
      <td>${escHtml(tc.title)}</td>
      <td><span class="badge ${typeClass(tc.type)}">${tc.type}</span></td>
      <td><span class="badge ${priorityClass(tc.priority)}">${tc.priority}</span></td>
      <td><span class="badge ${badgeClass(tc.status)}">${statusIcon(tc.status)} ${tc.status}</span></td>
      <td class="dur-col">${tc.duration != null ? tc.duration + 'ms' : '—'}</td>
      <td class="actual-col" title="${escHtml(tc.error || tc.actual || '')}">${escHtml((tc.actual || '').slice(0, 60))}${(tc.actual || '').length > 60 ? '…' : ''}</td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>QA AI Testing Report — ${escHtml(appUrl)}</title>
<style>
  :root {
    --primary: #6366f1; --primary-dark: #4f46e5;
    --pass: #10b981; --fail: #ef4444; --skip: #94a3b8; --warn: #f59e0b;
    --bg: #0f172a; --surface: #1e293b; --surface2: #334155;
    --text: #f1f5f9; --muted: #94a3b8; --border: #334155;
  }
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background:var(--bg); color:var(--text); font-family:'Segoe UI',system-ui,sans-serif; font-size:14px; line-height:1.5; }
  a { color:var(--primary); }

  /* ── Header ──────────────────────────────────────────── */
  .header { background:linear-gradient(135deg,#1e1b4b 0%,#312e81 50%,#1e1b4b 100%);
    padding:40px 48px; border-bottom:1px solid var(--border); }
  .header-brand { display:flex; align-items:center; gap:12px; margin-bottom:8px; }
  .header-brand span { font-size:32px; }
  .header-brand h1 { font-size:26px; font-weight:700; letter-spacing:-0.5px; }
  .header-meta { color:#a5b4fc; font-size:13px; }
  .header-meta b { color:#c7d2fe; }

  /* ── Layout ──────────────────────────────────────────── */
  .container { max-width:1400px; margin:0 auto; padding:32px 48px; }
  section { margin-bottom:40px; }
  h2 { font-size:18px; font-weight:600; margin-bottom:16px; display:flex; align-items:center; gap:8px; }
  h2::before { content:''; width:4px; height:20px; background:var(--primary); border-radius:2px; }

  /* ── Stat cards ──────────────────────────────────────── */
  .stats { display:grid; grid-template-columns:repeat(auto-fit,minmax(160px,1fr)); gap:16px; }
  .stat { background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:20px; text-align:center; }
  .stat-val { font-size:36px; font-weight:800; line-height:1; }
  .stat-lbl { color:var(--muted); font-size:12px; margin-top:6px; text-transform:uppercase; letter-spacing:.5px; }
  .stat-pass { border-color:var(--pass); }  .stat-pass .stat-val { color:var(--pass); }
  .stat-fail { border-color:var(--fail); }  .stat-fail .stat-val { color:var(--fail); }
  .stat-rate { border-color:var(--primary); } .stat-rate .stat-val { color:var(--primary); }
  .stat-dur  { border-color:var(--warn); }   .stat-dur  .stat-val { color:var(--warn); }

  /* ── Pass rate bar ───────────────────────────────────── */
  .progress-wrap { background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:24px; }
  .progress-header { display:flex; justify-content:space-between; margin-bottom:12px; }
  .progress-title { font-weight:600; }
  .progress-pct { font-size:24px; font-weight:800; color:${passRate >= 80 ? '#10b981' : passRate >= 50 ? '#f59e0b' : '#ef4444'}; }
  .progress-bar { background:var(--surface2); border-radius:999px; height:12px; overflow:hidden; }
  .progress-fill { height:100%; border-radius:999px; transition:width .8s ease;
    background:${passRate >= 80 ? 'linear-gradient(90deg,#10b981,#34d399)' : passRate >= 50 ? 'linear-gradient(90deg,#f59e0b,#fcd34d)' : 'linear-gradient(90deg,#ef4444,#f87171)'}; }

  /* ── Tables ──────────────────────────────────────────── */
  .table-wrap { background:var(--surface); border:1px solid var(--border); border-radius:12px; overflow:hidden; }
  table { width:100%; border-collapse:collapse; }
  th { background:var(--surface2); color:var(--muted); font-size:11px; font-weight:600; text-transform:uppercase;
    letter-spacing:.5px; padding:10px 14px; text-align:left; }
  td { padding:10px 14px; border-bottom:1px solid var(--border); vertical-align:top; }
  tr:last-child td { border-bottom:none; }
  tr:hover td { background:rgba(255,255,255,.03); }
  .row-pass td:first-child { border-left:3px solid var(--pass); }
  .row-fail td:first-child { border-left:3px solid var(--fail); }
  .tc-num { color:var(--muted); font-size:12px; width:36px; }
  .tc-id  { font-family:monospace; font-size:12px; background:var(--surface2); padding:2px 6px; border-radius:4px; }
  .tc-module { color:#a5b4fc; font-size:12px; max-width:160px; }
  .dur-col { color:var(--muted); font-size:12px; white-space:nowrap; }
  .actual-col { color:var(--muted); font-size:12px; max-width:200px; }
  .tc { text-align:center; }
  .pass-col { color:var(--pass); font-weight:600; }
  .fail-col { color:var(--fail); font-weight:600; }

  /* ── Mini bar ────────────────────────────────────────── */
  .mini-bar { background:var(--surface2); border-radius:999px; height:6px; width:80px; display:inline-block; vertical-align:middle; margin-right:6px; overflow:hidden; }
  .mini-fill { height:100%; border-radius:999px; }
  .mini-pct { font-size:12px; color:var(--muted); }

  /* ── Badges ──────────────────────────────────────────── */
  .badge { display:inline-block; padding:2px 9px; border-radius:999px; font-size:11px; font-weight:600; white-space:nowrap; }
  .badge-pass    { background:#064e3b; color:#34d399; border:1px solid #065f46; }
  .badge-fail    { background:#450a0a; color:#fca5a5; border:1px solid #7f1d1d; }
  .badge-skip    { background:#1e293b; color:#94a3b8; border:1px solid #334155; }
  .badge-not-run { background:#1e293b; color:#64748b; border:1px solid #334155; }
  .type-pos  { background:#1e3a5f; color:#93c5fd; }
  .type-neg  { background:#450a0a; color:#fca5a5; }
  .type-edge { background:#2d1b4e; color:#c4b5fd; }
  .pri-critical { background:#450a0a; color:#fca5a5; }
  .pri-high     { background:#431407; color:#fdba74; }
  .pri-medium   { background:#1e3a5f; color:#93c5fd; }
  .pri-low      { background:#064e3b; color:#6ee7b7; }

  /* ── Info box ────────────────────────────────────────── */
  .info-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
  .info-card { background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:20px; }
  .info-card h3 { font-size:13px; color:var(--muted); text-transform:uppercase; letter-spacing:.5px; margin-bottom:12px; }
  .info-row { display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid var(--border); }
  .info-row:last-child { border:none; }
  .info-key { color:var(--muted); font-size:13px; }
  .info-val { font-size:13px; font-weight:500; color:var(--text); }

  /* ── Footer ──────────────────────────────────────────── */
  .footer { border-top:1px solid var(--border); padding:24px 48px; text-align:center; color:var(--muted); font-size:12px; }

  /* ── Print ───────────────────────────────────────────── */
  @media print {
    body { background:#fff !important; color:#000 !important; }
    .header { background:#4f46e5 !important; color:#fff !important; -webkit-print-color-adjust:exact; }
    .badge, .stat, .table-wrap, .info-card, .progress-wrap { -webkit-print-color-adjust:exact; }
  }
</style>
</head>
<body>

<!-- ── Cover Header ─────────────────────────────────────────────────────────── -->
<div class="header">
  <div class="header-brand">
    <span>🤖</span>
    <h1>QA AI Testing Report</h1>
  </div>
  <div class="header-meta">
    <b>Target Application:</b> ${escHtml(appUrl)} &nbsp;|&nbsp;
    <b>Job ID:</b> ${jobId.slice(0, 8)} &nbsp;|&nbsp;
    <b>Generated:</b> ${dateStr}
  </div>
</div>

<div class="container">

  <!-- ── Execution Stats ────────────────────────────────────────────────────── -->
  <section>
    <h2>Execution Summary</h2>
    <div class="stats">
      <div class="stat">
        <div class="stat-val">${executionStats.total}</div>
        <div class="stat-lbl">Total Tests</div>
      </div>
      <div class="stat stat-pass">
        <div class="stat-val">${executionStats.passed}</div>
        <div class="stat-lbl">Passed</div>
      </div>
      <div class="stat stat-fail">
        <div class="stat-val">${executionStats.failed}</div>
        <div class="stat-lbl">Failed</div>
      </div>
      <div class="stat">
        <div class="stat-val">${executionStats.skipped || 0}</div>
        <div class="stat-lbl">Skipped</div>
      </div>
      <div class="stat stat-rate">
        <div class="stat-val">${passRate}%</div>
        <div class="stat-lbl">Pass Rate</div>
      </div>
      <div class="stat stat-dur">
        <div class="stat-val">${executionStats.duration || 0}s</div>
        <div class="stat-lbl">Duration</div>
      </div>
    </div>

    <div style="margin-top:16px;" class="progress-wrap">
      <div class="progress-header">
        <span class="progress-title">Overall Pass Rate</span>
        <span class="progress-pct">${passRate}%</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width:${passRate}%"></div>
      </div>
    </div>
  </section>

  <!-- ── Info ───────────────────────────────────────────────────────────────── -->
  <section>
    <h2>Test Execution Information</h2>
    <div class="info-grid">
      <div class="info-card">
        <h3>Configuration</h3>
        <div class="info-row"><span class="info-key">Application URL</span><span class="info-val">${escHtml(appUrl)}</span></div>
        <div class="info-row"><span class="info-key">Framework</span><span class="info-val">Playwright (Chromium)</span></div>
        <div class="info-row"><span class="info-key">Test Generation</span><span class="info-val">Rule-Based (AI-Ready)</span></div>
        <div class="info-row"><span class="info-key">Execution Type</span><span class="info-val">Parallel</span></div>
      </div>
      <div class="info-card">
        <h3>Results</h3>
        <div class="info-row"><span class="info-key">Total Test Cases</span><span class="info-val">${executionStats.total}</span></div>
        <div class="info-row"><span class="info-key">Modules Covered</span><span class="info-val">${Object.keys(groupByModule(testCases)).length}</span></div>
        <div class="info-row"><span class="info-key">Duration</span><span class="info-val">${executionStats.duration}s</span></div>
        <div class="info-row"><span class="info-key">Report Generated</span><span class="info-val">${dateStr}</span></div>
      </div>
    </div>
  </section>

  <!-- ── Module Summary ─────────────────────────────────────────────────────── -->
  <section>
    <h2>Module-wise Summary</h2>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Module</th>
            <th>Total</th>
            <th>Pass</th>
            <th>Fail</th>
            <th>Coverage</th>
          </tr>
        </thead>
        <tbody>${moduleRows}</tbody>
      </table>
    </div>
  </section>

  <!-- ── Detailed Test Cases ───────────────────────────────────────────────── -->
  <section>
    <h2>Detailed Test Results</h2>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>ID</th>
            <th>Module</th>
            <th>Title</th>
            <th>Type</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Duration</th>
            <th>Result / Error</th>
          </tr>
        </thead>
        <tbody>${testRows}</tbody>
      </table>
    </div>
  </section>

</div><!-- /container -->

<div class="footer">
  Generated by <strong>QA AI Testing Tool</strong> &nbsp;|&nbsp;
  Job ID: ${jobId} &nbsp;|&nbsp;
  ${dateStr}
</div>

</body>
</html>`;
}

function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function groupByModule(testCases) {
  const groups = {};
  for (const tc of testCases) {
    if (!groups[tc.module]) groups[tc.module] = { icon: tc.icon, tests: [] };
    groups[tc.module].tests.push(tc);
  }
  return groups;
}

module.exports = { generate };
