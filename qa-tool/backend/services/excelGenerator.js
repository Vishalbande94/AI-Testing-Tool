// ── Excel Test Cases Generator ────────────────────────────────────────────────
// Produces a styled .xlsx file with all test cases + execution results
const ExcelJS = require('exceljs');
const path    = require('path');

/**
 * Generate a formatted Excel workbook from test cases.
 * @param {Array}  testCases  - Updated test cases with status/actual/error
 * @param {Object} stats      - { total, passed, failed, skipped, duration, passRate }
 * @param {string} appUrl     - Tested application URL
 * @param {string} outputDir  - Directory to save the file
 * @returns {string} Full path to saved .xlsx file
 */
async function generate(testCases, stats, appUrl, outputDir) {
  const wb   = new ExcelJS.Workbook();
  wb.creator  = 'QA AI Testing Tool';
  wb.created  = new Date();
  wb.modified = new Date();

  await buildSummarySheet(wb, testCases, stats, appUrl);
  await buildTestCasesSheet(wb, testCases);
  await buildModuleSheet(wb, testCases);

  const filePath = path.join(outputDir, 'test-cases.xlsx');
  await wb.xlsx.writeFile(filePath);
  return filePath;
}

// ── Sheet 1: Executive Summary ─────────────────────────────────────────────────
async function buildSummarySheet(wb, testCases, stats, appUrl) {
  const ws = wb.addWorksheet('📊 Summary', {
    views: [{ showGridLines: false }],
    properties: { tabColor: { argb: 'FF6366F1' } },
  });

  ws.columns = [
    { width: 30 },
    { width: 35 },
    { width: 20 },
  ];

  // ── Title block ──────────────────────────────────────────────────────────────
  ws.mergeCells('A1:C1');
  const titleCell = ws.getCell('A1');
  titleCell.value = '🤖 QA AI TESTING TOOL — EXECUTION REPORT';
  titleCell.font  = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(1).height = 36;

  ws.mergeCells('A2:C2');
  const subCell = ws.getCell('A2');
  subCell.value = `Application: ${appUrl}   |   Generated: ${new Date().toLocaleString('en-IN')}`;
  subCell.font  = { size: 10, color: { argb: 'FFCBD5E1' } };
  subCell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF312E81' } };
  subCell.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(2).height = 22;

  ws.addRow([]); // spacer

  // ── Stats table ──────────────────────────────────────────────────────────────
  const statsRows = [
    ['Metric', 'Value', 'Status'],
    ['Total Test Cases',   stats.total,    ''],
    ['Passed',             stats.passed,   stats.passed   > 0 ? '✅ Pass' : '—'],
    ['Failed',             stats.failed,   stats.failed   > 0 ? '❌ Fail' : '—'],
    ['Skipped',            stats.skipped || 0, stats.skipped > 0 ? '⏭️ Skipped' : '—'],
    ['Pass Rate',          `${stats.passRate || 0}%`, stats.passRate >= 80 ? '🟢 Good' : stats.passRate >= 50 ? '🟡 Needs Work' : '🔴 Poor'],
    ['Execution Duration', `${stats.duration || 0}s`, ''],
  ];

  statsRows.forEach((row, i) => {
    const r = ws.addRow(row);
    r.height = 24;

    if (i === 0) {
      // Header row
      r.eachCell(cell => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = borderStyle();
      });
    } else {
      r.getCell(1).font = { bold: true, color: { argb: 'FF94A3B8' } };
      r.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };

      // Color-code value cell for Pass/Fail/Rate
      const valCell = r.getCell(2);
      valCell.font  = { bold: true, size: 12 };
      valCell.alignment = { horizontal: 'center' };
      if (row[0] === 'Passed')   valCell.font.color = { argb: 'FF10B981' };
      if (row[0] === 'Failed')   valCell.font.color = { argb: 'FFEF4444' };
      if (row[0] === 'Pass Rate') {
        const rate = stats.passRate || 0;
        valCell.font.color = { argb: rate >= 80 ? 'FF10B981' : rate >= 50 ? 'FFF59E0B' : 'FFEF4444' };
      }

      r.eachCell(cell => {
        cell.border = borderStyle();
        cell.alignment = cell.alignment || { vertical: 'middle' };
      });
      r.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' };
    }
  });

  ws.addRow([]); // spacer

  // ── Module breakdown ──────────────────────────────────────────────────────────
  ws.addRow(['📋 MODULE BREAKDOWN', '', '']).eachCell(cell => {
    cell.font = { bold: true, size: 11, color: { argb: 'FF6366F1' } };
  });

  const modHeader = ws.addRow(['Module', 'Total', 'Pass', 'Fail', 'Pass Rate']);
  modHeader.height = 22;
  modHeader.eachCell(cell => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
    cell.border = borderStyle();
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  const modules = groupByModule(testCases);
  Object.entries(modules).forEach(([mod, tcs]) => {
    const pass = tcs.filter(t => t.status === 'Pass').length;
    const fail = tcs.filter(t => t.status === 'Fail').length;
    const rate = tcs.length > 0 ? `${Math.round(pass / tcs.length * 100)}%` : '0%';
    const r = ws.addRow([mod, tcs.length, pass, fail, rate]);
    r.height = 20;
    r.getCell(3).font = { color: { argb: 'FF10B981' }, bold: true };
    r.getCell(4).font = { color: { argb: 'FFEF4444' }, bold: true };
    r.eachCell(cell => {
      cell.border = borderStyle();
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });
    r.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
  });
}

