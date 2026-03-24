// @ts-check
import { test } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * PERFORMANCE REPORT GENERATOR
 * Reads JSON results from all performance tests and generates
 * a professional HTML dashboard report.
 *
 * Run AFTER all .perf.js tests have completed.
 */

test('Generate HTML Performance Dashboard Report', async () => {

  const resultsDir  = path.join(process.cwd(), 'performance-results');
  const reportPath  = path.join(resultsDir, 'performance-dashboard.html');

  // ── Load result files ────────────────────────────────────────────────
  const pageLoad = fs.existsSync(path.join(resultsDir, 'page-load-results.json'))
    ? JSON.parse(fs.readFileSync(path.join(resultsDir, 'page-load-results.json'), 'utf8'))
    : { results: [], budget: {} };

  const cwv = fs.existsSync(path.join(resultsDir, 'cwv-results.json'))
    ? JSON.parse(fs.readFileSync(path.join(resultsDir, 'cwv-results.json'), 'utf8'))
    : { results: [] };

  const load = fs.existsSync(path.join(resultsDir, 'load-results.json'))
    ? JSON.parse(fs.readFileSync(path.join(resultsDir, 'load-results.json'), 'utf8'))
    : { results: [] };

  const timestamp = new Date().toLocaleString('en-IN');

  // ── Compute summary stats ────────────────────────────────────────────
  const plPassed  = pageLoad.results.filter(r => r.pass).length;
  const plTotal   = pageLoad.results.length;
  const plAvgLoad = pageLoad.results.length > 0
    ? Math.round(pageLoad.results.reduce((s, r) => s + r.fullLoad, 0) / pageLoad.results.length)
    : 0;

  const cwvFiltered  = (cwv.results || []).filter(r => r.lcp > 0);
  const cwvGoodCount = cwvFiltered.filter(r => r.lcp <= 2500 && r.cls <= 0.1).length;

  const loadGroups  = [...new Set((load.results || []).map(r => r.test))];

  // ── HTML Report ──────────────────────────────────────────────────────
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
  <title>InsureAI — Performance Test Report</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', sans-serif; background: #f0f4f8; color: #1a1a2e; }
    .header { background: linear-gradient(135deg, #0d47a1, #1976d2); color: white; padding: 30px 40px; }
    .header h1 { font-size: 1.8rem; font-weight: 700; }
    .header p { opacity: .85; margin-top: 4px; }
    .badge { background: rgba(255,255,255,.2); padding: 4px 12px; border-radius: 20px; font-size: .8rem; display: inline-block; margin-top: 8px; }
    .container { max-width: 1200px; margin: 0 auto; padding: 30px 20px; }
    .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 30px; }
    .stat-card { background: white; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,.08); text-align: center; }
    .stat-value { font-size: 2rem; font-weight: 700; }
    .stat-label { color: #6c757d; font-size: .85rem; margin-top: 4px; }
    .section { background: white; border-radius: 12px; padding: 24px; margin-bottom: 24px; box-shadow: 0 2px 8px rgba(0,0,0,.08); }
    .section h2 { font-size: 1.1rem; font-weight: 700; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
    table { width: 100%; border-collapse: collapse; font-size: .88rem; }
    th { background: #f8f9fa; padding: 10px 12px; text-align: left; font-size: .78rem; text-transform: uppercase; letter-spacing: .04em; color: #6c757d; border-bottom: 2px solid #dee2e6; }
    td { padding: 10px 12px; border-bottom: 1px solid #f1f3f5; }
    tr:hover td { background: #f8f9ff; }
    .pass { background: #e8f5e9; color: #2e7d32; padding: 3px 10px; border-radius: 12px; font-size: .78rem; font-weight: 600; }
    .fail { background: #ffebee; color: #c62828; padding: 3px 10px; border-radius: 12px; font-size: .78rem; font-weight: 600; }
    .good { color: #2e7d32; font-weight: 600; }
    .warn { color: #f57f17; font-weight: 600; }
    .poor { color: #c62828; font-weight: 600; }
    .bar-wrap { background: #e9ecef; border-radius: 4px; height: 8px; width: 120px; display: inline-block; vertical-align: middle; }
    .bar-fill { height: 100%; border-radius: 4px; }
    .metric-good { background: #4caf50; }
    .metric-warn { background: #ff9800; }
    .metric-poor { background: #f44336; }
    .cwv-card { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 12px; padding: 14px; background: #f8f9ff; border-radius: 8px; border-left: 4px solid #0d47a1; }
    .cwv-metric { text-align: center; min-width: 80px; }
    .cwv-metric .val { font-size: 1.3rem; font-weight: 700; }
    .cwv-metric .lbl { font-size: .72rem; color: #6c757d; text-transform: uppercase; }
    .cwv-page-name { font-weight: 600; margin-bottom: 8px; color: #0d47a1; }
    .footer { text-align: center; padding: 20px; color: #6c757d; font-size: .85rem; }
    .tool-tag { background: #e3f2fd; color: #0d47a1; padding: 2px 8px; border-radius: 4px; font-size: .78rem; font-weight: 600; }
    .progress-bar { height: 20px; background: #e9ecef; border-radius: 4px; overflow: hidden; }
    .progress-fill { height: 100%; border-radius: 4px; background: linear-gradient(90deg, #0d47a1, #1976d2); display: flex; align-items: center; padding-left: 8px; color: white; font-size: .75rem; font-weight: 600; }
    @media (max-width: 768px) { .summary-grid { grid-template-columns: repeat(2, 1fr); } }
  </style>
</head>
<body>

<div class="header">
  <h1>⚡ InsureAI — Performance Test Report</h1>
  <p>Automated performance testing using Playwright — No JMeter Required</p>
  <div>
    <span class="badge">📅 Generated: ${timestamp}</span>
    <span class="badge" style="margin-left:8px">🔧 Tool: Playwright + Web APIs</span>
    <span class="badge" style="margin-left:8px">🌐 App: InsureAI Insurance Portal</span>
  </div>
</div>

<div class="container">

  <!-- SUMMARY STATS -->
  <div class="summary-grid">
    <div class="stat-card">
      <div class="stat-value" style="color:#0d47a1">${plTotal}</div>
      <div class="stat-label">Pages Tested</div>
    </div>
    <div class="stat-card">
      <div class="stat-value" style="color:${plPassed === plTotal ? '#2e7d32' : '#c62828'}">${plPassed}/${plTotal}</div>
      <div class="stat-label">Load Budget Passed</div>
    </div>
    <div class="stat-card">
      <div class="stat-value" style="color:#1976d2">${plAvgLoad}ms</div>
      <div class="stat-label">Average Load Time</div>
    </div>
    <div class="stat-card">
      <div class="stat-value" style="color:${cwvGoodCount === cwvFiltered.length ? '#2e7d32' : '#f57f17'}">${cwvGoodCount}/${cwvFiltered.length}</div>
      <div class="stat-label">Core Web Vitals Passed</div>
    </div>
  </div>

  <!-- PAGE LOAD TIMES -->
  <div class="section">
    <h2>📄 Page Load Times <span class="tool-tag">Navigation Timing API</span></h2>
    <p style="color:#6c757d;font-size:.85rem;margin-bottom:16px">Budget: TTFB &lt; 600ms | FCP &lt; 1800ms | Full Load &lt; 3000ms (REQ-017)</p>
    <table>
      <thead>
        <tr>
          <th>Page</th>
          <th>TTFB</th>
          <th>FCP</th>
          <th>DOM Ready</th>
          <th>Full Load</th>
          <th>DOM Nodes</th>
          <th>Resources</th>
          <th>Budget</th>
        </tr>
      </thead>
      <tbody>
        ${pageLoad.results.map(r => {
          const loadBar = Math.min(100, Math.round(r.fullLoad / 3000 * 100));
          const barClass = r.fullLoad <= 1500 ? 'metric-good' : r.fullLoad <= 3000 ? 'metric-warn' : 'metric-poor';
          return `<tr>
            <td><strong>${r.page}</strong></td>
            <td class="${r.ttfb <= 600 ? 'good' : 'warn'}">${r.ttfb}ms</td>
            <td class="${r.fcp <= 1800 ? 'good' : r.fcp <= 3000 ? 'warn' : 'poor'}">${r.fcp}ms</td>
            <td>${r.domContentLoaded}ms</td>
            <td>
              <span class="${r.fullLoad <= 3000 ? 'good' : 'poor'}">${r.fullLoad}ms</span>
              <div class="bar-wrap" style="margin-left:6px">
                <div class="bar-fill ${barClass}" style="width:${loadBar}%"></div>
              </div>
            </td>
            <td>${r.domElements}</td>
            <td>${r.resourceCount} (${r.totalResourceKB}KB)</td>
            <td><span class="${r.pass ? 'pass' : 'fail'}">${r.pass ? '✅ PASS' : '❌ FAIL'}</span></td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
  </div>

  <!-- CORE WEB VITALS -->
  <div class="section">
    <h2>🌐 Core Web Vitals <span class="tool-tag">PerformanceObserver API</span></h2>
    <p style="color:#6c757d;font-size:.85rem;margin-bottom:16px">LCP Good &lt;2.5s | FCP Good &lt;1.8s | CLS Good &lt;0.1 | TBT Good &lt;200ms</p>
    ${cwvFiltered.map(r => {
      const lcpClass = r.lcp <= 2500 ? 'good' : r.lcp <= 4000 ? 'warn' : 'poor';
      const fcpClass = r.fcp <= 1800 ? 'good' : r.fcp <= 3000 ? 'warn' : 'poor';
      const clsClass = r.cls <= 0.1 ? 'good' : r.cls <= 0.25 ? 'warn' : 'poor';
      const tbtClass = r.tbt <= 200 ? 'good' : r.tbt <= 600 ? 'warn' : 'poor';
      return `<div>
        <div class="cwv-page-name">📄 ${r.page}</div>
        <div class="cwv-card">
          <div class="cwv-metric">
            <div class="val ${lcpClass}">${r.lcp}ms</div>
            <div class="lbl">LCP</div>
          </div>
          <div class="cwv-metric">
            <div class="val ${fcpClass}">${r.fcp}ms</div>
            <div class="lbl">FCP</div>
          </div>
          <div class="cwv-metric">
            <div class="val ${clsClass}">${r.cls}</div>
            <div class="lbl">CLS</div>
          </div>
          <div class="cwv-metric">
            <div class="val ${tbtClass}">${r.tbt}ms</div>
            <div class="lbl">TBT</div>
          </div>
          <div class="cwv-metric">
            <div class="val">${r.ttfb}ms</div>
            <div class="lbl">TTFB</div>
          </div>
        </div>
      </div>`;
    }).join('')}
  </div>

  <!-- CONCURRENT USERS -->
  <div class="section">
    <h2>👥 Concurrent Users & Load Tests <span class="tool-tag">Playwright Multi-Context</span></h2>
    <table>
      <thead>
        <tr><th>Test Scenario</th><th>Concurrent Users</th><th>Page</th><th>Load Time</th><th>Status</th></tr>
      </thead>
      <tbody>
        ${loadGroups.map(g => {
          const group = (load.results || []).filter(r => r.test === g);
          const avg = Math.round(group.reduce((s, r) => s + r.loadTime, 0) / Math.max(group.length, 1));
          const max = Math.max(...group.map(r => r.loadTime));
          const passed = group.filter(r => r.pass).length;
          const users = group[0]?.users || 1;
          return `<tr>
            <td><strong>${g}</strong></td>
            <td>${users} user${users > 1 ? 's' : ''}</td>
            <td>${group[0]?.page || '-'}</td>
            <td>Avg: <strong>${avg}ms</strong> | Max: ${max}ms</td>
            <td><span class="${passed === group.length ? 'pass' : 'fail'}">${passed}/${group.length} passed</span></td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
  </div>

  <!-- PERFORMANCE BUDGET COMPLIANCE -->
  <div class="section">
    <h2>🎯 Performance Budget Compliance Summary</h2>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
      <div>
        <h3 style="font-size:.9rem;margin-bottom:12px;color:#6c757d">Page Load Budget (< 3000ms)</h3>
        <div style="margin-bottom:8px">
          <div style="display:flex;justify-content:space-between;margin-bottom:4px">
            <span style="font-size:.85rem">Pages within budget</span>
            <span style="font-size:.85rem;font-weight:700">${plPassed}/${plTotal}</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width:${Math.round(plPassed/Math.max(plTotal,1)*100)}%">${Math.round(plPassed/Math.max(plTotal,1)*100)}%</div>
          </div>
        </div>
      </div>
      <div>
        <h3 style="font-size:.9rem;margin-bottom:12px;color:#6c757d">Core Web Vitals (Good rating)</h3>
        <div style="margin-bottom:8px">
          <div style="display:flex;justify-content:space-between;margin-bottom:4px">
            <span style="font-size:.85rem">Pages with Good CWV</span>
            <span style="font-size:.85rem;font-weight:700">${cwvGoodCount}/${cwvFiltered.length}</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width:${Math.round(cwvGoodCount/Math.max(cwvFiltered.length,1)*100)}%">${Math.round(cwvGoodCount/Math.max(cwvFiltered.length,1)*100)}%</div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- TOOLS COMPARISON -->
  <div class="section">
    <h2>🔧 Why Playwright for Performance Testing?</h2>
    <table>
      <thead><tr><th>Feature</th><th>JMeter</th><th>Playwright (This Report)</th></tr></thead>
      <tbody>
        <tr><td>Setup Required</td><td>Java + GUI install</td><td class="good">Already installed (npm)</td></tr>
        <tr><td>Page Load Measurement</td><td>HTTP response time only</td><td class="good">Real browser timing (FCP, LCP, CLS)</td></tr>
        <tr><td>Core Web Vitals</td><td>❌ Not supported</td><td class="good">✅ PerformanceObserver API</td></tr>
        <tr><td>Visual Rendering</td><td>❌ No browser rendering</td><td class="good">✅ Real Chrome rendering</td></tr>
        <tr><td>User Simulation</td><td>Virtual threads</td><td class="good">Real browser contexts</td></tr>
        <tr><td>Memory Testing</td><td>Basic heap monitoring</td><td class="good">Chrome DevTools Protocol (CDP)</td></tr>
        <tr><td>Integration with E2E Tests</td><td>❌ Separate tool</td><td class="good">✅ Same test suite</td></tr>
        <tr><td>CI/CD Integration</td><td>Complex setup</td><td class="good">✅ npx playwright test</td></tr>
        <tr><td>HTML Report</td><td>Requires plugins</td><td class="good">✅ Built-in + custom</td></tr>
      </tbody>
    </table>
  </div>

</div>

<div class="footer">
  InsureAI Performance Report · Generated by Playwright · ${timestamp}
</div>

</body>
</html>`;

  if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });
  fs.writeFileSync(reportPath, html);

  console.log('\n════════════════════════════════════════════════════════');
  console.log('📊 PERFORMANCE DASHBOARD REPORT GENERATED');
  console.log(`📁 Location: ${reportPath}`);
  console.log('🌐 Open in browser to view the full dashboard');
  console.log('════════════════════════════════════════════════════════');
});
