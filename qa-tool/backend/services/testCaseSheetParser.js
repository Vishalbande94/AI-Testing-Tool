// ── Test Case Sheet Parser ───────────────────────────────────────────────────
// Reads a QA engineer's test-case sheet (CSV or XLSX) and converts it to the
// internal testCase schema — bypassing requirement analysis entirely.
//
// Accepted columns (case-insensitive, flexible):
//   id | tc_id | test_id               → unique ID
//   title | name | summary | scenario  → test title
//   steps | test_steps                 → pipe-, semicolon-, or newline-separated steps
//   expected | expected_result         → expected outcome
//   priority                           → Critical | High | Medium | Low
//   type | category                    → Positive | Negative | Boundary | Security | ...
//   module | feature                   → module grouping
//   testdata | test_data               → optional test data string
//   preconditions                      → optional
const fs       = require('fs');
const path     = require('path');
const ExcelJS  = require('exceljs');

/**
 * Parse a test-case sheet into the canonical test-case schema.
 * @param {string} filePath - absolute path to .csv / .xlsx / .xls
 * @returns {Promise<Array>} - array of test cases
 */
async function parse(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.csv') return parseCsv(filePath);
  if (ext === '.xlsx' || ext === '.xls') return parseXlsx(filePath);
  throw new Error(`Unsupported file type: ${ext}. Use .csv or .xlsx.`);
}

// ── CSV parser (RFC 4180 compliant for common cases) ────────────────────────
function parseCsv(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const rows = splitCsv(content);
  if (rows.length < 2) throw new Error('CSV must have a header row and at least one data row.');

  const headers = rows[0].map(normalizeKey);
  const dataRows = rows.slice(1).filter(r => r.some(c => c && c.trim() !== ''));

  return dataRows.map((row, i) => rowToTestCase(headers, row, i));
}

function splitCsv(text) {
  const rows = [];
  let current = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') { cell += '"'; i++; }
      else if (ch === '"')              { inQuotes = false; }
      else                              { cell += ch; }
    } else {
      if (ch === '"')            { inQuotes = true; }
      else if (ch === ',')       { current.push(cell); cell = ''; }
      else if (ch === '\r')      { /* skip */ }
      else if (ch === '\n')      { current.push(cell); rows.push(current); current = []; cell = ''; }
      else                       { cell += ch; }
    }
  }
  if (cell !== '' || current.length > 0) { current.push(cell); rows.push(current); }
  return rows;
}

// ── Excel parser (uses exceljs, already a dep) ──────────────────────────────
async function parseXlsx(filePath) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const sheet = workbook.worksheets[0];
  if (!sheet) throw new Error('No worksheets found in the Excel file.');

  const rows = [];
  sheet.eachRow({ includeEmpty: false }, (row) => {
    const values = [];
    // row.values is 1-indexed in exceljs
    for (let i = 1; i < row.values.length; i++) {
      const v = row.values[i];
      values.push(v == null ? '' : (typeof v === 'object' ? (v.text || v.result || String(v)) : String(v)));
    }
    rows.push(values);
  });

  if (rows.length < 2) throw new Error('Excel sheet must have a header row and at least one data row.');
  const headers = rows[0].map(normalizeKey);
  return rows.slice(1).map((row, i) => rowToTestCase(headers, row, i));
}

// ── Canonical column aliases ────────────────────────────────────────────────
const COLUMN_ALIASES = {
  id:             ['id', 'tcid', 'testid', 'test id', 'tc id', 'case id', 'caseid', 'testcaseid', 'test_case_id'],
  title:          ['title', 'name', 'summary', 'scenario', 'testname', 'test name', 'testcase', 'test case', 'description'],
  steps:          ['steps', 'teststeps', 'test steps', 'stepstoexecute', 'step'],
  expected:       ['expected', 'expectedresult', 'expected result', 'expectedoutput', 'expected output', 'result'],
  priority:       ['priority', 'severity'],
  type:           ['type', 'category', 'testtype', 'test type'],
  module:         ['module', 'feature', 'component', 'area'],
  testData:       ['testdata', 'test data', 'data'],
  preconditions:  ['preconditions', 'precondition', 'pre-conditions', 'prerequisites', 'pre-requisites'],
};