// ── Sheet 2: All Test Cases ────────────────────────────────────────────────────
async function buildTestCasesSheet(wb, testCases) {
  const ws = wb.addWorksheet('📋 Test Cases', {
    views: [{ state: 'frozen', ySplit: 1, showGridLines: false }],
    properties: { tabColor: { argb: 'FF10B981' } },
  });

  // Column definitions
  ws.columns = [
    { header: 'Test Case ID',    key: 'id',       width: 14 },
    { header: 'Module',          key: 'module',   width: 28 },
    { header: 'Title',           key: 'title',    width: 45 },
    { header: 'Type',            key: 'type',     width: 12 },
    { header: 'Priority',        key: 'priority', width: 12 },
    { header: 'Test Steps',      key: 'steps',    width: 55 },
    { header: 'Expected Result', key: 'expected', width: 45 },
    { header: 'Actual Result',   key: 'actual',   width: 45 },
    { header: 'Status',          key: 'status',   width: 14 },
    { header: 'Duration (ms)',   key: 'duration', width: 14 },
    { header: 'Error / Notes',   key: 'error',    width: 50 },
  ];

  // Style header row
  const headerRow = ws.getRow(1);
  headerRow.height = 28;
  headerRow.eachCell(cell => {
    cell.font      = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
    cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border    = borderStyle();
  });

  // Data rows
  testCases.forEach((tc, idx) => {
    const row = ws.addRow({
      id:       tc.id,
      module:   tc.module,
      title:    tc.title,
      type:     tc.type,
      priority: tc.priority,
      steps:    Array.isArray(tc.steps) ? tc.steps.map((s, i) => `${i + 1}. ${s}`).join('\n') : tc.steps,
      expected: tc.expected || '',
      actual:   tc.actual   || '',
      status:   statusLabel(tc.status),
      duration: tc.duration != null ? tc.duration : '',
      error:    tc.error || '',
    });

    row.height = 60;

    // Alternate row background
    const bgColor = idx % 2 === 0 ? 'FF0F172A' : 'FF1A2332';

    row.eachCell(cell => {
      cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
      cell.font      = { color: { argb: 'FFF1F5F9' }, size: 10 };
      cell.border    = borderStyle();
      cell.alignment = { vertical: 'top', wrapText: true };
    });

    // ID — monospace style
    row.getCell('id').font = { name: 'Courier New', size: 10, bold: true, color: { argb: 'FFA5B4FC' } };

    // Type colors
    const typeCell = row.getCell('type');
    if (tc.type === 'Positive') typeCell.font.color = { argb: 'FF34D399' };
    if (tc.type === 'Negative') typeCell.font.color = { argb: 'FFFCA5A5' };
    if (tc.type === 'Edge')     typeCell.font.color = { argb: 'FFC4B5FD' };
    typeCell.alignment = { horizontal: 'center', vertical: 'top' };

    // Priority colors
    const priCell = row.getCell('priority');
    const priColors = { Critical: 'FFFCA5A5', High: 'FFFDBA74', Medium: 'FF93C5FD', Low: 'FF6EE7B7' };
    priCell.font.color = { argb: priColors[tc.priority] || 'FFF1F5F9' };
    priCell.font.bold  = true;
    priCell.alignment  = { horizontal: 'center', vertical: 'top' };

    // Status — colored cell background
    const statusCell = row.getCell('status');
    applyStatusStyle(statusCell, tc.status);

    // Duration — center aligned
    row.getCell('duration').alignment = { horizontal: 'center', vertical: 'top' };
  });

  // Auto-filter on header
  ws.autoFilter = { from: 'A1', to: 'K1' };
}

