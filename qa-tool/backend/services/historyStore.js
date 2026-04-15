// ── Run History Store ─────────────────────────────────────────────────────────
// Persists last 10 test runs for trend analysis
const fs   = require('fs');
const path = require('path');

const HISTORY_FILE = path.join(__dirname, '../reports/run-history.json');
const MAX_RUNS     = 10;

function saveRun({ jobId, appUrl, environment, browsers, testScope, stats, timestamp }) {
  const history = getHistory();
  history.unshift({
    jobId,
    timestamp:   timestamp || new Date().toISOString(),
    appUrl,
    environment: environment || 'Unknown',
    browsers:    browsers    || ['chromium'],
    testScope:   testScope   || 'regression',
    total:       stats.total,
    passed:      stats.passed,
    failed:      stats.failed,
    skipped:     stats.skipped || 0,
    passRate:    stats.passRate,
    duration:    stats.duration,
  });

  const trimmed = history.slice(0, MAX_RUNS);
  try {
    fs.mkdirSync(path.dirname(HISTORY_FILE), { recursive: true });
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(trimmed, null, 2));
  } catch (e) { /* ignore write errors */ }
}

function getHistory() {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
    }
  } catch (e) { /* ignore */ }
  return [];
}

module.exports = { saveRun, getHistory };