function normalizeKey(s) {
  return String(s || '').toLowerCase().trim().replace(/[_-]/g, '').replace(/\s+/g, ' ');
}

function findColumn(headers, aliases) {
  const normalizedAliases = aliases.map(a => a.toLowerCase().replace(/[_-]/g, '').replace(/\s+/g, ' '));
  return headers.findIndex(h => normalizedAliases.includes(h));
}

function rowToTestCase(headers, row, index) {
  const get = (key) => {
    const idx = findColumn(headers, COLUMN_ALIASES[key]);
    if (idx === -1) return '';
    return (row[idx] || '').toString().trim();
  };

  const id       = get('id')    || `TC_${String(index + 1).padStart(3, '0')}`;
  const title    = get('title') || '(no title)';
  const stepsRaw = get('steps');
  const expected = get('expected');
  const priority = normalizePriority(get('priority')) || 'Medium';
  const type     = normalizeType(get('type'))         || 'Positive';
  const module_  = get('module') || 'Imported';
  const testData = get('testData');
  const preconds = get('preconditions');

  const steps = splitSteps(stepsRaw);

  // Derive a stable playwrightKey for result-merging
  const playwrightKey = `${module_}_${id}`.toLowerCase().replace(/[^a-z0-9_]/g, '_').slice(0, 60);

  return {
    id,
    module:        module_,
    icon:          '📋',
    title,
    type,
    category:      type,
    priority,
    preconditions: preconds,
    steps,
    expected,
    testData,
    playwrightKey,
    status:        'Not Executed',
    actual:        '',
    error:         '',
    duration:      null,
    screenshot:    null,
    _imported:     true,
  };
}

// Multi-step cell: supports pipe "|", semicolon ";", or newline separators
function splitSteps(str) {
  if (!str) return [];
  // Prefer numbered-list detection first: "1. foo 2. bar"
  const numbered = str.split(/(?:^|\s)\d+[\.\)]\s+/).map(s => s.trim()).filter(Boolean);
  if (numbered.length > 1) return numbered;
  // Pipe / semicolon / newline
  const split = str.split(/\s*(?:\||;|\n|\r)\s*/).map(s => s.trim()).filter(Boolean);
  return split.length ? split : [str.trim()];
}

function normalizePriority(p) {
  const v = String(p || '').toLowerCase().trim();
  if (['p0', 'critical', 'blocker', 'urgent', '1'].includes(v)) return 'Critical';
  if (['p1', 'high', '2'].includes(v))                           return 'High';
  if (['p2', 'medium', 'normal', 'med', '3'].includes(v))        return 'Medium';
  if (['p3', 'low', 'minor', '4'].includes(v))                   return 'Low';
  if (!v) return null;
  return p; // leave as-is if non-standard
}

function normalizeType(t) {
  const v = String(t || '').toLowerCase().trim();
  if (!v) return null;
  if (['positive', 'pos', 'happy', 'happy path', 'smoke', 'sanity', 'functional']) {
    if (['positive', 'pos', 'happy', 'happy path', 'smoke'].includes(v)) return 'Positive';
  }
  if (['negative', 'neg', 'error'].includes(v))              return 'Negative';
  if (['boundary', 'bva', 'limit'].includes(v))              return 'Boundary';
  if (['edge', 'edge case', 'edgecase'].includes(v))         return 'Edge';
  if (['security', 'sec', 'owasp'].includes(v))              return 'Security';
  if (['accessibility', 'a11y', 'wcag'].includes(v))         return 'Accessibility';
  if (['performance', 'perf', 'load'].includes(v))           return 'Performance';
  if (['integration', 'api', 'e2e'].includes(v))             return 'Integration';
  return t;
}