// ── Sheet 3: Module-wise breakdown ─────────────────────────────────────────────
async function buildModuleSheet(wb, testCases) {
  const ws = wb.addWorksheet('📁 By Module', {
    views: [{ showGridLines: false }],
    properties: { tabColor: { argb: 'FFF59E0B' } },
  });

  const modules = groupByModule(testCases);

  let currentRow = 1;

  Object.entries(modules).forEach(([mod, tcs]) => {
    // Module header
    ws.mergeCells(`A${currentRow}:H${currentRow}`);
    const modCell = ws.getCell(`A${currentRow}`);
    modCell.value = `  ${tcs[0]?.icon || '📋'}  ${mod}`;
    modCell.font  = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
    modCell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
    modCell.alignment = { vertical: 'middle' };
    ws.getRow(currentRow).height = 28;
    currentRow++;

    // Column headers for this module
    const colHdr = ws.addRow(['ID', 'Title', 'Type', 'Priority', 'Status', 'Duration', 'Expected Result', 'Error']);
    colHdr.height = 22;
    colHdr.eachCell(cell => {
      cell.font      = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
      cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
      cell.border    = borderStyle();
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });
    currentRow++;

    tcs.forEach(tc => {
      const r = ws.addRow([
        tc.id,
        tc.title,
        tc.type,
        tc.priority,
        statusLabel(tc.status),
        tc.duration != null ? `${tc.duration}ms` : '—',
        tc.expected || '',
        tc.error    || '',
      ]);
      r.height = 40;
      r.eachCell(cell => {
        cell.border    = borderStyle();
        cell.alignment = { vertical: 'top', wrapText: true };
        cell.font      = { size: 10 };
      });
      applyStatusStyle(r.getCell(5), tc.status);
      currentRow++;
    });

    // Summary row
    const pass = tcs.filter(t => t.status === 'Pass').length;
    const summaryRow = ws.addRow([`Total: ${tcs.length}`, `Passed: ${pass}`, `Failed: ${tcs.filter(t => t.status === 'Fail').length}`, '', `${Math.round(pass / tcs.length * 100)}% Pass`, '', '', '']);
    summaryRow.height = 20;
    summaryRow.eachCell(cell => {
      cell.font = { bold: true, italic: true, color: { argb: 'FF94A3B8' }, size: 9 };
    });
    currentRow++;

    ws.addRow([]); // spacer
    currentRow++;
  });

  // Set column widths
  ws.columns = [
    { width: 14 }, { width: 40 }, { width: 12 },
    { width: 12 }, { width: 14 }, { width: 12 },
    { width: 40 }, { width: 40 },
  ];
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function groupByModule(testCases) {
  const g = {};
  for (const tc of testCases) {
    if (!g[tc.module]) g[tc.module] = [];
    g[tc.module].push(tc);
  }
  return g;
}

function statusLabel(status) {
  const map = { Pass: '✅ Pass', Fail: '❌ Fail', Skipped: '⏭️ Skipped', 'Not Executed': '⏸️ Not Executed' };
  return map[status] || status;
}

function applyStatusStyle(cell, status) {
  const styles = {
    Pass:          { fg: 'FF064E3B', font: 'FF34D399' },
    Fail:          { fg: 'FF450A0A', font: 'FFFCA5A5' },
    Skipped:       { fg: 'FF1E293B', font: 'FF94A3B8' },
    'Not Executed':{ fg: 'FF1E293B', font: 'FF64748B' },
  };
  const s = styles[status] || styles['Not Executed'];
  cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: s.fg } };
  cell.font      = { bold: true, color: { argb: s.font } };
  cell.alignment = { horizontal: 'center', vertical: 'top' };
}

function borderStyle() {
  const side = { style: 'thin', color: { argb: 'FF334155' } };
  return { top: side, left: side, bottom: side, right: side };
}

module.exports = { generate };