// ── Generate a sample CSV template ──────────────────────────────────────────
function sampleCsv() {
  const rows = [
    ['ID', 'Module', 'Title', 'Type', 'Priority', 'Preconditions', 'Steps', 'Expected Result', 'Test Data'],
    ['TC_001', 'Authentication', 'Login with valid credentials', 'Positive', 'Critical', 'User is registered',
      '1. Navigate to login page | 2. Enter valid email | 3. Enter valid password | 4. Click Login',
      'User is redirected to the dashboard', 'email=user@test.com, password=Test@1234'],
    ['TC_002', 'Authentication', 'Login with invalid password', 'Negative', 'High', 'User is registered',
      '1. Navigate to login page | 2. Enter valid email | 3. Enter wrong password | 4. Click Login',
      'Error message "Invalid credentials" is displayed', 'email=user@test.com, password=Wrong!'],
    ['TC_003', 'Dashboard', 'Dashboard loads within 2s', 'Performance', 'Medium', 'User is logged in',
      '1. Click Dashboard link | 2. Measure page load time',
      'Dashboard renders in < 2 seconds', ''],
    ['TC_004', 'Security', 'XSS sanitization in search', 'Security', 'Critical', 'Search field is visible',
      '1. Enter <script>alert(1)</script> in search | 2. Submit | 3. Observe output',
      'Payload is escaped; no alert fires', '<script>alert(1)</script>'],
    ['TC_005', 'Form', 'Submit with required field empty', 'Negative', 'High', 'Form has at least one required field',
      '1. Leave required field empty | 2. Click Submit',
      'Validation error shown, form not submitted', ''],
  ];
  return rows.map(r => r.map(cell => {
    const s = String(cell);
    return /[,"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }).join(',')).join('\n');
}

// ── Generate a sample XLSX template buffer ──────────────────────────────────
async function sampleXlsx() {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Test Cases');
  ws.columns = [
    { header: 'ID',              key: 'id',            width: 12 },
    { header: 'Module',          key: 'module',        width: 18 },
    { header: 'Title',           key: 'title',         width: 42 },
    { header: 'Type',            key: 'type',          width: 14 },
    { header: 'Priority',        key: 'priority',      width: 12 },
    { header: 'Preconditions',   key: 'preconditions', width: 28 },
    { header: 'Steps',           key: 'steps',         width: 60 },
    { header: 'Expected Result', key: 'expected',      width: 38 },
    { header: 'Test Data',       key: 'testData',      width: 30 },
  ];
  ws.getRow(1).font = { bold: true };
  ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0891B2' } };
  ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

  const rows = [
    { id: 'TC_001', module: 'Authentication', title: 'Login with valid credentials', type: 'Positive', priority: 'Critical',
      preconditions: 'User is registered',
      steps: '1. Navigate to login page | 2. Enter valid email | 3. Enter valid password | 4. Click Login',
      expected: 'User is redirected to the dashboard',
      testData: 'email=user@test.com, password=Test@1234' },
    { id: 'TC_002', module: 'Authentication', title: 'Login with invalid password', type: 'Negative', priority: 'High',
      preconditions: 'User is registered',
      steps: '1. Navigate to login page | 2. Enter valid email | 3. Enter wrong password | 4. Click Login',
      expected: 'Error message "Invalid credentials" is displayed',
      testData: 'email=user@test.com, password=Wrong!' },
    { id: 'TC_003', module: 'Dashboard', title: 'Dashboard loads within 2s', type: 'Performance', priority: 'Medium',
      preconditions: 'User is logged in',
      steps: '1. Click Dashboard link | 2. Measure page load time',
      expected: 'Dashboard renders in < 2 seconds', testData: '' },
    { id: 'TC_004', module: 'Security', title: 'XSS sanitization in search', type: 'Security', priority: 'Critical',
      preconditions: 'Search field is visible',
      steps: '1. Enter <script>alert(1)</script> in search | 2. Submit | 3. Observe output',
      expected: 'Payload is escaped; no alert fires',
      testData: '<script>alert(1)</script>' },
    { id: 'TC_005', module: 'Form', title: 'Submit with required field empty', type: 'Negative', priority: 'High',
      preconditions: 'Form has at least one required field',
      steps: '1. Leave required field empty | 2. Click Submit',
      expected: 'Validation error shown, form not submitted', testData: '' },
  ];
  rows.forEach(r => ws.addRow(r));

  return wb.xlsx.writeBuffer();
}

module.exports = { parse, sampleCsv, sampleXlsx };
